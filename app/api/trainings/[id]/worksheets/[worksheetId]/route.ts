import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; worksheetId: string }> }
) {
  try {
    const { worksheetId } = await params
    const supabase = await createServerSupabaseClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Delete child questions explicitly first to avoid foreign key constraints
    await supabase.from('worksheet_questions').delete().eq('worksheet_id', worksheetId)

    // Then delete the worksheet itself
    const { error } = await supabase
      .from('worksheets')
      .delete()
      .eq('id', worksheetId)
      .eq('user_id', user.id) // Ensure only owner can delete

    if (error) {
      console.error('Error deleting worksheet:', error)
      return NextResponse.json(
        { success: false, error: `Failed to delete worksheet: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE worksheet API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
