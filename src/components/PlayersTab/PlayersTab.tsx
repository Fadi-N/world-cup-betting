import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { savePlayers } from '../../lib/firebase';
import styles from './PlayersTab.module.css';

export function PlayersTab() {
  const { state, dispatch } = useApp();
  const [name, setName] = useState('');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed || state.players.includes(trimmed)) return;
    const newPlayers = [...state.players, trimmed];
    dispatch({ type: 'ADD_PLAYER', payload: trimmed });
    setName('');
    savePlayers(newPlayers)
      .then(() => {
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'firebase' });
        setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2500);
      })
      .catch(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'local' }));
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
