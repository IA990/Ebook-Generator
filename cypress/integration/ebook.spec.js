describe('Ebook Generator User Flows', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should fill the form and generate PDF', () => {
    cy.get('#title').type('Test Ebook');
    cy.get('#author').type('Author Name');
    cy.get('#description').type('This is a test description.');

    cy.get('#addChapter').click();
    cy.get('#chapters .chapter-entry').eq(0).find('input').type('Chapter 1');
    cy.get('#chapters .chapter-entry').eq(0).find('textarea').type('Content for chapter 1.');

    cy.get('#generatePDF').click();

    // Check for download link or PDF generation success indicator
    cy.window().then(win => {
      cy.stub(win, 'open').as('windowOpen');
    });
  });

  it('should handle undo and redo in state manager', () => {
    // This would be tested in Jest, but can simulate UI undo if implemented
  });

  it('should show preview updates on input change', () => {
    cy.get('#title').type('Preview Test');
    cy.get('#previewIframe').its('0.contentDocument.body').should('contain.text', 'Preview Test');
  });
});
