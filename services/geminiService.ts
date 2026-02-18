
import { GoogleGenAI } from "@google/genai";

// Use Gemini 3 series models as per guidelines for better performance and compliance
export const GeminiService = {
  generateProductDescription: async (name: string, category: string) => {
    try {
      // Initialize right before call to ensure latest config and direct use of API_KEY from env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Basic Text Task
        contents: `Write a short, engaging product description for ${name} (${category}).`,
      });
      // Correctly access .text property
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
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Basic Text Task
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
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Transform history for Gemini: 'ai' -> 'model'
        const chatHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const chat = ai.chats.create({
            model: 'gemini-3-pro-preview', // Use Pro for complex reasoning and assistant tasks
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
