import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Attempt to get the worksheet, create if it doesn't exist
    let { data: worksheet, error } = await supabase
      .from('worksheets')
      .select('*')
      .eq('training_id', trainingId)
      .maybeSingle()

    if (!worksheet) {
      const { data: newWorksheet, error: createError } = await supabase
        .from('worksheets')
        .insert({ training_id: trainingId, user_id: user.id })
        .select()
        .single()

      if (createError) throw createError
      worksheet = newWorksheet
    }

    // Fetch questions with their nested comments (doubts)
    const { data: questions, error: questionsError } = await supabase
      .from('worksheet_questions')
      .select(`
        *,
        worksheet_comments (
          *
        )
      `)
      .eq('worksheet_id', worksheet.id)
      .order('created_at', { ascending: true })

    if (questionsError) throw questionsError

    return NextResponse.json({
      success: true,
      worksheet,
      questions: questions || []
    })
  } catch (error: any) {
    console.error('Worksheet API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params
    const { questionText, lessonId } = await request.json()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get worksheet ID OR create it
    let { data: worksheet } = await supabase
      .from('worksheets')
      .select('id')
      .eq('training_id', trainingId)
      .maybeSingle()

    if (!worksheet) {
      const { data: newWorksheet, error: createError } = await supabase
        .from('worksheets')
        .insert({ training_id: trainingId, user_id: user.id })
        .select('id')
        .single()
      if (createError) throw createError
      worksheet = newWorksheet
    }

    // 2. Add question
    const { data: question, error: questionError } = await supabase
      .from('worksheet_questions')
      .insert({
        worksheet_id: worksheet.id,
        question_text: questionText,
        lesson_id: lessonId || null
      })
      .select()
      .single()

    if (questionError) throw questionError

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('Add question error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
