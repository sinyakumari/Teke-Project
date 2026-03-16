import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSupabase() {
  console.log('--- Supabase Test Start ---');
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables!');
    return;
  }
  console.log('URL:', SUPABASE_URL);
  console.log('Key exists:', !!SUPABASE_KEY);

  console.log('Creating client...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Client created.');
  
  try {
    console.log('Fetching training count...');
    const { data, error } = await supabase.from('trainings').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }
    console.log('✅ Supabase connected! Training count:', data);
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
  }
  console.log('--- Supabase Test End ---');
}

testSupabase();
