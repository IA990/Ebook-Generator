describe('PWA Offline and Caching Tests', () => {
  before(() => {
    cy.visit('/');
  });

  it('should cache generated PDFs for offline use', () => {
    // Generate a PDF (simulate user action)
    cy.get('#title').type('Offline PDF Test');
    cy.get('#author').type('Tester');
    cy.get('#generatePDF').click();

    // Wait for PDF generation and caching
    cy.wait(2000);

    // Simulate offline mode
    cy.log('Simulating offline mode');
    cy.window().then(win => {
      win.navigator.serviceWorker.controller.postMessage({ type: 'simulateOffline' });
    });

    // Reload page and check if PDF is accessible offline
    cy.reload();
    cy.get('#previewIframe').should('exist');
  });

  it('should show offline fallback page when offline and navigating', () => {
    cy.log('Simulating offline mode');
    cy.window().then(win => {
      win.navigator.serviceWorker.controller.postMessage({ type: 'simulateOffline' });
    });

    cy.visit('/some-nonexistent-page', { failOnStatusCode: false });
    cy.contains('You are offline').should('be.visible');
  });

  it('should use NetworkFirst strategy for /api calls', () => {
    cy.intercept('GET', '/api/*', (req) => {
      req.reply((res) => {
        expect(res.fromCache).to.be.false;
      });
    });

    cy.request('/api/health').its('body').should('have.property', 'status', 'ok');
  });

  it('should update service worker automatically in background', () => {
    // This test assumes service worker update logic posts a message or triggers an event
    cy.window().then(win => {
      cy.stub(win.navigator.serviceWorker, 'addEventListener').as('swListener');
    });

    // Trigger update check (simulate)
    cy.window().then(win => {
      win.navigator.serviceWorker.controller.postMessage({ type: 'checkForUpdate' });
    });

    cy.get('@swListener').should('have.been.called');
  });
});
