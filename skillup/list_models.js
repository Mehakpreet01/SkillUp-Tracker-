const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.split('\n').find(line => line.startsWith('GEMINI_API_KEY=')).split('=')[1].trim();

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    const models = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name);
    console.log("AVAILABLE MODELS:", models);
  })
  .catch(console.error);
