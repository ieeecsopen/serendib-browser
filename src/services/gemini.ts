/**
 * Gemini AI Service
 * 
 * Integration with Google's Gemini API for AI-powered features.
 */

import { GoogleGenAI } from "@google/genai";

// ============================================================================
// Constants
// ============================================================================

const MODEL_NAME = 'gemini-2.5-flash';

// ============================================================================
// Client
// ============================================================================

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate a completion response from the Gemini model.
 * 
 * @param prompt - The user's prompt/question
 * @param context - Optional context (e.g., page content) to inform the response
 * @returns The generated text response
 */
export const generateCompletion = async (prompt: string, context?: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const finalPrompt = context
      ? `Context: ${context}\n\nUser Question: ${prompt}\n\nPlease answer based on the context provided, or use general knowledge if the context is insufficient.`
      : prompt;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: finalPrompt,
    });
    
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I encountered an error communicating with the AI service. Please check your API key.";
  }
};

/**
 * Generate a summary of the provided text.
 * 
 * @param text - The text to summarize
 * @returns A concise summary
 */
export const summarizeText = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Please provide a concise summary of the following text:\n\n${text}`,
    });
    
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Could not generate summary.";
  }
};

/**
 * Rewrite text to be more professional and engaging.
 * 
 * @param text - The text to rewrite
 * @returns The rewritten text
 */
export const rewriteText = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Please rewrite the following text to be more professional, concise, and engaging. Highlight the main points:\n\n${text}`,
    });
    
    return response.text || "Could not rewrite text.";
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    return "Could not rewrite text.";
  }
};

/**
 * Explain key concepts from the provided text.
 * 
 * @param text - The text containing concepts to explain
 * @returns Explanations of key concepts
 */
export const explainConcepts = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Please explain the key concepts and main ideas found in the following text:\n\n${text}`,
    });
    
    return response.text || "Could not explain concepts.";
  } catch (error) {
    console.error("Gemini Explain Error:", error);
    return "Could not explain concepts.";
  }
};
