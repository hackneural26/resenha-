import { GoogleGenAI } from "@google/genai";
import { InputContext, AIProcessResult } from '../types';
import { INITIAL_ITEMS } from '../constants';

const getClient = () => {
  const apiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env)
    ? (import.meta as any).env.VITE_GEMINI_API_KEY
    : (process.env && (process.env as any).VITE_GEMINI_API_KEY);
  
  if (!apiKey) {
    console.error("❌ ERRO CRÍTICO: VITE_GEMINI_API_KEY não configurada no arquivo .env.local");
    console.error("Para corrigir: Adicione uma variável VITE_GEMINI_API_KEY com sua chave do Google AI Studio no arquivo .env.local");
    return null;
  }
  
  return new GoogleGenAI({ apiKey });
};

export const parseVoiceInput = async (
  text: string, 
  context: InputContext
): Promise<AIProcessResult | null> => {
  const ai = getClient();
  
  // Se não tem IA configurada, retorna null para que a UI possa avisar o usuário
  if (!ai) return null;

  const itemNames = INITIAL_ITEMS.map(i => `${i.name} (id: ${i.id})`).join(', ');

  let prompt = `
    You are an assistant for a skewer restaurant kitchen. 
    Available items: [${itemNames}].
    
    The user is in the "${context}" section. Analyze the text: "${text}".
    
    Rules:
    1. Identify the item ID based on the text (e.g., "bife" -> "contra_file", "bayco" -> "frango_bacon" or "carne_bacon").
    2. Identify the quantity.
    3. If context is 'ENTRY' (Estoque), check if user mentions "pacote", "fardo", "caixa". If so, multiply quantity by 10.
    4. If context is 'PRODUCTION', determine if it is 'GRILLED' (assado/saiu/grelha) or 'LEFTOVER' (sobrou/voltou/frio). Default to 'GRILLED' if ambiguous.
    
    Return ONLY valid JSON:
    {
      "itemId": "string_id_or_null",
      "quantity": number,
      "subType": "GRILLED" | "LEFTOVER" (only if context is PRODUCTION, otherwise null)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const resultText = response.text;
    if (!resultText) return null;

    const parsed = JSON.parse(resultText);
    return {
      itemId: parsed.itemId,
      quantity: parsed.quantity || 0,
      actionType: 'ADD', // Default behavior for voice is adding to the tally
      subType: parsed.subType
    };

  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};