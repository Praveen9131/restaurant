import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, quantity = 1, selectedVariation = null, specialInstructions = '') => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.selectedVariation === selectedVariation
      );

      if (existingItemIndex >= 0) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        updatedCart[existingItemIndex].specialInstructions = specialInstructions || updatedCart[existingItemIndex].specialInstructions;
        return updatedCart;
      }

      // Calculate price based on variation or single price
      let price = item.price;
      if (item.pricing_type === 'multiple' && selectedVariation) {
        price = item.price_variations[selectedVariation];
      }

      return [
        ...prevCart,
        {
          id: item.id,
          menu_item_id: item.id,
          name: item.name,
          price: price,
          quantity: quantity,
          selectedVariation: selectedVariation,
          specialInstructions: specialInstructions,
          image: item.image,
          pricing_type: item.pricing_type,
        },
      ];
    });
  };

  const removeFromCart = (itemId, selectedVariation = null) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(item.id === itemId && item.selectedVariation === selectedVariation)
      )
    );
  };

  const updateQuantity = (itemId, selectedVariation, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, selectedVariation);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId && item.selectedVariation === selectedVariation
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getDeliveryFee = () => {
    // Delivery fee is ₹50 for all orders
    return 50;
  };

  const getServiceFee = () => {
    // Service fee is ₹0 for now
    return 0;
  };

  const getTax = () => {
    // Tax (GST) is ₹0 for now
    return 0;
  };

  const getTotalWithFees = () => {
    const subtotal = getCartTotal();
    const deliveryFee = getDeliveryFee();
    const serviceFee = getServiceFee();
    const tax = getTax();
    return subtotal + deliveryFee + serviceFee + tax;
  };

  const getBillingBreakdown = () => {
    return {
      subtotal: getCartTotal(),
      deliveryFee: getDeliveryFee(),
      serviceFee: getServiceFee(),
      tax: getTax(),
      total: getTotalWithFees(),
      itemCount: cart.length,
      totalQuantity: getCartCount()
    };
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getDeliveryFee,
    getServiceFee,
    getTax,
    getTotalWithFees,
    getBillingBreakdown,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};


