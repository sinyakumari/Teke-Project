import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getFileBuffer, refreshAccessToken } from '@/lib/google-drive'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params
    const supabase = await createServerSupabaseClient()

    // 1. Get lesson entry
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 })
    }

    let extractedText = lesson.notes || ''

    // 2. Extra PDF content if exists
    if (lesson.file_id && lesson.mime_type?.includes('pdf')) {
      const cookieHeader = request.headers.get('cookie') || ''
      const getCookie = (name: string) => {
        const value = `; ${cookieHeader}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      }

      let accessToken = getCookie('google_access_token')
      const refreshToken = getCookie('google_refresh_token')

      if (!accessToken && !refreshToken) {
         console.warn('Missing Google Auth tokens for PDF extraction.')
         // Note to user in final error message
      } else {
        try {
          if (!accessToken && refreshToken) {
             console.log('Refreshing expired Google Drive token...')
             const credentials = await refreshAccessToken(refreshToken)
             accessToken = credentials.access_token as string | undefined
          }
          
          if (accessToken) {
             console.log(`Fetching PDF buffer for ID: ${lesson.file_id}...`)
             const buffer = await getFileBuffer({ access_token: accessToken as string }, lesson.file_id)
             console.log(`Buffer size: ${buffer.length} bytes`)
             
             try {
               // DYNAMICALLY require pdf-parse here to avoid boot errors
               const pdfParser = require('pdf-parse')
               const data = await pdfParser(buffer)
               if (data?.text) {
                 const text = data.text.trim()
                 if (text.length > 0) {
                   extractedText += `\n\nPDF CONTENT:\n${text}`
                   console.log(`Extracted ${text.length} chars from PDF.`)
                 }
               }
             } catch (pdfErr) {
               console.error('pdf-parse fallback error:', pdfErr)
             }
          }
        } catch (err) {
          console.error('Failed to extract text from PDF on server:', err)
        }
      }
    }

    const notesLen = lesson.notes?.trim().length || 0;
    const pdfLen = (extractedText.length - (lesson.notes?.length || 0));

    if (extractedText.trim().length < 30) {
      let message = 'Not enough content to summarize. '
      if (lesson.file_id && lesson.mime_type?.includes('pdf') && pdfLen < 10) {
        message += 'The PDF appears to be a scanned image or has no selectable text. '
      }
      message += `(Debug: Notes length: ${notesLen}, PDF text length: ${Math.max(0, pdfLen)})`
      return Response.json({ error: message }, { status: 400 })
    }

    const prompt = `You are a professional educational summarizer. 
Create a concise, structured bullet-point summary of the following lesson material.

Rules:
- Strictly bullet points.
- No paragraphs. No introductory or concluding text.
- Focused and technical.
- Accurate.

Lesson Content:
${extractedText}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a bullet-point summary expert.' },
        { role: 'user', content: prompt }
      ]
    })

    const rawSummary = response.choices[0].message?.content || ''
    
    // Clean to bullets
    const bullets = rawSummary
      .split('\n')
      .map(line => line.replace(/^(\d+\.|\*|-|•)\s*/, '').trim())
      .filter(line => line.length > 0)

    // Update the database
    await supabase
      .from('lessons')
      .update({
        summary_raw: rawSummary,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)

    return NextResponse.json({ success: true, bullets, rawSummary })
  } catch (error: any) {
    console.error('Summarization Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to generate summary' 
    }, { status: 500 })
  }
}
