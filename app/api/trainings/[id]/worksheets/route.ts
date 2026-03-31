import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    
    // Get worksheets with lesson information and questions
    const { data: worksheets, error } = await supabase
      .from('worksheets')
      .select(`
        *,
        lessons(
          id,
          name
        ),
        worksheet_questions(
          id,
          worksheet_id,
          question_text,
          answer_text,
          order_index,
          created_at,
          updated_at
        )
      `)
      .eq('training_id', trainingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching worksheets:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch worksheets' },
        { status: 500 }
      )
    }

    const mappedWorksheets = worksheets?.map((ws: any) => ({
      ...ws,
      questions: ws.worksheet_questions?.map((q: any) => ({
        id: q.id,
        worksheetId: q.worksheet_id,
        question: q.question_text,
        answer: q.answer_text,
        order: q.order_index,
        createdAt: q.created_at,
        updatedAt: q.updated_at
      })) || []
    }))

    return NextResponse.json({
      success: true,
      worksheets: mappedWorksheets || []
    })
  } catch (error) {
    console.error('Error in worksheets API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingId } = await params
    const body = await request.json()

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      )
    }

    const { name, lessonId } = body

    if (!name || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'Worksheet name and lesson ID are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    
    // Get lesson information
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('name')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create worksheet
    const { data: worksheet, error } = await supabase
      .from('worksheets')
      .insert({
        name,
        training_id: trainingId,
        lesson_id: lessonId,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating worksheet:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create worksheet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      worksheet: {
        ...worksheet,
        lessonName: lesson.name
      }
    })
  } catch (error) {
    console.error('Error in worksheets API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
