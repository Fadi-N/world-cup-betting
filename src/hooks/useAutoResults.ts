import { useEffect, useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchWC2026Results } from '../lib/footballApi';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export function useAutoResults() {
  const { dispatch } = useApp();
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const results = await fetchWC2026Results();
      const count = Object.keys(results).length;

      if (count > 0) {
        Object.entries(results).forEach(([id, score]) => {
          dispatch({ type: 'SET_RESULT', payload: { id: Number(id), score } });
        });
      }

      dispatch({ type: 'SET_LAST_SYNCED', payload: Date.now() });
      console.info(`[auto-results] synced ${count} finished matches`);
    } catch (err) {
      console.warn('[auto-results] fetch failed:', err);
    } finally {
      setSyncing(false);
    }
  }, [dispatch, syncing]);

  useEffect(() => {
    void sync();
    const interval = setInterval(sync, TWELVE_HOURS);
    const onFocus = () => { void sync(); };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return { syncing, sync };
}
