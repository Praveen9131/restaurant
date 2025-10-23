import React, { useState, useEffect } from 'react';
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

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all orders first to extract unique customers
      const response = await adminAPI.getOrders();
      
      if (response.data && response.data.orders) {
        // Extract unique customers from orders
        const customerMap = new Map();
        
        response.data.orders.forEach(order => {
          // Use customer_id if available, otherwise use order_id as customer identifier
          const customerId = order.customer_id || order.order_id;
          const customerKey = `${order.customer_name}_${order.customer_phone || order.phone}`;
          
          if (order.customer_name && !customerMap.has(customerKey)) {
            customerMap.set(customerKey, {
              id: customerId,
              name: order.customer_name,
              phone: order.customer_phone || order.phone,
              email: order.customer_email || '',
              address: order.delivery_address || '',
              totalOrders: 1,
              totalSpent: parseFloat(order.total_amount) || 0,
              lastOrderDate: order.order_date,
              orderIds: [order.order_id]
            });
          } else if (order.customer_name && customerMap.has(customerKey)) {
            const customer = customerMap.get(customerKey);
            customer.totalOrders += 1;
            customer.totalSpent += parseFloat(order.total_amount) || 0;
            customer.orderIds.push(order.order_id);
            
            // Update last order date if this is more recent
            if (new Date(order.order_date) > new Date(customer.lastOrderDate)) {
              customer.lastOrderDate = order.order_date;
            }
          }
        });
        
        setCustomers(Array.from(customerMap.values()));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ALL customer orders (from main orders API to get complete data)
  const fetchCustomerOrders = async (customerId, customerName) => {
    try {
      setOrdersLoading(true);
      setError('');
      
      console.log('🔵 [CustomerManagement] Fetching ALL orders for customer:', customerName);
      
      // Get all orders and filter by customer name to get complete order data
      const response = await adminAPI.getOrders();
      
      console.log('✅ [CustomerManagement] All orders response:', response.data);
      
      if (response.data && response.data.orders) {
        // Filter orders by customer name to get ALL orders for this customer
        const customerOrders = response.data.orders.filter(order => 
          order.customer_name === customerName
        );
        
        console.log('🔍 [CustomerManagement] Filtered orders for customer:', customerOrders);
        
        setCustomerOrders(customerOrders);
        setSelectedCustomer(customerId);
      } else {
        console.log('No orders found for customer:', customerName);
        setCustomerOrders([]);
        setSelectedCustomer(customerId);
      }
    } catch (error) {
      console.error('❌ [CustomerManagement] Error fetching customer orders:', error);
      setError('Failed to fetch customer orders');
      setCustomerOrders([]);
      setSelectedCustomer(customerId);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search by Order ID
  const searchByOrderId = async () => {
    if (!orderIdSearch.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    try {
      setOrdersLoading(true);
      setError('');
      
      console.log('🔍 [CustomerManagement] Searching for Order ID:', orderIdSearch);
      
      // Get all orders and find the specific order
      const response = await adminAPI.getOrders();
      
      if (response.data && response.data.orders) {
        const foundOrder = response.data.orders.find(order => 
          order.order_id === orderIdSearch || 
          order.order_number === orderIdSearch ||
          order.order_id.toString() === orderIdSearch
        );
        
        if (foundOrder) {
          // Set the order as the only order for this customer
          setCustomerOrders([foundOrder]);
          setSelectedCustomer(foundOrder.customer_id || foundOrder.order_id);
          
          // Add customer to list if not already there
          const existingCustomer = customers.find(c => c.name === foundOrder.customer_name);
          if (!existingCustomer) {
            const newCustomer = {
              id: foundOrder.customer_id || foundOrder.order_id,
              name: foundOrder.customer_name,
              phone: foundOrder.customer_phone || foundOrder.phone,
              email: foundOrder.customer_email || '',
              address: foundOrder.delivery_address || '',
              totalOrders: 1,
              totalSpent: parseFloat(foundOrder.total_amount) || 0,
              lastOrderDate: foundOrder.order_date,
              orderIds: [foundOrder.order_id]
            };
            setCustomers(prev => [newCustomer, ...prev]);
          }
        } else {
          setCustomerOrders([]);
          setSelectedCustomer(null);
          setError(`No order found with ID: ${orderIdSearch}`);
        }
      } else {
        setCustomerOrders([]);
        setSelectedCustomer(null);
        setError(`No order found with ID: ${orderIdSearch}`);
      }
    } catch (error) {
      console.error('❌ [CustomerManagement] Search error:', error);
      setError(`Failed to find order with ID: ${orderIdSearch}`);
      setCustomerOrders([]);
      setSelectedCustomer(null);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Filter customers based on search term (name only)
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
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
  };

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
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Customers</h2>
              
              {/* Search by Order ID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Order ID</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter Order ID..."
                    value={orderIdSearch}
                    onChange={(e) => setOrderIdSearch(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    onClick={searchByOrderId}
                    disabled={ordersLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {ordersLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    <span>Search</span>
                  </button>
                </div>
              </div>
              
              {/* Search by Customer Name */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by customer name..."
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
                    {(() => {
                      const customer = customers.find(c => c.id === selectedCustomer);
                      if (!customer) return null;
                      
                      return (
                        <button
                          onClick={() => fetchCustomerOrders(customer.id, customer.name)}
                          disabled={ordersLoading}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {ordersLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                      );
                    })()}
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
                              {getStatusBadge(order.status)}
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
    </div>
  );
};

export default CustomerManagement;
