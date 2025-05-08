const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // adjust as needed
}));
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Import prompt engineering routes
const promptEngineeringRoutes = require('./promptEngineering');
app.use('/api/prompt-engineering', promptEngineeringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const systemMessage = `You are an assistant that generates a complete ebook structure in JSON format based on the user's prompt. 
    The JSON should include the following fields:
    {
      "title": string,
      "author": string,
      "description": string,
      "chapters": [
        {
          "title": string,
          "content": string
        }
      ],
      "settings": {
        "format": string, // e.g. "6x9", "5x8", "7x10"
        "font": string, // e.g. "times", "arial", "georgia"
        "fontSize": number, // e.g. 11, 12, 14
        "ebookType": string, // e.g. "standard", "coloring", "planner", "journal", "other"
        "margin": number, // page margin in points
        "lineHeight": number, // line height in points
        "textAlign": string, // e.g. "left", "center", "right", "justify"
        "pageCount": number // number of pages requested
      }
    }
    Ensure the JSON is valid and parsable.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const generatedText = completion.data.choices[0].message.content;

    // Try to parse JSON from the response
    let ebookData;
    try {
      ebookData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(500).json({ error: 'Failed to parse generated ebook data' });
    }

    res.json(ebookData);
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

// Endpoint to generate image from prompt (optional, using DALL·E)
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: '512x512',
    });

    const imageUrl = response.data.data[0].url;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
