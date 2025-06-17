import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API Key. Please set OPENAI_API_KEY in your .env file.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
