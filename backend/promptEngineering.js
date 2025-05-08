const express = require('express');
const router = express.Router();
const { OpenAIApi } = require('openai');
const openai = new OpenAIApi(require('openai').configuration);

// Analyze theme from prompt or content
router.post('/analyze-theme', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    const systemMessage = `You are an assistant that extracts the main theme or topic of a book based on the user's prompt or description. Provide a concise theme summary.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const theme = completion.data.choices[0].message.content.trim();
    res.json({ theme });
  } catch (error) {
    console.error('Error analyzing theme:', error);
    res.status(500).json({ error: 'Failed to analyze theme' });
  }
});

// Suggest chapter titles based on theme
router.post('/suggest-chapters', async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme || typeof theme !== 'string' || theme.trim() === '') {
      return res.status(400).json({ error: 'Valid theme is required' });
    }

    const systemMessage = `You are an assistant that suggests a list of coherent and relevant chapter titles for a book based on its theme. Provide the chapter titles as a JSON array of strings.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: theme },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    let chapters;
    try {
      chapters = JSON.parse(completion.data.choices[0].message.content);
    } catch {
      chapters = completion.data.choices[0].message.content.split('\n').filter(line => line.trim() !== '');
    }

    res.json({ chapters });
  } catch (error) {
    console.error('Error suggesting chapters:', error);
    res.status(500).json({ error: 'Failed to suggest chapters' });
  }
});

// Generate SEO-friendly metadata
router.post('/generate-seo', async (req, res) => {
  try {
    const { title, description, theme } = req.body;
    if (!title || !description || !theme) {
      return res.status(400).json({ error: 'Title, description, and theme are required' });
    }

    const systemMessage = `You are an assistant that generates SEO-friendly metadata for a book including keywords, meta description, and tags based on the title, description, and theme. Provide the result as a JSON object with keys: keywords (array), metaDescription (string), tags (array).`;

    const userContent = `Title: ${title}\nDescription: ${description}\nTheme: ${theme}`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userContent },
      ],
      max_tokens: 300,
      temperature: 0.6,
    });

    let seoData;
    try {
      seoData = JSON.parse(completion.data.choices[0].message.content);
    } catch {
      seoData = { error: 'Failed to parse SEO metadata' };
    }

    res.json(seoData);
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    res.status(500).json({ error: 'Failed to generate SEO metadata' });
  }
});

// Receive user feedback to refine results
router.post('/feedback', async (req, res) => {
  try {
    const { feedbackType, comments, relatedContentId } = req.body;
    // Store feedback in DB or log for future improvements
    console.log('User feedback received:', { feedbackType, comments, relatedContentId });
    res.json({ status: 'Feedback received' });
  } catch (error) {
    console.error('Error receiving feedback:', error);
    res.status(500).json({ error: 'Failed to receive feedback' });
  }
});

module.exports = router;
