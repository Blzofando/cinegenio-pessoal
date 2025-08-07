import React, { useContext, useMemo } from 'react';
import { WatchedDataContext } from '../App';
import type { Rating, MediaType } from '../types';
import styles from './StatsView.module.css'; // Importa o CSS

const ratingStyles: Record<Rating, { color: string, name: string }> = {
    amei: { color: '#4ade80', name: 'Amei' },
    gostei: { color: '#818cf8', name: 'Gostei' },
    meh: { color: '#facc15', name: 'Meh' },
    naoGostei: { color: '#f87171', name: 'Não Gostei' }
};

const PieChart = ({ data }: { data: Record<Rating, number> }) => {
    const total = Object.values(data).reduce((acc, val) => acc + val, 0);
    if (total === 0) return <div><span>Sem dados</span></div>;

    let cumulativePercent = 0;
    const slices = (Object.keys(data) as Rating[]).map(key => {
        const value = data[key];
        const percent = value / total;
        const startAngle = cumulativePercent * 2 * Math.PI;
        cumulativePercent += percent;
        const endAngle = cumulativePercent * 2 * Math.PI;
        
        const r = 90;
        const x1 = r * Math.cos(startAngle);
        const y1 = r * Math.sin(startAngle);
        const x2 = r * Math.cos(endAngle);
        const y2 = r * Math.sin(endAngle);
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L 0 0 Z`;
        
        return { pathData, color: ratingStyles[key].color };
    });

    return (
        <svg viewBox="-100 -100 200 200" className={styles.pieChartSvg}>
            {slices.map((slice, index) => (
                <path key={index} d={slice.pathData} fill={slice.color} />
            ))}
        </svg>
    );
};

const BarChart = ({ data }: { data: { genre: string, count: number }[] }) => {
    if (data.length === 0) {
        return <div>Adicione itens à lista 'Amei' para ver seus gêneros favoritos.</div>;
    }
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className={styles.barChartList}>
            {data.map(({ genre, count }) => (
                <div key={genre} className={styles.barChartItem}>
                    <span className={styles.barLabel}>{genre}</span>
                    <div className={styles.barTrack}>
                        <div 
                            className={styles.barFill}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                        >
                            <span className={styles.barValue}>{count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const StatsView: React.FC = () => {
  const { data } = useContext(WatchedDataContext);

  const stats = useMemo(() => {
    const allItems = Object.values(data).flat();
    if (allItems.length === 0) return null;

    const ratingsCount = {
        amei: data.amei.length,
        gostei: data.gostei.length,
        meh: data.meh.length,
        naoGostei: data.naoGostei.length,
    };

    const typeCount = allItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<MediaType, number>);

    const ameiGenres = data.amei.reduce((acc, item) => {
      acc[item.genre] = (acc[item.genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topGenres = Object.entries(ameiGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    return { totalItems: allItems.length, ratingsCount, typeCount, topGenres };
  }, [data]);

  if (!stats) {
    return (
        <div className={styles.emptyStateContainer}>
            <h1 className={styles.mainTitle}>Ver Insights</h1>
            <div className={styles.emptyStateCard}>
                <p className={styles.emptyStateText}>Sua coleção está vazia.</p>
                <p className={styles.emptyStateSubtext}>Adicione itens em "Minha Coleção" para ver suas estatísticas.</p>
            </div>
        </div>
    );
  }

  const totalRatings = Object.values(stats.ratingsCount).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.container}>
        <h1 className={styles.mainTitle}>Seus Insights</h1>
        
        <div className={styles.grid}>
            <div className={`${styles.card} ${styles.statCardsContainer}`}>
                {Object.entries(stats.typeCount).map(([type, count]) => (
                    <div key={type} className={styles.statItem}>
                        <span className={styles.statValue}>{count}</span>
                        <p className={styles.statLabel}>{type}s</p>
                    </div>
                ))}
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.totalItems}</span>
                    <p className={styles.statLabel}>Total</p>
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Distribuição de Avaliações</h2>
                <div className={styles.pieChartContainer}>
                    <PieChart data={stats.ratingsCount} />
                    <ul className={styles.pieChartLegend}>
                        {(Object.keys(stats.ratingsCount) as Rating[]).map(key => (
                            <li key={key} className={styles.legendItem}>
                                <span style={{ backgroundColor: ratingStyles[key].color }} className={styles.legendColorBox}></span>
                                <span className={styles.legendName}>{ratingStyles[key].name}:</span>
                                <span className={styles.legendValue}>{stats.ratingsCount[key]} ({(totalRatings > 0 ? (stats.ratingsCount[key] / totalRatings * 100) : 0).toFixed(0)}%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={`${styles.card} ${styles.barChartContainer}`}>
               <h2 className={styles.cardTitle}>Top 5 Gêneros que Você Amou</h2>
               <BarChart data={stats.topGenres} />
            </div>
        </div>
    </div>
  );
};

export default StatsView;
