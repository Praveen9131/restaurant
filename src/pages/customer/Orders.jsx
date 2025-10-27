import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../services/api';
import Loading from '../../components/common/Loading';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoReloading, setAutoReloading] = useState(false);
  const [nextRefresh, setNextRefresh] = useState(null);

  const fetchOrders = useCallback(async (isAutoReload = false) => {
    try {
      // Fix: Use camelCase property name that matches AuthContext
      const customerId = user?.customerId || user?.id;
      
      if (isAutoReload) {
        setAutoReloading(true);
      }
      
      if (!customerId) {
        throw new Error('Customer ID not found');
      }
      
      const response = await orderAPI.getCustomerOrders(customerId);
      
      setOrders(response.data.orders || []);
      setLastUpdated(new Date());
      setNextRefresh(new Date(Date.now() + 15000)); // Set next refresh time
      setError(''); // Clear any previous errors on successful fetch
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setAutoReloading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [user, navigate, authLoading, fetchOrders]);

  // Auto-refresh interval - separate useEffect for better control
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    // Set up auto-reload every 15 seconds
    const interval = setInterval(() => {
      fetchOrders(true); // Pass true to indicate this is an auto-reload
    }, 15000); // 15 seconds

    // Cleanup interval on component unmount or when dependencies change
    return () => {
      clearInterval(interval);
    };
  }, [user, authLoading, fetchOrders]);

  // Countdown timer for next refresh
  useEffect(() => {
    if (!nextRefresh) return;

    const timer = setInterval(() => {
      const now = new Date();
      const timeLeft = Math.max(0, nextRefresh.getTime() - now.getTime());
      
      if (timeLeft === 0) {
        setNextRefresh(new Date(Date.now() + 15000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextRefresh]);

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

  if (loading || authLoading) return <Loading />;

  return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">My Orders</h1>
              <div className="flex items-center space-x-4">
                {autoReloading && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Auto-refreshing...
                  </div>
                )}
                {lastUpdated && (
                  <div className="text-sm text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                    {nextRefresh && (
                      <div className="text-xs text-blue-600 mt-1">
                        Next refresh in: {Math.ceil((nextRefresh.getTime() - new Date().getTime()) / 1000)}s
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => fetchOrders()}
                  disabled={loading || autoReloading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center space-x-1"
                  title="Refresh orders manually"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                
              </div>
            </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}


        {orders.length === 0 ? (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Start ordering to see your order history here</p>
            <button
              onClick={() => navigate('/menu')}
              className="btn-primary"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.order_id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {new Date(order.order_date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {/* Special message for cancelled orders */}
                  {order.status === 'cancelled' && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Order Cancelled
                          </h3>
                          <div className="mt-1 text-sm text-red-700">
                            <p>Sorry, delivery area is not serviceable. Please contact us for alternative arrangements.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm mb-1">
                      <strong>Delivery Address:</strong> {order.delivery_address}
                    </p>
                    {order.customer_phone && (
                      <p className="text-gray-600 text-sm mb-1">
                        <strong>Phone:</strong> {order.customer_phone}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm">
                      <strong>Items:</strong> {order.items_count}
                    </p>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start bg-gray-50 p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.selected_variation && (
                              <p className="text-sm text-gray-600">
                                Size: {item.selected_variation}
                              </p>
                            )}
                            {item.special_instructions && (
                              <p className="text-sm text-gray-600 italic">
                                Note: {item.special_instructions}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">₹{Math.round(item.subtotal || (item.price * item.quantity))}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="pt-3 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal ({order.items_count} item{order.items_count !== 1 ? 's' : ''})</span>
                        <span className="font-medium">₹{Math.round(order.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₹{order.delivery_fee || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-700 font-medium text-lg">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">
                          ₹{Math.round(order.total_amount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;


