import { useState, useEffect } from 'react';
import { Header } from './components/Header/Header';
import { Tabs, type TabId } from './components/Tabs/Tabs';
import { SavePill } from './components/SavePill/SavePill';
import { MatchesTab } from './components/MatchesTab/MatchesTab';
import { PlayersTab } from './components/PlayersTab/PlayersTab';
import { RankingTab } from './components/RankingTab/RankingTab';
import { useApp } from './context/AppContext';
import { subscribeToRoom } from './lib/firebase';
import { useAutoResults } from './hooks/useAutoResults';
import styles from './App.module.css';

export default function App() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<TabId>('matches');
  const [loading, setLoading] = useState(true);
  const { syncing: apiSyncing, sync: apiSync } = useAutoResults();

  useEffect(() => {
    let resolved = 0;
    const markLoaded = () => {
      resolved++;
      if (resolved === 1) {
        dispatch({ type: 'SET_ONLINE', payload: true });
        setLoading(false);
      }
    };
    const unsub = subscribeToRoom(
      players => { dispatch({ type: 'SET_STATE', payload: { players } }); markLoaded(); },
      results => { dispatch({ type: 'SET_STATE', payload: { results } }); markLoaded(); },
      bets    => { dispatch({ type: 'SET_STATE', payload: { bets } });    markLoaded(); },
      () => { dispatch({ type: 'SET_ONLINE', payload: false }); setLoading(false); },
    );
    return unsub;
  }, [dispatch]);

  if (loading) {
    return (
      <div className={styles.app}>
        <div className={styles.loader}>
          <div className={styles.spinner} />
          <span>Łączenie...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Header
        online={state.online}
        lastSynced={state.lastSynced}
        syncing={apiSyncing}
        onSync={apiSync}
      />
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
