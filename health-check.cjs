#!/usr/bin/env node

/**
 * Production Health Check Script
 * Checks if the application is running properly in production
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  apiUrl: 'https://api.seasidelbs.com',
  timeout: 10000,
  retries: 3
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Health check functions
const healthChecks = {
  // Check if API is responding
  async checkAPI() {
    try {
      const response = await makeRequest(`${config.apiUrl}/health/`);
      return {
        name: 'API Health',
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        details: `Status: ${response.status}`,
        responseTime: response.responseTime
      };
    } catch (error) {
      return {
        name: 'API Health',
        status: 'unhealthy',
        details: error.message,
        responseTime: null
      };
    }
  },

  // Check if menu endpoint is working
  async checkMenu() {
    try {
      const response = await makeRequest(`${config.apiUrl}/menu/`);
      return {
        name: 'Menu Endpoint',
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        details: `Status: ${response.status}`,
        responseTime: response.responseTime
      };
    } catch (error) {
      return {
        name: 'Menu Endpoint',
        status: 'unhealthy',
        details: error.message,
        responseTime: null
      };
    }
  },

  // Check if authentication endpoint is working
  async checkAuth() {
    try {
      const response = await makeRequest(`${config.apiUrl}/login/`, 'POST', {
        username: 'test',
        password: 'test'
      });
      return {
        name: 'Auth Endpoint',
        status: response.status === 400 || response.status === 401 ? 'healthy' : 'unhealthy',
        details: `Status: ${response.status} (Expected 400/401 for invalid credentials)`,
        responseTime: response.responseTime
      };
    } catch (error) {
      return {
        name: 'Auth Endpoint',
        status: 'unhealthy',
        details: error.message,
        responseTime: null
      };
    }
  },

  // Check if file upload endpoint is working
  async checkUpload() {
    try {
      const response = await makeRequest(`${config.apiUrl}/upload/`, 'POST');
      return {
        name: 'Upload Endpoint',
        status: response.status === 400 ? 'healthy' : 'unhealthy',
        details: `Status: ${response.status} (Expected 400 for missing file)`,
        responseTime: response.responseTime
      };
    } catch (error) {
      return {
        name: 'Upload Endpoint',
        status: 'unhealthy',
        details: error.message,
        responseTime: null
      };
    }
  }
};

// Make HTTP request with timeout
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: config.timeout
    };

    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          data: responseData,
          responseTime: `${responseTime}ms`
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run all health checks
async function runHealthChecks() {
  console.log(`${colors.bold}${colors.blue}🏥 SeaSide Live Bake Studio - Health Check${colors.reset}\n`);
  
  const results = [];
  
  for (const [key, check] of Object.entries(healthChecks)) {
    try {
      console.log(`${colors.yellow}⏳ Running ${key}...${colors.reset}`);
      const result = await check();
      results.push(result);
      
      const statusColor = result.status === 'healthy' ? colors.green : colors.red;
      const statusIcon = result.status === 'healthy' ? '✅' : '❌';
      
      console.log(`${statusIcon} ${statusColor}${result.name}: ${result.status.toUpperCase()}${colors.reset}`);
      console.log(`   Details: ${result.details}`);
      if (result.responseTime) {
        console.log(`   Response Time: ${result.responseTime}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${colors.red}${key}: ERROR${colors.reset}`);
      console.log(`   Error: ${error.message}\n`);
      
      results.push({
        name: key,
        status: 'error',
        details: error.message,
        responseTime: null
      });
    }
  }

  // Summary
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;
  const healthPercentage = Math.round((healthyCount / totalCount) * 100);

  console.log(`${colors.bold}📊 Health Check Summary${colors.reset}`);
  console.log(`   Healthy: ${colors.green}${healthyCount}/${totalCount}${colors.reset}`);
  console.log(`   Health Score: ${healthPercentage}%`);
  
  if (healthPercentage >= 80) {
    console.log(`   Status: ${colors.green}🟢 EXCELLENT${colors.reset}`);
  } else if (healthPercentage >= 60) {
    console.log(`   Status: ${colors.yellow}🟡 GOOD${colors.reset}`);
  } else {
    console.log(`   Status: ${colors.red}🔴 NEEDS ATTENTION${colors.reset}`);
  }

  console.log(`\n${colors.blue}⏰ Check completed at: ${new Date().toISOString()}${colors.reset}`);
  
  // Exit with appropriate code
  process.exit(healthPercentage >= 60 ? 0 : 1);
}

// Run health checks if this script is executed directly
if (require.main === module) {
  runHealthChecks().catch(error => {
    console.error(`${colors.red}❌ Health check failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runHealthChecks, healthChecks };
