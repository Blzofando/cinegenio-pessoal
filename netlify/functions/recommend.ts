import { GoogleGenAI } from "@google/genai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// O formato do handler muda para o padrão da Netlify
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Configurações de CORS para permitir chamadas do seu site
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Responde a requisições OPTIONS (necessário para CORS)
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
    // O corpo da requisição vem como uma string no Netlify
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

    // A Netlify espera um objeto de retorno com statusCode e body
    return {
      statusCode: 200,
      headers,
      body: result.text.trim() // O JSON já é uma string, então não precisa de JSON.stringify
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
