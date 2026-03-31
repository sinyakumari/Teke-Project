const fs = require('fs');
const path = require('path');

async function test() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (!match) return;
  const apiKey = match[1].trim();
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    const validModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
    console.log("Supported Models for generateContent:");
    validModels.forEach(m => console.log(`- ${m.name}`));
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
