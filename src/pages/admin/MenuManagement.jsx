import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { menuAPI, categoryAPI, fileAPI } from '../../services/api';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const MenuManagement = () => {
  console.log('MenuManagement: Component is rendering...');
  
  const [searchParams] = useSearchParams();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'available', 'unavailable'
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    pricing_type: 'single',
    category_id: '',
    is_vegetarian: false,
    is_available: true,
    image: '',
    price_variations: {}
  });
  const [priceVariations, setPriceVariations] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    console.log('MenuManagement: Starting to fetch data...');
    try {
      // Use the correct API endpoint from documentation
      console.log('MenuManagement: Calling menuAPI.getAll()...');
      const menuResponse = await menuAPI.getAll();
      console.log('MenuManagement: Menu API response:', menuResponse);
      
      console.log('MenuManagement: Calling categoryAPI.getAll()...');
      const categoriesResponse = await categoryAPI.getAll();
      console.log('MenuManagement: Categories API response:', categoriesResponse);
      
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
      
      console.log('MenuManagement: Successfully fetched data:', {
        total: allMenuItems.length,
        available: allMenuItems.filter(item => item.is_available).length,
        unavailable: allMenuItems.filter(item => !item.is_available).length
      });
    } catch (error) {
      console.error('MenuManagement: Error fetching data:', error);
      console.error('MenuManagement: Error response:', error.response);
      showError('Failed to fetch data: ' + (error.response?.data?.message || error.message));
      
      // Set empty arrays to prevent rendering issues
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL parameter for tab switching
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['all', 'available', 'unavailable'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        showError('Item name is required');
        return;
      }
      
      if (!formData.category_id) {
        showError('Please select a category');
        return;
      }
      
      if (formData.pricing_type === 'single' && (!formData.price || parseFloat(formData.price) <= 0)) {
        showError('Please enter a valid price');
        return;
      }
      
      if (formData.pricing_type === 'multiple' && priceVariations.filter(v => v.size && v.price).length === 0) {
        showError('Please add at least one size and price variation');
        return;
      }
      
      // Prepare data exactly as API expects
      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        category_id: parseInt(formData.category_id),
        is_vegetarian: Boolean(formData.is_vegetarian),
        is_available: Boolean(formData.is_available),
        pricing_type: formData.pricing_type
      };
      
      // Handle image - API REQUIRES this field, use placeholder if empty
      const imageUrl = formData.image?.trim() || '';
      if (imageUrl) {
        submitData.image = imageUrl;
      } else {
        // API requires image field - use placeholder
        submitData.image = 'https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=SeaSide+Bake';
      }
      
      if (submitData.pricing_type === 'single') {
        // Single pricing: send price as number, send empty price_variations
        submitData.price = parseFloat(formData.price);
        submitData.price_variations = {}; // API expects this field even if empty
      } else {
        // Multiple pricing: send price_variations object, don't send price field
        submitData.price_variations = {};
        priceVariations.forEach(variation => {
          if (variation.size && variation.price) {
            submitData.price_variations[variation.size] = parseFloat(variation.price);
          }
        });
        // Don't include price field for multiple pricing
      }

      console.log('Submitting data:', JSON.stringify(submitData, null, 2));

      if (editingItem) {
        // For update, API needs item_id plus all fields
        const updateData = {
          item_id: editingItem.id,
          ...submitData
        };
        console.log('Updating with data:', JSON.stringify(updateData, null, 2));
        const response = await menuAPI.update(editingItem.id, submitData);
        console.log('Update response:', response.data);
        showSuccess('Menu item updated successfully!');
      } else {
        console.log('Creating with data:', JSON.stringify(submitData, null, 2));
        const response = await menuAPI.create(submitData);
        console.log('Create response:', response.data);
        showSuccess('Menu item created successfully!');
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Build detailed error message
      let errorMessage = 'Failed to save menu item';
      
      if (error.response?.status === 500) {
        errorMessage += ' - Server error (500). ';
        if (error.response?.data?.message) {
          errorMessage += error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage += error.response.data.error;
        } else {
          errorMessage += 'Please check console for details.';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage += ' - ' + error.message;
      }
      
      showError(errorMessage);
      
      // Show detailed error in console for debugging
      console.group('🔴 Menu Item Save Error Details');
      console.log('Status Code:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Error Message:', error.message);
      console.log('Response Data:', error.response?.data);
      console.log('Submitted Data:', formData);
      console.groupEnd();
    }
  };

  const handleEdit = (item) => {
    setItemToEdit(item);
    setShowEditDialog(true);
  };

  const handleEditConfirm = () => {
    setEditingItem(itemToEdit);
    
    // Map API response directly to form
    setFormData({
      name: itemToEdit.name,
      description: itemToEdit.description || '',
      price: itemToEdit.price?.toString() || '',
      pricing_type: itemToEdit.pricing_type || 'single',
      category_id: itemToEdit.category_id?.toString() || '',
      is_vegetarian: itemToEdit.is_vegetarian || false,
      is_available: itemToEdit.is_available !== false,
      image: itemToEdit.image || '',
      price_variations: itemToEdit.price_variations || {}
    });

    // Convert API price_variations object to array for form inputs
    if (itemToEdit.pricing_type === 'multiple' && itemToEdit.price_variations) {
      const variations = Object.entries(itemToEdit.price_variations).map(([size, price]) => ({
        size,
        price: price.toString()
      }));
      setPriceVariations(variations);
    } else {
      setPriceVariations([]);
    }

    setShowModal(true);
    setShowEditDialog(false);
    setItemToEdit(null);
  };

  const handleEditCancel = () => {
    setShowEditDialog(false);
    setItemToEdit(null);
  };

  const handleDelete = (itemId) => {
    const item = menuItems.find(item => item.id === itemId);
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await menuAPI.delete(itemToDelete.id);
        showSuccess('Menu item deleted successfully!');
        fetchData();
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete menu item');
      }
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleToggleAvailability = async (item) => {
    try {
      await menuAPI.update(item.id, {
        ...item,
        is_available: !item.is_available
      });
      showSuccess(`Menu item ${!item.is_available ? 'made available' : 'made unavailable'} successfully!`);
      fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update availability');
    }
  };

  const addPriceVariation = () => {
    setPriceVariations([...priceVariations, { size: '', price: '' }]);
  };

  const updatePriceVariation = (index, field, value) => {
    const updated = [...priceVariations];
    updated[index][field] = value;
    setPriceVariations(updated);
  };

  const removePriceVariation = (index) => {
    setPriceVariations(priceVariations.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    try {
      // Upload to server using the new file upload API
      showSuccess('Uploading image to server...');
      const response = await fileAPI.uploadImage(file);
      
      // Get the file URL from the response
      const fileUrl = response.data.s3_url || response.data.file_url || response.data.url;
      
      if (fileUrl) {
        setFormData({ ...formData, image: fileUrl });
        showSuccess('✅ Image uploaded successfully to server!');
      } else {
        // If server doesn't return URL, show error
        showError('Server upload failed - no URL returned');
        console.error('Server response:', response.data);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      showError(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      pricing_type: 'single',
      category_id: '',
      is_vegetarian: false,
      is_available: true,
      image: '',
      price_variations: {}
    });
    setPriceVariations([]);
  };

  const openModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  // Helper functions to get filtered items
  const getAvailableItems = () => menuItems.filter(item => item.is_available);
  const getUnavailableItems = () => menuItems.filter(item => !item.is_available);
  
  // Search function
  const getFilteredItems = () => {
    let items = [];
    switch (activeTab) {
      case 'available':
        items = getAvailableItems();
        break;
      case 'unavailable':
        items = getUnavailableItems();
        break;
      default:
        items = menuItems;
    }
    
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <div className="ml-4 text-gray-600">Loading menu items...</div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-swiggy font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Manage your menu items</p>
          
          {/* Statistics */}
          <div className="flex space-x-6 mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-green-600">{getAvailableItems().length}</span> Available
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-red-600">{getUnavailableItems().length}</span> Unavailable
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-700">{menuItems.length}</span> Total Items
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={openModal}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-swiggy font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Menu Item</span>
        </button>
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

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'all'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>All ({menuItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'available'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Available ({getAvailableItems().length})</span>
          </button>
          <button
            onClick={() => setActiveTab('unavailable')}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'unavailable'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Unavailable ({getUnavailableItems().length})</span>
          </button>
        </div>
      </div>



      {/* Menu Items Grid */}
      <div className="mb-8">
        {getFilteredItems().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No menu items found</div>
            <div className="text-gray-400 text-sm">
              {searchTerm ? 'No items match your search' :
               activeTab === 'available' ? 'No available items' : 
               activeTab === 'unavailable' ? 'No unavailable items' : 
               'No items in database'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredItems().map((item) => (
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
              <div className={`w-full h-full flex items-center justify-center text-gray-400 flex-col ${item.image ? 'hidden' : ''}`}>
                <div className="text-6xl mb-2">🍽️</div>
                {!item.image && <p className="text-xs text-gray-500">No image</p>}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-swiggy font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{item.description}</p>
                  
                  <div className="mb-3">
                    {/* Price Display */}
                    {item.pricing_type === 'multiple' && item.price_variations ? (
                      <div className="space-y-1 mb-2">
                        <p className="text-xs text-gray-500 font-medium">Multiple Sizes:</p>
                        {Object.entries(item.price_variations).map(([size, price]) => (
                          <div key={`${item.id}-${size}`} className="flex justify-between text-sm">
                            <span className="text-gray-700">{size}:</span>
                            <span className="font-semibold text-orange-600">₹{Math.round(price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-orange-600">
                        ₹{Math.round(item.price || 0)}
                      </span>
                    )}
                    
                    {/* Badges */}
                    <div className="flex items-center space-x-2 mt-2">
                      {item.is_vegetarian && (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          🌱 Veg
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1 ml-4">
                  {/* Availability Toggle */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      item.is_available 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    title={item.is_available ? 'Make Unavailable' : 'Make Available'}
                  >
                    {item.is_available ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Edit item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <p>Category: {categories.find(cat => cat.id === item.category_id)?.name || 'Uncategorized'}</p>
                <p>ID: {item.id}</p>
              </div>
            </div>
          </div>
        ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-swiggy font-bold text-gray-800 mb-6">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 resize-none"
                  placeholder="Enter item description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Type *
                  </label>
                  <select
                    required
                    value={formData.pricing_type}
                    onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="single">Single Price</option>
                    <option value="multiple">Multiple Sizes</option>
                  </select>
                </div>

                {formData.pricing_type === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required={formData.pricing_type === 'single'}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter price"
                    />
                  </div>
                )}
              </div>

              {/* Price Variations */}
              {formData.pricing_type === 'multiple' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Size & Price Options *
                    </label>
                    <button
                      type="button"
                      onClick={addPriceVariation}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      + Add Size
                    </button>
                  </div>
                  {priceVariations.map((variation, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Size (e.g., Small, Medium, Large)"
                        value={variation.size}
                        onChange={(e) => updatePriceVariation(index, 'size', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={variation.price}
                        onChange={(e) => updatePriceVariation(index, 'price', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removePriceVariation(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                  <span className="text-gray-500 font-normal"> (Optional)</span>
                </label>
                
                {/* Image Preview */}
                {formData.image && (
                  <div className="mb-3 relative group">
                    <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-red-500 flex-col bg-gray-100">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">Invalid Image</p>
                      </div>
                      
                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Image preview loaded {formData.image.startsWith('data:image') ? '(Local File)' : formData.image.startsWith('http') ? '(Server URL)' : '(URL)'}
                    </p>
                  </div>
                )}
                
                {/* Upload Options */}
                <div className="space-y-4">
                  {/* Primary Upload Method - File Upload with Drag & Drop */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                      isDragOver 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-orange-500'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label className="cursor-pointer flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-2 text-orange-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="font-semibold text-lg">
                          {isDragOver ? 'Drop Image Here' : 'Upload Image File'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {isDragOver ? 'Release to upload' : 'Click to browse or drag & drop your image'}
                      </p>
                      <p className="text-xs text-gray-500">Supports: PNG, JPG, JPEG, WEBP (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Alternative: URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or paste Image URL:
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Clear Button */}
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>
                
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800 font-semibold mb-1">
                    ✅ Recommended Image Upload:
                  </p>
                  <ul className="text-xs text-green-700 ml-4 space-y-1">
                    <li>1. <strong>Upload file</strong> from your computer (stored on server)</li>
                    <li>2. <strong>Paste URL</strong> from any website</li>
                    <li>• Leave empty to use default placeholder</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_vegetarian"
                    checked={formData.is_vegetarian}
                    onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_vegetarian" className="ml-2 block text-sm text-gray-700">
                    Vegetarian
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                    Available
                  </label>
                </div>

              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-swiggy font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Confirmation Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-swiggy font-bold text-gray-800 text-center mb-2">
              Edit Menu Item
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to edit <span className="font-semibold">"{itemToEdit?.name}"</span>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleEditCancel}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-swiggy font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditConfirm}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Yes, Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-swiggy font-bold text-gray-800 text-center mb-2">
              Delete Menu Item
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Are you sure you want to delete <span className="font-semibold">"{itemToDelete?.name}"</span>?
            </p>
            <p className="text-red-600 text-sm text-center mb-6 font-medium">
              This action cannot be undone!
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-swiggy font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-swiggy font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuManagementWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <MenuManagement />
    </ErrorBoundary>
  );
};

export default MenuManagementWithErrorBoundary;
