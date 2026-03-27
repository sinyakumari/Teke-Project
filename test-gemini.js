const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Current SDK doesn't have listModels on genAI directly in some versions
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("SUCCESS with gemini-1.5-flash");
    process.exit(0);
  } catch (e) {
    console.log("FAILED gemini-1.5-flash:", e.message);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("test");
      console.log("SUCCESS with gemini-pro");
      process.exit(0);
    } catch (e2) {
      console.log("FAILED gemini-pro:", e2.message);
    }
  }
}
list();
