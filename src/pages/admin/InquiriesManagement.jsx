import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { inquiryAPI, adminAPI } from '../../services/api';

const InquiriesManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getInquiries();
      // API returns array directly, not wrapped in object
      setInquiries(response.data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      console.error('Error response:', error.response);
      
      // Check if it's a 404 error (endpoint not available)
      if (error.response?.status === 404) {
        showError('Note: Inquiry list endpoint is not available. Inquiries are being received and stored, but the backend team needs to add a GET /inquirylist/ endpoint to view them.');
        setInquiries([]);
      } else {
        showError('Failed to fetch inquiries: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      await adminAPI.updateInquiryStatus({ id: inquiryId, status: newStatus });
      showSuccess(`Inquiry marked as ${newStatus.replace('_', ' ')}!`);
      fetchInquiries();
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update inquiry status');
    }
  };

  const deleteInquiry = async (inquiryId) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      try {
        await inquiryAPI.delete(inquiryId);
        showSuccess('Inquiry deleted successfully!');
        fetchInquiries();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete inquiry');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FC8019]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1C] leading-relaxed mb-2">Inquiries Management</h1>
          <p className="text-[#9C9C9C] leading-relaxed">Manage customer inquiries and messages</p>
        </div>
        <button
          onClick={fetchInquiries}
          className="bg-[#FC8019] hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Inquiries List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-[#FC8019] rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-sm">
                      {inquiry.name?.charAt(0)?.toUpperCase() || inquiry.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1C1C1C] leading-relaxed mb-1">{inquiry.name || inquiry.customer_name}</h3>
                    <p className="text-sm text-[#9C9C9C] leading-relaxed">{inquiry.email}</p>
                  </div>
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    inquiry.status === 'resolved' 
                      ? 'bg-green-100 text-green-700' 
                      : inquiry.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inquiry.status === 'in_progress' ? 'In Progress' : inquiry.status === 'resolved' ? 'Resolved' : 'New'}
                  </span>
                </div>
                <p className="text-[#1C1C1C] text-sm line-clamp-3 mb-4 leading-relaxed">{inquiry.message}</p>
                <div className="flex items-center justify-between text-xs text-[#9C9C9C] leading-relaxed">
                  <span>Phone: {inquiry.phone || 'N/A'}</span>
                  <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedInquiry(inquiry)}
                className="flex-1 bg-[#FC8019] hover:bg-orange-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              >
                View Details
              </button>
              {inquiry.status !== 'in_progress' && (
                <button
                  onClick={() => updateInquiryStatus(inquiry.id, 'in_progress')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                  title="Mark as In Progress"
                >
                  In Progress
                </button>
              )}
              {inquiry.status !== 'resolved' && (
                <button
                  onClick={() => updateInquiryStatus(inquiry.id, 'resolved')}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                  title="Mark as Resolved"
                >
                  Resolve
                </button>
              )}
              <button
                onClick={() => deleteInquiry(inquiry.id)}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-3 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {inquiries.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Inquiry List Endpoint Not Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">
                  <strong>Status:</strong> Inquiries are being <strong>received and stored</strong> via the contact form (/inquirycreate/ endpoint is working).
                </p>
                <p className="mb-2">
                  <strong>Issue:</strong> The backend does not have a GET endpoint to retrieve inquiries.
                </p>
                <p className="mb-2">
                  <strong>Solution Required:</strong> Backend team needs to implement:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-yellow-100 px-1 rounded">GET /inquiries/</code> - To fetch all inquiries</li>
                  <li><code className="bg-yellow-100 px-1 rounded">GET /inquiry/{'{id}'}/</code> - To fetch specific inquiry</li>
                  <li><code className="bg-yellow-100 px-1 rounded">POST /inquiry/reply/</code> - To reply to inquiries</li>
                </ul>
                <p className="mt-3">
                  <strong>Temporary Workaround:</strong> Check the database directly or implement email notifications for new inquiries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-swiggy font-bold text-gray-800">
                Inquiry Details
              </h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedInquiry.name || selectedInquiry.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedInquiry.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedInquiry.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedInquiry.created_at).toLocaleDateString()} at{' '}
                      {new Date(selectedInquiry.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedInquiry.status === 'resolved' 
                        ? 'bg-green-100 text-green-700' 
                        : selectedInquiry.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedInquiry.status === 'in_progress' ? 'In Progress' : selectedInquiry.status === 'resolved' ? 'Resolved' : 'New'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{selectedInquiry.message}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry.id, 'in_progress')}
                    disabled={selectedInquiry.status === 'in_progress'}
                    className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
                      selectedInquiry.status === 'in_progress'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry.id, 'resolved')}
                    disabled={selectedInquiry.status === 'resolved'}
                    className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
                      selectedInquiry.status === 'resolved'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                >
                  Reply via Email
                </a>
                {selectedInquiry.phone && (
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                  >
                    Call Customer
                  </a>
                )}
                <button
                  onClick={() => deleteInquiry(selectedInquiry.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiriesManagement;
