import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ 
      success: false, 
      error: 'Not authenticated',
      authError: authError?.message 
    });
  }

  // Try inserting with authenticated user
  const { data, error } = await supabase
    .from('trainings')
    .insert({
      title: 'RLS TEST ' + new Date().toISOString(),
      user_id: user.id,
      is_archived: false
    })
    .select()

  if (error) {
    return NextResponse.json({ 
      success: false, 
      userId: user.id,
      error: error.message, 
      hint: error.hint, 
      details: error.details, 
      code: error.code 
    });
  }

  // Clean up test row
  if (data && data[0]) {
    await supabase.from('trainings').delete().eq('id', data[0].id)
  }

  return NextResponse.json({ success: true, userId: user.id, message: 'INSERT + DELETE worked!' });
}
