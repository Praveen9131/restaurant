
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI } from '../../services/api';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);

  // Fetch all customers using OrdersByCustomerView API
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 [CustomerManagement] Fetching customers with orders...');
      
      const response = await adminAPI.getOrdersByCustomer();
      
      console.log('📊 [CustomerManagement] OrdersByCustomerView Response:', {
        status: response.status,
        success: response.data?.success,
        totalCustomers: response.data?.total_customers,
        dataLength: response.data?.data?.length || 0
      });
      
      if (response.data && response.data.success && response.data.data) {
        const customersData = response.data.data;
        
        // Transform the data to match our existing structure
        const customersList = customersData.map(customer => ({
          id: customer.customer_id,
          name: customer.customer_name,
          phone: customer.customer_phone,
          email: '', // Not provided in this API
          address: '', // Not provided in this API
          orders: customer.orders || [],
          totalOrders: customer.orders?.length || 0,
          totalSpent: customer.orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
          lastOrderDate: customer.orders?.[0]?.order_date || null,
          orderIds: customer.orders?.map(order => order.order_id) || []
        }));
        
        setCustomers(customersList);
        
        if (customersList.length === 0) {
          setError('No customers found in the system.');
        }
      } else {
        throw new Error('Invalid response format from OrdersByCustomerView API');
      }
      
    } catch (error) {
      console.error('❌ [CustomerManagement] Error fetching customers:', error);
      
      // Handle different types of errors
      let errorMessage = '';
      
      if (error.response?.status === 500) {
        errorMessage = 'Server Error: The backend server is experiencing issues. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API Endpoint Not Found: The customer data endpoint is not available.';
      } else if (error.response?.data?.error) {
        errorMessage = `API Error: ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        errorMessage = `API Error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Network Error: ${error.message}`;
      } else {
        errorMessage = 'Unknown error occurred while fetching customer data.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);


  // Fetch customer orders from the already loaded customer data
  const fetchCustomerOrders = useCallback(async (customerId, customerName) => {
    try {
      setOrdersLoading(true);
      setError('');
      
      console.log('🔄 [CustomerManagement] Loading orders for customer:', customerName);
      
      // Find the customer in the already loaded data
      const customer = customers.find(c => c.id === customerId);
      
      if (customer && customer.orders) {
        console.log('📋 [CustomerManagement] Found orders for customer:', customer.orders.length);
        setCustomerOrders(customer.orders);
        setSelectedCustomer(customerId);
        
        if (customer.orders.length === 0) {
          setError(`No orders found for customer: ${customerName}`);
        }
      } else {
        console.warn('⚠️ [CustomerManagement] Customer not found or no orders available');
        setError(`Customer data not available: ${customerName}`);
        setCustomerOrders([]);
        setSelectedCustomer(null);
      }
      
    } catch (error) {
      console.error('❌ [CustomerManagement] Error loading customer orders:', error);
      setError(`Failed to load orders for customer: ${customerName}`);
      setCustomerOrders([]);
      setSelectedCustomer(null);
    } finally {
      setOrdersLoading(false);
    }
  }, [customers]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Retry function for failed API calls
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError('');
    fetchCustomers();
  }, [fetchCustomers]);

  // Search by Order ID within the already loaded customer data
  const searchByOrderId = useCallback(async () => {
    if (!orderIdSearch.trim()) {
      setError('Please enter an Order ID to search');
      return;
    }

    try {
      setOrdersLoading(true);
      setError('');
      
      console.log('🔍 [CustomerManagement] Searching for order ID:', orderIdSearch);
      
      let foundOrder = null;
      let foundCustomer = null;
      
      // Search through all customers and their orders
      for (const customer of customers) {
        if (customer.orders && customer.orders.length > 0) {
          foundOrder = customer.orders.find(order => 
            order.order_id === parseInt(orderIdSearch) || 
            order.order_number === orderIdSearch ||
            order.order_id.toString() === orderIdSearch
          );
          
          if (foundOrder) {
            foundCustomer = customer;
            break;
          }
        }
      }
        
      if (foundOrder && foundCustomer) {
        console.log('✅ [CustomerManagement] Found order:', foundOrder.order_id);
        // Set the order as the only order for this customer
        setCustomerOrders([foundOrder]);
        setSelectedCustomer(foundCustomer.id);
      } else {
        console.log('❌ [CustomerManagement] Order not found:', orderIdSearch);
        setCustomerOrders([]);
        setSelectedCustomer(null);
        setError(`No order found with ID: ${orderIdSearch}`);
      }
      
    } catch (error) {
      console.error('❌ [CustomerManagement] Error searching for order:', error);
      setError(`Failed to find order with ID: ${orderIdSearch}`);
      setCustomerOrders([]);
      setSelectedCustomer(null);
    } finally {
      setOrdersLoading(false);
    }
  }, [orderIdSearch, customers]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
      
      console.log('🔄 [CustomerManagement] Updating order status:', { orderId, newStatus });
      
      const response = await adminAPI.updateOrderStatus({
        order_id: orderId,
        status: newStatus
      });
      
      console.log('✅ [CustomerManagement] Order status updated:', response.data);
      
      // Update the order in the customer orders list
      setCustomerOrders(prev => 
        prev.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Show success message
      setError('');
      
    } catch (error) {
      console.error('❌ [CustomerManagement] Error updating order status:', error);
      
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

  // Filter customers based on search term (name only)
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  }, [customers, searchTerm]);

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

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }, []);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p className="text-gray-600">View and manage all customers and their orders</p>
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
              <div className="mt-3">
                <button 
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {retryCount > 0 ? `Retry (${retryCount})` : 'Try Again'}
                </button>
                
                {retryCount > 2 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                      <strong>Still having issues?</strong> This appears to be a server-side problem. 
                      Please contact your system administrator or try again later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Customers</h2>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by customer name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No customers found matching your search' : 'No customers found'}
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => fetchCustomerOrders(customer.id, customer.name)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCustomer === customer.id ? 'bg-orange-50 border-orange-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {customer.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {customer.phone || 'No phone'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.email || 'No email'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">
                          {customer.totalOrders} orders
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Customer Details & Orders */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Details */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
                  </div>
                  {(() => {
                    const customer = customers.find(c => c.id === selectedCustomer);
                    if (!customer) return null;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Identifier</label>
                          <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{customer.id}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm text-gray-900">{customer.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <p className="text-sm text-gray-900">{customer.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-sm text-gray-900">{customer.email || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Orders</label>
                          <p className="text-sm text-gray-900">{customer.totalOrders}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Spent</label>
                          <p className="text-sm text-gray-900 font-semibold">{formatCurrency(customer.totalSpent)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Order</label>
                          <p className="text-sm text-gray-900">{formatDate(customer.lastOrderDate)}</p>
                        </div>
                        {customer.address && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-sm text-gray-900">{customer.address}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Customer Orders */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History</h2>
                  
                  {ordersLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No orders found</h3>
                      <p className="text-sm text-gray-500">
                        No orders found for this customer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map((order) => (
                        <div key={order.order_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                Order #{order.order_number || order.order_id}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.order_date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(order.total_amount)}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                              {getStatusBadge(order.status)}
                                <button
                                  onClick={() => handleStatusUpdate(order)}
                                  disabled={updatingStatus[order.order_id]}
                                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
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
                                      <span>Update</span>
                                    </>
                                  )}
                                </button>
                              </div>
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
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customer selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a customer from the list to view their details and orders
                </p>
              </div>
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

export default CustomerManagement;
