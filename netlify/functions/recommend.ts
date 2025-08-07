import { GoogleGenAI } from "@google/genai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'A chave da API do Gemini não foi configurada no servidor.' })
    };
  }

  try {
    if (!event.body) {
        throw new Error("Corpo da requisição está vazio.");
    }
    const { prompt, schema, tools } = JSON.parse(event.body);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
            responseMimeType: schema ? "application/json" : undefined,
            responseSchema: schema,
            tools: tools,
        }
    });

    if (!result || !result.text) {
        throw new Error("A resposta da IA está vazia ou em um formato inválido.");
    }

    let responseText = result.text.trim();
    if (responseText.startsWith("```json")) {
        responseText = responseText.substring(7, responseText.length - 3).trim();
    } else if (responseText.startsWith("```")) {
        responseText = responseText.substring(3, responseText.length - 3).trim();
    }
    
    // --- CORREÇÃO DE ROBUSTEZ ---
    // Adicionamos um try-catch aqui para garantir que o parse não quebre a função
    try {
        JSON.parse(responseText); // Apenas testamos se o parse funciona
    } catch (e) {
        console.error("Erro de parse do JSON da IA:", responseText);
        throw new Error("A resposta da IA não era um JSON válido.");
    }
    // -------------------------

    return {
      statusCode: 200,
      headers,
      body: responseText 
    };
  } catch (error) {
    console.error('Erro ao chamar a API do Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Falha ao buscar dados da IA', details: errorMessage })
    };
  }
};

export { handler };
