import React, { useState, useContext } from 'react';
import type { Recommendation } from '../types';
import { getRandomSuggestion } from '../services/RecommendationService';
import { WatchedDataContext } from '../App';
import RecommendationCard from './RecommendationCard';
import styles from './RandomView.module.css'; // Importa o CSS

const LoadingSpinner = () => (
  <div className={styles.loadingSpinner}>
    <div className={styles.spinner}></div>
    <span className={styles.loadingText}>Gerando uma surpresa...</span>
  </div>
);

const RandomView: React.FC = () => {
  const { data: watchedData } = useContext(WatchedDataContext);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);

  const handleGetRandomSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const result = await getRandomSuggestion(watchedData, sessionSuggestions);
      setRecommendation(result);
      setSessionSuggestions(prev => [...prev, result.title]);
    } catch (err) {
      console.error(err);
      setError('Desculpe, não foi possível gerar uma sugestão. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sugestão Aleatória</h1>
      <p className={styles.subtitle}>
        Descubra joias escondidas! Clique no botão abaixo e nosso CineGênio encontrará uma recomendação inesperada, mas que tem tudo a ver com você.
      </p>

      {!isLoading && (
        <button
          onClick={handleGetRandomSuggestion}
          disabled={isLoading}
          className={styles.surpriseButton}
        >
          {recommendation ? 'Tentar Outra Vez' : 'Me Surpreenda!'}
        </button>
      )}

      {isLoading && <LoadingSpinner />}

      {error && <p className={styles.error}>{error}</p>}
      
      {recommendation && !isLoading && (
        <div className={styles.recommendationContainer}>
            <RecommendationCard recommendation={recommendation} />
        </div>
      )}
    </div>
  );
};

export default RandomView;
