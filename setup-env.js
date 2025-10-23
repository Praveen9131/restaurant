#!/usr/bin/env node

// Environment Setup Script for SeaSide Live Bake Studio
// This script helps configure the correct API base URL for production

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 SeaSide Live Bake Studio - Environment Setup');
console.log('================================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  const apiUrlMatch = currentEnv.match(/VITE_API_BASE_URL=(.+)/);
  if (apiUrlMatch) {
    console.log(`📡 Current API Base URL: ${apiUrlMatch[1]}`);
  }
} else {
  console.log('❌ .env file not found');
}

console.log('\n🔍 Common API Base URL Options:');
console.log('1. http://localhost:8000 (Local development)');
console.log('2. https://api.seasidelbs.com (Production API)');
console.log('3. /api (Same domain proxy)');
console.log('4. Custom URL');

rl.question('\nEnter your API Base URL (or press Enter to use localhost:8000): ', (apiUrl) => {
  const finalApiUrl = apiUrl.trim() || 'http://localhost:8000';
  
  console.log(`\n📡 Setting API Base URL to: ${finalApiUrl}`);
  
  // Read the example file
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Update the API base URL
  envContent = envContent.replace(
    /VITE_API_BASE_URL=.*/,
    `VITE_API_BASE_URL=${finalApiUrl}`
  );
  
  // Write the .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file created/updated successfully!');
  
  // Test the API URL
  console.log('\n🧪 Testing API connectivity...');
  
  const https = require('https');
  const http = require('http');
  const url = require('url');
  
  const parsedUrl = new url.URL(finalApiUrl);
  const protocol = parsedUrl.protocol === 'https:' ? https : http;
  
  const testUrl = `${finalApiUrl}/categories/`;
  
  const req = protocol.get(testUrl, (res) => {
    console.log(`✅ API is accessible! Status: ${res.statusCode}`);
    console.log(`📡 Test URL: ${testUrl}`);
    
    if (res.statusCode === 200) {
      console.log('\n🎉 Great! Your API is working correctly.');
      console.log('You can now run: npm run build');
    } else {
      console.log(`⚠️  API responded with status ${res.statusCode}`);
      console.log('This might be normal if the endpoint requires authentication.');
    }
    
    rl.close();
  });
  
  req.on('error', (error) => {
    console.log(`❌ API is not accessible: ${error.message}`);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure your backend server is running');
    console.log('2. Check if the URL is correct');
    console.log('3. Verify CORS configuration on the backend');
    console.log('4. Check firewall settings');
    
    rl.close();
  });
  
  req.setTimeout(5000, () => {
    console.log('⏰ Request timed out. The server might be slow or unreachable.');
    req.destroy();
    rl.close();
  });
});

rl.on('close', () => {
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test your application');
  console.log('3. Check browser console for any API errors');
  console.log('4. Refer to API-TROUBLESHOOTING-GUIDE.md if issues persist');
  console.log('\n🚀 Happy coding!');
});
