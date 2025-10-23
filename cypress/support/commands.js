// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to wait for API calls to complete
Cypress.Commands.add('waitForApiCalls', () => {
  cy.intercept('GET', '**/GetAllMenu/**').as('getMenuItems');
  cy.intercept('GET', '**/categories/**').as('getCategories');
  
  cy.wait(['@getMenuItems', '@getCategories'], { timeout: 10000 });
});

// Custom command to clear all filters
Cypress.Commands.add('clearAllFilters', () => {
  cy.get('input[name="dietFilter"][value="all"]').click();
  cy.get('input[name="category"][value="all"]').click();
});

// Custom command to search for items
Cypress.Commands.add('searchForItems', (query) => {
  cy.get('input[placeholder*="Search for dishes"]').clear().type(query);
  cy.wait(500); // Wait for search to complete
});

// Custom command to select category
Cypress.Commands.add('selectCategory', (categoryName) => {
  cy.contains(categoryName).click();
  cy.wait(500); // Wait for category filter to apply
});

// Custom command to select dietary filter
Cypress.Commands.add('selectDietaryFilter', (filterType) => {
  const filterMap = {
    'all': '🍽️ All Items',
    'vegetarian': '🌱 Vegetarian',
    'non-vegetarian': '🍖 Non-Vegetarian'
  };
  
  cy.contains(filterMap[filterType]).click();
  cy.wait(500); // Wait for filter to apply
});
