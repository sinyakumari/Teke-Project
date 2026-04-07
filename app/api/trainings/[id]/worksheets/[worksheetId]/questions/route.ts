import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; worksheetId: string }> }
) {
  try {
    const { worksheetId } = await params
    const body = await request.json()
    const { question_text, answer_text } = body

    if (!question_text) {
      return NextResponse.json(
        { success: false, error: 'Question text is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // NEW: Fetch the lesson_id from the parent worksheet
    const { data: worksheet, error: worksheetError } = await supabase
      .from('worksheets')
      .select('lesson_id')
      .eq('id', worksheetId)
      .single()

    if (worksheetError || !worksheet) {
      console.error('Error fetching parent worksheet:', worksheetError)
      return NextResponse.json({ success: false, error: 'Parent worksheet not found' }, { status: 404 })
    }

    // Create question with the inherited lesson_id
    const { data: question, error } = await supabase
      .from('worksheet_questions')
      .insert({
        worksheet_id: worksheetId,
        lesson_id: worksheet.lesson_id, // Inherit from parent
        question_text,
        answer_text
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json(
        { success: false, error: `Failed to add question: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        worksheetId: question.worksheet_id,
        question: question.question_text,
        answer: question.answer_text,
        order: question.order_index,
        createdAt: question.created_at,
        updatedAt: question.updated_at
      }
    })
  } catch (error: any) {
    console.error('Error in questions API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; worksheetId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'Question ID required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('worksheet_questions')
      .delete()
      .eq('id', questionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; worksheetId: string }> }
) {
  try {
    const { id: trainingId, worksheetId } = await params
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')
    const { questionText, answerText, lessonId } = await request.json()

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'Question ID required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: question, error } = await supabase
      .from('worksheet_questions')
      .update({
        question_text: questionText,
        answer_text: answerText,
        lesson_id: lessonId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .eq('worksheet_id', worksheetId) // Safety check
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('Update question error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
