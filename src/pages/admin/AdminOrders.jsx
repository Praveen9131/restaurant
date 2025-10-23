import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import Loading from '../../components/common/Loading';

const AdminOrders = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchOrders();
  }, [user, isAdmin, navigate, filters, fetchOrders]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;

      const response = await adminAPI.getOrders(params);
      setOrders(response.data.orders || []);
      setStatusCounts(response.data.status_counts || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await adminAPI.updateOrderStatus({
        order_id: orderId,
        status: newStatus,
      });

      if (response.data.success) {
        alert('Order status updated successfully!');
        fetchOrders();
      }
    } catch (err) {
      // Handle database column size issue for out_for_delivery
      if (err.response?.data?.message?.includes('Data truncated')) {
        alert('Database column size issue. Please contact the administrator to fix the status column size.');
      } else {
        alert(err.response?.data?.message || 'Failed to update order status');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const calculateSubtotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Orders Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className={`card p-4 text-center cursor-pointer transition ${
                filters.status === status ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setFilters({ ...filters, status: filters.status === status ? '' : status })}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs capitalize text-gray-600">{formatStatus(status)}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Order # or Customer"
                className="input-field"
              />
            </div>
          </div>

          <button
            onClick={() => setFilters({ status: '', date_from: '', date_to: '', search: '' })}
            className="mt-4 text-primary hover:text-orange-600 font-medium text-sm"
          >
            Clear Filters
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <Loading />
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.order_id} className="card p-6">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="text-xl font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all text-left"
                    >
                      Order #{order.order_number}
                    </button>
                    <p className="text-gray-600 text-sm">
                      {new Date(order.order_date).toLocaleString()}
                    </p>
                    <p className="text-gray-700 font-medium mt-1">{order.customer_name}</p>
                    <p className="text-gray-600 text-sm">{order.customer_phone}</p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-2xl font-bold text-primary">₹{Math.round(order.total_amount)}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Delivery Address:</strong> {order.delivery_address}
                  </p>
                  
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <strong className="text-sm text-gray-700">Items:</strong>
                      <div className="mt-2 space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            <div className="flex justify-between">
                              <span>
                                {item.quantity}x {item.name}
                                {item.selected_variation && ` (${item.selected_variation})`}
                              </span>
                              <span className="font-medium">₹{Math.round(item.price * item.quantity)}</span>
                            </div>
                            {item.special_instructions && (
                              <p className="text-gray-600 text-xs italic mt-1">
                                Note: {item.special_instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    Current: {formatStatus(order.status)}
                  </span>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium text-gray-700">Update to:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== order.status) {
                          if (confirm(`Update order status to ${formatStatus(e.target.value)}?`)) {
                            handleStatusUpdate(order.order_id, e.target.value);
                          }
                        }
                      }}
                      className="input-field"
                      value=""
                    >
                      <option value="">Select new status...</option>
                      {statuses
                        .filter(s => s !== order.status)
                        .map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-gray-600">No orders found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <>
          {/* Modal Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeOrderModal}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Order Details</h2>
                      <p className="text-orange-100 text-sm">Order #{selectedOrder.order_number}</p>
                    </div>
                    <button
                      onClick={closeOrderModal}
                      className="p-2 hover:bg-white/20 rounded-lg transition-all"
                      aria-label="Close modal"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Order Status & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedOrder.order_date).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                        {formatStatus(selectedOrder.status)}
                      </span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-gray-900">
                          <a href={`tel:${selectedOrder.customer_phone || selectedOrder.phone}`} className="text-orange-600 hover:underline">
                            {selectedOrder.customer_phone || selectedOrder.phone}
                          </a>
                        </p>
                      </div>
                      {selectedOrder.customer_email && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500 mb-1">Email</p>
                          <p className="font-medium text-gray-900">
                            <a href={`mailto:${selectedOrder.customer_email}`} className="text-orange-600 hover:underline">
                              {selectedOrder.customer_email}
                            </a>
                          </p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                        <p className="font-medium text-gray-900">{selectedOrder.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Order Items ({selectedOrder.items?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex items-start">
                              {/* Item Image */}
                              <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.image ? 'hidden' : 'flex'}`}>
                                  <div className="text-3xl">🍽️</div>
                                </div>
                              </div>
                              
                              {/* Item Details */}
                              <div className="flex-1 p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="bg-orange-100 text-orange-700 font-bold text-sm px-2 py-1 rounded">
                                        {item.quantity}x
                                      </span>
                                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                    </div>
                                    {item.selected_variation && (
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Size:</span> {item.selected_variation}
                                      </p>
                                    )}
                                    {item.special_instructions && (
                                      <p className="text-sm text-gray-600 mt-1 italic bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                                        <span className="font-medium">Note:</span> {item.special_instructions}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="text-sm text-gray-500">₹{Math.round(item.price)} each</p>
                                    <p className="font-bold text-lg text-gray-900">₹{Math.round(item.price * item.quantity)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No items in this order</p>
                      )}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Payment Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-medium">₹{Math.round(calculateSubtotal(selectedOrder.items))}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Delivery Fee</span>
                        <span className="font-medium">₹50</span>
                      </div>
                      {selectedOrder.tax && selectedOrder.tax > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Tax</span>
                          <span className="font-medium">₹{Math.round(selectedOrder.tax)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-orange-300 pt-3 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-orange-600">₹{Math.round(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value && e.target.value !== selectedOrder.status) {
                            if (confirm(`Update order status to ${formatStatus(e.target.value)}?`)) {
                              handleStatusUpdate(selectedOrder.order_id, e.target.value);
                              closeOrderModal();
                            }
                          }
                        }}
                        className="flex-1 min-w-[200px] px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        value=""
                      >
                        <option value="">Update Status...</option>
                        {statuses
                          .filter(s => s !== selectedOrder.status)
                          .map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t flex justify-end">
                  <button
                    onClick={closeOrderModal}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;


