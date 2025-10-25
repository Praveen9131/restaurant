import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { orderAPI, adminAPI, menuAPI } from '../../services/api';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const { showSuccess, showError } = useNotification();

  // In-House Order states
  const [showInHouseModal, setShowInHouseModal] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getOrders();
      
      // Use backend data directly without frontend processing
      const backendData = response.data;
      
      setOrders(backendData.orders || []);
      setStatusCounts(backendData.status_counts || {});
    } catch (error) {
      showError('Failed to fetch orders: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch available menu items for in-house orders
  const fetchAvailableItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const response = await menuAPI.getAll({ available_only: true });
      const items = response.data.menu_items || [];
      setAvailableItems(items);
    } catch (error) {
      showError('Failed to fetch available items: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingItems(false);
    }
  }, [showError]);

  // Handle in-house order creation
  const handleCreateInHouseOrder = async () => {
    if (selectedItems.length === 0) {
      showError('Please select at least one item');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderData = {
        items: selectedItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          ...(item.selected_variation && { selected_variation: item.selected_variation }),
          ...(item.special_instructions && { special_instructions: item.special_instructions })
        }))
      };

      const response = await adminAPI.createInHouseOrder(orderData);
      showSuccess('Dine in order created successfully!');
      setShowInHouseModal(false);
      setSelectedItems([]);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      showError('Failed to create dine in order: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingOrder(false);
    }
  };

  // Add item to selected items
  const addItemToOrder = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected.id === item.id 
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1, selected_variation: '', special_instructions: '' }]);
    }
  };

  // Remove item from selected items
  const removeItemFromOrder = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Update item variation
  const updateItemVariation = (itemId, variation) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, selected_variation: variation } : item
      )
    );
  };

  // Update item special instructions
  const updateItemInstructions = (itemId, instructions) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, special_instructions: instructions } : item
      )
    );
  };

  // Calculate total amount
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const price = item.pricing_type === 'multiple' && item.selected_variation 
        ? (item.price_variations?.[item.selected_variation] || item.price)
        : item.price;
      return total + (parseFloat(price) * item.quantity);
    }, 0);
  };

  // Filter orders based on status and search term
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const response = await orderAPI.updateStatus(orderId, { status: newStatus });
      showSuccess('Order status updated successfully!');
      fetchOrders();
    } catch (error) {
      let errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update order status';
      
      // Special handling for "out_for_delivery" database limitation
      if (errorMsg.includes('Data truncated') && newStatus === 'out_for_delivery') {
        errorMsg = 'Note: "Out for Delivery" status cannot be saved due to database limitations. Please use "Delivered" status instead, or contact backend team to increase the status column size.';
      }
      
      showError(errorMsg);
    }
  }, [showSuccess, showError, fetchOrders]);

  const getStatusColor = useCallback((status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <div className="ml-4 text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-swiggy font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and their status</p>
          
          {/* Statistics */}
          <div className="flex space-x-6 mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-700">{orders.length}</span> Total Orders
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-yellow-600">{statusCounts.pending || 0}</span> Pending
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-blue-600">{statusCounts.confirmed || 0}</span> Confirmed
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-green-600">{statusCounts.delivered || 0}</span> Delivered
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowInHouseModal(true);
              fetchAvailableItems();
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Inhouse</span>
          </button>
          <button
            onClick={fetchOrders}
            className="bg-orange-500 hover:bg-orange-600 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
            <input
              type="text"
              placeholder="Search by customer name, order number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="pending">Pending ({statusCounts.pending || 0})</option>
              <option value="confirmed">Confirmed ({statusCounts.confirmed || 0})</option>
              <option value="preparing">Preparing ({statusCounts.preparing || 0})</option>
              <option value="out_for_delivery">Out for Delivery ({statusCounts.out_for_delivery || 0})</option>
              <option value="delivered">Delivered ({statusCounts.delivered || 0})</option>
              <option value="cancelled">Cancelled ({statusCounts.cancelled || 0})</option>
            </select>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== 'all' && ` with status "${statusFilter}"`}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.order_number || order.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{Math.round(order.total_amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      View
                    </button>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {orders.length === 0 ? 'No orders' : 'No orders found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {orders.length === 0 
                ? 'No orders have been placed yet.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-swiggy font-bold text-gray-800">
                Order #{selectedOrder.order_number || selectedOrder.order_id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
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
                <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customer_phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customer_email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <span className="ml-2 font-medium">{selectedOrder.delivery_address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.special_instructions && (
                          <p className="text-sm text-gray-500">Note: {item.special_instructions}</p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">₹{Math.round(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{Math.round(selectedOrder.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-medium">₹{Math.round(selectedOrder.delivery_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">₹{Math.round(selectedOrder.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{Math.round(selectedOrder.total_amount || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Update Status</h4>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.order_id, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-House Order Modal */}
      {showInHouseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Dine In Order</h2>
                <button
                  onClick={() => {
                    setShowInHouseModal(false);
                    setSelectedItems([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex h-[70vh]">
              {/* Available Items */}
              <div className="flex-1 p-6 border-r border-gray-200 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Items</h3>
                {loadingItems ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {availableItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm font-medium text-orange-600">
                                ₹{item.price}
                              </span>
                              {item.is_vegetarian && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  🌱 Veg
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => addItemToOrder(item)}
                            className="ml-4 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Items */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Items</h3>
                {selectedItems.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No items selected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">₹{item.price}</p>
                            
                            {/* Quantity */}
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Variations */}
                            {item.pricing_type === 'multiple' && item.price_variations && (
                              <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                <select
                                  value={item.selected_variation}
                                  onChange={(e) => updateItemVariation(item.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                  <option value="">Select Size</option>
                                  {Object.entries(item.price_variations).map(([variation, price]) => (
                                    <option key={variation} value={variation}>
                                      {variation} - ₹{price}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Special Instructions */}
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                              <input
                                type="text"
                                value={item.special_instructions}
                                onChange={(e) => updateItemInstructions(item.id, e.target.value)}
                                placeholder="e.g., Extra spicy, No onions"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeItemFromOrder(item.id)}
                            className="ml-4 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  Total: ₹{calculateTotal().toFixed(2)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowInHouseModal(false);
                      setSelectedItems([]);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInHouseOrder}
                    disabled={selectedItems.length === 0 || creatingOrder}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {creatingOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
