const axios = require('axios');
const { performance } = require('perf_hooks');

describe('Performance Automation Tests', () => {
  const API_BASE_URL = 'https://api.seasidelbs.com';
  const PERFORMANCE_THRESHOLDS = {
    API_RESPONSE_TIME: 2000, // 2 seconds
    CONCURRENT_REQUESTS: 10,
    MEMORY_USAGE_MB: 100,
    CPU_USAGE_PERCENT: 80
  };

  describe('API Performance Tests', () => {
    test('Menu API should respond within acceptable time', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${API_BASE_URL}/GetAllMenu/`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      console.log(`Menu API Response Time: ${responseTime.toFixed(2)}ms`);
    });

    test('Categories API should respond within acceptable time', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${API_BASE_URL}/categories/`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // 1 second for categories
      
      console.log(`Categories API Response Time: ${responseTime.toFixed(2)}ms`);
    });

    test('Should handle concurrent requests efficiently', async () => {
      const startTime = performance.now();
      
      const promises = Array(PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS).fill().map(() => 
        axios.get(`${API_BASE_URL}/GetAllMenu/`)
      );
      
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const avgTimePerRequest = totalTime / PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS;
      expect(avgTimePerRequest).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      console.log(`Concurrent Requests (${PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS}): ${totalTime.toFixed(2)}ms total, ${avgTimePerRequest.toFixed(2)}ms average`);
    });

    test('Should handle rapid sequential requests', async () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 5; i++) {
        const response = await axios.get(`${API_BASE_URL}/GetAllMenu/`);
        expect(response.status).toBe(200);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / 5;
      
      expect(avgTimePerRequest).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      console.log(`Sequential Requests (5): ${totalTime.toFixed(2)}ms total, ${avgTimePerRequest.toFixed(2)}ms average`);
    });
  });

  describe('Load Testing', () => {
    test('Should handle high load without degradation', async () => {
      const loadTestRequests = 20;
      const startTime = performance.now();
      
      const promises = Array(loadTestRequests).fill().map(async (_, index) => {
        const requestStart = performance.now();
        const response = await axios.get(`${API_BASE_URL}/GetAllMenu/`);
        const requestEnd = performance.now();
        
        return {
          index,
          status: response.status,
          responseTime: requestEnd - requestStart,
          dataSize: JSON.stringify(response.data).length
        };
      });
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Analyze results
      const responseTimes = results.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      
      // Performance should not degrade significantly
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      expect(maxResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2);
      
      console.log(`Load Test Results (${loadTestRequests} requests):`);
      console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min Response Time: ${minResponseTime.toFixed(2)}ms`);
      console.log(`  Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
    });

    test('Should maintain consistent response times under stress', async () => {
      const stressTestRounds = 3;
      const requestsPerRound = 10;
      const responseTimes = [];
      
      for (let round = 0; round < stressTestRounds; round++) {
        const roundStart = performance.now();
        
        const promises = Array(requestsPerRound).fill().map(() => 
          axios.get(`${API_BASE_URL}/GetAllMenu/`)
        );
        
        await Promise.all(promises);
        const roundEnd = performance.now();
        const roundTime = roundEnd - roundStart;
        
        responseTimes.push(roundTime);
        
        // Small delay between rounds
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check consistency
      const avgRoundTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const timeVariance = responseTimes.map(time => Math.abs(time - avgRoundTime)).reduce((a, b) => a + b, 0) / responseTimes.length;
      
      expect(avgRoundTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * requestsPerRound);
      expect(timeVariance).toBeLessThan(avgRoundTime * 0.5); // Variance should be less than 50% of average
      
      console.log(`Stress Test Results:`);
      console.log(`  Average Round Time: ${avgRoundTime.toFixed(2)}ms`);
      console.log(`  Time Variance: ${timeVariance.toFixed(2)}ms`);
      console.log(`  Round Times: ${responseTimes.map(t => t.toFixed(2)).join(', ')}ms`);
    });
  });

  describe('Memory and Resource Tests', () => {
    test('Should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make many requests
      for (let i = 0; i < 50; i++) {
        const response = await axios.get(`${API_BASE_URL}/GetAllMenu/`);
        expect(response.status).toBe(200);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      expect(memoryIncreaseMB).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB);
      
      console.log(`Memory Usage:`);
      console.log(`  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    });

    test('Should handle large response payloads efficiently', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${API_BASE_URL}/GetAllMenu/`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      const payloadSize = JSON.stringify(response.data).length;
      const payloadSizeKB = payloadSize / 1024;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      
      // Response should be reasonably sized
      expect(payloadSizeKB).toBeLessThan(500); // Less than 500KB
      
      console.log(`Large Payload Test:`);
      console.log(`  Response Time: ${responseTime.toFixed(2)}ms`);
      console.log(`  Payload Size: ${payloadSizeKB.toFixed(2)}KB`);
      console.log(`  Items Count: ${response.data.menu_items.length}`);
    });
  });

  describe('Network Performance Tests', () => {
    test('Should handle different network conditions', async () => {
      const networkConditions = [
        { name: 'Fast 3G', delay: 100 },
        { name: 'Slow 3G', delay: 500 },
        { name: '2G', delay: 1000 }
      ];
      
      for (const condition of networkConditions) {
        const startTime = performance.now();
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, condition.delay));
        
        const response = await axios.get(`${API_BASE_URL}/GetAllMenu/`);
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME + condition.delay);
        
        console.log(`${condition.name}: ${totalTime.toFixed(2)}ms`);
      }
    });

    test('Should handle connection timeouts gracefully', async () => {
      const timeoutClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 1000 // 1 second timeout
      });
      
      const startTime = performance.now();
      
      try {
        await timeoutClient.get('/GetAllMenu/');
      } catch (error) {
        const endTime = performance.now();
        const timeoutTime = endTime - startTime;
        
        expect(timeoutTime).toBeLessThan(2000); // Should timeout within 2 seconds
        console.log(`Timeout handled in: ${timeoutTime.toFixed(2)}ms`);
      }
    });
  });

  describe('Scalability Tests', () => {
    test('Should scale with increasing request volume', async () => {
      const volumes = [5, 10, 20, 50];
      const results = [];
      
      for (const volume of volumes) {
        const startTime = performance.now();
        
        const promises = Array(volume).fill().map(() => 
          axios.get(`${API_BASE_URL}/GetAllMenu/`)
        );
        
        await Promise.all(promises);
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTimePerRequest = totalTime / volume;
        
        results.push({
          volume,
          totalTime,
          avgTimePerRequest
        });
        
        expect(avgTimePerRequest).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
      }
      
      console.log('Scalability Test Results:');
      results.forEach(result => {
        console.log(`  Volume ${result.volume}: ${result.totalTime.toFixed(2)}ms total, ${result.avgTimePerRequest.toFixed(2)}ms avg`);
      });
    });
  });
});
