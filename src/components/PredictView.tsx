import React, { useState, useContext } from 'react';
import type { PredictionResult } from '../types';
import { getPrediction } from '../services/RecommendationService';
import { WatchedDataContext } from '../App';
import styles from './PredictView.module.css'; // Importa o CSS

// Helper para combinar classes condicionalmente
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const LoadingSpinner = () => (
    <div className={styles.loadingSpinner}>
      <div className={styles.spinner}></div>
      <span>Analisando os confins do cinema...</span>
    </div>
);

const PredictView: React.FC = () => {
  const { data: watchedData } = useContext(WatchedDataContext);
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim()) {
      setError('Por favor, digite o nome de um filme ou série.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const predictionResult = await getPrediction(title, watchedData);
      setResult(predictionResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      console.error(err);
      setError(`Desculpe, não foi possível fazer a análise. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getVerdictChipStyle = (prediction: string): string => {
    const p = prediction.toUpperCase();
    if (p.includes('AMAR')) return styles.verdictAmar;
    if (p.includes('GOSTAR')) return styles.verdictGostar;
    if (p.includes('RESSALVAS')) return styles.verdictRessalvas;
    if (p.includes('NÃO É PARA VOCÊ') || p.includes('NÃO GOSTAR')) return styles.verdictNaoGostar;
    return styles.verdictDefault;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Será que vou gostar?</h1>
      <p className={styles.subtitle}>
        Digite o nome de um filme ou série e o CineGênio analisará se tem a ver com seu perfil.
      </p>

      <div className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if(error) setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAnalyze()}
            placeholder="Ex: Blade Runner 2049"
            className={styles.textInput}
            aria-label="Título do filme ou série"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !title.trim()}
            className={styles.analyzeButton}
          >
            {isLoading ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.resultContainer} role="alert">
          <div className={styles.resultCard}>
            <div className={cn(styles.verdictChip, getVerdictChipStyle(result.prediction))}>
              {result.prediction}
            </div>
            <p className={styles.resultReason}>{result.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictView;
