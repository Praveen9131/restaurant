// API Debugging utility for production issues

class APIDebugger {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.isDevelopment = import.meta.env.DEV;
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  // Test API connectivity
  async testAPIConnectivity() {
    console.log('🔍 Testing API Connectivity...');
    
    const testResults = {
      baseUrl: this.apiBaseUrl,
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Basic connectivity
    try {
      const response = await fetch(`${this.apiBaseUrl}/categories/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      testResults.tests.push({
        name: 'Basic Connectivity',
        url: `${this.apiBaseUrl}/categories/`,
        status: response.status,
        success: response.ok,
        error: null
      });
      
      console.log('✅ Basic connectivity test:', response.status);
    } catch (error) {
      testResults.tests.push({
        name: 'Basic Connectivity',
        url: `${this.apiBaseUrl}/categories/`,
        status: null,
        success: false,
        error: error.message
      });
      
      console.error('❌ Basic connectivity test failed:', error.message);
    }

    // Test 2: CORS preflight
    try {
      const response = await fetch(`${this.apiBaseUrl}/categories/`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      testResults.tests.push({
        name: 'CORS Preflight',
        url: `${this.apiBaseUrl}/categories/`,
        status: response.status,
        success: response.ok,
        error: null
      });
      
      console.log('✅ CORS preflight test:', response.status);
    } catch (error) {
      testResults.tests.push({
        name: 'CORS Preflight',
        url: `${this.apiBaseUrl}/categories/`,
        status: null,
        success: false,
        error: error.message
      });
      
      console.error('❌ CORS preflight test failed:', error.message);
    }

    // Test 3: Menu API
    try {
      const response = await fetch(`${this.apiBaseUrl}/GetAllMenu/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      testResults.tests.push({
        name: 'Menu API',
        url: `${this.apiBaseUrl}/GetAllMenu/`,
        status: response.status,
        success: response.ok,
        error: null
      });
      
      console.log('✅ Menu API test:', response.status);
    } catch (error) {
      testResults.tests.push({
        name: 'Menu API',
        url: `${this.apiBaseUrl}/GetAllMenu/`,
        status: null,
        success: false,
        error: error.message
      });
      
      console.error('❌ Menu API test failed:', error.message);
    }

    // Test 4: Network information
    if ('connection' in navigator) {
      const connection = navigator.connection;
      testResults.networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }

    // Test 5: Environment information
    testResults.environment = {
      mode: import.meta.env.MODE,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('📊 API Test Results:', testResults);
    return testResults;
  }

  // Check if API base URL is accessible
  async checkBaseURL() {
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      console.log('✅ Base URL is accessible:', this.apiBaseUrl);
      return true;
    } catch (error) {
      console.error('❌ Base URL is not accessible:', this.apiBaseUrl, error.message);
      return false;
    }
  }

  // Get common API issues and solutions
  getCommonIssues() {
    return {
      issues: [
        {
          problem: 'CORS Error',
          symptoms: ['Access to fetch at ... has been blocked by CORS policy', 'No \'Access-Control-Allow-Origin\' header'],
          solutions: [
            'Configure CORS on the backend server',
            'Add proper CORS headers to API responses',
            'Use a proxy server for development'
          ]
        },
        {
          problem: 'Network Error',
          symptoms: ['Failed to fetch', 'ERR_NETWORK', 'ERR_CONNECTION_REFUSED'],
          solutions: [
            'Check if the backend server is running',
            'Verify the API base URL is correct',
            'Check firewall and network settings'
          ]
        },
        {
          problem: 'Timeout Error',
          symptoms: ['Request timed out', 'ECONNABORTED'],
          solutions: [
            'Increase timeout value',
            'Check server performance',
            'Optimize API response time'
          ]
        },
        {
          problem: '404 Not Found',
          symptoms: ['404 status code', 'Endpoint not found'],
          solutions: [
            'Verify API endpoint URLs',
            'Check if backend routes are properly configured',
            'Ensure API version compatibility'
          ]
        }
      ]
    };
  }

  // Generate diagnostic report
  async generateDiagnosticReport() {
    console.log('🔧 Generating API Diagnostic Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        mode: import.meta.env.MODE,
        isProduction: this.isProduction,
        isDevelopment: this.isDevelopment,
        apiBaseUrl: this.apiBaseUrl
      },
      connectivity: await this.testAPIConnectivity(),
      commonIssues: this.getCommonIssues(),
      recommendations: []
    };

    // Generate recommendations based on test results
    const failedTests = report.connectivity.tests.filter(test => !test.success);
    
    if (failedTests.length > 0) {
      report.recommendations.push('Some API tests failed. Check the connectivity results above.');
      
      if (failedTests.some(test => test.error && test.error.includes('CORS'))) {
        report.recommendations.push('CORS issues detected. Configure CORS on the backend server.');
      }
      
      if (failedTests.some(test => test.error && test.error.includes('Failed to fetch'))) {
        report.recommendations.push('Network connectivity issues. Verify the backend server is running and accessible.');
      }
    } else {
      report.recommendations.push('All API tests passed. The API should be working correctly.');
    }

    console.log('📋 Diagnostic Report:', report);
    return report;
  }
}

// Create singleton instance
const apiDebugger = new APIDebugger();

// Auto-run diagnostics in development or when there are API issues
if (import.meta.env.DEV) {
  // Run diagnostics after a short delay to allow the app to load
  setTimeout(() => {
    apiDebugger.generateDiagnosticReport();
  }, 2000);
}

export default apiDebugger;

// Convenience functions
export const testAPIConnectivity = () => apiDebugger.testAPIConnectivity();
export const generateDiagnosticReport = () => apiDebugger.generateDiagnosticReport();
export const checkBaseURL = () => apiDebugger.checkBaseURL();
