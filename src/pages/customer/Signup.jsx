import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);


  const validateField = (name, value) => {
    const errors = {};
    
    switch(name) {
      case 'first_name':
        if (!value.trim()) {
          errors[name] = 'First name is required';
        } else if (value.length < 2) {
          errors[name] = 'Must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors[name] = 'Only letters and spaces allowed';
        }
        break;
        
      case 'last_name':
        // Last name is optional, but if provided, validate it
        if (value.trim() && value.length < 2) {
          errors[name] = 'Must be at least 2 characters';
        } else if (value.trim() && !/^[a-zA-Z\s]+$/.test(value)) {
          errors[name] = 'Only letters and spaces allowed';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors[name] = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[name] = 'Please enter a valid email address';
        }
        break;
        
      case 'password':
        if (!value) {
          errors[name] = 'Password is required';
        } else if (value.length < 8) {
          errors[name] = 'Must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          errors[name] = 'Must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          errors[name] = 'Must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
          errors[name] = 'Must contain at least one number';
        }
        
        // Calculate password strength
        {
          let strength = 0;
          if (value.length >= 8) strength++;
          if (value.length >= 12) strength++;
          if (/(?=.*[a-z])/.test(value)) strength++;
          if (/(?=.*[A-Z])/.test(value)) strength++;
          if (/(?=.*\d)/.test(value)) strength++;
          if (/(?=.*[!@#$%^&*])/.test(value)) strength++;
          setPasswordStrength(Math.min(strength, 4));
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errors[name] = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors[name] = 'Passwords do not match';
        }
        break;
        
      case 'phone':
        // Phone is optional, but if provided, validate it
        if (value.trim() && !/^[+]?[\d\s\-()]{10,15}$/.test(value)) {
          errors[name] = 'Please enter a valid phone number (10-15 digits)';
        }
        break;
        
      case 'address':
        // Address is optional, but if provided, validate it
        if (value.trim() && value.length < 10) {
          errors[name] = 'Please enter a complete address (min 10 characters)';
        }
        break;
        
      case 'username':
        if (!value.trim()) {
          errors[name] = 'Username is required';
        } else if (value.length < 3) {
          errors[name] = 'Username must be at least 3 characters';
        } else if (value.length > 20) {
          errors[name] = 'Username must be less than 20 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors[name] = 'Username can only contain letters, numbers, and underscores';
        }
        break;
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Real-time validation
    const errors = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      ...errors,
      [name]: errors[name] || null
    }));
    
    // Clear general error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate only mandatory fields
    const mandatoryFields = ['email', 'first_name', 'password', 'username'];
    const allErrors = {};
    
    mandatoryFields.forEach(key => {
      const errors = validateField(key, formData[key]);
      if (errors[key]) {
        allErrors[key] = errors[key];
      }
    });
    
    // Validate optional fields only if they have values
    const optionalFields = ['last_name', 'phone', 'address'];
    optionalFields.forEach(key => {
      if (formData[key].trim()) {
        const errors = validateField(key, formData[key]);
        if (errors[key]) {
          allErrors[key] = errors[key];
        }
      }
    });
    
    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      allErrors.confirmPassword = 'Passwords do not match';
    }
    
    // If there are errors, show them and stop
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setError('Please fix the errors above before submitting');
      setLoading(false);
      return;
    }

    // Remove confirmPassword and prepare data for API
    const { confirmPassword: _confirmPassword, ...signupData } = formData;
    
    // Ensure optional fields are sent as empty strings if not provided
    const apiData = {
      email: signupData.email,
      password: signupData.password,
      first_name: signupData.first_name,
      last_name: signupData.last_name || '',
      phone: signupData.phone || '',
      address: signupData.address || '',
      username: signupData.username
    };
    
    const result = await signup(apiData);
    
    console.log('Signup result:', result);
    
    if (result.success) {
      // Signup successful - show success message and navigate to login
      console.log('✅ Signup successful, navigating to login');
      alert('Account created successfully! Please login.');
      navigate('/login');
    } else {
      // Signup failed - show error message from backend API
      console.log('❌ Signup failed with error:', result.error);
      setError(result.error);
    }
    
    setLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/90 text-lg">Join us and start ordering delicious food!</p>
          <p className="text-white/70 text-sm mt-2">Only email, first name, and password are required</p>
        </div>

        <div className="card p-8 professional-shadow">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  minLength="2"
                  maxLength="50"
                  pattern="[a-zA-Z\s]+"
                  className={`input-field ${fieldErrors.first_name ? 'border-red-500 focus:ring-red-500' : formData.first_name.length >= 2 ? 'border-green-500' : ''}`}
                  placeholder="John"
                />
                {fieldErrors.first_name && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {fieldErrors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  minLength="2"
                  maxLength="50"
                  pattern="[a-zA-Z\s]+"
                  className={`input-field ${fieldErrors.last_name ? 'border-red-500 focus:ring-red-500' : formData.last_name.length >= 2 ? 'border-green-500' : ''}`}
                  placeholder="Doe (optional)"
                />
                {fieldErrors.last_name && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {fieldErrors.last_name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Optional</p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`input-field ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : formData.email.includes('@') && formData.email.includes('.') ? 'border-green-500' : ''}`}
                placeholder="john.doe@example.com"
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {fieldErrors.email}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength="3"
                maxLength="20"
                pattern="[a-zA-Z0-9_]+"
                className={`input-field ${fieldErrors.username ? 'border-red-500 focus:ring-red-500' : formData.username.length >= 3 ? 'border-green-500' : ''}`}
                placeholder="johndoe123"
              />
              {fieldErrors.username && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                className={`input-field ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : passwordStrength >= 3 ? 'border-green-500' : ''}`}
                placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              />
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {fieldErrors.password}
                </p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must contain: uppercase, lowercase, number (8+ chars)</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`input-field ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'border-green-500' : ''}`}
                placeholder="Re-enter your password"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {fieldErrors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && formData.confirmPassword === formData.password && (
                <p className="text-green-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input-field ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : formData.phone.length >= 10 ? 'border-green-500' : ''}`}
                placeholder="+91 9876543210 (optional)"
              />
              {fieldErrors.phone && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {fieldErrors.phone}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Optional - 10-15 digits, can include +, -, (), spaces</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                minLength="10"
                className={`input-field ${fieldErrors.address ? 'border-red-500 focus:ring-red-500' : formData.address.length >= 10 ? 'border-green-500' : ''}`}
                rows="2"
                placeholder="123 Main Street, City, State, PIN (optional)"
              />
              {fieldErrors.address && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {fieldErrors.address}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Optional - Minimum 10 characters if provided</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:underline">
                Login
              </Link>
            </p>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

