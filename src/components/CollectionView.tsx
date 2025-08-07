import React, { useState, useContext, useEffect, useMemo } from 'react';
import type { ManagedWatchedItem, Rating } from '../types';
import { WatchedDataContext } from '../App';
import { getTMDbDetails } from '../services/TMDbService';
import styles from './CollectionView.module.css'; // Importa o CSS

// Helper para combinar classes condicionalmente
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// Mapeamento de ratings para as classes CSS correspondentes
const ratingClassMap: Record<Rating, string> = {
    amei: styles.ratingAmei,
    gostei: styles.ratingGostei,
    meh: styles.ratingMeh,
    naoGostei: styles.ratingNaoGostei,
};

const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div className={styles.modalBackdrop} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

const DetailsModal = ({ item, onClose }: { item: ManagedWatchedItem, onClose: () => void }) => {
    const { removeItem } = useContext(WatchedDataContext);
    const [synopsis, setSynopsis] = useState(item.synopsis || '');
    const [isLoadingSynopsis, setIsLoadingSynopsis] = useState(!item.synopsis);
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (!item.synopsis || item.synopsis === 'Falha ao carregar dados.') {
            setIsLoadingSynopsis(true);
            getTMDbDetails(item.id, item.tmdbMediaType)
                .then(details => {
                    if (isMounted) setSynopsis(details.overview || "Sinopse não disponível em português.");
                })
                .catch(err => {
                    if (isMounted) setSynopsis(err instanceof Error ? err.message : "Não foi possível carregar a sinopse do TMDb.");
                    console.error("Failed to fetch TMDb details", err);
                })
                .finally(() => {
                    if (isMounted) setIsLoadingSynopsis(false);
                });
        }
        return () => { isMounted = false; };
    }, [item.id, item.tmdbMediaType, item.synopsis]);

    const codeSnippet = `{ id: ${item.id}, tmdbMediaType: '${item.tmdbMediaType}', title: '${item.title}', type: '${item.type}', genre: '${item.genre}' }`;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(codeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemove = () => {
        const userConfirmed = confirm(`Tem certeza que deseja remover "${item.title}" da sua coleção?`);
        if (userConfirmed) {
            removeItem(item.id);
            onClose();
        }
    };

    return (
        <Modal onClose={onClose}>
            <div className={styles.modalPadding}>
                <div className={styles.modalHeader}>
                    {item.posterUrl && <img src={item.posterUrl} alt={`Pôster de ${item.title}`} className={styles.modalPoster} />}
                    <div className={styles.modalInfo}>
                        <h2 className={styles.modalTitle}>{item.title}</h2>
                        <div className={styles.modalMeta}>
                            <span className={cn(styles.detailsRatingBadge, ratingClassMap[item.rating])}>
                                {item.rating.toUpperCase()}
                            </span>
                            <span>{item.type}</span>
                            <span>&bull;</span>
                            <span>{item.genre}</span>
                        </div>
                    </div>
                </div>

                <h3 className={styles.sectionTitle}>Sinopse</h3>
                {isLoadingSynopsis ? (
                    <div className={styles.synopsisLoader}></div>
                ) : (
                    <p className={styles.synopsisText}>{synopsis}</p>
                )}

                <div className={styles.buttonGroup}>
                    <button onClick={() => setShowCode(!showCode)} className={cn(styles.baseButton, styles.secondaryButton)}>
                        {/* SVG aqui se quiser */}
                        {showCode ? 'Ocultar Código' : 'Gerar Código'}
                    </button>
                    <button onClick={handleRemove} className={cn(styles.baseButton, styles.dangerButton)}>
                        {/* SVG aqui se quiser */}
                        Remover
                    </button>
                </div>
                
                {showCode && (
                    <div className={styles.codeSnippetContainer}>
                        <pre className={styles.codeSnippetPre}><code>{codeSnippet}</code></pre>
                        <button onClick={handleCopyCode} className={styles.copyButton}>
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                )}

                <button onClick={onClose} className={cn(styles.baseButton, styles.primaryButton, styles.fullWidthButton)}>Fechar</button>
            </div>
        </Modal>
    );
};

const AddModal = ({ onClose }: { onClose: () => void }) => {
    const [title, setTitle] = useState('');
    const [rating, setRating] = useState<Rating>('gostei');
    const { addItem, loading: isAdding } = useContext(WatchedDataContext);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('O título não pode estar vazio.');
            return;
        }
        setError('');
        try {
            await addItem(title, rating);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao adicionar título.');
        }
    };

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h2 className={styles.modalTitle}>Adicionar Novo Título</h2>
                <div className={styles.formField}>
                    <label htmlFor="title" className={styles.formLabel}>Título do Filme ou Série</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={styles.formInput} placeholder="Ex: Interestelar"/>
                </div>
                <div className={styles.formField}>
                    <label className={styles.formLabel}>Minha Avaliação</label>
                    <select value={rating} onChange={e => setRating(e.target.value as Rating)} className={styles.formSelect}>
                        <option value="amei">Amei</option>
                        <option value="gostei">Gostei</option>
                        <option value="meh">Meh</option>
                        <option value="naoGostei">Não Gostei</option>
                    </select>
                </div>
                {error && <p className={styles.errorMessage}>{error}</p>}
                <div className={styles.formActions}>
                    <button type="button" onClick={onClose} className={cn(styles.baseButton, styles.secondaryButton)}>Cancelar</button>
                    <button type="submit" disabled={isAdding} className={cn(styles.baseButton, styles.primaryButton)}>
                        {isAdding ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ItemCard = ({ item, onClick }: { item: ManagedWatchedItem, onClick: () => void }) => {
    const { updateItem } = useContext(WatchedDataContext);
    const [currentPosterUrl, setCurrentPosterUrl] = useState(item.posterUrl);
    const [isLoading, setIsLoading] = useState(!item.posterUrl);

    useEffect(() => {
        let isMounted = true;
        if (item.posterUrl === undefined || item.synopsis === undefined) {
            setIsLoading(true);
            getTMDbDetails(item.id, item.tmdbMediaType)
                .then(details => {
                    if (isMounted) {
                        const newPosterUrl = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'not_found';
                        const newSynopsis = details.overview || "Sinopse não disponível.";
                        updateItem({ ...item, posterUrl: newPosterUrl, synopsis: newSynopsis });
                        setCurrentPosterUrl(newPosterUrl);
                        setIsLoading(false);
                    }
                })
                .catch(err => {
                    if (isMounted) {
                        console.error(`Failed to hydrate data for ${item.title}:`, err.message);
                        updateItem({ ...item, posterUrl: 'not_found', synopsis: 'Falha ao carregar dados.' });
                        setCurrentPosterUrl('not_found');
                        setIsLoading(false);
                    }
                });
        } else {
            setIsLoading(false);
            setCurrentPosterUrl(item.posterUrl);
        }
        return () => { isMounted = false; };
    }, [item, updateItem]);

    return (
        <div onClick={onClick} className={styles.itemCard}>
            <div className={styles.posterContainer}>
                {isLoading ? (
                    <div className={styles.pulse}></div>
                ) : currentPosterUrl && currentPosterUrl !== 'not_found' ? (
                    <img src={currentPosterUrl} alt={`Pôster de ${item.title}`} className={styles.posterImage} loading="lazy" />
                ) : (
                    <div className={styles.posterPlaceholder}>
                        <span>Pôster não disponível</span>
                    </div>
                )}
            </div>
            <div className={styles.cardGradient}></div>
            <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle} title={item.title}>{item.title}</h3>
            </div>
            <div className={cn(styles.ratingBadge, ratingClassMap[item.rating])}>
                {item.rating.toUpperCase()}
            </div>
        </div>
    );
};

const CollectionView: React.FC = () => {
    const { data } = useContext(WatchedDataContext);
    const [modal, setModal] = useState<'add' | 'details' | null>(null);
    const [selectedItem, setSelectedItem] = useState<ManagedWatchedItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // O resto dos seus hooks de estado...

    const allItems = useMemo(() => [...data.amei, ...data.gostei, ...data.meh, ...data.naoGostei], [data]);
    // O resto do seu código de filtragem...
    
    const filteredItems = allItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));


    const handleItemClick = (item: ManagedWatchedItem) => {
        setSelectedItem(item);
        setModal('details');
    };

    return (
        <div className={styles.viewContainer}>
            {modal === 'details' && selectedItem && <DetailsModal item={selectedItem} onClose={() => setModal(null)} />}
            {modal === 'add' && <AddModal onClose={() => setModal(null)} />}
            
            <div className={styles.header}>
                <h1 className={styles.title}>Minha Coleção</h1>
                <button onClick={() => setModal('add')} className={styles.addButton}>[+] Adicionar</button>
            </div>

            <div className={styles.filtersContainer}>
                <div className={styles.searchAndQuickFilters}>
                    <input 
                        type="text" 
                        placeholder="Buscar na coleção..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {/* Aqui entraria a lógica dos seus quick filters */}
                </div>
                 {/* Aqui entraria a lógica dos seus filtros avançados */}
            </div>

            {filteredItems.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Nenhum resultado encontrado.</p>
                </div>
            ) : (
                <div className={styles.itemsGrid}>
                    {filteredItems.map(item => (
                        <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CollectionView;
