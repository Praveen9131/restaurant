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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // FIXED: Proper currency formatting function
  const formatCurrency = useCallback((amount) => {
    // Convert to number and handle invalid values
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₹0.00';
    
    // Format with proper Indian currency format
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  }, []);

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
      
      // FIXED: Process orders to ensure proper financial data structure with better number handling
      const processedOrders = ordersList.map((order, index) => {
        const processed = {
          ...order,
          subtotal: parseFloat(order.subtotal) || 0,
          delivery_fee: parseFloat(order.delivery_fee) || 0,
          total_amount: parseFloat(order.total_amount) || 0,
          items_count: order.items?.length || 0
        };
        
        // Debug logging for first few orders
        if (index < 3) {
          console.log('🔍 [AllOrdersManagement] Processing order:', {
            order_id: order.order_id,
            original_subtotal: order.subtotal,
            processed_subtotal: processed.subtotal,
            original_delivery_fee: order.delivery_fee,
            processed_delivery_fee: processed.delivery_fee,
            original_total_amount: order.total_amount,
            processed_total_amount: processed.total_amount
          });
        }
        
        return processed;
      });
      
      setOrders(processedOrders);
      
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

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_id?.toString().includes(searchTerm) ||
        order.order_number?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === '' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Get status badge color
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Format status for display
  const formatStatus = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Orders Management</h1>
          <p className="text-gray-600">View and manage all customer orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
              <input
                type="text"
                placeholder="Search by customer name or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex items-end">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh Orders</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredOrders.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{orders.length}</span> orders
          </p>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No orders available'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div key={order.order_id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.order_number || order.order_id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <span className="ml-2 font-medium text-gray-900">{order.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <span className="ml-2 font-medium text-gray-900">{order.customer_phone || order.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <span className="ml-2 font-medium text-gray-900">{order.customer_email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Order Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {order.order_date ? new Date(order.order_date).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : 'Invalid Date'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Items:</span>
                          <span className="ml-2 font-medium text-gray-900">{order.items_count} item(s)</span>
                        </div>
                      </div>
                      
                      {/* FIXED: Financial Breakdown with proper number formatting */}
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Subtotal</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.subtotal)}
                            </div>
                          </div>
                          <div className="text-center border-l border-r border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Delivery Fee</div>
                            <div className="text-sm font-semibold text-blue-600">
                              {formatCurrency(order.delivery_fee || ((order.total_amount || 0) - (order.subtotal || 0)))}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                            <div className="text-base font-bold text-green-600">
                              {formatCurrency(order.total_amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 md:mt-0 md:ml-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order)}
                        disabled={updatingStatus[order.order_id]}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
                      >
                        {updatingStatus[order.order_id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Update</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {order.delivery_address && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Delivery Address:</span>
                        <span className="ml-2">{order.delivery_address}</span>
                      </p>
                    </div>
                  )}
                  
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Order Items:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="bg-white border border-gray-200 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                            {item.selected_variation && (
                              <p className="text-xs text-gray-500">Size: {item.selected_variation}</p>
                            )}
                            {item.special_instructions && (
                              <p className="text-xs text-gray-500 mt-1">Note: {item.special_instructions}</p>
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

      {/* View Order Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Order Details</h2>
                  <p className="text-orange-100 text-sm">Order #{selectedOrder.order_number || selectedOrder.order_id}</p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Order Information */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order Number</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.order_number || selectedOrder.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="font-mono font-semibold text-gray-900">{selectedOrder.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Invalid Date'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {formatStatus(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">
                      <a href={`tel:${selectedOrder.customer_phone || selectedOrder.phone}`} className="text-orange-600 hover:underline">
                        {selectedOrder.customer_phone || selectedOrder.phone || 'N/A'}
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.customer_email ? (
                        <a href={`mailto:${selectedOrder.customer_email}`} className="text-orange-600 hover:underline">
                          {selectedOrder.customer_email}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-medium text-gray-900">{selectedOrder.delivery_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items ({selectedOrder.items.length})</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.quantity}x {item.name}</p>
                            {item.selected_variation && (
                              <p className="text-sm text-gray-600">Size: {item.selected_variation}</p>
                            )}
                            {item.special_instructions && (
                              <p className="text-sm text-gray-500 italic">Note: {item.special_instructions}</p>
                            )}
                          </div>
                          <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({selectedOrder.items_count || selectedOrder.items?.length || 0} items)</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.delivery_fee || ((selectedOrder.total_amount || 0) - (selectedOrder.subtotal || 0)))}</span>
                  </div>
                  <div className="border-t-2 border-orange-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-orange-600">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t flex justify-end">
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrderForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrderForUpdate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Order:</span> #{selectedOrderForUpdate.order_number || selectedOrderForUpdate.order_id}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Customer:</span> {selectedOrderForUpdate.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current Status:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrderForUpdate.status)}`}>
                    {formatStatus(selectedOrderForUpdate.status)}
                  </span>
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
                          ? 'border-blue-500 bg-blue-50'
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
              
              <div className="mt-6 flex justify-end">
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