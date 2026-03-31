const fs = require('fs');
const path = require('path');

async function test() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (!match) {
    console.log("GEMINI_API_KEY not found in .env.local");
    return;
  }
  const apiKey = match[1].trim();
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash-exp'];
  
  for (const model of models) {
    try {
      console.log(`Checking ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "test" }] }] })
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ SUCCESS with ${model}`);
      } else {
        console.log(`❌ FAILED ${model}: ${data.error?.message}`);
      }
    } catch (e) {
      console.log(`❌ ERROR ${model}: ${e.message}`);
    }
  }
}
test();
