require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { generateEbookContent } = require('./backend/aiEngine.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/api/generate-ebook', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const content = await generateEbookContent(prompt);
    res.json({ content });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
