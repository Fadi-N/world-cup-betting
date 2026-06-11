import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { outcome, isLocked, getStreakAt } from '../../lib/scoring';
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

  const focusNext = (side: 'home' | 'away') => {
    if (side === 'home') {
      awayRef.current?.focus();
      awayRef.current?.select();
      return;
    }
    // Jump to next unlocked home input for this player
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
    // Keep only the last digit entered (0–9)
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    dispatch({
      type: 'SET_BET',
      payload: {
        player,
        id: match.id,
        score: {
          home: side === 'home' ? digit : (bet?.home ?? ''),
          away: side === 'away' ? digit : (bet?.away ?? ''),
        },
      },
    });
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
