const axios = require('axios');

// API configuration
const API_BASE_URL = 'https://api.seasidelbs.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Test APIs
async function testAPIs() {
  console.log('🔍 Testing APIs...\n');
  
  const apis = [
    {
      name: 'Dashboard API',
      url: '/Dashboard/',
      method: 'GET'
    },
    {
      name: 'Orders API',
      url: '/AdminOrdersView/',
      method: 'GET'
    },
    {
      name: 'Inquiries API',
      url: '/inquirylist/',
      method: 'GET'
    }
  ];

  for (const apiTest of apis) {
    console.log(`\n📡 Testing ${apiTest.name}...`);
    console.log(`URL: ${API_BASE_URL}${apiTest.url}`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const response = await api.get(apiTest.url);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Response Headers:`, JSON.stringify(response.headers, null, 2));
      console.log(`📋 Response Data:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`📊 Status: ${error.response.status} ${error.response.statusText}`);
        console.log(`📋 Error Data:`, JSON.stringify(error.response.data, null, 2));
        console.log(`📊 Error Headers:`, JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        console.log(`📋 Request Error:`, error.request);
      } else {
        console.log(`📋 Error:`, error.message);
      }
    }
    
    console.log('─'.repeat(50));
  }
}

// Run the tests
testAPIs().catch(console.error);
