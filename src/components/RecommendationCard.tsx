import type { Recommendation } from '../types';
import styles from './RecommendationCard.module.css'; // Importa o CSS

// Helper para combinar classes
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// Mapeamento de chaves de probabilidade para classes CSS
const probabilityClassMap = {
    amei: styles.probAmei,
    gostei: styles.probGostei,
    meh: styles.probMeh,
    naoGostei: styles.probNaoGostei,
};

// Fallback Card (sem pôster)
const OldCard = ({ recommendation }: { recommendation: Recommendation }) => {
    return (
        <div className={styles.oldCardWrapper}>
            <div className={styles.oldCardContainer}>
                <h2 className={styles.oldCardTitle}>{recommendation.title}</h2>
                <div className={styles.oldCardMeta}>
                    <span>{recommendation.type}</span>
                    <span>&bull;</span>
                    <span>{recommendation.genre}</span>
                </div>
                
                <h3 className={styles.oldCardSectionTitle}>Sinopse</h3>
                <p className={styles.oldCardSectionText}>{recommendation.synopsis}</p>
                
                <h3 className={styles.oldCardSectionTitle}>Análise do Gênio</h3>
                <p className={styles.oldCardSectionText}>{recommendation.analysis}</p>

                <h3 className={styles.oldCardSectionTitle}>Probabilidades de Gosto</h3>
                <div className={styles.probabilityList}>
                    {Object.entries(recommendation.probabilities).map(([key, value]) => (
                        <div key={key} className={styles.probabilityItem}>
                            <span className={styles.probabilityLabel}>{key === 'naoGostei' ? 'Não Gostei' : key}</span>
                            <div className={styles.oldCardProgressBarTrack}>
                                <div
                                    className={cn(styles.progressBarFill, probabilityClassMap[key as keyof typeof probabilityClassMap])}
                                    style={{ width: `${value}%` }}
                                >
                                   {value > 10 ? `${value}%` : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Card Principal (com pôster)
const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => {
    const { title, type, genre, synopsis, analysis, probabilities, posterUrl } = recommendation;

    if (!posterUrl) {
        return <OldCard recommendation={recommendation} />;
    }
    
    return (
        <div className={styles.cardWrapper}>
            <div className={styles.cardContainer}>
                <div
                    className={styles.backgroundLayer}
                    style={{ backgroundImage: `url(${posterUrl})` }}
                />
                <div className={styles.blurOverlay} />

                <div className={styles.contentGrid}>
                    <div className={styles.posterContainer}>
                        <img
                            src={posterUrl}
                            alt={`Pôster de ${title}`}
                            className={styles.posterImage}
                        />
                    </div>

                    <div className={styles.detailsContainer}>
                        <h2 className={styles.title}>{title}</h2>
                        <div className={styles.metaInfo}>
                            <span>{type}</span>
                            <span>&bull;</span>
                            <span>{genre}</span>
                        </div>

                        <div className={styles.sectionsContainer}>
                            <div>
                                <h3 className={styles.sectionTitle}>Sinopse</h3>
                                <p className={styles.sectionText}>{synopsis}</p>
                            </div>
                            <div>
                                <h3 className={styles.sectionTitle}>Análise do Gênio</h3>
                                <p className={styles.sectionText}>{analysis}</p>
                            </div>
                        </div>

                        <div className={styles.probabilitiesContainer}>
                            <h3 className={styles.sectionTitle}>Probabilidades de Gosto</h3>
                            <div className={styles.probabilityList}>
                                {Object.entries(probabilities).map(([key, value]) => (
                                    <div key={key} className={styles.probabilityItem}>
                                        <span className={styles.probabilityLabel}>{key === 'naoGostei' ? 'Não Gostei' : key}</span>
                                        <div className={styles.progressBarTrack}>
                                            <div
                                                className={cn(styles.progressBarFill, probabilityClassMap[key as keyof typeof probabilityClassMap])}
                                                style={{ width: `${value}%` }}
                                            >
                                               {value > 10 ? `${value}%` : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationCard;
