import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wnxsfpukosmhuuusnnyv.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueHNmcHVrb3NtaHV1dXNubnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTMyMTksImV4cCI6MjA4OTIyOTIxOX0.wIxCA8sN2iTPHB72kQfLFQVESdghEv_TL8nDN3-VTD8";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueHNmcHVrb3NtaHV1dXNubnl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY1MzIxOSwiZXhwIjoyMDg5MjI5MjE5fQ.ia2EJVQbXp_cJphZ-8etUzEsvNsOtlkoRREceh-lSlU";

async function compareVisibility() {
  console.log('--- RLS Diagnostic ---');
  
  const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);
  const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

  console.log('1. Trying with Service Role Key (Bypasses RLS)...');
  const { data: serviceData, error: serviceError } = await supabaseService.from('trainings').select('id, title');
  if (serviceError) console.error('Service Key Error:', serviceError.message);
  else console.log(`Found ${serviceData.length} trainings with Service Key.`);

  console.log('\n2. Trying with Anon Key (Follows RLS)...');
  const { data: anonData, error: anonError } = await supabaseAnon.from('trainings').select('id, title');
  if (anonError) console.error('Anon Key Error:', anonError.message);
  else console.log(`Found ${anonData.length} trainings with Anon Key.`);

  if (serviceData?.length > 0 && anonData?.length === 0) {
    console.log('\n🚨 DIAGNOSIS: Data exists but is hidden by RLS policies.');
    console.log('You need to add RLS policies to allow authenticated users to read their data.');
  } else if (serviceData?.length === 0) {
    console.log('\n🚨 DIAGNOSIS: No data found even with Service Key. Migration might have failed or target tables are wrong.');
  } else {
    console.log('\n✅ Data is visible with Anon Key. If it doesn\'t show in app, check user ownership (user_id).');
  }
}

compareVisibility();
