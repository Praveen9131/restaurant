import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { render } from './test-utils';
import Menu from '../src/pages/customer/Menu';
import * as api from '../src/services/api';

// Mock API responses
jest.mock('../src/services/api', () => ({
  menuAPI: {
    getAll: jest.fn(),
  },
  categoryAPI: {
    getAll: jest.fn(),
  },
}));

const mockMenuItems = [
  { id: 1, name: 'Veg Burger', is_vegetarian: true, is_available: true, category_id: 1, category_name: 'Burgers' },
  { id: 2, name: 'Chicken Burger', is_vegetarian: false, is_available: true, category_id: 1, category_name: 'Burgers' },
  { id: 3, name: 'Veg Pizza', is_vegetarian: true, is_available: true, category_id: 2, category_name: 'Pizza' },
  { id: 4, name: 'Chicken Pizza', is_vegetarian: false, is_available: true, category_id: 2, category_name: 'Pizza' },
  { id: 5, name: 'Veg Momos', is_vegetarian: true, is_available: false, category_id: 3, category_name: 'Momos' },
  { id: 6, name: 'Chicken Momos', is_vegetarian: false, is_available: false, category_id: 3, category_name: 'Momos' },
];

const mockCategories = [
  { id: 1, name: 'Burgers', description: 'Delicious burgers' },
  { id: 2, name: 'Pizza', description: 'Freshly baked pizzas' },
  { id: 3, name: 'Momos', description: 'Steamed dumplings' },
];

describe('Menu Component Tests', () => {
  beforeEach(() => {
    api.menuAPI.getAll.mockResolvedValue({ data: { menu_items: mockMenuItems } });
    api.categoryAPI.getAll.mockResolvedValue({ data: { categories: mockCategories } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render menu component with search bar', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for dishes, cuisines, or categories...')).toBeInTheDocument();
    });
  });

  test('should render filter options', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('🍽️ All Items')).toBeInTheDocument();
      expect(screen.getByText('🌱 Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('🍖 Non-Vegetarian')).toBeInTheDocument();
    });
  });

  test('should display categories in sidebar', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Burgers')).toBeInTheDocument();
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Momos')).toBeInTheDocument();
    });
  });

  test('should handle search input', async () => {
    render(<Menu />);
    
    const searchInput = screen.getByPlaceholderText('Search for dishes, cuisines, or categories...');
    fireEvent.change(searchInput, { target: { value: 'burger' } });
    
    expect(searchInput.value).toBe('burger');
  });

  test('should handle filter selection', async () => {
    render(<Menu />);
    
    const vegetarianFilter = screen.getByLabelText('🌱 Vegetarian');
    fireEvent.click(vegetarianFilter);
    
    expect(vegetarianFilter.checked).toBe(true);
  });

  test('should display loading state initially', async () => {
    // Mock a delayed response
    api.menuAPI.getAll.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: { menu_items: mockMenuItems } }), 100)
    ));
    
    render(<Menu />);
    
    // Should show loading spinner initially - look for the spinner div
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should display error state when API fails', async () => {
    api.menuAPI.getAll.mockRejectedValue(new Error('API Error'));
    
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load menu items. Please refresh the page.')).toBeInTheDocument();
    });
  });

  test('should display no items message when no items found', async () => {
    api.menuAPI.getAll.mockResolvedValue({ data: { menu_items: [] } });
    
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });
});
