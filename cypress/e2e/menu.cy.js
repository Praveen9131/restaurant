describe('Restaurant Website E2E Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5174');
  });

  describe('Menu Page Tests', () => {
    it('should load the menu page successfully', () => {
      cy.get('h1').should('contain', 'Menu');
      cy.get('[data-testid="menu-container"]').should('be.visible');
    });

    it('should display menu items', () => {
      cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);
    });

    it('should show loading state initially', () => {
      cy.get('[data-testid="loading"]').should('be.visible');
      cy.get('[data-testid="loading"]').should('not.exist');
    });
  });

  describe('Filter Tests', () => {
    it('should filter vegetarian items', () => {
      cy.get('[data-testid="vegetarian-filter"]').click();
      
      cy.get('[data-testid="menu-item"]').each(($item) => {
        cy.wrap($item).should('contain', '🌱');
      });
    });

    it('should filter non-vegetarian items', () => {
      cy.get('[data-testid="non-veg-filter"]').click();
      
      cy.get('[data-testid="menu-item"]').each(($item) => {
        cy.wrap($item).should('contain', '🍖');
      });
    });

    it('should show all items when all filter is selected', () => {
      // First filter by vegetarian
      cy.get('[data-testid="vegetarian-filter"]').click();
      cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);
      
      // Then select all items
      cy.get('[data-testid="all-items-filter"]').click();
      cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);
    });

    it('should maintain mutual exclusivity between filters', () => {
      cy.get('[data-testid="vegetarian-filter"]').click();
      cy.get('[data-testid="vegetarian-filter"]').should('be.checked');
      cy.get('[data-testid="non-veg-filter"]').should('not.be.checked');
      cy.get('[data-testid="all-items-filter"]').should('not.be.checked');

      cy.get('[data-testid="non-veg-filter"]').click();
      cy.get('[data-testid="vegetarian-filter"]').should('not.be.checked');
      cy.get('[data-testid="non-veg-filter"]').should('be.checked');
      cy.get('[data-testid="all-items-filter"]').should('not.be.checked');
    });
  });

  describe('Menu Item Tests', () => {
    it('should display available items correctly', () => {
      cy.get('[data-testid="menu-item"]').first().within(() => {
        cy.get('[data-testid="item-name"]').should('be.visible');
        cy.get('[data-testid="item-price"]').should('be.visible');
        cy.get('[data-testid="add-to-cart"]').should('be.enabled');
      });
    });

    it('should display unavailable items with correct styling', () => {
      cy.get('[data-testid="unavailable-item"]').first().within(() => {
        cy.get('[data-testid="not-available-badge"]').should('be.visible');
        cy.get('[data-testid="add-to-cart"]').should('be.disabled');
        cy.get('[data-testid="item-image"]').should('have.class', 'grayscale');
      });
    });

    it('should open add to cart modal for multiple pricing items', () => {
      cy.get('[data-testid="multiple-pricing-item"]').first().click();
      
      cy.get('[data-testid="add-to-cart-modal"]').should('be.visible');
      cy.get('[data-testid="size-options"]').should('be.visible');
      cy.get('[data-testid="quantity-selector"]').should('be.visible');
    });

    it('should add item to cart successfully', () => {
      cy.get('[data-testid="add-to-cart"]').first().click();
      
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="cart-count"]').should('contain', '1');
    });
  });

  describe('Category Tests', () => {
    it('should display category sidebar on desktop', () => {
      cy.viewport(1024, 768);
      cy.get('[data-testid="category-sidebar"]').should('be.visible');
    });

    it('should display category dropdown on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="category-dropdown"]').should('be.visible');
    });

    it('should filter items by category', () => {
      cy.get('[data-testid="category-item"]').first().click();
      
      cy.get('[data-testid="menu-item"]').each(($item) => {
        cy.wrap($item).should('contain', 'Burgers'); // Assuming first category is Burgers
      });
    });
  });

  describe('Search Tests', () => {
    it('should search menu items by name', () => {
      cy.get('[data-testid="search-input"]').type('burger');
      
      cy.get('[data-testid="menu-item"]').each(($item) => {
        cy.wrap($item).should('contain', 'burger');
      });
    });

    it('should clear search results', () => {
      cy.get('[data-testid="search-input"]').type('burger');
      cy.get('[data-testid="clear-search"]').click();
      
      cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Responsive Design Tests', () => {
    it('should work on mobile devices', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="menu-container"]').should('be.visible');
      cy.get('[data-testid="mobile-filters"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport(768, 1024);
      cy.get('[data-testid="menu-container"]').should('be.visible');
    });

    it('should work on desktop devices', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="menu-container"]').should('be.visible');
      cy.get('[data-testid="category-sidebar"]').should('be.visible');
    });
  });

  describe('Performance Tests', () => {
    it('should load page within acceptable time', () => {
      cy.visit('http://localhost:5174', {
        onBeforeLoad: (win) => {
          win.performance.mark('start');
        }
      });

      cy.get('[data-testid="menu-item"]').should('be.visible').then(() => {
        cy.window().then((win) => {
          win.performance.mark('end');
          win.performance.measure('pageLoad', 'start', 'end');
          const measure = win.performance.getEntriesByName('pageLoad')[0];
          expect(measure.duration).to.be.lessThan(3000); // 3 seconds
        });
      });
    });

    it('should handle large number of menu items', () => {
      cy.get('[data-testid="menu-item"]').should('have.length.greaterThan', 10);
      cy.get('[data-testid="menu-item"]').should('be.visible');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/GetAllMenu/**', { statusCode: 500 }).as('apiError');
      
      cy.visit('http://localhost:5174');
      cy.wait('@apiError');
      
      cy.get('[data-testid="error-message"]').should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '**/GetAllMenu/**', { forceNetworkError: true }).as('networkError');
      
      cy.visit('http://localhost:5174');
      cy.wait('@networkError');
      
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="vegetarian-filter"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="non-veg-filter"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="all-items-filter"]').should('have.attr', 'aria-label');
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      cy.get('body').type('{tab}');
      cy.focused().should('be.visible');
    });

    it('should have proper color contrast', () => {
      cy.get('[data-testid="menu-item"]').first().should('be.visible');
      // This would need additional accessibility testing tools
    });
  });
});
