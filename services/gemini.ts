import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCompletion = async (prompt: string, context?: string) => {
  try {
    const ai = getClient();
    const finalPrompt = context 
      ? `Context: ${context}\n\nUser Question: ${prompt}\n\nPlease answer based on the context provided, or use general knowledge if the context is insufficient.`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I encountered an error communicating with the AI service. Please check your API key.";
  }
};

export const summarizeText = async (text: string) => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please provide a concise summary of the following text:\n\n${text}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Could not generate summary.";
  }
};
