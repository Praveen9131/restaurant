describe('Simple Menu E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/menu');
    cy.wait(2000); // Wait for initial load
  });

  it('should load the menu page successfully', () => {
    cy.contains('Menu Categories').should('be.visible');
    cy.contains('Search for dishes, cuisines, or categories...').should('be.visible');
  });

  it('should display filter options', () => {
    cy.contains('🍽️ All Items').should('be.visible');
    cy.contains('🌱 Vegetarian').should('be.visible');
    cy.contains('🍖 Non-Vegetarian').should('be.visible');
  });

  it('should handle search input', () => {
    cy.get('input[placeholder*="Search for dishes"]').type('burger');
    cy.get('input[placeholder*="Search for dishes"]').should('have.value', 'burger');
  });

  it('should handle filter selection', () => {
    cy.contains('🌱 Vegetarian').click();
    cy.get('input[name="dietFilter"]').should('be.checked');
  });

  it('should display categories in sidebar', () => {
    cy.get('h2').contains('Menu Categories').should('be.visible');
  });

  it('should be responsive on mobile', () => {
    cy.viewport(375, 667); // iPhone SE
    cy.contains('Search for dishes, cuisines, or categories...').should('be.visible');
  });

  it('should be responsive on tablet', () => {
    cy.viewport(768, 1024); // iPad
    cy.contains('Search for dishes, cuisines, or categories...').should('be.visible');
  });

  it('should be responsive on desktop', () => {
    cy.viewport(1280, 720); // Desktop
    cy.contains('Search for dishes, cuisines, or categories...').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Intercept API calls and return error
    cy.intercept('GET', '**/GetAllMenu/**', { statusCode: 500, body: { error: 'Server Error' } }).as('getMenuError');
    cy.intercept('GET', '**/categories/**', { statusCode: 500, body: { error: 'Server Error' } }).as('getCategoriesError');
    
    cy.visit('/menu');
    cy.wait('@getMenuError');
    cy.wait('@getCategoriesError');
    
    // Should show error message
    cy.contains('Failed to load menu items').should('be.visible');
  });

  it('should display no items message when no data', () => {
    // Intercept API calls and return empty data
    cy.intercept('GET', '**/GetAllMenu/**', { statusCode: 200, body: { menu_items: [] } }).as('getEmptyMenu');
    cy.intercept('GET', '**/categories/**', { statusCode: 200, body: { categories: [] } }).as('getEmptyCategories');
    
    cy.visit('/menu');
    cy.wait('@getEmptyMenu');
    cy.wait('@getEmptyCategories');
    
    // Should show no items message
    cy.contains('No items found').should('be.visible');
  });
});
