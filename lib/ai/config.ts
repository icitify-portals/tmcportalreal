
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

// 1. Google Gemini
export const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// 2. DeepSeek (via OpenAI compatible endpoint)
const deepseekProvider = createOpenAI({
    name: 'deepseek',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Provider Registry
export const aiModels = {
    // Calling the provider as a function returns the correct LanguageModel type
    gemini: google(process.env.GEMINI_MODEL || 'gemini-1.5-flash'),
    deepseek: deepseekProvider(process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
} as const;

export type AIModelKey = keyof typeof aiModels;

export function getModel(key: string) {
    if (key in aiModels) {
        return aiModels[key as AIModelKey];
    }
    // Default to Gemini if key invalid
    return aiModels.gemini;
}
