import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_REASONING = 'gemini-3-pro-preview';

export const GeminiService = {
  /**
   * Generates a product description based on name and category.
   * Uses Flash model for speed.
   */
  generateProductDescription: async (name: string, category: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Write a short, professional, and attractive product description (max 2 sentences) for an inventory item.
        Product Name: ${name}
        Category: ${category}
        Target Audience: Retail customers.`,
      });
      return response.text || "No description generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Description generation failed. Please try again.";
    }
  },

  /**
   * Analyzes sales data to provide business insights.
   * Uses Pro model for complex reasoning.
   */
  analyzeBusinessData: async (summaryContext: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_REASONING,
        contents: `You are a smart business analyst for a small business. Analyze the following data context and provide 3 brief, actionable bullet points for the business owner.
        
        Data Context:
        ${summaryContext}
        
        Format output as plain text with bullet points.`,
      });
      return response.text || "Could not analyze data.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Analysis unavailable.";
    }
  },

  /**
   * Auto-categorizes expenses based on description.
   * Uses Flash model.
   */
  suggestExpenseCategory: async (description: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Categorize this business expense into one of these exact categories: 'Rent', 'Utilities', 'Travel', 'Inventory', 'Marketing', 'Salaries', 'Maintenance', 'Office Supplies', 'Other'. Return ONLY the category name.
        Expense Description: ${description}`,
      });
      return response.text?.trim() || "Other";
    } catch (error) {
      return "Other";
    }
  },

  /**
   * Analyzes a financial report.
   * Uses Pro model for detailed analysis.
   */
  analyzeReport: async (reportData: string, reportType: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_REASONING,
        contents: `Analyze this ${reportType} report for a small business owner. Highlight key trends, anomalies, or areas for improvement in a friendly, professional tone. Keep it under 100 words.
        
        Report Data:
        ${reportData}`,
      });
      return response.text || "Analysis pending...";
    } catch (error) {
      return "Could not generate report analysis.";
    }
  },

  /**
   * Chat with data helper.
   * Uses Flash model for responsive chat.
   */
  askAssistant: async (history: {role: string, text: string}[], question: string, contextData: string): Promise<string> => {
    try {
      // Construct the conversation history including the system context
      const contents = [
        { 
          role: 'user', 
          parts: [{ text: `System Context: You are a helpful billing assistant. Use this business data to answer the user's questions accurately: ${contextData}` }] 
        },
        ...history.map(h => ({ 
          role: h.role === 'ai' ? 'model' : 'user', 
          parts: [{ text: h.text }] 
        })),
        { role: 'user', parts: [{ text: question }] }
      ];

      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: contents as any,
      });
      return response.text || "I'm not sure how to answer that.";
    } catch (error) {
        console.error("Gemini Chat Error", error);
        return "Sorry, I encountered an error processing your request.";
    }
  }
};
