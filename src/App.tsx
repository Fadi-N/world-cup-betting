import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header/Header';
import { Tabs, type TabId } from './components/Tabs/Tabs';
import { SavePill } from './components/SavePill/SavePill';
import { MatchesTab } from './components/MatchesTab/MatchesTab';
import { PlayersTab } from './components/PlayersTab/PlayersTab';
import { RankingTab } from './components/RankingTab/RankingTab';
import { useApp } from './context/AppContext';
import { subscribeToRoom, saveToRoom, saveLocal, loadLocal } from './lib/firebase';
import styles from './App.module.css';

export default function App() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<TabId>('matches');
  const isSyncing = useRef(false);

  useEffect(() => {
    const local = loadLocal();
    if (local) {
      dispatch({ type: 'SET_STATE', payload: local });
    }
  }, [dispatch]);

  useEffect(() => {
    const unsub = subscribeToRoom(
      data => {
        if (isSyncing.current) return;
        dispatch({ type: 'SET_STATE', payload: data });
        dispatch({ type: 'SET_ONLINE', payload: true });
      },
      () => {
        dispatch({ type: 'SET_ONLINE', payload: false });
      },
    );
    return unsub;
  }, [dispatch]);

  const { players, results, bets } = state;
  useEffect(() => {
    if (!players.length && !Object.keys(results).length) return;
    const data = { players, results, bets };
    isSyncing.current = true;
    saveToRoom(data)
      .then(() => {
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'firebase' });
        saveLocal(data);
      })
      .catch(() => {
        saveLocal(data);
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'local' });
      })
      .finally(() => {
        isSyncing.current = false;
        setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2500);
      });
  }, [players, results, bets, dispatch]);

  return (
    <div className={styles.app}>
      <Header online={state.online} />
      <Tabs active={tab} onChange={setTab} />
      <main className={styles.main}>
        {tab === 'matches' && <MatchesTab />}
        {tab === 'players' && <PlayersTab />}
        {tab === 'ranking' && <RankingTab />}
      </main>
      <SavePill status={state.saveStatus} />
    </div>
  );
}
