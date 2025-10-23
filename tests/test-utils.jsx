import React from 'react';
import { render } from '@testing-library/react';
import { CartProvider } from '../src/context/CartContext';
import { NotificationProvider } from '../src/context/NotificationContext';

// Custom render function that includes providers
const customRender = (ui, options) => {
  const Wrapper = ({ children }) => (
    <CartProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </CartProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
