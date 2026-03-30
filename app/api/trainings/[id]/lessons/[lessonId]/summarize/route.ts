import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFileBuffer, refreshAccessToken } from '@/lib/google-drive'
import { cookies } from 'next/headers'

/**
 * Robust Multi-Model Gemini Call
 */
async function callGeminiInLoop(apiKey: string, promptContent: string) {
  // Ordered list of free models CONFIRMED to be in your API list
  const modelsToTry = [
    'gemini-2.0-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.0-flash', 
    'gemini-pro-latest'
  ]

  let lastError = 'No models tried'

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Summarizer] Attempting with model: ${modelName}...`)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
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

  // 5. Call Gemini via Loop
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Key Missing' }, { status: 500 })

  try {
    let prompt = `Analyze the following Lesson Sources.

Source 1 (Media Content):
${mediaContent || 'None'}

Source 2 (User's Manual Notes):
${userNotes || 'None'}

Task:
1. Provide a concise, highly relevant title for this lesson (maximum 5 words) on the FIRST line, prefixed exactly with "TITLE: ".
2. On subsequent lines, provide a concise bulleted list summarizing the key points from both sources combined (using only dashes '-').
3. Ensure the summary is strictly deduplicated. Merge any points with similar meanings into a single cohesive bullet. Do not repeat facts.`
    
    if (existingBullets.length > 0) {
      prompt = `You are a strict, analytical note-taking assistant. I provide you existing bullet points and the latest Lesson Sources.

Source 1 (Media Content):
${mediaContent || 'None'}

Source 2 (User's Manual Notes):
${userNotes || 'None'}

Existing Bullet Points:
${existingBullets.map((s: string) => `- ${s}`).join('\n')}

Task:
1. Provide a concise title for this lesson (maximum 5 words) on the FIRST line, prefixed exactly with "TITLE: ".
2. Compare the combined Lesson Sources (Media + Notes) against the Existing Bullet Points.
3. Identify ONLY entirely new information, facts, or concepts from the Lesson Sources that are NOT semantically captured in the Existing Bullet Points.
4. Apply rigorous SEMANTIC deduplication: If a new concept has the same or similar meaning to an existing point, or a point you just wrote, DISCARD IT. Do not rephrase.
5. Provide the new, strictly unique bullet points starting with "- " on subsequent lines.
6. If absolutely ALL information is already logically covered, you MUST reply EXACTLY with the word "NO_NEW_CONTENT" immediately after the TITLE line.`
    }

    const { text: rawSummary, modelUsed } = await callGeminiInLoop(apiKey, prompt)
    
    let bullets: string[] = []
    let newTitle: string | undefined = undefined;
    
    // First line check to robustly extract title and NO_NEW_CONTENT
    const lines = rawSummary.split('\n').filter((l: string) => l.trim() !== '')
    
    const titleLine = lines.find((l: string) => l.trim().startsWith('TITLE:'))
    if (titleLine) {
       newTitle = titleLine.replace('TITLE:', '').trim()
    }

    // Check if the AI returned NO_NEW_CONTENT anywhere to signify no new bullets
    if (rawSummary.includes('NO_NEW_CONTENT')) {
      bullets = []
    } else {
      bullets = lines
        .filter((l: string) => !l.trim().startsWith('TITLE:'))
        .filter((l: string) => !l.includes('NO_NEW_CONTENT'))
        .map((l: string) => l.replace(/^[-•*]\s*/, '').trim())
        .filter((l: string) => l.length > 3)
    }

    const finalBullets = Array.from(new Set([...existingBullets, ...bullets]))

    const updatePayload: any = { 
      summary_raw: rawSummary,
      summary: finalBullets,
      updated_at: new Date().toISOString()
    }
    if (newTitle) {
      updatePayload.name = newTitle
    }

    // CRITICAL: Save both the raw text and the structured bullets array to the DB immediately
    await supabase.from('lessons').update(updatePayload).eq('id', lessonId)

    return NextResponse.json({ success: true, bullets, finalBullets, source: pdfLog.includes('Extracted') ? 'PDF' : 'Notes', model: modelUsed, noNewContent: bullets.length === 0 })

  } catch (err: any) {
    console.error('[Summarizer] Final Loop Error:', err)
    return NextResponse.json({ error: `AI Quota/Error: ${err.message}. Try creating a new key in AI Studio or enabling billing.` }, { status: 500 })
  }
}
