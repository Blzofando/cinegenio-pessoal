import type { AllManagedWatchedData, ManagedWatchedItem, Recommendation, PredictionResult, MediaType } from '../types';
import type { TMDbSearchResult } from './TMDbService';
import { searchTMDb, getTMDbDetails, fetchPosterUrl } from './TMDbService';

// Helper para chamar nossa API segura
async function callSecureApi(payload: { prompt: string; schema?: any; tools?: any; }) {
    // CORREÇÃO: Usamos um caminho relativo para produção (Netlify)
    // e a URL completa apenas para desenvolvimento local.
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/recommend' 
      : `${import.meta.env.VITE_API_URL || ''}/api/recommend`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Falha ao chamar a API segura');
    }
    return response.json();
}

// O tipo SuggestionFilters é definido e exportado aqui.
export type SuggestionFilters = {
    category: MediaType | null;
    genres: string[];
    keywords: string;
};

// Helper para formatar os dados para os prompts (continua o mesmo)
const formatWatchedDataForPrompt = (data: AllManagedWatchedData, sessionExclude: string[] = []): string => {
    const permanentTitles = Object.values(data).flat().map(item => item.title);
    const allToExclude = [...new Set([...permanentTitles, ...sessionExclude])];
    const formatList = (list: ManagedWatchedItem[]) => list.map(item => `- ${item.title} (Tipo: ${item.type}, Gênero: ${item.genre})`).join('\n') || 'Nenhum';
    return `
**Itens já na coleção do usuário ou sugeridos nesta sessão (NUNCA SUGERIR ESTES):**
${allToExclude.length > 0 ? allToExclude.join(', ') : 'Nenhum'}
**Amei (obras que considero perfeitas, alvo principal para inspiração):**
${formatList(data.amei)}
**Gostei (obras muito boas, boas pistas do que faltou para ser 'amei'):**
${formatList(data.gostei)}
**Indiferente (obras que achei medianas, armadilhas a evitar):**
${formatList(data.meh)}
**Não Gostei (obras que não me agradaram, elementos a excluir completamente):**
${formatList(data.naoGostei)}
    `.trim();
};

// O schema que a IA deve seguir (continua o mesmo)
const recommendationSchema = {
    type: "OBJECT",
    properties: {
        title: { type: "STRING" },
        type: { type: "STRING", enum: ['Filme', 'Série', 'Anime', 'Programa'] },
        genre: { type: "STRING" },
        synopsis: { type: "STRING" },
        probabilities: {
            type: "OBJECT",
            properties: {
                amei: { type: "INTEGER" },
                gostei: { type: "INTEGER" },
                meh: { type: "INTEGER" },
                naoGostei: { type: "INTEGER" }
            },
            required: ["amei", "gostei", "meh", "naoGostei"]
        },
        analysis: { type: "STRING" }
    },
    required: ["title", "type", "genre", "synopsis", "probabilities", "analysis"]
};

// Função atualizada para usar a API segura
const callGeminiWithSchema = async (prompt: string): Promise<Omit<Recommendation, 'posterUrl'>> => {
    const payload = { prompt, schema: recommendationSchema };
    return callSecureApi(payload);
};

export const getRandomSuggestion = async (watchedData: AllManagedWatchedData, sessionExclude: string[] = []): Promise<Recommendation> => {
    const formattedData = formatWatchedDataForPrompt(watchedData, sessionExclude);
    const prompt = `Você é o "CineGênio Pessoal", um especialista em cinema e séries com uma capacidade analítica profunda. Sua tarefa é analisar o "DNA de gosto" do usuário para fornecer UMA recomendação de filme ou série.

**REGRAS DE ANÁLISE PROFUNDA:**
1.  **Exclusão Absoluta:** Obedeça estritamente à lista de exclusão. NUNCA sugira um título dessa lista.
2.  **Análise Ponderada das Listas:**
    * **Amei:** Esta é sua fonte principal de inspiração. Identifique os padrões-chave aqui (gêneros, temas, diretores, tom, complexidade da narrativa). Sua sugestão deve espelhar essas qualidades.
    * **Gostei:** Estas são pistas valiosas. Analise o que pode ter faltado para que não estivessem na lista "Amei".
    * **Meh:** Estas são armadilhas a evitar. Que elementos essas obras têm em comum?
    * **Não Gostei:** Elementos a excluir completamente.
3.  **Descoberta:** A recomendação deve ser uma "jóia escondida" ou algo que o usuário provavelmente não conhece, mas que se alinha perfeitamente ao seu perfil.

**PERFIL DO USUÁRIO (DNA de Gosto):**
${formattedData}

**Sua Tarefa:**
Com base nesta análise profunda, gere UMA recomendação. Sua resposta DEVE ser um único objeto JSON com a estrutura exata definida no schema.`;
    const recommendation = await callGeminiWithSchema(prompt);
    const posterUrl = await fetchPosterUrl(recommendation.title);
    return { ...recommendation, posterUrl: posterUrl ?? undefined };
};

export const getPersonalizedSuggestion = async (watchedData: AllManagedWatchedData, filters: SuggestionFilters, sessionExclude: string[] = []): Promise<Recommendation> => {
    const formattedData = formatWatchedDataForPrompt(watchedData, sessionExclude);
    const genresText = filters.genres.length > 0 ? filters.genres.join(', ') : 'Qualquer';
    const prompt = `Você é o "CineGênio Pessoal", um especialista em cinema e séries. Sua tarefa é encontrar a recomendação PERFEITA que se encaixe tanto nos filtros do usuário quanto no seu "DNA de gosto".

**REGRAS DE ANÁLISE PROFUNDA:**
1.  **Filtros são Reis:** Sua sugestão DEVE corresponder a todos os filtros fornecidos (Categoria, Gêneros, Palavras-chave).
2.  **Exclusão Absoluta:** Dentro dos resultados filtrados, obedeça estritamente à lista de exclusão.
3.  **Análise Ponderada (Dentro dos Filtros):** Use as listas "Amei", "Gostei", "Meh" e "Não Gostei" para refinar a escolha entre os resultados que correspondem aos filtros.

**FILTROS DO USUÁRIO:**
- Categoria: ${filters.category || 'Qualquer'}
- Gêneros: ${genresText}
- Palavras-chave: ${filters.keywords || 'Nenhuma'}

**PERFIL DO USUÁRIO (DNA de Gosto):**
${formattedData}

**Sua Tarefa:**
Com base nesta análise profunda, gere UMA recomendação. Sua resposta DEVE ser um único objeto JSON com a estrutura exata definida no schema.`;
    const recommendation = await callGeminiWithSchema(prompt);
    const posterUrl = await fetchPosterUrl(recommendation.title);
    return { ...recommendation, posterUrl: posterUrl ?? undefined };
};

export const getPrediction = async (title: string, watchedData: AllManagedWatchedData): Promise<PredictionResult> => {
    const formattedData = formatWatchedDataForPrompt(watchedData);
    const prompt = `Você é o "CineGênio Pessoal". Preveja se o usuário gostará do título: "${title}". Compare com o histórico do usuário: ${formattedData}. Gere uma resposta JSON com "prediction" (veredito: "Altíssima probabilidade de você AMAR!", "Boas chances de você GOSTAR.", "Você pode gostar, MAS COM RESSALVAS.", ou "Provavelmente NÃO É PARA VOCÊ.") e "reason" (justificativa detalhada). Sua resposta DEVE ser APENAS o objeto JSON.`;
    const payload = { prompt };
    return callSecureApi(payload);
};

const findBestTMDbMatch = async (userQuery: string, searchResults: TMDbSearchResult[]): Promise<number | null> => {
    if (searchResults.length === 0) return null;
    if (searchResults.length === 1) return searchResults[0].id;

    const prompt = `Você é um especialista em identificar a mídia correta a partir de uma lista de resultados de busca do TMDb. Analise a lista 'search_results' e, usando a 'user_query' como a principal dica de contexto, determine qual resultado é o mais provável de ser o que o usuário deseja. Sua resposta final deve ser APENAS o número do ID do item escolhido, nada mais.

user_query: "${userQuery}"

search_results:
${JSON.stringify(searchResults.map(r => ({ id: r.id, title: r.title || r.name, overview: r.overview, popularity: r.popularity, media_type: r.media_type })), null, 2)}

Com base na sua análise, qual é o ID correto? Responda APENAS com o número do ID.`;
    
    const response = await callSecureApi({ prompt, tools: [{googleSearch: {}}] });
    const parsedId = parseInt(response as any, 10);

    if (!isNaN(parsedId) && searchResults.some(r => r.id === parsedId)) {
        return parsedId;
    }

    console.warn(`A IA retornou um ID inválido. Usando o resultado mais popular como fallback.`);
    const mostPopular = [...searchResults].sort((a, b) => b.popularity - a.popularity)[0];
    return mostPopular.id;
};

export const getFullMediaDetailsFromQuery = async (query: string): Promise<Omit<ManagedWatchedItem, 'rating' | 'createdAt'>> => {
    let searchResults: TMDbSearchResult[] = [];
    searchResults = await searchTMDb(query, 'pt-BR');
    if (searchResults.length === 0) {
       searchResults = await searchTMDb(query, 'en-US');
    }
    if (searchResults.length === 0) {
        const simplifiedQuery = query.replace(/\s*\([^)]*\)\s*/g, '').trim();
        if (simplifiedQuery && simplifiedQuery !== query) {
            searchResults = await searchTMDb(simplifiedQuery, 'pt-BR');
             if (searchResults.length === 0) {
               searchResults = await searchTMDb(simplifiedQuery, 'en-US');
             }
        }
    }
    if (!searchResults || searchResults.length === 0) {
        throw new Error(`Nenhum resultado encontrado para "${query}", mesmo após buscas alternativas.`);
    }
    const bestMatchId = await findBestTMDbMatch(query, searchResults);
    if (!bestMatchId) {
        throw new Error("A IA não conseguiu identificar um resultado correspondente.");
    }
    const bestMatch = searchResults.find(r => r.id === bestMatchId);
    if (!bestMatch) {
        throw new Error("Ocorreu um erro interno ao selecionar o resultado após a análise da IA.");
    }
    const details = await getTMDbDetails(bestMatch.id, bestMatch.media_type);
    let mediaType: MediaType = 'Filme';
    let titleWithYear = '';
    if (bestMatch.media_type === 'tv') {
        const hasAnimeKeyword = query.toLowerCase().includes('anime');
        const isJapaneseAnimation = details.original_language === 'ja' && details.genres.some((g: any) => g.id === 16);
        mediaType = (hasAnimeKeyword || isJapaneseAnimation) ? 'Anime' : 'Série';
        titleWithYear = `${details.name} (${details.first_air_date ? new Date(details.first_air_date).getFullYear() : 'N/A'})`;
    } else {
        mediaType = 'Filme';
        titleWithYear = `${details.title} (${details.release_date ? new Date(details.release_date).getFullYear() : 'N/A'})`;
    }
    if (details.genres.some((g: any) => g.id === 10767 || g.id === 10763)) {
        mediaType = 'Programa';
    }
    return {
        id: bestMatch.id,
        tmdbMediaType: bestMatch.media_type,
        title: titleWithYear,
        type: mediaType,
        genre: details.genres[0]?.name || 'Desconhecido',
        synopsis: details.overview || 'Sinopse não disponível.',
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
    };
};
