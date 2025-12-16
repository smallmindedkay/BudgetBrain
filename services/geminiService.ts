import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, ReceiptData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a receipt image to extract transaction details.
 */
export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Extract the merchant name, total amount, date, and suggest a category (Food, Transport, Shopping, Utilities, Entertainment, Health, Other) from this receipt.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            category: { type: Type.STRING },
          },
          required: ["merchant", "amount", "date", "category"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");
    return JSON.parse(jsonText) as ReceiptData;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

/**
 * Provides financial advice based on transaction history and user query.
 */
export const getFinancialAdvice = async (
  query: string,
  transactions: Transaction[]
): Promise<string> => {
  // Summarize context to avoid token limits if list is huge
  const recentTransactions = transactions.slice(0, 50); 
  const context = JSON.stringify(recentTransactions.map(t => ({
    date: t.date,
    amount: t.amount,
    category: t.category,
    desc: t.description
  })));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a helpful, encouraging, and concise financial advisor.
        Here is the user's recent transaction history JSON:
        ${context}
        
        User Query: ${query}
        
        Answer the user's question based on their data. Be specific. If they ask about savings, look at their spending.
        Keep the response brief (under 100 words) and friendly.
      `,
    });

    return response.text || "I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Sorry, I'm having trouble connecting to the financial brain right now.";
  }
};