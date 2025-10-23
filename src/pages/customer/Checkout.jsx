import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../services/api';

const Checkout = () => {
  const { cart, getCartTotal, clearCart, getBillingBreakdown } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    delivery_address: user?.address || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Debug logging
      console.log('User data:', user);
      console.log('Cart data:', cart);
      
      const customerId = user?.customerId || user?.id;
      if (!customerId) {
        throw new Error('Customer ID not found. Please login again.');
      }

      // Validate that all cart items have valid menu_item_id
      const invalidItems = cart.filter(item => !item.menu_item_id);
      if (invalidItems.length > 0) {
        throw new Error('Some items in your cart are invalid. Please refresh the page and try again.');
      }

      const orderData = {
        customer_id: customerId,
        delivery_address: formData.delivery_address,
        phone: formData.phone,
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          selected_variation: item.selectedVariation || '',
          special_instructions: item.specialInstructions || '',
        })),
      };

      console.log('Order data being sent:', orderData);
      const response = await orderAPI.create(orderData);
      console.log('Order response:', response);
      
      if (response.data.success) {
        clearCart();
        alert(`Order placed successfully! Order Number: ${response.data.order_number}`);
        navigate('/orders');
      } else {
        // Handle specific error cases
        if (response.data.error && response.data.error.includes('menu items not found')) {
          throw new Error('Some items in your cart are no longer available. Please refresh the page and try again.');
        }
        throw new Error(response.data.message || response.data.error || 'Order creation failed');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Delivery Information */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  required
                  className="input-field"
                  rows="3"
                  placeholder="Enter your full delivery address"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.selectedVariation}`}
                    className="flex justify-between items-start pb-3 border-b"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.selectedVariation && (
                        <p className="text-sm text-gray-600">{item.selectedVariation}</p>
                      )}
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{Math.round(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {(() => {
                const billing = getBillingBreakdown();
                return (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Complete Bill</h3>
                    
                    {/* Item Details */}
                    <div className="space-y-2">
                      {cart.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.name} {item.selectedVariation && `(${item.selectedVariation})`} × {item.quantity}
                          </span>
                          <span className="font-medium">₹{Math.round(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Subtotal */}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Subtotal ({billing.itemCount} item{billing.itemCount !== 1 ? 's' : ''})</span>
                      <span className="font-medium">₹{Math.round(billing.subtotal)}</span>
                    </div>
                    
                    {/* Delivery Fee */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">₹{billing.deliveryFee}</span>
                    </div>
                    
                    {/* Service Fee (if applicable) */}
                    {billing.serviceFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-medium">₹{billing.serviceFee}</span>
                      </div>
                    )}
                    
                    {/* Tax (if applicable) */}
                    {billing.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (GST)</span>
                        <span className="font-medium">₹{billing.tax}</span>
                      </div>
                    )}
                    
                    {/* Total */}
                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-primary">
                      <span>Total Amount</span>
                      <span>₹{Math.round(billing.total)}</span>
                    </div>
                    
                    {/* Payment Method */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                        <span className="text-green-800 font-medium">Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">Pay ₹{Math.round(billing.total)} when your order arrives</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">Delivery Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Estimated delivery time: 30-45 minutes</li>
                <li>• You can track your order in "My Orders"</li>
                <li>• Pay cash on delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


