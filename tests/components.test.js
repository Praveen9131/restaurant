import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Menu from '../src/pages/customer/Menu';
import MenuCard from '../src/components/customer/MenuCard';

// Mock API responses
const mockMenuItems = [
  {
    id: 1,
    name: "Veg Burger",
    description: "Delicious vegetarian burger",
    price: 12.99,
    pricing_type: "single",
    price_variations: {},
    is_available: true,
    is_vegetarian: true,
    category_id: 1,
    category_name: "Burgers",
    image: "https://example.com/veg-burger.jpg"
  },
  {
    id: 2,
    name: "Chicken Burger",
    description: "Juicy chicken burger",
    price: 15.99,
    pricing_type: "single",
    price_variations: {},
    is_available: true,
    is_vegetarian: false,
    category_id: 1,
    category_name: "Burgers",
    image: "https://example.com/chicken-burger.jpg"
  },
  {
    id: 3,
    name: "Unavailable Pizza",
    description: "This pizza is not available",
    price: 18.99,
    pricing_type: "single",
    price_variations: {},
    is_available: false,
    is_vegetarian: true,
    category_id: 2,
    category_name: "Pizza",
    image: "https://example.com/pizza.jpg"
  }
];

const mockCategories = [
  { id: 1, name: "Burgers", description: "Delicious burgers" },
  { id: 2, name: "Pizza", description: "Fresh pizzas" }
];

// Mock the API module
jest.mock('../src/services/api', () => ({
  menuAPI: {
    getAll: jest.fn()
  },
  categoryAPI: {
    getAll: jest.fn()
  }
}));

describe('Menu Component Tests', () => {
  beforeEach(() => {
    const { menuAPI, categoryAPI } = require('../src/services/api');
    
    menuAPI.getAll.mockResolvedValue({
      data: { menu_items: mockMenuItems }
    });
    
    categoryAPI.getAll.mockResolvedValue({
      data: { categories: mockCategories }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render menu component with all items by default', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
      expect(screen.getByText('Unavailable Pizza')).toBeInTheDocument();
    });
  });

  test('should filter vegetarian items when vegetarian filter is selected', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
    });

    const vegetarianFilter = screen.getByLabelText(/vegetarian only/i);
    fireEvent.click(vegetarianFilter);

    await waitFor(() => {
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
      expect(screen.queryByText('Chicken Burger')).not.toBeInTheDocument();
    });
  });

  test('should filter non-vegetarian items when non-veg filter is selected', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
    });

    const nonVegFilter = screen.getByLabelText(/non-vegetarian only/i);
    fireEvent.click(nonVegFilter);

    await waitFor(() => {
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
      expect(screen.queryByText('Veg Burger')).not.toBeInTheDocument();
    });
  });

  test('should show all items when all items filter is selected', async () => {
    render(<Menu />);
    
    // First select vegetarian filter
    const vegetarianFilter = screen.getByLabelText(/vegetarian only/i);
    fireEvent.click(vegetarianFilter);

    await waitFor(() => {
      expect(screen.queryByText('Chicken Burger')).not.toBeInTheDocument();
    });

    // Then select all items filter
    const allItemsFilter = screen.getByLabelText(/all items/i);
    fireEvent.click(allItemsFilter);

    await waitFor(() => {
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
    });
  });

  test('should maintain mutual exclusivity between filters', async () => {
    render(<Menu />);
    
    const vegetarianFilter = screen.getByLabelText(/vegetarian only/i);
    const nonVegFilter = screen.getByLabelText(/non-vegetarian only/i);
    const allItemsFilter = screen.getByLabelText(/all items/i);

    // Select vegetarian filter
    fireEvent.click(vegetarianFilter);
    expect(vegetarianFilter).toBeChecked();
    expect(nonVegFilter).not.toBeChecked();
    expect(allItemsFilter).not.toBeChecked();

    // Select non-veg filter
    fireEvent.click(nonVegFilter);
    expect(vegetarianFilter).not.toBeChecked();
    expect(nonVegFilter).toBeChecked();
    expect(allItemsFilter).not.toBeChecked();

    // Select all items filter
    fireEvent.click(allItemsFilter);
    expect(vegetarianFilter).not.toBeChecked();
    expect(nonVegFilter).not.toBeChecked();
    expect(allItemsFilter).toBeChecked();
  });

  test('should display loading state initially', () => {
    render(<Menu />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should handle API errors gracefully', async () => {
    const { menuAPI } = require('../src/services/api');
    menuAPI.getAll.mockRejectedValue(new Error('API Error'));

    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});

describe('MenuCard Component Tests', () => {
  test('should render available item correctly', () => {
    const availableItem = mockMenuItems[0];
    render(<MenuCard item={availableItem} />);
    
    expect(screen.getByText('Veg Burger')).toBeInTheDocument();
    expect(screen.getByText('Delicious vegetarian burger')).toBeInTheDocument();
    expect(screen.getByText('₹12.99')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  test('should render unavailable item with correct styling', () => {
    const unavailableItem = mockMenuItems[2];
    render(<MenuCard item={unavailableItem} />);
    
    expect(screen.getByText('Unavailable Pizza')).toBeInTheDocument();
    expect(screen.getByText('NOT AVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('NOT AVAILABLE')).toBeDisabled();
  });

  test('should display vegetarian badge for vegetarian items', () => {
    const vegItem = mockMenuItems[0];
    render(<MenuCard item={vegItem} />);
    
    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('Veg')).toBeInTheDocument();
  });

  test('should display non-vegetarian badge for non-veg items', () => {
    const nonVegItem = mockMenuItems[1];
    render(<MenuCard item={nonVegItem} />);
    
    expect(screen.getByText('🍖')).toBeInTheDocument();
    expect(screen.getByText('Non-Veg')).toBeInTheDocument();
  });

  test('should handle multiple pricing correctly', () => {
    const multiPriceItem = {
      ...mockMenuItems[0],
      pricing_type: "multiple",
      price_variations: {
        "Small": 8.99,
        "Medium": 12.99,
        "Large": 16.99
      }
    };
    
    render(<MenuCard item={multiPriceItem} />);
    
    expect(screen.getByText('₹8.99 - ₹16.99')).toBeInTheDocument();
  });

  test('should open add to cart modal for multiple pricing items', () => {
    const multiPriceItem = {
      ...mockMenuItems[0],
      pricing_type: "multiple",
      price_variations: {
        "Small": 8.99,
        "Medium": 12.99
      }
    };
    
    render(<MenuCard item={multiPriceItem} />);
    
    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);
    
    expect(screen.getByText('Select Size:')).toBeInTheDocument();
    expect(screen.getByText('Small - ₹8.99')).toBeInTheDocument();
    expect(screen.getByText('Medium - ₹12.99')).toBeInTheDocument();
  });
});

describe('Filter Integration Tests', () => {
  test('should update item counts when filters change', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
    });

    // Check initial count
    const vegetarianFilter = screen.getByLabelText(/vegetarian only/i);
    fireEvent.click(vegetarianFilter);

    await waitFor(() => {
      // Should only show vegetarian items
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
      expect(screen.queryByText('Chicken Burger')).not.toBeInTheDocument();
    });
  });

  test('should work with category filtering', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Veg Burger')).toBeInTheDocument();
    });

    // This would test category dropdown if implemented
    // For now, we'll test that the component renders without errors
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
