import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

const EbookGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [valid, setValid] = useState(false);

  const validatePrompt = (input) => {
    return input.trim().length >= 10;
  };

  const handlePromptChange = (e) => {
    const value = e.target.value;
    setPrompt(value);
    setValid(validatePrompt(value));
    setError('');
  };

  const generateContent = async () => {
    if (!validatePrompt(prompt)) {
      setError('Le prompt doit contenir au moins 10 caractères.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3000/api/generate-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (response.ok) {
        setContent(data.content);
      } else {
        setError(data.error || 'Erreur lors de la génération du contenu.');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'ebook.txt');
  };

  const downloadAsPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;

    const wrappedText = content.match(/.{1,90}/g).join('\n');
    page.drawText(wrappedText, {
      x: 50,
      y: height - 50,
      size: fontSize,
      maxWidth: width - 100,
      lineHeight: 14,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, 'ebook.pdf');
  };

  return (
    <div className="generator-container">
      <h2>Générateur de eBook AI</h2>
      <textarea
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Entrez votre prompt ici..."
        className="prompt-input"
        rows="4"
      />
      {error && <p className="error-message">{error}</p>}
      <button onClick={generateContent} disabled={!valid || loading} className="generate-button">
        {loading ? 'Génération en cours...' : 'Générer'}
      </button>

      {content && (
        <>
          <h3>Contenu généré :</h3>
          <div className="generated-output">{content}</div>
          <div className="download-buttons">
            <button onClick={downloadAsTxt}>Télécharger TXT</button>
            <button onClick={downloadAsPdf}>Télécharger PDF</button>
          </div>
        </>
      )}
    </div>
  );
};

export default EbookGenerator;
