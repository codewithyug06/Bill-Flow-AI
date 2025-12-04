import { GoogleGenAI } from "@google/genai";

// Safely access environment variable to prevent browser crash
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

export const GeminiService = {
  generateProductDescription: async (name: string, category: string) => {
    if (!apiKey) return "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short, engaging product description for ${name} (${category}).`,
      });
      return response.text || "";
    } catch (e) {
      console.error("Gemini Error:", e);
      return "";
    }
  },

  analyzeBusinessData: async (data: any) => {
    // Placeholder for future implementation
    return "Analysis pending implementation.";
  },

  suggestExpenseCategory: async (description: string) => {
    if (!apiKey) return "Other";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest a one-word category for this expense: "${description}". Examples: Rent, Utilities, Salary, Travel, Food, Office, Inventory. Only return the category word.`,
      });
      return response.text?.trim() || "Other";
    } catch (e) {
       console.error("Gemini Error:", e);
       return "Other";
    }
  },

  analyzeReport: async (data: any) => {
    // Placeholder for future implementation
    return "";
  },

  askAssistant: async (
    history: { role: string; text: string }[],
    currentInput: string,
    contextData: string
  ) => {
    if (!apiKey) return "Gemini API key is missing. Please configure it in your environment.";
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Transform history for Gemini
        // Gemini expects role 'user' or 'model'. We map 'ai' -> 'model'.
        // We exclude the last message because it represents the current input which is sent separately.
        const chatHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are a smart business assistant for Bill Flux. 
                Use the following business data context to answer user queries:
                ${contextData}
                
                Keep answers concise, helpful and strictly related to business operations.`,
            },
            history: chatHistory
        });

        const result = await chat.sendMessage({ message: currentInput });
        return result.text || "No response generated.";
    } catch (error) {
        console.error("Gemini Assistant Error:", error);
        return "I encountered an error while processing your request.";
    }
  }
};