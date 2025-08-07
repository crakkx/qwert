#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AI NPC Generator - Environment Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file already exists');
  
  // Read current content
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('your-gemini-api-key-here')) {
    console.log('⚠️  Please update your Gemini API key in the .env file');
    console.log('   Current content:');
    console.log('   ' + envContent.replace(/\n/g, '\n   '));
    console.log('\n📝 To get your API key:');
    console.log('   1. Go to https://aistudio.google.com/');
    console.log('   2. Create a new API key');
    console.log('   3. Replace "your-gemini-api-key-here" in .env file');
  } else {
    console.log('✅ Gemini API key appears to be configured');
  }
} else {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Gemini API Configuration
# Get your API key from: https://aistudio.google.com/
# Replace 'your-gemini-api-key-here' with your actual Gemini API key
REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
  console.log('\n📝 Next steps:');
  console.log('   1. Go to https://aistudio.google.com/');
  console.log('   2. Create a new API key');
  console.log('   3. Replace "your-gemini-api-key-here" in .env file with your actual key');
}

console.log('\n🚀 After updating the API key, you can start the app with:');
console.log('   npm start'); 