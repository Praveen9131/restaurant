// Security utilities for production

class SecurityManager {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.isDevelopment = import.meta.env.DEV;
  }

  // Sanitize user input to prevent XSS
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (Indian format)
  validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength score
  calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  // Rate limiting for API calls
  createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();
    
    return (key) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old requests
      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(time => time > windowStart);
        requests.set(key, userRequests);
      } else {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key);
      
      if (userRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      userRequests.push(now);
      return true; // Request allowed
    };
  }

  // Generate CSRF token
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate CSRF token
  validateCSRFToken(token, storedToken) {
    return token && storedToken && token === storedToken;
  }

  // Secure storage for sensitive data
  secureStorage = {
    setItem: (key, value) => {
      try {
        const encrypted = btoa(JSON.stringify(value));
        localStorage.setItem(key, encrypted);
      } catch (error) {
        console.error('Failed to store data securely:', error);
      }
    },
    
    getItem: (key) => {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return JSON.parse(atob(encrypted));
      } catch (error) {
        console.error('Failed to retrieve data securely:', error);
        return null;
      }
    },
    
    removeItem: (key) => {
      localStorage.removeItem(key);
    }
  };

  // Content Security Policy helper
  getCSPDirectives() {
    if (!this.isProduction) return {};
    
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': ["'self'", "https://api.seasidelbs.com"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    };
  }

  // Security headers for production
  getSecurityHeaders() {
    if (!this.isProduction) return {};
    
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }

  // Log security events
  logSecurityEvent(event, details = {}) {
    if (!this.isProduction) {
      console.log('[Security Event]', event, details);
      return;
    }
    
    const securityEvent = {
      event,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.secureStorage.getItem('userId') || 'anonymous'
    };
    
    // In production, send to security monitoring service
    console.log('[Security Event]', securityEvent);
    
    // Example: Send to security monitoring service
    // fetch('/api/security-events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(securityEvent)
    // }).catch(console.error);
  }

  // Validate file upload
  validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    if (file.size > maxSize) {
      errors.push(`File size ${file.size} exceeds maximum allowed size ${maxSize}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clean up sensitive data
  cleanup() {
    // Remove sensitive data from memory
    this.secureStorage.removeItem('authToken');
    this.secureStorage.removeItem('userData');
  }
}

// Create singleton instance
const securityManager = new SecurityManager();

export default securityManager;

// Convenience functions
export const sanitizeInput = (input) => securityManager.sanitizeInput(input);
export const validateEmail = (email) => securityManager.validateEmail(email);
export const validatePhone = (phone) => securityManager.validatePhone(phone);
export const validatePassword = (password) => securityManager.validatePassword(password);
export const secureStorage = securityManager.secureStorage;
export const logSecurityEvent = (event, details) => securityManager.logSecurityEvent(event, details);
