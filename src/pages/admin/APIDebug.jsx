import React, { useState } from 'react';
import { adminAPI, testAPI, testAdminLogin, testUploadEndpoint, fileAPI } from '../../services/api';

const APIDebug = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const runTest = async (testName, testFunction) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFunction();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: { success: false, error: error.message, details: error } }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'Basic API Connection',
      function: testAPI,
      description: 'Test basic API connectivity with /categories/'
    },
    {
      name: 'Admin Login API Test',
      function: testAdminLogin,
      description: 'Test admin login endpoint accessibility'
    },
    {
      name: 'Create Admin Test',
      function: () => adminAPI.createAdmin({
        email: 'test@test.com',
        password: 'test123',
        first_name: 'Test',
        last_name: 'Admin',
        phone: '+1234567890',
        address: 'Test Address',
        username: 'testadmin'
      }),
      description: 'Test admin creation endpoint'
    },
    {
      name: 'Admin Login Test',
      function: () => adminAPI.login({
        username: 'admin@seasidelbs.com',
        password: 'admin123'
      }),
      description: 'Test actual admin login with working demo credentials'
    },
    {
      name: 'File Upload Test',
      function: testUploadEndpoint,
      description: 'Test file upload endpoint /upload/ with a test file'
    },
    {
      name: 'Image Upload Test',
      function: async () => {
        if (!selectedFile) {
          throw new Error('Please select an image file first');
        }
        return await fileAPI.uploadImage(selectedFile);
      },
      description: 'Test image upload with selected file'
    },
    {
      name: 'Inquiry List Test',
      function: () => adminAPI.getInquiries(),
      description: 'Test getting all inquiries from /inquirylist/'
    },
    {
      name: 'Inquiry Update Test',
      function: () => adminAPI.updateInquiryStatus({ id: 1, status: 'in_progress' }),
      description: 'Test updating inquiry status via /inquiryupdate/'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Debug Console</h1>
        
        <div className="grid gap-6">
          {tests.map((test) => (
            <div key={test.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.description}</p>
                </div>
                <button
                  onClick={() => runTest(test.name, test.function)}
                  disabled={loading[test.name]}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading[test.name] ? 'Running...' : 'Run Test'}
                </button>
              </div>
              
              {results[test.name] && (
                <div className={`p-4 rounded ${
                  results[test.name].success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    results[test.name].success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {results[test.name].success ? '✅ Success' : '❌ Failed'}
                  </h4>
                  <pre className="text-sm overflow-auto max-h-40">
                    {JSON.stringify(results[test.name], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Upload Testing</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File for Testing:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}
            </div>
            <div>
              <strong>API Base URL:</strong> {import.meta.env.DEV ? 'Relative (using proxy)' : 'https://api.seasidelbs.com'}
            </div>
            <div>
              <strong>Current URL:</strong> {window.location.href}
            </div>
            <div>
              <strong>User Agent:</strong> {navigator.userAgent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDebug;
