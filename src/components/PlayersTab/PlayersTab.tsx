import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import styles from './PlayersTab.module.css';

export function PlayersTab() {
  const { state, dispatch } = useApp();
  const [name, setName] = useState('');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_PLAYER', payload: trimmed });
    setName('');
  };

  return (
    <div>
      <h2>Gracze typujący</h2>
      <div className={styles.addRow}>
        <input
          className={styles.input}
          placeholder="Imię gracza..."
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className={styles.addBtn} onClick={add}>+ Dodaj</button>
      </div>

      {state.players.length === 0 ? (
        <p className={styles.empty}>Brak graczy – dodaj pierwszego!</p>
      ) : (
        <div className={styles.list}>
          {state.players.map(p => (
            <div key={p} className={styles.tag}>
              <span>👤 {p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
