import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (_ai) return _ai;

  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!baseUrl && !apiKey) {
    throw new Error(
      "Gemini AI is not configured. Set AI_INTEGRATIONS_GEMINI_BASE_URL + AI_INTEGRATIONS_GEMINI_API_KEY (Replit) or GEMINI_API_KEY (direct).",
    );
  }

  _ai = new GoogleGenAI({
    apiKey: apiKey!,
    ...(baseUrl ? { httpOptions: { apiVersion: "", baseUrl } } : {}),
  });

  return _ai;
}

export const ai = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    return (getAiClient() as any)[prop];
  },
});
