const fastify = require('fastify')({ logger: true });
const formBody = require('@fastify/formbody');
const fastifyStatic = require('@fastify/static');
const path = require('path');
require('dotenv').config();

fastify.register(formBody);

// CORS pour autoriser GitHub Pages
fastify.register(require('@fastify/cors'), {
  origin: '*', // Tu peux restreindre à l'URL GitHub Pages ici si nécessaire
});

// Route principale pour tester
fastify.get('/', async (request, reply) => {
  return { message: 'Bienvenue sur l’API eBook AI ✨' };
});

// API OpenAI
fastify.post('/api/generate-ebook', async (request, reply) => {
  const { prompt } = request.body;

  if (!prompt || prompt.trim().length < 10) {
    reply.code(400).send({ error: 'Prompt trop court ou vide.' });
    return;
  }

  try {
    const { Configuration, OpenAIApi } = require('openai');
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const aiResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const generated = aiResponse.data.choices[0].message.content.trim();
    reply.send({ content: generated });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: 'Erreur lors de la génération du contenu AI.' });
  }
});

// Lancer le serveur
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    fastify.log.info(`Serveur lancé sur http://localhost:${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
