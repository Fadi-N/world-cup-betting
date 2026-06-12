import { useEffect, useCallback, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchWC2026Results } from '../lib/footballApi';
import { saveResults } from '../lib/firebase';

const ONE_HOUR = 60 * 60 * 1000;

export function useAutoResults() {
  const { dispatch } = useApp();
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const results = await fetchWC2026Results();
      const count = Object.keys(results).length;

      if (count > 0) {
        Object.entries(results).forEach(([id, score]) => {
          dispatch({ type: 'SET_RESULT', payload: { id: Number(id), score } });
        });
        await saveResults(results);
      }

      dispatch({ type: 'SET_LAST_SYNCED', payload: Date.now() });
      console.info(`[auto-results] synced ${count} finished matches`);
    } catch (err) {
      console.warn('[auto-results] fetch failed:', err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void sync();
    const interval = setInterval(sync, ONE_HOUR);
    const onVisible = () => { if (document.visibilityState === 'visible') void sync(); };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [sync]);

  return { syncing, sync };
}
