import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('API Mock Tests', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('mock generate-text API success', async () => {
    const mockResponse = {
      title: 'Mock Title',
      author: 'Mock Author',
      description: 'Mock description',
      chapters: [{ title: 'Chapter 1', content: 'Content 1' }],
      settings: { format: '6x9', font: 'times', fontSize: 12, ebookType: 'standard', margin: 50, lineHeight: 18, textAlign: 'left', pageCount: 10 }
    };

    mock.onPost('/api/generate-text').reply(200, mockResponse);

    const response = await axios.post('/api/generate-text', { prompt: 'Test prompt' });
    expect(response.status).toBe(200);
    expect(response.data.title).toBe('Mock Title');
  });

  test('mock generate-text API failure', async () => {
    mock.onPost('/api/generate-text').reply(500);

    try {
      await axios.post('/api/generate-text', { prompt: 'Test prompt' });
    } catch (error) {
      expect(error.response.status).toBe(500);
    }
  });

  test('mock generate-image API success', async () => {
    const mockImageUrl = 'http://example.com/image.png';
    mock.onPost('/api/generate-image').reply(200, { imageUrl: mockImageUrl });

    const response = await axios.post('/api/generate-image', { prompt: 'Image prompt' });
    expect(response.status).toBe(200);
    expect(response.data.imageUrl).toBe(mockImageUrl);
  });
});
