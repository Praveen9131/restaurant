import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI } from '../../services/api';

const AllOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);

  // Fetch all orders by trying multiple approaches
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 [AllOrdersManagement] Fetching all orders...');
      
      let ordersList = [];
      
      // Strategy 1: Try to get all orders from AdminOrdersView
      try {
        console.log('📡 [AllOrdersManagement] Trying AdminOrdersView endpoint...');
        const ordersResponse = await adminAPI.getOrders();
        
        console.log('📊 [AllOrdersManagement] AdminOrdersView Response:', {
          status: ordersResponse.status,
          data: ordersResponse.data,
          hasOrders: !!ordersResponse.data?.orders,
          ordersCount: ordersResponse.data?.orders?.length || 0
        });
        
        if (ordersResponse.data && ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
          ordersList = ordersResponse.data.orders;
        } else if (Array.isArray(ordersResponse.data)) {
          ordersList = ordersResponse.data;
        }
      } catch (ordersError) {
        console.warn('⚠️ [AllOrdersManagement] AdminOrdersView failed, trying Dashboard API:', ordersError.message);
        
        // Strategy 2: Fallback to Dashboard API (limited to recent orders)
        try {
          console.log('📡 [AllOrdersManagement] Trying Dashboard API...');
          const dashboardResponse = await adminAPI.getDashboard();
          
          console.log('📊 [AllOrdersManagement] Dashboard Response:', {
            status: dashboardResponse.status,
            data: dashboardResponse.data,
            hasOrders: !!dashboardResponse.data?.recent_orders,
            ordersCount: dashboardResponse.data?.recent_orders?.length || 0
          });
          
          if (dashboardResponse.data && dashboardResponse.data.recent_orders && Array.isArray(dashboardResponse.data.recent_orders)) {
            ordersList = dashboardResponse.data.recent_orders;
          }
        } catch (dashboardError) {
          console.warn('⚠️ [AllOrdersManagement] Dashboard API failed:', dashboardError.message);
          throw ordersError; // Throw the original error
        }
      }
      
      console.log('📋 [AllOrdersManagement] Final orders list:', ordersList.length);
      setOrders(ordersList);
      
      if (ordersList.length === 0) {
        setError('No orders found in the system. Please check if there are any orders in the database.');
      }
      
    } catch (error) {
      console.error('❌ [AllOrdersManagement] Error fetching orders:', error);
      
      // Handle different types of errors
      let errorMessage = '';
      
      if (error.response?.status === 500) {
        errorMessage = 'Server Error: The backend server is experiencing issues. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API Endpoint Not Found: The orders endpoint is not available.';
      } else if (error.response?.data?.error) {
        errorMessage = `API Error: ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        errorMessage = `API Error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Network Error: ${error.message}`;
      } else {
        errorMessage = 'Unknown error occurred while fetching orders.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
      
      console.log('🔄 [AllOrdersManagement] Updating order status:', { orderId, newStatus });
      
      const response = await adminAPI.updateOrderStatus({
        order_id: orderId,
        status: newStatus
      });
      
      console.log('✅ [AllOrdersManagement] Order status updated:', response.data);
      
      // Update the order in the orders list
      setOrders(prev => 
        prev.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Show success message
      setError('');
      
    } catch (error) {
      console.error('❌ [AllOrdersManagement] Error updating order status:', error);
      
      let errorMessage = '';
      if (error.response?.status === 500) {
        errorMessage = 'Server Error: Unable to update order status. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = `API Error: ${error.response.data.error}`;
      } else {
        errorMessage = `Failed to update order status: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
      setShowStatusModal(false);
      setSelectedOrderForUpdate(null);
    }
  }, []);

  // Handle status update button click
  const handleStatusUpdate = useCallback((order) => {
    setSelectedOrderForUpdate(order);
    setShowStatusModal(true);
  }, []);

  // Filter orders based on search term and status
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_id?.toString().includes(searchTerm) ||
        order.order_number?.toString().includes(searchTerm);
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        statusClasses[status] || 'bg-gray-100 text-gray-800'
      }`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Orders Management</h1>
        <p className="text-gray-600">View and manage all orders across all customers</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer name, order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Results Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                {filteredOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders List</h2>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter ? 'No orders match your current filters' : 'No orders found in the system'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.order_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Order #{order.order_number || order.order_id}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                        <div>
                          <strong>Customer:</strong> {order.customer_name}
                        </div>
                        <div>
                          <strong>Date:</strong> {formatDate(order.order_date)}
                        </div>
                        <div>
                          <strong>Amount:</strong> {formatCurrency(order.total_amount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(order)}
                        disabled={updatingStatus[order.order_id]}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {updatingStatus[order.order_id] ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Update Status</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {order.delivery_address && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600">
                        <strong>Address:</strong> {order.delivery_address}
                      </p>
                    </div>
                  )}
                  
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Items:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{formatCurrency(item.price)}</span>
                            </div>
                            {item.selected_variation && (
                              <p className="text-gray-500 mt-1">Size: {item.selected_variation}</p>
                            )}
                            {item.special_instructions && (
                              <p className="text-gray-500 mt-1">Note: {item.special_instructions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrderForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrderForUpdate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Order:</strong> #{selectedOrderForUpdate.order_number || selectedOrderForUpdate.order_id}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Customer:</strong> {selectedOrderForUpdate.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Current Status:</strong> {selectedOrderForUpdate.status}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Select New Status:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
                    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
                    { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
                    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800' },
                    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
                    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateOrderStatus(selectedOrderForUpdate.order_id, status.value)}
                      disabled={updatingStatus[selectedOrderForUpdate.order_id]}
                      className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                        selectedOrderForUpdate.status === status.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrderForUpdate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrdersManagement;
