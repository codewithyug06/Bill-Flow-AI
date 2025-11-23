import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini AI Client
// NOTE: In a real app, ensure API_KEY is defined in your environment variables.
// We use a safe check for process to avoid ReferenceError in browser-only environments.
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_REASONING = 'gemini-3-pro-preview';

export const GeminiService = {
  /**
   * Generates a product description based on name and category.
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
   * Auto-categorizes expenses based on description
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
   * Analyzes a financial report
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
   * Chat with data helper
   */
  askAssistant: async (history: {role: string, text: string}[], question: string, contextData: string): Promise<string> => {
    try {
      const contents = [
        { role: 'user', parts: [{ text: `System Context: You are a helpful billing assistant. Use this data to answer: ${contextData}` }] },
        ...history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: question }] }
      ];

      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: contents as any, // Type casting for simplicity in this demo structure
      });
      return response.text || "I'm not sure how to answer that.";
    } catch (error) {
        console.error("Gemini Chat Error", error);
        return "Sorry, I encountered an error processing your request.";
    }
  }
};