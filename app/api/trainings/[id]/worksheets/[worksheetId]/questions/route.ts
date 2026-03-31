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

    // Create question
    const { data: question, error } = await supabase
      .from('worksheet_questions')
      .insert({
        worksheet_id: worksheetId,
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
