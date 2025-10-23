import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { menuAPI, categoryAPI } from '../../services/api';
import Loading from '../../components/common/Loading';

const AdminMenu = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'unavailable'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    pricing_type: 'single',
    price: '',
    price_variations: {},
    image: '',
    is_available: true,
    is_vegetarian: false,
  });

  const [variationInputs, setVariationInputs] = useState([
    { name: 'Small', price: '' },
    { name: 'Medium', price: '' },
    { name: 'Large', price: '' },
  ]);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchMenuItems();
    fetchCategories();
  }, [user, isAdmin, navigate]);

  const fetchMenuItems = async () => {
    try {
      // Backend has issue with available_only parameter, so always fetch all items
      const response = await menuAPI.getAll();
      
      const allItems = response.data.menu_items || [];
      
      // Sort items: available first, then unavailable
      const availableItems = allItems.filter(item => item.is_available);
      const unavailableItems = allItems.filter(item => !item.is_available);
      const sortedItems = [...availableItems, ...unavailableItems];
      
      setMenuItems(sortedItems);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleVariationChange = (index, field, value) => {
    const newVariations = [...variationInputs];
    newVariations[index][field] = value;
    setVariationInputs(newVariations);
  };

  const addVariation = () => {
    setVariationInputs([...variationInputs, { name: '', price: '' }]);
  };

  const removeVariation = (index) => {
    setVariationInputs(variationInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare data exactly as API expects
      const data = { ...formData };
      data.category_id = parseInt(data.category_id);

      if (data.pricing_type === 'single') {
        // Single pricing: send price field
        data.price = parseFloat(data.price);
        delete data.price_variations;
      } else {
        // Multiple pricing: send price_variations object
        data.price_variations = {};
        variationInputs.forEach(variation => {
          if (variation.name && variation.price) {
            data.price_variations[variation.name] = parseFloat(variation.price);
          }
        });
        delete data.price;
      }

      let response;
      if (editingItem) {
        response = await menuAPI.update(editingItem.id, data);
      } else {
        response = await menuAPI.create(data);
      }

      if (response.data.success) {
        alert(editingItem ? 'Menu item updated successfully!' : 'Menu item created successfully!');
        setShowModal(false);
        resetForm();
        fetchMenuItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      pricing_type: 'single',
      price: '',
      price_variations: {},
      image: '',
      is_available: true,
      is_vegetarian: false,
    });
    setVariationInputs([
      { name: 'Small', price: '' },
      { name: 'Medium', price: '' },
      { name: 'Large', price: '' },
    ]);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Map API response directly to form
    setFormData({
      name: item.name,
      description: item.description,
      category_id: item.category_id,
      pricing_type: item.pricing_type,
      price: item.price || '',
      price_variations: item.price_variations || {},
      image: item.image || '',
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
    });

    // Convert API price_variations object to array for form inputs
    if (item.pricing_type === 'multiple' && item.price_variations) {
      const variations = Object.entries(item.price_variations).map(([name, price]) => ({ 
        name, 
        price: price.toString() 
      }));
      setVariationInputs(variations);
    }

    setShowModal(true);
  };

  // Helper functions to get filtered items
  const getAvailableItems = () => menuItems.filter(item => item.is_available);
  const getUnavailableItems = () => menuItems.filter(item => !item.is_available);
  const getCurrentTabItems = () => activeTab === 'available' ? getAvailableItems() : getUnavailableItems();

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Menu Management</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            + Add Menu Item
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'available'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Available Items ({getAvailableItems().length})
            </button>
            <button
              onClick={() => setActiveTab('unavailable')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'unavailable'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unavailable Items ({getUnavailableItems().length})
            </button>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCurrentTabItems().map((item) => (
              <div key={item.id} className={`card overflow-hidden ${
                !item.is_available 
                  ? 'opacity-75 relative' 
                  : ''
              }`}>
                {/* Unavailable Overlay */}
                {!item.is_available && (
                  <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-lg shadow-lg font-bold text-xs">
                    UNAVAILABLE
                  </div>
                )}
                
            <div className={`h-48 bg-gray-200 overflow-hidden relative ${!item.is_available ? 'grayscale' : ''}`}>
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              )}
            </div>

            <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{item.name}</h3>
                    <div className="flex gap-2">
                      {item.is_vegetarian && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🌱</span>}
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        Available
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <p className="text-gray-600 text-xs mb-2">Category: {item.category_name}</p>

                  {item.pricing_type === 'single' ? (
                    <p className="text-primary font-bold text-lg mb-3">₹{Math.round(item.price)}</p>
                  ) : (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Multiple Pricing:</p>
                      <div className="text-sm">
                        {Object.entries(item.price_variations || {}).map(([name, price]) => (
                          <div key={`${item.id}-${name}`} className="flex justify-between">
                            <span>{name}:</span>
                            <span className="font-medium">₹{Math.round(price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => handleEdit(item)} className="w-full btn-secondary">
                    Edit Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold mb-6">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Category *</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Image URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Pricing Type *</label>
                  <select
                    name="pricing_type"
                    value={formData.pricing_type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="single">Single Price</option>
                    <option value="multiple">Multiple Prices (Sizes)</option>
                  </select>
                </div>

                {formData.pricing_type === 'single' ? (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="input-field"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Price Variations *</label>
                    <div className="space-y-2">
                      {variationInputs.map((variation, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Size name"
                            value={variation.name}
                            onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                            className="input-field flex-1"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={variation.price}
                            onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                            step="0.01"
                            min="0"
                            className="input-field flex-1"
                          />
                          {variationInputs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariation(index)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 rounded"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addVariation}
                        className="text-primary hover:text-orange-600 text-sm font-medium"
                      >
                        + Add Variation
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary focus:ring-primary rounded"
                    />
                    <span className="text-gray-700 font-medium">Available</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vegetarian"
                      checked={formData.is_vegetarian}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary focus:ring-primary rounded"
                    />
                    <span className="text-gray-700 font-medium">Vegetarian</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMenu;

