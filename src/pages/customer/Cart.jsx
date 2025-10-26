import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart, getBillingBreakdown } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError } = useNotification();

  const handleCheckout = () => {
    if (!user) {
      showError('Please login to proceed with checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Add some delicious items to your cart</p>
          <Link to="/menu" className="btn-primary inline-block">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.id}-${item.selectedVariation}`} className="card p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍽️
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                    {item.selectedVariation && (
                      <p className="text-sm text-gray-600 mb-1">
                        Size: {item.selectedVariation}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-600 mb-2">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                    <p className="text-primary font-bold">₹{Math.round(item.price)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id, item.selectedVariation)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.selectedVariation, item.quantity - 1)
                        }
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded"
                      >
                        -
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.selectedVariation, item.quantity + 1)
                        }
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded"
                      >
                        +
                      </button>
                    </div>

                    <p className="font-bold text-lg">
                      ₹{Math.round(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {(() => {
                const billing = getBillingBreakdown();
                return (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({billing.itemCount} item{billing.itemCount !== 1 ? 's' : ''})</span>
                      <span className="font-medium">₹{Math.round(billing.subtotal)}</span>
                    </div>
                    {billing.serviceFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-medium">₹{billing.serviceFee}</span>
                      </div>
                    )}
                    {billing.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (GST)</span>
                        <span className="font-medium">₹{billing.tax}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-xl font-bold">
                      <span>Total Amount</span>
                      <span className="text-primary">₹{Math.round(billing.total)}</span>
                    </div>
                  </div>
                );
              })()}

              <button onClick={handleCheckout} className="w-full btn-primary mb-3">
                Proceed to Checkout
              </button>
              
              <Link
                to="/menu"
                className="block text-center text-gray-600 hover:text-primary transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;


