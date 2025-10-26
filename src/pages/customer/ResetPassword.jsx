import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Extract token from URL or localStorage when component mounts
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const tokenFromStorage = localStorage.getItem('passwordResetToken');
    setToken(tokenFromUrl);
  
    
    // Also check window.location.search for token (in case URL is localhost:8000)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromWindow = urlParams.get('token');
    
    console.log('🔍 Checking for token...');
    console.log('🔍 Token from searchParams:', tokenFromUrl);
    console.log('🔍 Token from window.location:', tokenFromWindow);
    console.log('🔍 Token from localStorage:', tokenFromStorage);
    
    // Priority: searchParams > window.location > localStorage
    const finalToken = tokenFromUrl || tokenFromWindow || tokenFromStorage;
    
    if (finalToken) {
      setToken(finalToken);
      console.log('✅ Token extracted:', finalToken.substring(0, 20) + '...');
    }
    // Silently handle no token - don't log or set error
  }, [searchParams]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (error) setError('');
    
    // After updating formData, validate passwords
    // Use setTimeout to ensure state update completes first
  };

  const validatePassword = () => {
    const errors = {};
    
    // Check password requirements
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }
    
    // Check if passwords match (only if both are filled)
    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
console.log(fieldErrors);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate token is present
    if (!token || token.trim() === '') {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!validatePassword(formData.password)) {
      setError('Please ensure your password meets all requirements');
      setLoading(false);
      return;
    }

    try {
      console.log('🔵 Submitting password reset request');
      console.log('🔵 Token being used:', token);
      console.log('🔵 Token length:', token?.length);
      console.log('🔵 API request data:', {
        token: token.substring(0, 20) + '...',
        new_password: formData.password.substring(0, 5) + '***'
      });
      
      const response = await authAPI.resetPassword({
        token,
        new_password: formData.password,
      });
      
      console.log('✅ Password reset successful:', response.data);
      setSuccess(true);
      setError('');
      
      // Clear the stored token and email from localStorage
      localStorage.removeItem('passwordResetToken');
      localStorage.removeItem('passwordResetEmail');
      console.log('✅ Token and email cleared from localStorage');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('❌ Reset password error:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card p-8 professional-shadow text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">Your password has been successfully changed. Redirecting to login...</p>
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔵 Current token value:', token);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/90 text-lg">Enter your new password</p>
          {token && (
            <p className="text-xs text-white/70 mt-2">
              Token: {token.substring(0, 20)}...
            </p>
          )}
        </div>

        <div className="card p-8 professional-shadow">
          {!token && !error && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              <p className="text-sm font-medium">No Token Found</p>
              <p className="text-xs mt-2">
                Please use the link from your email or request a new password reset link below.
              </p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs mt-2">
                Please check your email for the password reset link and click on it.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  className={`input-field pr-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Must contain: uppercase, lowercase, number (8+ chars)</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="8"
                  className={`input-field pr-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'border-green-500' : ''}`}
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!token && (
              <p className="text-sm text-gray-600 mb-2">
                Don't have a reset link?{' '}
                <Link to="/forgot-password" className="text-primary-600 font-medium hover:underline">
                  Request a new one
                </Link>
              </p>
            )}
            <p className="text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
