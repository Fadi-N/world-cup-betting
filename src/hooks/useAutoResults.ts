import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fetchWC2026Results } from '../lib/footballApi';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export function useAutoResults() {
  const { dispatch } = useApp();

  const sync = useCallback(async () => {
    try {
      const results = await fetchWC2026Results();
      const count = Object.keys(results).length;
      if (count === 0) return;

      Object.entries(results).forEach(([id, score]) => {
        dispatch({
          type: 'SET_RESULT',
          payload: { id: Number(id), score },
        });
      });

      dispatch({ type: 'SET_SAVE_STATUS', payload: 'firebase' });
      setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2500);

      console.info(`[auto-results] synced ${count} finished matches`);
    } catch (err) {
      console.warn('[auto-results] fetch failed:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    // Fetch immediately on mount
    void sync();

    // Revalidate every 12 hours
    const interval = setInterval(sync, TWELVE_HOURS);

    // Also revalidate when the tab regains focus after being hidden
    const onFocus = () => { void sync(); };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [sync]);
}
