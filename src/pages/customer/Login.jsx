import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (error) setError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login attempt with:', { username: formData.username });
      const result = await login(formData.username, formData.password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Login successful - navigate to menu
        console.log('✅ Login successful, navigating to menu');
        navigate('/menu');
      } else {
        // Login failed - show error message from backend API
        console.log('❌ Login failed with error:', result.error);
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('Unexpected login error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data
      });
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      // Handle specific status codes
      if (error.response?.status === 400) {
        // Status code 400 - Print the response
        console.log('🔴 Status Code 400 - Printing Response:');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.log('Response Headers:', error.response.headers);
        
        // Extract error message from response
        if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = `Bad Request (400): ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.response?.status === 201) {
        // Status code 201 - Proceed to next page
        console.log('✅ Status Code 201 - Login successful, proceeding to next page');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        navigate('/menu');
        return; // Exit early to prevent setting error
      } else if (error.response?.status === 200) {
        // Status code 200 - Login successful
        console.log('✅ Status Code 200 - Login successful, proceeding to next page');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        navigate('/menu');
        return; // Exit early to prevent setting error
      } else {
        // Try to extract error from response for other status codes
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // If 404 error, provide helpful message
        if (error.status === 404) {
          errorMessage = 'API endpoint not found (404). Please check if the server is running correctly.';
        } else if (error.isNetworkError) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-white/90 text-lg">Login to your account</p>
        </div>

        <div className="card p-8 professional-shadow">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-red-500 mt-1">Debug: {error}</p>
                  )}
                </div>
              </div>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Username or Email
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your username or email"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 font-medium hover:underline">
                Sign Up
              </Link>
            </p>
            <p className="text-gray-600">
              <Link to="/forgot-password" className="text-primary-600 font-medium hover:underline">
                Forgot Password?
              </Link>
            </p>
            <p className="text-gray-600">
              <Link to="/admin/login" className="text-secondary-600 font-medium hover:underline">
                Admin Login
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

