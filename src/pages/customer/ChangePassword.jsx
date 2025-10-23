import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const ChangePassword = () => {
  const { user } = useAuth();
  const _navigate = useNavigate();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, _setUserProfile] = useState(null);

  // Log user data on component mount
  useEffect(() => {
    if (user) {
      console.log('🔵 [ChangePassword] User loaded:', user);
      console.log('🔵 [ChangePassword] User ID from context:', user.id);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 [ChangePassword] Form submitted!');
    console.log('🔵 [ChangePassword] Form data:', formData);
    console.log('🔵 [ChangePassword] User:', user);
    console.log('🔵 [ChangePassword] User profile:', userProfile);
    
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Get user_id from user context (stored as 'id' from login response)
      const userId = user?.id;
      
      console.log('🔵 [ChangePassword] User ID found:', userId);
      console.log('🔵 [ChangePassword] User object keys:', Object.keys(user || {}));
      
      if (!userId) {
        console.error('❌ [ChangePassword] No user ID found!');
        console.error('❌ [ChangePassword] User object:', user);
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      // The API expects user_id, current_password, and new_password
      const requestData = {
        user_id: parseInt(userId), // Ensure it's a number
        current_password: formData.current_password,
        new_password: formData.new_password
      };
      
      console.log('🔵 [ChangePassword] About to call API with data:', requestData);
      console.log('🔵 [ChangePassword] Calling authAPI.changePassword...');
      
      const response = await authAPI.changePassword(requestData);
      
      console.log('✅ [ChangePassword] API Success:', response.data);
      setMessage(response.data.message || 'Password changed successfully!');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Optionally log the user out after password change
      // logout();
      // navigate('/login');
      
    } catch (error) {
      console.error('❌ [ChangePassword] API Error:', error);
      console.error('❌ [ChangePassword] Error response:', error.response?.data);
      
      // More specific error messages
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.response?.data?.detail ||
                      'Failed to change password. Please try again.';
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update your account password
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-6 rounded">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 mb-6 rounded">
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1">
                <input
                  id="current_password"
                  name="current_password"
                  type="password"
                  required
                  value={formData.current_password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  required
                  minLength="8"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength="8"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <a href="/profile" className="font-medium text-primary-600 hover:text-primary-500">
              Back to Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
