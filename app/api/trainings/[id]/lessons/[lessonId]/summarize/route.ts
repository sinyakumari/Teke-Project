import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFileBuffer, refreshAccessToken } from '@/lib/google-drive'
import { cookies } from 'next/headers'
import SHA256 from 'crypto-js/sha256'

/**
 * Robust Multi-Model Gemini Call
 */
async function callGeminiInLoop(apiKey: string, promptContent: string) {
  // Ordered list of free models CONFIRMED to be in your API list
  const modelsToTry = [
    'models/gemini-2.5-flash',
    'models/gemini-flash-latest',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite'
  ]

  let lastError = 'No models tried'

  for (const modelName of modelsToTry) {
    try {
      const fullModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`
      const url = `https://generativelanguage.googleapis.com/v1beta/${fullModelName}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptContent }] }]
        })
      })

      const data = await response.json()
      if (response.ok) {
        console.log(`[Summarizer] Success with ${modelName}!`)
        return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '', modelUsed: modelName }
      } else {
        lastError = data.error?.message || `Status ${response.status}`
        console.warn(`[Summarizer] ${modelName} failed: ${lastError}`)
        if (lastError.includes('Model not found')) continue // Try next name
        if (lastError.includes('quota')) continue // Try next tier
        throw new Error(lastError) // Fatal error
      }
    } catch (e: any) {
      lastError = e.message
      console.error(`[Summarizer] Fatal error with ${modelName}:`, e.message)
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { id: trainingId, lessonId } = await params

  let manualContent = ''
  let frontendNotes = ''
  let existingBullets: string[] = []
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      manualContent = body?.manualContent || ''
      frontendNotes = body?.notes || ''
      existingBullets = body?.existingBullets || []
    }
  } catch (_) {}

  // 2. Fetch lesson
  const supabase = await createServerSupabaseClient()
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  console.log(`[Summarizer] Incoming request for: ${lesson.name}`)

  let userNotes = (frontendNotes || lesson.notes || '').trim()
  let mediaContent = manualContent || ''
  let pdfLog = 'No Media Extracted'

  // 3. Extract Media (Standard logic)
  if (!mediaContent && lesson.file_id) {
    try {
      const cookieStore = await cookies()
      let token = cookieStore.get('google_access_token')?.value || ''
      const refreshToken = cookieStore.get('google_refresh_token')?.value || ''
      
      if (!token && refreshToken) {
        try {
          const credentials = await refreshAccessToken(refreshToken)
          token = credentials.access_token || ''
        } catch (err: any) {
          console.error('[Summarizer] Token refresh failed:', err.message)
        }
      }

      if (token) {
        const buffer = await getFileBuffer({ access_token: token }, lesson.file_id) // this is just a buffer
        
        if (lesson.mime_type?.includes('pdf')) {
          const pdfParse = require('pdf-parse/lib/pdf-parse.js')
          const parsed = await pdfParse(buffer)
          const extracted = (parsed?.text || '').trim()
          if (extracted.length > 5) {
            mediaContent = extracted
            pdfLog = `Extracted ${extracted.length} chars from PDF`
          }
        } 
        else if (lesson.mime_type?.includes('text') || lesson.mime_type?.includes('json') || lesson.mime_type?.includes('csv')) {
          const extracted = buffer.toString('utf-8').trim()
          if (extracted.length > 5) {
            mediaContent = extracted
            pdfLog = `Extracted ${extracted.length} chars from text file`
          }
        }
      }
    } catch (e: any) { pdfLog = `Media Error: ${e.message}` }
  }

  // 4. Validate sources
  if (!userNotes && !mediaContent) {
     return NextResponse.json({ error: 'No readable text or notes found. Triggering OCR Fallback.', debug: { pdfLog } }, { status: 400 })
  }

  // --- CONTENT CHANGE DETECTION (Step 1) ---
  const currentContentRaw = (mediaContent || '') + (userNotes || '') + (lesson.file_id || '')
  const currentHash = SHA256(currentContentRaw).toString()

  if (lesson.content_hash === currentHash && existingBullets.length > 0) {
    console.log('[Summarizer] No change detected via hash. Skipping AI.')
    return NextResponse.json({ 
      success: true, 
      noNewContent: true, 
      message: 'No changes detected',
      finalBullets: existingBullets 
    })
  }

  // 5. Call Gemini via Loop
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Key Missing' }, { status: 500 })

  try {
    let prompt = `You are an AI summarization agent. Your task is to generate concise bullets from the lesson content provided. Follow these strict rules:

1. You are provided with two inputs:
   - existing_summary: the bullets already generated for this lesson.
   - new_content: the full lesson content.

2. Do NOT repeat, paraphrase, or modify any bullets already in existing_summary.

3. Only generate bullets for content in new_content that is NOT already covered in existing_summary.

4. Use clear, concise bullet points:
   - Start each bullet with "•"
   - Keep each bullet focused on one idea
   - Avoid unnecessary repetition or filler words

5. If no new content is found (i.e., everything is already in existing_summary), respond with:
   "No new bullets needed."

6. Maintain consistent style with existing_summary (if any).

7. Only output the bullet points; do not include explanations or extra text.

existing_summary: 
${existingBullets.length > 0 ? existingBullets.map((s: string) => `• ${s}`).join('\n') : 'None'}

new_content:
${mediaContent || ''}
${userNotes || ''}`

    const { text: rawSummary, modelUsed } = await callGeminiInLoop(apiKey, prompt)
    
    let bullets: string[] = []
    let newTitle: string | undefined = undefined;
    
    // First line check to robustly extract title and NO_NEW_CONTENT
    const lines = rawSummary.split('\n').filter((l: string) => l.trim() !== '')
    
    const titleLine = lines.find((l: string) => l.trim().startsWith('TITLE:'))
    if (titleLine) {
       newTitle = titleLine.replace('TITLE:', '').trim()
    }

    // Check if the AI returned NO_NEW_CONTENT or the new "No new bullets needed" phrase
    if (rawSummary.includes('NO_NEW_CONTENT') || rawSummary.includes('No new bullets needed')) {
      bullets = []
    } else {
      bullets = lines
        .filter((l: string) => !l.trim().startsWith('TITLE:'))
        .filter((l: string) => !l.includes('NO_NEW_CONTENT'))
        .filter((l: string) => !l.includes('No new bullets needed'))
        .map((l: string) => l.replace(/^[•\-\*]\s*/, '').trim())
        .filter((l: string) => l.length > 2)
    }

    const finalBullets = Array.from(new Set([...existingBullets, ...bullets]))

    if (bullets.length > 0) {
      const updatePayload: any = { 
        summary_raw: rawSummary,
        summary: finalBullets,
        content_hash: currentHash,
        updated_at: new Date().toISOString()
      }
      if (newTitle) {
        updatePayload.name = newTitle
      }
      await supabase.from('lessons').update(updatePayload).eq('id', lessonId)
    }

    return NextResponse.json({ 
      success: true, 
      bullets, 
      finalBullets, 
      source: pdfLog.includes('Extracted') ? 'PDF' : 'Notes', 
      model: modelUsed, 
      noNewContent: bullets.length === 0 
    })

  } catch (err: any) {
    console.error('[Summarizer] Final Loop Error:', err)
    return NextResponse.json({ error: `AI Quota/Error: ${err.message}. Try creating a new key in AI Studio or enabling billing.` }, { status: 500 })
  }
}
