self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');

const { PDFDocument, StandardFonts, rgb } = self.PDFLib;

let memoizedLayouts = new Map();

function memoizeLayout(key, computeFn) {
  if (memoizedLayouts.has(key)) {
    return memoizedLayouts.get(key);
  }
  const result = computeFn();
  memoizedLayouts.set(key, result);
  return result;
}

function drawWrappedText(page, text, x, y, maxWidth, lineHeight, font, fontSize) {
  const words = text.split(' ');
  let line = '';
  let yPos = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testLineWidth > maxWidth && n > 0) {
      page.drawText(line, { x, y: yPos, size: fontSize, font, color: rgb(0, 0, 0) });
      line = words[n] + ' ';
      yPos -= lineHeight;
      if (yPos < 50) { // margin bottom
        return { yPos, pageFull: true };
      }
    } else {
      line = testLine;
    }
  }
  page.drawText(line, { x, y: yPos, size: fontSize, font, color: rgb(0, 0, 0) });
  return { yPos: yPos - lineHeight, pageFull: false };
}

self.onmessage = async function(e) {
  const { title, author, description, chapters, settings, currentLang } = e.data;

  try {
    const pdfDoc = await PDFDocument.create();

    // Page size based on format
    let pageWidth = 595.276;
    let pageHeight = 841.890;
    if (settings.format === '6x9') {
      pageWidth = 432;
      pageHeight = 648;
    } else if (settings.format === '5x8') {
      pageWidth = 360;
      pageHeight = 576;
    } else if (settings.format === '7x10') {
      pageWidth = 504;
      pageHeight = 720;
    }

    const margin = settings.margin || 50;
    const fontSize = settings.fontSize || 12;
    const lineHeight = fontSize + 6;

    // Embed font
    let font;
    if (settings.font === 'times') {
      font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    } else if (settings.font === 'arial') {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    } else if (settings.font === 'georgia') {
      font = await pdfDoc.embedFont(StandardFonts.Courier);
    } else {
      font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }

    // Add first page
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    const { width, height } = page.getSize();

    // Draw title
    page.drawText(title, {
      x: margin,
      y: height - margin,
      size: fontSize + 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Draw author
    page.drawText(`${currentLang === 'fr' ? 'Par' : 'By'} ${author}`, {
      x: margin,
      y: height - margin - lineHeight,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Draw description with memoized layout
    let yPosition = height - margin - 2 * lineHeight;
    const maxWidth = width - 2 * margin;

    const descKey = `desc-${description}-${fontSize}-${maxWidth}`;
    const descLayout = memoizeLayout(descKey, () => {
      return drawWrappedText(page, description, margin, yPosition, maxWidth, lineHeight, font, fontSize);
    });
    yPosition = descLayout.yPos;

    // Draw chapters with lazy pagination
    for (const chapter of chapters) {
      if (yPosition < margin + lineHeight * 4) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = height - margin;
      }

      // Draw chapter title
      page.drawText(chapter.title, {
        x: margin,
        y: yPosition,
        size: fontSize + 4,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight + 4;

      // Draw chapter content with memoized layout
      const contentKey = `content-${chapter.content}-${fontSize}-${maxWidth}`;
      const contentLayout = memoizeLayout(contentKey, () => {
        return drawWrappedText(page, chapter.content, margin + 10, yPosition, maxWidth - 10, lineHeight, font, fontSize);
      });

      yPosition = contentLayout.yPos;

      if (contentLayout.pageFull) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = height - margin;
      }
    }

    const pdfBytes = await pdfDoc.save();

    self.postMessage({ success: true, pdfBytes }, [pdfBytes.buffer]);
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
