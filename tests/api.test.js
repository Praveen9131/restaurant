const axios = require('axios');

// API Configuration
const API_BASE_URL = 'https://api.seasidelbs.com';
const TIMEOUT = 10000; // 10 seconds

describe('Restaurant API Automation Tests', () => {
  let apiClient;

  beforeAll(() => {
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  });

  describe('Menu API Tests', () => {
    test('GET /GetAllMenu/ - Should return all menu items', async () => {
      const response = await apiClient.get('/GetAllMenu/');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.total_items).toBeGreaterThan(0);
      expect(Array.isArray(response.data.menu_items)).toBe(true);
      expect(response.data.menu_items.length).toBeGreaterThan(0);
    });

    test('GET /GetAllMenu/ - Should have correct item structure', async () => {
      const response = await apiClient.get('/GetAllMenu/');
      const item = response.data.menu_items[0];
      
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('pricing_type');
      expect(item).toHaveProperty('is_available');
      expect(item).toHaveProperty('is_vegetarian');
      expect(item).toHaveProperty('category_id');
      expect(item).toHaveProperty('category_name');
      expect(item).toHaveProperty('image');
      expect(item).toHaveProperty('created_at');
    });

    test('GET /GetAllMenu/?vegetarian_only=true - Should return only vegetarian items', async () => {
      const response = await apiClient.get('/GetAllMenu/?vegetarian_only=true');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.menu_items.length).toBeGreaterThan(0);
      
      // Verify all items are vegetarian
      response.data.menu_items.forEach(item => {
        expect(item.is_vegetarian).toBe(true);
      });
    });

    test('GET /GetAllMenu/?category_id=5 - Should return items from specific category', async () => {
      const response = await apiClient.get('/GetAllMenu/?category_id=5');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      if (response.data.menu_items.length > 0) {
        response.data.menu_items.forEach(item => {
          expect(item.category_id).toBe(5);
        });
      }
    });

    test('GET /GetAllMenu/?category_id=999 - Should handle invalid category gracefully', async () => {
      const response = await apiClient.get('/GetAllMenu/?category_id=999');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.menu_items).toEqual([]);
    });

    test('GET /GetAllMenu/ - Response time should be under 2 seconds', async () => {
      const startTime = Date.now();
      const response = await apiClient.get('/GetAllMenu/');
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Categories API Tests', () => {
    test('GET /categories/ - Should return all categories', async () => {
      const response = await apiClient.get('/categories/');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.categories)).toBe(true);
      expect(response.data.categories.length).toBeGreaterThan(0);
    });

    test('GET /categories/ - Should have correct category structure', async () => {
      const response = await apiClient.get('/categories/');
      const category = response.data.categories[0];
      
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
    });

    test('GET /categories/ - Response time should be under 1 second', async () => {
      const startTime = Date.now();
      const response = await apiClient.get('/categories/');
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Data Validation Tests', () => {
    test('Menu items should have valid data types', async () => {
      const response = await apiClient.get('/GetAllMenu/');
      
      response.data.menu_items.forEach(item => {
        expect(typeof item.id).toBe('number');
        expect(typeof item.name).toBe('string');
        expect(typeof item.description).toBe('string');
        expect(typeof item.is_available).toBe('boolean');
        expect(typeof item.is_vegetarian).toBe('boolean');
        expect(typeof item.category_id).toBe('number');
        expect(typeof item.category_name).toBe('string');
        expect(typeof item.pricing_type).toBe('string');
      });
    });

    test('Menu items should have valid pricing', async () => {
      const response = await apiClient.get('/GetAllMenu/');
      
      response.data.menu_items.forEach(item => {
        if (item.pricing_type === 'single') {
          expect(typeof item.price).toBe('number');
          expect(item.price).toBeGreaterThan(0);
        } else if (item.pricing_type === 'multiple') {
          expect(typeof item.price_variations).toBe('object');
          expect(Object.keys(item.price_variations).length).toBeGreaterThan(0);
        }
      });
    });

    test('Categories should have valid data types', async () => {
      const response = await apiClient.get('/categories/');
      
      response.data.categories.forEach(category => {
        expect(typeof category.id).toBe('number');
        expect(typeof category.name).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(category.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('Should handle network timeout gracefully', async () => {
      const timeoutClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 1, // 1ms timeout to force timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await expect(timeoutClient.get('/GetAllMenu/')).rejects.toThrow();
    });

    test('Should handle invalid endpoint gracefully', async () => {
      try {
        await apiClient.get('/invalid-endpoint/');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('Performance Tests', () => {
    test('Concurrent API calls should handle load', async () => {
      const promises = Array(10).fill().map(() => 
        apiClient.get('/GetAllMenu/')
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    test('API should handle rapid sequential requests', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(apiClient.get('/GetAllMenu/'));
      }
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
