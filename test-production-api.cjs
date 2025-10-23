#!/usr/bin/env node

// Production API Test Script
// Tests the production API endpoints to ensure they're working correctly

const https = require('https');

const API_BASE_URL = 'https://api.seasidelbs.com';

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const url = `${API_BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            success: true,
            status: res.statusCode,
            url,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            success: true,
            status: res.statusCode,
            url,
            data: responseData,
            headers: res.headers,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        url
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Production API Endpoints');
  console.log('====================================');
  console.log(`Base URL: ${API_BASE_URL}\n`);

  const tests = [
    {
      name: 'Categories API',
      path: '/categories/',
      description: 'Get all categories'
    },
    {
      name: 'Menu API',
      path: '/GetAllMenu/',
      description: 'Get all menu items'
    },
    {
      name: 'Menu Search API',
      path: '/menu/search/?q=chicken',
      description: 'Search menu items'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`   Path: ${test.path}`);
    console.log(`   Description: ${test.description}`);
    
    const result = await testEndpoint(test.path);
    results.push({ ...test, result });

    if (result.success) {
      console.log(`   ✅ Status: ${result.status}`);
      if (result.data && typeof result.data === 'object') {
        if (result.data.categories) {
          console.log(`   📊 Categories found: ${result.data.categories.length}`);
        }
        if (result.data.menu_items) {
          console.log(`   📊 Menu items found: ${result.data.menu_items.length}`);
        }
        if (result.data.total_items) {
          console.log(`   📊 Total items: ${result.data.total_items}`);
        }
      }
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);

  if (successful.length === results.length) {
    console.log('\n🎉 All API tests passed! The production API is working correctly.');
    console.log('✅ Your application should be able to call the APIs successfully.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('❌ There might be issues with the API endpoints.');
  }

  // Show successful endpoints
  if (successful.length > 0) {
    console.log('\n✅ Working endpoints:');
    successful.forEach(r => {
      console.log(`   ${r.name}: ${r.result.status} - ${r.path}`);
    });
  }

  // Show failed endpoints
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(r => {
      console.log(`   ${r.name}: ${r.result.error} - ${r.path}`);
    });
  }

  return results;
}

// Run the tests
runTests().catch(console.error);
