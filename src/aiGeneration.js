import StateManager from '../frontend/stateManager.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const stateManager = new StateManager();

export async function exportPDF() {
  const state = stateManager.getState();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([432, 648]);
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  let y = 620;
  page.drawText(`Title: ${state.title}`, { x: 50, y, size: 14, font, color: rgb(0, 0, 0) });
  y -= 20;
  page.drawText(`Author: ${state.author}`, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
  y -= 30;
  page.drawText(`Description: ${state.description}`, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
  y -= 30;

  for (const chapter of state.chapters) {
    if (y < 50) {
      page.addPage([432, 648]);
      y = 620;
    }
    page.drawText(`Chapter: ${chapter.title}`, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
    y -= 20;
    const lines = chapter.content.split('\\n');
    for (const line of lines) {
      if (y < 50) {
        page.addPage([432, 648]);
        y = 620;
      }
      page.drawText(line, { x: 60, y, size: 10, font, color: rgb(0, 0, 0) });
      y -= 15;
    }
    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.title || 'ebook'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}


export async function generateAIContent(prompt) {
  try {
    const response = await fetch('/api/generate-ebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error('AI generation failed');
    const data = await response.json();
    return data.content || '';
  } catch (error) {
    console.error('Error generating AI content:', error);
    return null;
  }
}

// UI integration for ebook generation
// Add input event listener to enable/disable generate button based on input validity
promptInput.addEventListener('input', () => {
  const value = promptInput.value.trim();
  if (value.length >= 10) {
    generateButton.disabled = false;
    errorDiv.textContent = '';
  } else {
    generateButton.disabled = true;
    if (value.length === 0) {
      errorDiv.textContent = 'Please enter a prompt.';
    } else {
      errorDiv.textContent = 'Prompt is too short. Please enter at least 10 characters.';
    }
  }
});

// Initialize button state
generateButton.disabled = true;

generateButton.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    errorDiv.textContent = 'Please enter a prompt.';
    return;
  }
  if (prompt.length < 10) {
    errorDiv.textContent = 'Prompt is too short. Please enter at least 10 characters.';
    return;
  }
  errorDiv.textContent = '';
  outputDiv.textContent = '';
  loadingIndicator.style.display = 'block';
  generateButton.disabled = true;
  downloadTextButton.style.display = 'none';
  downloadPdfButton.style.display = 'none';

  const content = await generateAIContent(prompt);
  loadingIndicator.style.display = 'none';
  generateButton.disabled = false;

  if (content === null) {
    errorDiv.textContent = 'Failed to generate content.';
    return;
  }

  outputDiv.textContent = content;
  downloadTextButton.style.display = 'inline-block';
  downloadPdfButton.style.display = 'inline-block';

  downloadTextButton.onclick = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebook.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  downloadPdfButton.onclick = () => {
    // For simplicity, download PDF with plain text content
    const pdfDoc = PDFDocument.create();
    pdfDoc.then(doc => {
      doc.addPage();
      doc.getPages()[0].drawText(content, { x: 10, y: 700, size: 12 });
      doc.save().then(pdfBytes => {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ebook.pdf';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  };
});
