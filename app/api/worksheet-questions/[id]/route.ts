import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params
    const { questionText, answerText, lessonId } = await request.json()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
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
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('Update question error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('worksheet_questions')
      .delete()
      .eq('id', questionId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Question deleted' })
  } catch (error: any) {
    console.error('Delete question error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
