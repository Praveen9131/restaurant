import { useEffect, useState, useCallback } from 'react';
import { menuAPI, categoryAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import MenuCard from '../../components/customer/MenuCard';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]); // Store all items for search
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [showAllItems, setShowAllItems] = useState(true); // Show all items by default
  // const [availableOnly, setAvailableOnly] = useState(false); // Always show all items including unavailable
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch categories only once on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch menu items and update counts when filters change
  useEffect(() => {
    if (categories.length > 0) {
      fetchMenuItems();
      fetchCategoryCounts(categories);
    }
  }, [selectedCategory, vegetarianOnly, nonVegOnly, showAllItems, categories, fetchCategoryCounts, fetchMenuItems]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setError('');
      const response = await categoryAPI.getAll();
      const categoriesData = response.data.categories || [];
      
      // Add "All" category at the beginning
      const allCategory = {
        id: 'all',
        name: 'All',
        description: 'All menu items'
      };
      
      const categoriesList = [allCategory, ...categoriesData];
      setCategories(categoriesList);
      
      // Fetch menu items and counts on initial load
      await Promise.all([
        fetchMenuItems(),
        fetchCategoryCounts(categoriesList)
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please refresh the page.');
    } finally {
      setCategoriesLoading(false);
    }
  }, [fetchMenuItems, fetchCategoryCounts]);

  const fetchCategoryCounts = useCallback(async (categoriesList) => {
    const counts = { 'all': 0 };
    
    try {
      // Get total count for "All" category with current filters
      const allParams = {}; // Backend has issue with available_only parameter, so fetch all items
      if (vegetarianOnly) {
        allParams.vegetarian_only = true;
      }
      const allResponse = await menuAPI.getAll(allParams);
      let allItems = allResponse.data.menu_items || [];
      
      // Apply client-side filtering based on selected filter
      if (vegetarianOnly) {
        allItems = allItems.filter(item => item.is_vegetarian);
      } else if (nonVegOnly) {
        allItems = allItems.filter(item => !item.is_vegetarian);
      }
      // If showAllItems is true (default), show all items without filtering
      
      // Count all items (both available and unavailable)
      counts['all'] = allItems.length;
      
      // Get count for each specific category with current filters
      for (const category of categoriesList) {
        if (category.id !== 'all') {
          try {
            const params = { 
              category_id: category.id
              // Backend has issue with available_only parameter, so fetch all items
            };
            if (vegetarianOnly) {
              params.vegetarian_only = true;
            }
            const response = await menuAPI.getAll(params);
            let categoryItems = response.data.menu_items || [];
            
            // Apply client-side filtering based on selected filter
            if (vegetarianOnly) {
              categoryItems = categoryItems.filter(item => item.is_vegetarian);
            } else if (nonVegOnly) {
              categoryItems = categoryItems.filter(item => !item.is_vegetarian);
            }
            // If showAllItems is true (default), show all items without filtering
            
            // Count all items (both available and unavailable)
            counts[category.id] = categoryItems.length;
          } catch (error) {
            console.error(`Error fetching count for category ${category.id}:`, error);
            counts[category.id] = 0;
          }
        }
      }
      
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
  }, [vegetarianOnly, nonVegOnly]);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const params = {}; // Backend has issue with available_only parameter, so fetch all items
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.category_id = selectedCategory;
      }
      
      if (vegetarianOnly) {
        params.vegetarian_only = true;
      }

      const response = await menuAPI.getAll(params);
      const allItems = response.data.menu_items || [];
      
      // Apply client-side filtering based on selected filter
      let filteredItems = allItems;
      if (vegetarianOnly) {
        filteredItems = allItems.filter(item => item.is_vegetarian);
      } else if (nonVegOnly) {
        filteredItems = allItems.filter(item => !item.is_vegetarian);
      }
      // If showAllItems is true (default), show all items without filtering
      
      // Show both available and unavailable items
      setAllMenuItems(filteredItems);
      setMenuItems(filteredItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items. Please refresh the page.');
      setMenuItems([]);
      setAllMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, vegetarianOnly, nonVegOnly]);

  // Filter menu items based on search query
  const filterBySearch = (items, query) => {
    if (!query.trim()) return items;
    
    const lowerQuery = query.toLowerCase().trim();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.category_name?.toLowerCase().includes(lowerQuery)
    );
  };

  // Handle search input
  const handleSearch = (value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      // If search is cleared, show items based on current category
      setMenuItems(allMenuItems);
    } else {
      // Filter items based on search query
      const filtered = filterBySearch(allMenuItems, value);
      setMenuItems(filtered);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setMenuItems(allMenuItems);
  };


  // const getItemCount = (categoryId) => {
  //   if (categoryId === 'all') return menuItems.length;
  //   return menuItems.filter(item => item.category_id === parseInt(categoryId)).length;
  // };

  // Get total items count for each category from API
  const getCategoryItemCount = (categoryId) => {
    return categoryCounts[categoryId] || 0;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop Only - Fixed structure with internal scrolling */}
        <div className="hidden md:flex flex-col w-80 bg-white shadow-lg border-r border-gray-200 flex-shrink-0">
          {/* Sidebar Header - Fixed */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold">🍽️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Menu Categories</h2>
            </div>
          </div>
          
          {/* Scrollable Categories Section */}
          <div className="flex-1 overflow-y-auto p-6">
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-100 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500 ${
                    selectedCategory === category.id.toString()
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                      : 'hover:bg-orange-50 hover:shadow-md hover:border-l-4 hover:border-orange-500'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id.toString()}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-3 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className={`text-sm ${
                    selectedCategory === category.id.toString() ? 'text-white' : 'text-gray-500'
                  }`}>
                    ({getCategoryItemCount(category.id)})
                  </span>
                </label>
              ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Section - Menu Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Search Bar and Filters - Desktop */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for dishes, cuisines, or categories..."
                    className="w-full pl-12 pr-12 py-3 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-base"
                    aria-label="Search menu items"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Filters - Right side of search bar */}
              <div className="hidden lg:flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Filters:</span>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dietFilter"
                      checked={showAllItems && !vegetarianOnly && !nonVegOnly}
                      onChange={() => {
                        setShowAllItems(true);
                        setVegetarianOnly(false);
                        setNonVegOnly(false);
                      }}
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">🍽️ All Items</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dietFilter"
                      checked={vegetarianOnly}
                      onChange={() => {
                        setVegetarianOnly(true);
                        setNonVegOnly(false);
                        setShowAllItems(false);
                      }}
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">🌱 Vegetarian</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dietFilter"
                      checked={nonVegOnly}
                      onChange={() => {
                        setNonVegOnly(true);
                        setVegetarianOnly(false);
                        setShowAllItems(false);
                      }}
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">🍖 Non-Vegetarian</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Search Results Count */}
            {searchQuery && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  Found <span className="font-semibold text-orange-600">{menuItems.length}</span> item{menuItems.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                {menuItems.length === 0 && (
                  <button
                    onClick={clearSearch}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Category Filter */}
          <div className="md:hidden mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({getCategoryItemCount(category.id)})
                </option>
              ))}
            </select>
            
            {/* Mobile Filters */}
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200">
                <input
                  type="radio"
                  name="mobileDietFilter"
                  checked={showAllItems && !vegetarianOnly && !nonVegOnly}
                  onChange={() => {
                    setShowAllItems(true);
                    setVegetarianOnly(false);
                    setNonVegOnly(false);
                  }}
                  className="mr-2 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">🍽️ All</span>
              </label>
              <label className="inline-flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200">
                <input
                  type="radio"
                  name="mobileDietFilter"
                  checked={vegetarianOnly}
                  onChange={() => {
                    setVegetarianOnly(true);
                    setNonVegOnly(false);
                    setShowAllItems(false);
                  }}
                  className="mr-2 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">🌱 Veg Only</span>
              </label>
              <label className="inline-flex items-center cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200">
                <input
                  type="radio"
                  name="mobileDietFilter"
                  checked={nonVegOnly}
                  onChange={() => {
                    setNonVegOnly(true);
                    setVegetarianOnly(false);
                    setShowAllItems(false);
                  }}
                  className="mr-2 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">🍖 Non-Veg Only</span>
              </label>
              <div className="inline-flex items-center bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                <span className="mr-2 text-green-600">✓</span>
                <span className="text-sm text-gray-600">Available Only</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loading />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {menuItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {!loading && menuItems.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-6xl mb-4">🔍</div>
              {searchQuery ? (
                <>
                  <p className="text-xl font-semibold text-gray-800 mb-2">No items found for "{searchQuery}"</p>
                  <p className="text-gray-600 mb-6">Try searching with different keywords or browse all items</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={clearSearch}
                      className="btn-primary"
                    >
                      Clear Search
                    </button>
                    <button
                      onClick={() => {
                        clearSearch();
                        setSelectedCategory('all');
                        setVegetarianOnly(false);
                      }}
                      className="btn-secondary"
                    >
                      Show All Items
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xl font-semibold text-gray-800 mb-2">No items found</p>
                  <p className="text-gray-600 mb-6">
                    {vegetarianOnly 
                      ? "No vegetarian items available in this category. Try turning off the vegetarian filter or selecting a different category."
                      : "No items available in this category. Try selecting a different category."
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {vegetarianOnly && (
                      <button
                        onClick={() => setVegetarianOnly(false)}
                        className="btn-secondary"
                      >
                        Show All Items (Including Non-Veg)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setVegetarianOnly(false);
                      }}
                      className="btn-primary"
                    >
                      Show All Available Items
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Compact Footer for Menu Page */}
      <footer className="bg-gray-800 text-white py-4 border-t border-gray-700 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm">
              <span>📞 +91 9994592607</span>
              <span>✉️ admin@seasidelbs.com</span>
              <span>📍 Cuddalore, Tamil Nadu</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span>© 2025 SeaSide Bake Studio</span>
              <div className="flex items-center space-x-2">
                <span>Follow us:</span>
                <a href="#" className="hover:text-orange-400 transition">Facebook</a>
                <a href="https://www.instagram.com/seaside_live_bake_studio?igsh=MW9ycnRyY3QxeTAwMg==" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition">Instagram</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Menu;


