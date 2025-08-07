// src/components/MainMenu.tsx - VERSÃO ATUALIZADA
import React from 'react';
import { View } from '../types';
import styles from './MainMenu.module.css'; // Importa o estilo

interface MainMenuProps {
  setView: (view: View) => void;
}

const MenuButton = ({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) => (
  <button onClick={onClick} className={styles.menuButton}>
    <span className={styles.icon}>{icon}</span>
    <span>{text}</span>
  </button>
);

const MainMenu: React.FC<MainMenuProps> = ({ setView }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          CineGênio <span className={styles.highlight}>Pessoal</span>
        </h1>
        <p className={styles.subtitle}>Seu assistente de cinema e séries.</p>
      </div>
      <div className={styles.buttonGroup}>
        <MenuButton icon="🎲" text="Sugestão Aleatória" onClick={() => setView(View.RANDOM)} />
        <MenuButton icon="💡" text="Sugestão Personalizada" onClick={() => setView(View.SUGGESTION)} />
        <MenuButton icon="🤔" text="Será que vou gostar?" onClick={() => setView(View.PREDICT)} />
        <MenuButton icon="📚" text="Minha Coleção" onClick={() => setView(View.COLLECTION)} />
        <MenuButton icon="📊" text="Ver Insights" onClick={() => setView(View.STATS)} />
      </div>
    </div>
  );
};

export default MainMenu;