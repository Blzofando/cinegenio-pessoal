import React, { useState, useMemo, useContext } from 'react';
import type { Recommendation, ManagedWatchedItem } from '../types';
// Correção aqui: separamos a função do tipo
import { getPersonalizedSuggestion } from '../services/RecommendationService';
import type { SuggestionFilters } from '../services/RecommendationService';
import { WatchedDataContext } from '../App';
import RecommendationCard from './RecommendationCard';
import styles from './SuggestionView.module.css';

// ... (O resto do seu código SuggestionView.tsx continua exatamente igual)
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const getTopGenres = (amei: ManagedWatchedItem[], gostei: ManagedWatchedItem[], count = 10): string[] => {
    const genreCounts = new Map<string, number>();
    amei.forEach(item => {
        genreCounts.set(item.genre, (genreCounts.get(item.genre) || 0) + 2);
    });
    gostei.forEach(item => {
        genreCounts.set(item.genre, (genreCounts.get(item.genre) || 0) + 1);
    });
    const sortedGenres = [...genreCounts.entries()]
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([genre]) => genre);
    const topGenres = [...new Set(sortedGenres)];
    const defaultGenres = ['Ação', 'Comédia', 'Drama', 'Ficção Científica', 'Suspense', 'Terror', 'Romance', 'Aventura', 'Mistério', 'Fantasia'];
    while (topGenres.length < count) {
        const nextDefault = defaultGenres.find(g => !topGenres.includes(g));
        if (nextDefault) {
            topGenres.push(nextDefault);
        } else {
            break; 
        }
    }
    return topGenres.slice(0, count);
};

const LoadingSpinner = () => (
    <div className={styles.loadingSpinner}>
      <div className={styles.spinner}></div>
      <span className={styles.loadingText}>Buscando a sugestão perfeita...</span>
    </div>
);

const SuggestionView: React.FC = () => {
  const { data: watchedData } = useContext(WatchedDataContext);
  const [filters, setFilters] = useState<SuggestionFilters>({
    category: null,
    genres: [],
    keywords: '',
  });
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);

  const topGenres = useMemo(() => getTopGenres(watchedData.amei, watchedData.gostei, 10), [watchedData]);

  const handleFilterChange = <K extends keyof SuggestionFilters>(key: K, value: SuggestionFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenreToggle = (genreToToggle: string) => {
    const newGenres = filters.genres.includes(genreToToggle)
      ? filters.genres.filter(g => g !== genreToToggle)
      : [...filters.genres, genreToToggle];
    handleFilterChange('genres', newGenres);
  };

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const result = await getPersonalizedSuggestion(watchedData, filters, sessionSuggestions);
      setRecommendation(result);
      setSessionSuggestions(prev => [...prev, result.title]);
    } catch (err) {
      console.error(err);
      setError('Desculpe, não foi possível gerar uma sugestão. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <div className={styles.filterSection}>
      <h2 className={styles.filterSectionTitle}>{title}</h2>
      <div className={styles.filterButtons}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sugestão Personalizada</h1>
      <p className={styles.subtitle}>
        Refine sua busca para encontrar a recomendação ideal.
      </p>

      <div className={styles.filtersCard}>
        {renderFilterSection('1. Escolha a Categoria',
            (['Filme', 'Série', 'Anime', 'Programa'] as const).map(cat => (
                <button 
                    key={cat} 
                    onClick={() => handleFilterChange('category', filters.category === cat ? null : cat)} 
                    className={cn(styles.filterButton, filters.category === cat && styles.filterButtonActive)}
                >
                    {cat}
                </button>
            ))
        )}

        {renderFilterSection('2. Selecione Gêneros (Opcional)',
            topGenres.map(genre => (
                <button 
                    key={genre} 
                    onClick={() => handleGenreToggle(genre)} 
                    className={cn(styles.filterButton, filters.genres.includes(genre) && styles.filterButtonActive)}
                >
                    {genre}
                </button>
            ))
        )}
        
        <div className={styles.filterSection}>
            <h2 className={styles.filterSectionTitle}>3. Adicione Palavras-Chave (Opcional)</h2>
            <input 
                type="text" 
                value={filters.keywords} 
                onChange={(e) => handleFilterChange('keywords', e.target.value)} 
                placeholder="Ex: viagem no tempo, suspense psicológico..." 
                className={styles.keywordsInput} 
            />
        </div>
      </div>
      
      <button onClick={handleGetSuggestion} disabled={isLoading} className={styles.generateButton}>
        {isLoading ? 'Gerando...' : 'Gerar Sugestão'}
      </button>

      {isLoading && <LoadingSpinner />}
      {error && <p className={styles.error}>{error}</p>}

      {recommendation && <RecommendationCard recommendation={recommendation} />}
    </div>
  );
};

export default SuggestionView;
