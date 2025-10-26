import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { menuAPI, categoryAPI, orderAPI } from '../../services/api';

const InhouseManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBill, setShowBill] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({}); // Track selected sizes for each item
  const { showSuccess, showError } = useNotification();

  // Load selected items from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedItems = localStorage.getItem('dineInCart');
        const storedSizes = localStorage.getItem('dineInCartSizes');
        if (storedItems) {
          setSelectedItems(JSON.parse(storedItems));
        }
        if (storedSizes) {
          setSelectedSizes(JSON.parse(storedSizes));
        }
      }
    } catch (error) {
      console.error('Error loading dine-in cart from localStorage:', error);
    }
  }, []);

  // Save selected items to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (selectedItems.length > 0) {
          localStorage.setItem('dineInCart', JSON.stringify(selectedItems));
        } else {
          localStorage.removeItem('dineInCart');
        }
        if (Object.keys(selectedSizes).length > 0) {
          localStorage.setItem('dineInCartSizes', JSON.stringify(selectedSizes));
        } else {
          localStorage.removeItem('dineInCartSizes');
        }
      }
    } catch (error) {
      console.error('Error saving dine-in cart to localStorage:', error);
    }
  }, [selectedItems, selectedSizes]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use available_only=true to get only available items
      const menuResponse = await menuAPI.getAll({ available_only: true });
      const categoriesResponse = await categoryAPI.getAll();
      
      const allMenuItems = menuResponse.data.menu_items || [];
      
      // Sort items by availability and then by name
      const sortedItems = allMenuItems.sort((a, b) => {
        // First sort by availability (available first)
        if (a.is_available !== b.is_available) {
          return b.is_available - a.is_available;
        }
        // Then sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
      
      setMenuItems(sortedItems);
      setCategories(categoriesResponse.data.categories || []);
      
      // Validate menu items have valid IDs
      const invalidItems = allMenuItems.filter(item => {
        const menuItemId = item.menu_item_id || item.id || item.menu_id;
        return !menuItemId || menuItemId <= 0;
      });
      
      if (invalidItems.length > 0) {
        showError(`Found ${invalidItems.length} invalid menu items. Please check the menu data.`);
      }
    } catch (error) {
      showError('Failed to fetch data: ' + (error.response?.data?.message || error.message));
      
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []); // Remove showError dependency to prevent re-renders

  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount


  // Size selection function - optimized to prevent unnecessary re-renders
  const handleSizeSelection = useCallback((itemId, size) => {
    setSelectedSizes(prev => {
      // Only update if the size actually changed
      if (prev[itemId] === size) return prev;
      return {
        ...prev,
        [itemId]: size
      };
    });
  }, []);

  // Item selection functions - memoized for performance
  const addToCart = useCallback((item) => {
    if (!item.is_available) {
      showError('This item is not available');
      return;
    }

    // Check if item has valid menu_item_id
    const menuItemId = item.menu_item_id || item.id || item.menu_id;
    if (!menuItemId || menuItemId <= 0) {
      showError('Invalid menu item ID. Please refresh the menu and try again.');
      return;
    }

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
      // For items with multiple sizes, use the selected size
      let itemToAdd = { ...item, quantity: 1 };
      
      if (item.pricing_type !== 'single' && item.price_variations && Object.keys(item.price_variations).length > 0) {
        const selectedSize = selectedSizes[item.id];
        if (selectedSize && item.price_variations[selectedSize]) {
          itemToAdd.selected_variation = selectedSize;
        } else {
          showError('Please select a size before adding to cart');
          return;
        }
      }
      
      setSelectedItems(prev => [...prev, itemToAdd]);
    }
    showSuccess(`${item.name} added to cart`);
  }, [selectedItems, selectedSizes, showError, showSuccess]);

  const removeFromCart = useCallback((itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    showSuccess('Item removed from cart');
  }, [showSuccess]);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setSelectedItems([]);
    setSelectedSizes({});
    setShowBill(false);
    // Clear localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('dineInCart');
        localStorage.removeItem('dineInCartSizes');
      }
    } catch (error) {
      console.error('Error clearing dine-in cart from localStorage:', error);
    }
    showSuccess('Cart cleared');
  }, []); // Remove showSuccess dependency to prevent re-renders

  const calculateTotal = useCallback(() => {
    return selectedItems.reduce((total, item) => {
      let price = item.price || 0;
      
      if (item.pricing_type !== 'single' && item.price_variations) {
        if (item.selected_variation && item.price_variations[item.selected_variation]) {
          price = item.price_variations[item.selected_variation];
        } else {
          // Fallback to first available variation
          price = Object.values(item.price_variations)[0] || item.price || 0;
        }
      }
      
      return total + (price * item.quantity);
    }, 0);
  }, [selectedItems]);

  const createOrder = useCallback(async () => {
    if (selectedItems.length === 0) {
      showError('Please select at least one item');
      return;
    }

    // Validate that all selected items have valid IDs
    const invalidItems = selectedItems.filter(item => !item.id || item.id <= 0);
    if (invalidItems.length > 0) {
      showError('Some selected items have invalid IDs. Please refresh the page and try again.');
      return;
    }

    // Check if menu items still exist in the current menu data
    const currentMenuIds = menuItems.map(item => item.id);
    const missingItems = selectedItems.filter(item => !currentMenuIds.includes(item.id));
    if (missingItems.length > 0) {
      const itemNames = missingItems.map(item => item.name).join(', ');
      showError(`Some items (${itemNames}) are no longer available. Please refresh the menu and try again.`);
      return;
    }

    // Validate that all selected items have valid menu_item_id
    const invalidMenuItems = selectedItems.filter(item => {
      const menuItemId = item.menu_item_id || item.id || item.menu_id;
      return !menuItemId || menuItemId <= 0;
    });
    
    if (invalidMenuItems.length > 0) {
      showError('Some selected items have invalid menu item IDs. Please refresh the menu and try again.');
      return;
    }

    setOrderLoading(true);
    try {
      const orderData = {
        items: selectedItems.map(item => {
          // Use the correct field for menu_item_id - try different possible field names
          const menuItemId = item.menu_item_id || item.id || item.menu_id;
          
          const itemData = {
            menu_item_id: menuItemId,
            quantity: item.quantity
          };
          
          // Add selected_variation if it exists and item has multiple pricing
          if (item.pricing_type !== 'single' && item.price_variations && Object.keys(item.price_variations).length > 0) {
            if (item.selected_variation && item.price_variations[item.selected_variation]) {
              itemData.selected_variation = item.selected_variation;
            } else {
              // Fallback to first available variation
              itemData.selected_variation = Object.keys(item.price_variations)[0];
            }
          }
          
          // Add special_instructions if needed (currently not implemented in UI)
          // itemData.special_instructions = "Extra spicy";
          
          return itemData;
        })
      };

      const response = await orderAPI.adminCreate(orderData);
      
      if (response.data.success) {
        showSuccess('Order created successfully!');
        clearCart();
      } else {
        showError('Failed to create order: ' + (response.data.message || response.data.error || 'Unknown error'));
      }
    } catch (error) {
      // If it's a "not found" error, provide clear feedback about backend issue
      if (error.response?.data?.error && error.response.data.error.includes('not found')) {
        // Extract the ID from the error message
        const errorMessage = error.response.data.error;
        const idMatch = errorMessage.match(/ID (\d+)/);
        const itemId = idMatch ? idMatch[1] : 'unknown';
        
        // Find the item name for the failed ID
        const failedItem = selectedItems.find(item => {
          const menuItemId = item.menu_item_id || item.id || item.menu_id;
          return menuItemId.toString() === itemId;
        });
        
        const itemName = failedItem ? failedItem.name : 'Unknown Item';
        
        showError(`Menu item "${itemName}" (ID: ${itemId}) cannot be found in the database. This appears to be a backend synchronization issue. Please contact the development team to resolve this database inconsistency.`);
        
        // Clear the cart to prevent further issues
        clearCart();
        // Automatically refresh the menu data
        fetchData();
      } else {
        showError('Failed to create order: ' + (error.response?.data?.message || error.response?.data?.error || error.message));
      }
    } finally {
      setOrderLoading(false);
    }
  }, [selectedItems, menuItems, showError, showSuccess, clearCart]);

  // Search function
  const filteredItems = useMemo(() => {
    let items = menuItems;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.category && item.category.name && item.category.name.toLowerCase().includes(term))
      );
    }
    
    return items;
  }, [menuItems, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <div className="ml-4 text-gray-600">Loading inhouse items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-swiggy font-bold text-gray-900">Inhouse Order Management</h1>
          <p className="text-gray-600 mt-1">Select items and create inhouse orders</p>
          
          {/* Statistics - Only Selected Items */}
          {selectedItems.length > 0 && (
            <div className="flex space-x-6 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">
                  <span className="font-semibold text-orange-600">{selectedItems.length}</span> Selected Items
                </span>
              </div>
            </div>
          )}
        </div>
        
            {/* Cart Actions */}
            <div className="flex items-center space-x-3">
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Menu'}</span>
        </button>
        
        {selectedItems.length > 0 && (
          <button
            onClick={() => {
              clearCart();
              fetchData();
              showSuccess('Cart cleared and menu refreshed');
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear Cart & Refresh</span>
          </button>
        )}
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={() => setShowBill(!showBill)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="relative">
                      View Bill
                      <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={clearCart}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-swiggy font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bill Display */}
      {showBill && selectedItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-swiggy font-bold text-gray-900">Order Bill</h2>
            <button
              onClick={() => setShowBill(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
                {selectedItems.map((item) => {
                  let price = item.price || 0;
                  let variation = '';
                  
                  if (item.pricing_type !== 'single' && item.price_variations) {
                    if (item.selected_variation && item.price_variations[item.selected_variation]) {
                      price = item.price_variations[item.selected_variation];
                      variation = item.selected_variation;
                    } else {
                      // Fallback to first available variation
                      price = Object.values(item.price_variations)[0] || item.price || 0;
                      variation = Object.keys(item.price_variations)[0] || '';
                    }
                  }
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            (item.menu_item_id || item.id || item.menu_id) === 21 
                              ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            ID: {item.menu_item_id || item.id || item.menu_id || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          ₹{Math.round(price)} each {variation && `(${variation})`}
                        </p>
                      </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900 w-20 text-right">
                      ₹{Math.round(price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold text-gray-900">
              <span>Total Amount:</span>
              <span>₹{Math.round(calculateTotal())}</span>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={createOrder}
                disabled={orderLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {orderLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Order...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Create Order</span>
                  </>
                )}
              </button>
              <button
                onClick={clearCart}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-swiggy font-semibold rounded-lg transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="mb-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No menu items found</div>
            <div className="text-gray-400 text-sm">
              {searchTerm ? 'No items match your search' : 'No items in database'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${
                !item.is_available 
                  ? 'border-red-300 bg-red-50 relative' 
                  : 'border-gray-200'
              }`}>
                {/* Unavailable Overlay */}
                {!item.is_available && (
                  <div className="absolute top-3 right-3 z-10 bg-red-600 text-white px-3 py-1 rounded-lg shadow-lg font-bold text-xs flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>UNAVAILABLE</span>
                  </div>
                )}
                
                {/* Image */}
                <div className={`h-48 bg-gray-100 relative ${!item.is_available ? 'grayscale' : ''}`}>
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
                  <div className={`${item.image ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200`}>
                    <div className="text-center">
                      <svg className="w-12 h-12 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-orange-600 text-sm font-medium">No Image</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          (item.menu_item_id || item.id || item.menu_id) === 21 
                            ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          ID: {item.menu_item_id || item.id || item.menu_id || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {item.pricing_type === 'single' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-600">
                          ₹{Math.round(item.price || 0)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Select Size:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {item.price_variations && Object.entries(item.price_variations).map(([size, price]) => {
                            const isSelected = selectedSizes[item.id] === size;
                            return (
                              <button
                                key={size}
                                onClick={() => handleSizeSelection(item.id, size)}
                                className={`p-2 rounded-lg border text-sm transition-all duration-200 ${
                                  isSelected
                                    ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-25'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-medium">{size}</div>
                                  <div className="text-orange-600 font-bold">₹{Math.round(price)}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="flex items-center space-x-2 mt-2">
                      {item.is_vegetarian && (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          🌱 Veg
                        </span>
                      )}
                      {item.is_inhouse && (
                        <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                          🏠 Inhouse
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="p-4 pt-0">
                    {(() => {
                      const needsSizeSelection = item.pricing_type !== 'single' && 
                        item.price_variations && 
                        Object.keys(item.price_variations).length > 0 && 
                        !selectedSizes[item.id];
                      
                      const isDisabled = !item.is_available || needsSizeSelection;
                      
                      return (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={isDisabled}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                            isDisabled
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          {!item.is_available ? (
                            'Not Available'
                          ) : needsSizeSelection ? (
                            'Select Size First'
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                              </svg>
                              <span>Add to Cart</span>
                            </div>
                          )}
                        </button>
                      );
                    })()}
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

export default InhouseManagement;