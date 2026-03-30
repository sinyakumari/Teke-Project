import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('lessons').select('name, summary_raw, mime_type, file_id').order('created_at', { ascending: false }).limit(3);
  return NextResponse.json(data);
}
