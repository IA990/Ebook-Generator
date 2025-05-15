document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ebook-form');
  const promptInput = document.getElementById('prompt-input');
  const generateButton = document.getElementById('generate-button');
  const loadingIndicator = document.getElementById('loading-indicator');
  const outputArea = document.getElementById('output-area');
  const downloadButton = document.getElementById('download-button');
  const errorMessage = document.getElementById('error-message');

  function setLoading(isLoading) {
    if (isLoading) {
      loadingIndicator.style.display = 'block';
      generateButton.disabled = true;
      errorMessage.textContent = '';
      outputArea.textContent = '';
      downloadButton.style.display = 'none';
    } else {
      loadingIndicator.style.display = 'none';
      generateButton.disabled = false;
    }
  }

  function downloadContent(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) {
      errorMessage.textContent = 'Please enter a prompt.';
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/generate-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }
      const data = await response.json();
      outputArea.textContent = data.content;
      downloadButton.style.display = 'inline-block';
      downloadButton.onclick = () => {
        downloadContent('generated_ebook.txt', data.content);
      };
    } catch (error) {
      errorMessage.textContent = error.message;
    } finally {
      setLoading(false);
    }
  });
});
