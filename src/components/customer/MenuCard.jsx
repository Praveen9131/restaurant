import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';

const MenuCard = ({ item }) => {
  const { addToCart } = useCart();
  const { showSuccess } = useNotification();
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddToCart = () => {
    if (item.pricing_type === 'multiple' && !selectedVariation) {
      setShowAddModal(true);
      return;
    }

    addToCart(item, quantity, selectedVariation, specialInstructions);
    showSuccess(`${item.name} added to cart!`, 2000);
    setQuantity(1);
    setSpecialInstructions('');
    setShowAddModal(false);
  };

  const getPrice = () => {
    if (item.pricing_type === 'single') {
      return `₹${Math.round(item.price)}`;
    } else {
      const prices = Object.values(item.price_variations || {});
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return `₹${Math.round(minPrice)} - ₹${Math.round(maxPrice)}`;
    }
  };

  const getSelectedPrice = () => {
    if (selectedVariation && item.price_variations) {
      return `₹${Math.round(item.price_variations[selectedVariation])}`;
    }
    return getPrice();
  };

  const hasMultipleSizes = item.pricing_type === 'multiple' && item.price_variations && Object.keys(item.price_variations).length > 1;

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${
        !item.is_available 
          ? 'border-gray-300 relative' 
          : 'border-gray-100'
      }`}>
        {/* Unavailable Overlay Badge */}
        {!item.is_available && (
          <div className="absolute top-3 right-3 z-20 bg-red-500 text-white px-3 py-1 rounded-lg shadow-lg font-bold text-xs flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>UNAVAILABLE</span>
          </div>
        )}
        {/* Image */}
        <div className={`h-48 bg-gray-100 overflow-hidden relative ${!item.is_available ? 'grayscale' : ''}`}>
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
            <div className="text-6xl">🍽️</div>
          </div>
          
          {/* Vegetarian Badge - Top Right */}
          {item.is_vegetarian && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center space-x-1">
              <span className="text-xs">🌱</span>
              <span>Veg</span>
            </div>
          )}

          {/* Non-Veg Badge - Top Right */}
          {!item.is_vegetarian && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center space-x-1">
              <span className="text-xs">🍖</span>
              <span>Non-Veg</span>
            </div>
          )}

          {/* Rating Badge - Top Left */}
          {item.rating && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center space-x-1 shadow-sm">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
              </svg>
              <span className="text-xs font-semibold text-gray-800">{item.rating}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-4 ${!item.is_available ? 'bg-gray-50' : ''}`}>
          {/* Header */}
          <div className="mb-3">
            <h3 className={`text-lg font-swiggy font-bold mb-1 line-clamp-2 ${
              !item.is_available ? 'text-gray-700' : 'text-gray-800'
            }`}>{item.name}</h3>
            {item.category_name && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                !item.is_available ? 'bg-gray-300 text-gray-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {item.category_name}
              </span>
            )}
          </div>

          {/* Description */}
          <p className={`text-sm mb-3 line-clamp-2 leading-relaxed ${
            !item.is_available ? 'text-gray-600' : 'text-gray-600'
          }`}>{item.description}</p>

          {/* Size Options (if available) */}
          {hasMultipleSizes && item.is_available && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(item.price_variations).slice(0, 3).map(([size, price]) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedVariation(size);
                      if (selectedVariation === size) {
                        setSelectedVariation(null);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-swiggy font-semibold transition-all duration-200 ${
                      selectedVariation === size
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size} - ₹{Math.round(price)}
                  </button>
                ))}
                {Object.keys(item.price_variations).length > 3 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-swiggy font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                  >
                    +{Object.keys(item.price_variations).length - 3} more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Price and Add Button */}
          <div className={`rounded-lg p-3 border ${
            !item.is_available 
              ? 'bg-gray-200 border-gray-300' 
              : 'bg-orange-50 border-orange-100'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-lg font-swiggy font-bold ${
                    !item.is_available ? 'text-gray-700' : 'text-orange-600'
                  }`}>
                    {selectedVariation ? getSelectedPrice() : getPrice()}
                  </span>
                  {item.is_available && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
                      </svg>
                      <span className="text-xs text-orange-600 font-swiggy font-medium">Best Price</span>
                    </div>
                  )}
                </div>
                {selectedVariation && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-swiggy font-medium">Selected: {selectedVariation}</span>
                  </div>
                )}
                {!selectedVariation && item.pricing_type === 'multiple' && (
                  <span className="text-xs text-gray-600 font-swiggy font-medium">Choose size above</span>
                )}
              </div>

              <div className="flex flex-col items-end">
                {item.is_available ? (
                  <button
                    onClick={() => {
                      if (hasMultipleSizes && !selectedVariation) {
                        setShowAddModal(true);
                      } else {
                        handleAddToCart();
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
                      <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
                    </svg>
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <button disabled className="bg-gray-500 text-white font-swiggy font-semibold px-4 py-2 rounded-lg cursor-not-allowed flex items-center space-x-2 text-sm border-2 border-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span>Not available at this time</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Cart Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-swiggy font-bold text-gray-800 mb-4">{item.name}</h3>

            {/* Variations */}
            {item.pricing_type === 'multiple' && (
              <div className="mb-6">
                <label className="block text-body font-display font-semibold text-gray-700 mb-3">Select Size:</label>
                <div className="space-y-3">
                  {Object.entries(item.price_variations || {}).map(([variation, price]) => (
                    <label key={variation} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border-2 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50">
                      <input
                        type="radio"
                        name="variation"
                        value={variation}
                        checked={selectedVariation === variation}
                        onChange={(e) => setSelectedVariation(e.target.value)}
                        className="text-orange-500 focus:ring-orange-500 w-4 h-4"
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-body font-display font-medium text-gray-800">{variation}</span>
                        <span className="text-price text-orange-600 font-display font-bold">₹{Math.round(price)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-body font-display font-semibold text-gray-700 mb-3">Quantity:</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-heading-4 font-display font-bold text-gray-800 min-w-[2rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mb-6">
              <label className="block text-body font-display font-semibold text-gray-700 mb-3">
                Special Instructions (Optional):
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-body"
                rows="3"
                placeholder="e.g., No onions, extra cheese..."
              />
            </div>

            {/* Total Price */}
            {selectedVariation && (
              <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-body font-display font-semibold text-gray-700">Total:</span>
                  <span className="text-price-large text-orange-600 font-display font-bold">
                    ₹{Math.round(item.price_variations[selectedVariation] * quantity)}
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                disabled={item.pricing_type === 'multiple' && !selectedVariation}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-display font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;

