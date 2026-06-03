import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel() {
  if (!genAI) {
    console.warn('Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY in .env file.');
    return null;
  }
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}
