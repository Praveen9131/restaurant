# 🔧 API Troubleshooting Guide - Production Issues

This guide helps diagnose and fix API connectivity issues in production.

## 🚨 Common API Issues in Production

### 1. **CORS (Cross-Origin Resource Sharing) Errors**

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/categories/' from origin 'http://localhost:4173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Solutions:**
1. **Backend CORS Configuration** - Add CORS headers to your backend:
   ```python
   # Django example
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:4173",
       "https://yourdomain.com",
   ]
   CORS_ALLOW_CREDENTIALS = True
   ```

2. **Nginx Proxy** - Use Nginx to proxy API requests:
   ```nginx
   location /api/ {
       proxy_pass http://localhost:8000/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

### 2. **Network/Connection Errors**

**Symptoms:**
```
Failed to fetch
ERR_NETWORK
ERR_CONNECTION_REFUSED
```

**Solutions:**
1. **Check Backend Server Status:**
   ```bash
   # Test if backend is running
   curl http://localhost:8000/categories/
   
   # Check if port is open
   netstat -tlnp | grep :8000
   ```

2. **Verify API Base URL:**
   - Check `.env` file has correct `VITE_API_BASE_URL`
   - Ensure URL matches your backend server address
   - For production: `https://yourdomain.com` or `https://api.yourdomain.com`

### 3. **Environment Configuration Issues**

**Problem:** APIs work in development but not production

**Solutions:**
1. **Create Production Environment File:**
   ```bash
   # Copy example file
   cp env.example .env
   
   # Edit with production values
   nano .env
   ```

2. **Set Correct API URL:**
   ```env
   # For local backend
   VITE_API_BASE_URL=http://localhost:8000
   
   # For production backend
   VITE_API_BASE_URL=https://api.yourdomain.com
   
   # For same-domain backend
   VITE_API_BASE_URL=/api
   ```

### 4. **Build Configuration Issues**

**Problem:** Environment variables not loaded in production build

**Solutions:**
1. **Rebuild with Environment:**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

2. **Check Build Output:**
   ```bash
   # Verify environment variables are included
   grep -r "VITE_API_BASE_URL" dist/
   ```

## 🔍 Diagnostic Steps

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for API configuration logs:
   ```
   🔧 API Configuration: {
     API_BASE_URL: "http://localhost:8000",
     isDevelopment: false,
     isProduction: true,
     env: "production"
   }
   ```

### Step 2: Check Network Tab
1. Go to Network tab in Developer Tools
2. Try to load the menu or make an API call
3. Look for failed requests (red entries)
4. Check the request URL and status

### Step 3: Test API Endpoints Directly
```bash
# Test categories endpoint
curl -X GET http://localhost:8000/categories/

# Test menu endpoint
curl -X GET http://localhost:8000/GetAllMenu/

# Test with CORS headers
curl -X GET http://localhost:8000/categories/ \
  -H "Origin: http://localhost:4173" \
  -H "Access-Control-Request-Method: GET"
```

### Step 4: Use Built-in API Debugger
The app includes an API debugger that runs automatically in development:

```javascript
// In browser console
import('./utils/apiDebug').then(module => {
  module.generateDiagnosticReport();
});
```

## 🛠️ Quick Fixes

### Fix 1: Update API Base URL
```bash
# Create .env file with correct API URL
echo "VITE_API_BASE_URL=http://your-backend-server:8000" > .env

# Rebuild the application
npm run build
```

### Fix 2: Configure Backend CORS
```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4173",
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Only for development
```

### Fix 3: Use Nginx Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve frontend
    location / {
        root /var/www/seasidelbs;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Fix 4: Environment-Specific Configuration
```javascript
// In vite.config.js
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    define: {
      __API_BASE_URL__: JSON.stringify(
        isProduction 
          ? 'https://api.yourdomain.com' 
          : 'http://localhost:8000'
      )
    }
  }
})
```

## 📋 Production Deployment Checklist

### Before Deployment:
- [ ] Backend server is running and accessible
- [ ] CORS is properly configured on backend
- [ ] API endpoints are tested and working
- [ ] Environment variables are set correctly
- [ ] SSL certificates are installed (for HTTPS)

### After Deployment:
- [ ] Test API calls from production URL
- [ ] Check browser console for errors
- [ ] Verify CORS headers in network tab
- [ ] Test all major features (menu, cart, orders)
- [ ] Monitor error logs

## 🆘 Emergency Fixes

### If APIs Stop Working Suddenly:

1. **Check Backend Server:**
   ```bash
   # Restart backend server
   sudo systemctl restart your-backend-service
   
   # Check logs
   sudo journalctl -u your-backend-service -f
   ```

2. **Check Frontend Build:**
   ```bash
   # Rebuild and redeploy
   npm run build
   # Deploy dist/ folder to your server
   ```

3. **Check DNS/Network:**
   ```bash
   # Test DNS resolution
   nslookup api.yourdomain.com
   
   # Test connectivity
   ping api.yourdomain.com
   ```

## 📞 Support Information

### For API Issues:
- **Backend Team**: Check backend server logs
- **DevOps Team**: Check server configuration and CORS
- **Frontend Team**: Check environment variables and build

### Debug Information to Collect:
1. Browser console errors
2. Network tab failed requests
3. Backend server logs
4. Environment configuration
5. API endpoint test results

---

**Last Updated**: October 2024  
**For**: SeaSide Live Bake Studio Production Deployment
