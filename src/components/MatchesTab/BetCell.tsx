import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { outcome, isLocked, getStreakAt } from '../../lib/scoring';
import { saveBet } from '../../lib/firebase';
import type { Match, Score } from '../../context/types';
import styles from './MatchesTab.module.css';

interface Props {
  player: string;
  match: Match;
  result?: Score;
}

export function BetCell({ player, match, result }: Props) {
  const { state, dispatch } = useApp();
  const bet = state.bets[player]?.[match.id];
  const locked = isLocked(match);
  const homeRef = useRef<HTMLInputElement>(null);
  const awayRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Survives Firebase resets during rapid typing — only updated by handleChange, never by renders
  const localBet = useRef<Score | undefined>(undefined);

  const focusNext = (side: 'home' | 'away') => {
    if (side === 'home') {
      awayRef.current?.focus();
      awayRef.current?.select();
      return;
    }
    const all = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        `input[data-player="${player}"][data-side="home"]:not(:disabled)`,
      ),
    );
    const idx = all.findIndex(el => Number(el.dataset.matchId) === match.id);
    const next = all[idx + 1];
    if (next) { next.focus(); next.select(); }
  };

  const handleChange = (side: 'home' | 'away', value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    // localBet is preferred over bet: if Firebase reset bet during the debounce window,
    // localBet still holds what the user actually typed
    const base = localBet.current ?? bet;
    const newScore: Score = {
      home: side === 'home' ? digit : (base?.home ?? ''),
      away: side === 'away' ? digit : (base?.away ?? ''),
    };
    localBet.current = newScore;

    // Flush synchronously so the next field reads updated state, not stale render values
    flushSync(() => {
      dispatch({ type: 'SET_BET', payload: { player, id: match.id, score: newScore } });
    });

    // Debounce Firebase write so auto-advance home→away sends one request
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBet(player, match.id, newScore)
        .then(() => {
          dispatch({ type: 'SET_SAVE_STATUS', payload: 'firebase' });
          setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2500);
        })
        .catch(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'local' }));
    }, 400);

    if (digit !== '') focusNext(side);
  };

  let cellClass = styles.betCell;
  let cls = '';
  let pts = 0;

  if (result && bet) {
    const isExact = bet.home === result.home && bet.away === result.away;
    const betOut = outcome(bet.home, bet.away);
    const resOut = outcome(result.home, result.away);

    if (betOut && resOut && betOut === resOut) {
      cls = isExact ? 'exact' : 'hit';
      const streak = getStreakAt(player, match.id, state.results, state.bets);
      const mult = streak >= 3 ? 3 : streak >= 2 ? 2 : 1;
      pts = (isExact ? 10 : 5) * mult;
    } else if (betOut && resOut) {
      cls = 'miss';
    }
  }

  if (cls === 'exact') cellClass = `${styles.betCell} ${styles.exact}`;
  else if (cls === 'hit') cellClass = `${styles.betCell} ${styles.hit}`;
  else if (cls === 'miss') cellClass = `${styles.betCell} ${styles.miss}`;
  if (locked) cellClass += ` ${styles.locked}`;

  const streak = result && bet && cls !== 'miss'
    ? getStreakAt(player, match.id, state.results, state.bets)
    : 0;

  return (
    <div className={cellClass} title={locked ? 'Typowanie zamknięte' : player}>
      <span className={styles.betName}>{player}</span>
      <input
        ref={homeRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]"
        data-player={player}
        data-match-id={match.id}
        data-side="home"
        value={bet?.home ?? ''}
        disabled={locked}
        onChange={e => handleChange('home', e.target.value)}
        className={styles.betInput}
        aria-label={`${player} home bet`}
      />
      <span className={styles.betColon}>:</span>
      <input
        ref={awayRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]"
        data-player={player}
        data-match-id={match.id}
        data-side="away"
        value={bet?.away ?? ''}
        disabled={locked}
        onChange={e => handleChange('away', e.target.value)}
        className={styles.betInput}
        aria-label={`${player} away bet`}
      />
      {streak >= 2 && (
        <span className={styles.betFire}>🔥{streak}</span>
      )}
      {result && cls !== '' && (
        <span className={styles.betPts}>
          {cls === 'miss' ? '0' : `+${pts}`}
        </span>
      )}
    </div>
  );
}
