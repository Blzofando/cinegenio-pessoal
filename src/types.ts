// src/types.ts

// Usamos um objeto 'as const' em vez de um enum para compatibilidade máxima.
// Ele funciona exatamente da mesma forma que o enum no resto do seu código.
export const View = {
  MENU: 'MENU',
  SUGGESTION: 'SUGGESTION',
  STATS: 'STATS',
  COLLECTION: 'COLLECTION',
  RANDOM: 'RANDOM',
  PREDICT: 'PREDICT',
} as const;

// Criamos um tipo a partir das chaves do objeto acima.
export type View = typeof View[keyof typeof View];


// Estes são 'types' (tipos), que são removidos após a compilação.
// Eles descrevem a "forma" dos seus dados.
export type Rating = 'amei' | 'gostei' | 'meh' | 'naoGostei';
export type MediaType = 'Filme' | 'Série' | 'Anime' | 'Programa';

// Interfaces também são removidas após a compilação.
// Elas são como um contrato para a estrutura de um objeto.
export interface ManagedWatchedItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
  synopsis?: string;
  posterUrl?: string;
  rating: Rating;
  createdAt: number;
}

export interface AllManagedWatchedData {
  amei: ManagedWatchedItem[];
  gostei: ManagedWatchedItem[];
  meh: ManagedWatchedItem[];
  naoGostei: ManagedWatchedItem[];
}

export interface Recommendation {
  title: string;
  type: MediaType;
  genre: string;
  synopsis: string;
  probabilities: {
    amei: number;
    gostei: number;
    meh: number;
    naoGostei: number;
  };
  analysis: string;
  posterUrl?: string;
}

export interface PredictionResult {
  prediction: string;
  reason: string;
}
// Adicione esta interface no final do seu arquivo src/types.ts
export interface WatchedItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
}