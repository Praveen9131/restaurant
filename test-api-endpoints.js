#!/usr/bin/env node

// API Endpoint Testing Script
// This script tests various API endpoints to find the correct ones

const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_BASE_URL = 'http://localhost:8000';

// List of endpoints to test
const endpointsToTest = [
  // Categories
  '/categories/',
  '/api/categories/',
  '/v1/categories/',
  
  // Menu
  '/GetAllMenu/',
  '/api/GetAllMenu/',
  '/menu/',
  '/api/menu/',
  '/v1/menu/',
  
  // Auth
  '/api/signup/',
  '/api/login/',
  '/signup/',
  '/login/',
  
  // Admin
  '/api/create-admin/',
  '/api/Owner-Login/',
  '/create-admin/',
  '/Owner-Login/',
  
  // Common paths
  '/',
  '/health',
  '/status',
  '/api/',
  '/v1/',
  '/docs',
  '/openapi.json',
  '/swagger.json'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: null,
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: null,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing API Endpoints');
  console.log('========================');
  console.log(`Base URL: ${API_BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of endpointsToTest) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Testing: ${fullUrl}`);
    
    const result = await testEndpoint(fullUrl);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.status} - ${result.url}`);
      if (result.data) {
        console.log(`   Response: ${result.data.substring(0, 100)}...`);
      }
    } else if (result.error) {
      console.log(`❌ Error - ${result.url}: ${result.error}`);
    } else {
      console.log(`⚠️  ${result.status} - ${result.url}`);
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary');
  console.log('==========');
  
  const successful = results.filter(r => r.success);
  const errors = results.filter(r => r.error);
  const notFound = results.filter(r => r.status === 404);
  
  console.log(`✅ Successful endpoints: ${successful.length}`);
  console.log(`❌ Error endpoints: ${errors.length}`);
  console.log(`⚠️  404 endpoints: ${notFound.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Working endpoints:');
    successful.forEach(r => {
      console.log(`   ${r.status} - ${r.url}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Error endpoints:');
    errors.forEach(r => {
      console.log(`   ${r.error} - ${r.url}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (successful.length === 0) {
    console.log('   - No working endpoints found');
    console.log('   - Check if the backend server is properly configured');
    console.log('   - Verify the server is running the correct API routes');
    console.log('   - Check server logs for any startup errors');
  } else {
    console.log('   - Use the working endpoints found above');
    console.log('   - Update your .env file with the correct API base URL');
    console.log('   - Update the frontend API service to use the working endpoints');
  }
  
  return results;
}

// Run the tests
testAllEndpoints().catch(console.error);
