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

  // 1. Parse manual content
  let manualContent = ''
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      manualContent = body?.manualContent || ''
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

  let totalContent = manualContent || (lesson.notes || '').trim()
  let pdfLog = 'No PDF'

  // 3. Extract PDF (Standard logic)
  if (!manualContent && lesson.file_id && lesson.mime_type?.includes('pdf')) {
    try {
      const cookieStore = await cookies()
      let token = cookieStore.get('google_access_token')?.value
      if (token) {
        const buffer = await getFileBuffer({ access_token: token }, lesson.file_id)
        const pdfParse = require('pdf-parse/lib/pdf-parse.js')
        const parsed = await pdfParse(buffer)
        const extracted = (parsed?.text || '').trim().replace(/[^\x20-\x7E\n\r\t]/g, '').replace(/\s{3,}/g, '\n\n').trim()
        if (extracted.length > 5) {
          totalContent += `\n\n${extracted}`
          pdfLog = `Extracted ${extracted.length} chars`
        }
      }
    } catch (e: any) { pdfLog = `PDF Error: ${e.message}` }
  }

  // 4. Validate
  if (!totalContent || totalContent.length < 5) {
     return NextResponse.json({ error: 'Lesson is empty.', debug: { pdfLog } }, { status: 400 })
  }

  // 5. Call Gemini via Loop
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Key Missing' }, { status: 500 })

  try {
    const prompt = `Summarize this lesson content into a short bulleted list (only dashes '-'). Contents: \n\n ${totalContent}`
    
    const { text: rawSummary, modelUsed } = await callGeminiInLoop(apiKey, prompt)
    
    const bullets = rawSummary
      .split('\n')
      .map((l: string) => l.replace(/^[-•*]\s*/, '').trim())
      .filter((l: string) => l.length > 3)

    // CRITICAL: Save both the raw text and the structured bullets array to the DB immediately
    await supabase.from('lessons').update({ 
      summary_raw: rawSummary,
      summary: bullets,
      updated_at: new Date().toISOString()
    }).eq('id', lessonId)

    return NextResponse.json({ success: true, bullets, source: pdfLog.includes('Extracted') ? 'PDF' : 'Notes', model: modelUsed })

  } catch (err: any) {
    console.error('[Summarizer] Final Loop Error:', err)
    return NextResponse.json({ error: `AI Quota/Error: ${err.message}. Try creating a new key in AI Studio or enabling billing.` }, { status: 500 })
  }
}
