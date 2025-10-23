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

describe('Basic Menu Component Tests', () => {
  beforeEach(() => {
    api.menuAPI.getAll.mockResolvedValue({ data: { menu_items: [] } });
    api.categoryAPI.getAll.mockResolvedValue({ data: { categories: [] } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render menu component without crashing', () => {
    render(<Menu />);
    expect(screen.getByText('Menu Categories')).toBeInTheDocument();
  });

  test('should render search bar', () => {
    render(<Menu />);
    expect(screen.getByPlaceholderText('Search for dishes, cuisines, or categories...')).toBeInTheDocument();
  });

  test('should render filter options', () => {
    render(<Menu />);
    expect(screen.getByText('🍽️ All Items')).toBeInTheDocument();
    expect(screen.getByText('🌱 Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('🍖 Non-Vegetarian')).toBeInTheDocument();
  });

  test('should handle search input', () => {
    render(<Menu />);
    const searchInput = screen.getByPlaceholderText('Search for dishes, cuisines, or categories...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput.value).toBe('test search');
  });

  test('should handle filter selection', () => {
    render(<Menu />);
    const vegetarianFilter = screen.getByLabelText('🌱 Vegetarian');
    fireEvent.click(vegetarianFilter);
    expect(vegetarianFilter.checked).toBe(true);
  });

  test('should display error state when API fails', async () => {
    api.menuAPI.getAll.mockRejectedValue(new Error('API Error'));
    
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load menu items. Please refresh the page.')).toBeInTheDocument();
    });
  });

  test('should display no items message when no items found', async () => {
    render(<Menu />);
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });
});
