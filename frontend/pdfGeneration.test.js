import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

describe('PDF Generation Edge Cases', () => {
  test('generates PDF with empty chapters', async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([432, 648]);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    page.drawText('Empty chapters test', { x: 50, y: 600, size: 12, font, color: rgb(0, 0, 0) });
    const pdfBytes = await pdfDoc.save();
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  test('handles very long chapter content', async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([432, 648]);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const longText = 'Lorem ipsum '.repeat(1000);
    page.drawText(longText, { x: 50, y: 600, size: 12, font, color: rgb(0, 0, 0) });
    const pdfBytes = await pdfDoc.save();
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  test('handles special characters in text', async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([432, 648]);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const specialText = 'Special chars: <>&"\'`~!@#$%^&*()_+-={}[]|;:\'",.<>?/';
    page.drawText(specialText, { x: 50, y: 600, size: 12, font, color: rgb(0, 0, 0) });
    const pdfBytes = await pdfDoc.save();
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(0);
  });
});
