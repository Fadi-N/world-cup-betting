import { COUNTRY_ISO } from '../../data/matches';
import { isLocked } from '../../lib/scoring';
import { BetCell } from './BetCell';
import type { Match, Score } from '../../context/types';
import styles from './MatchesTab.module.css';

const FLAG_BASE = 'https://cdn.jsdelivr.net/npm/flag-icons@7.5.0/flags/4x3';

function FlagImg({ country }: { country: string }) {
  const iso = COUNTRY_ISO[country];
  if (!iso) return <span className={styles.flagPlaceholder}>{country.slice(0, 2)}</span>;
  return (
    <img
      src={`${FLAG_BASE}/${iso}.svg`}
      alt={country}
      className={styles.flag}
      loading="lazy"
    />
  );
}

interface Props {
  match: Match;
  result?: Score;
  players: string[];
  displayHome?: string;
  displayAway?: string;
}

export function MatchCard({ match, result, players, displayHome, displayAway }: Props) {
  const locked = isLocked(match);
  const homeLabel = displayHome ?? match.home;
  const awayLabel = displayAway ?? match.away;

  const badge = result
    ? <span className={`${styles.badge} ${styles.badgeResult}`}>wynik</span>
    : locked
    ? <span className={`${styles.badge} ${styles.badgeLocked}`}>🔒 zamknięte</span>
    : <span className={`${styles.badge} ${styles.badgeOpen}`}>otwarte</span>;

  return (
    <div className={styles.matchCard} data-mid={match.id}>
      <div className={styles.matchHeader}>
        <div className={styles.matchMeta}>
          <span className={styles.matchDate}>{match.date}</span>
          {match.grp && <span className={styles.matchGrp}>Gr. {match.grp}</span>}
        </div>
        {badge}
      </div>

      <div className={styles.teams}>
        <div className={`${styles.team} ${styles.teamHome}`}>
          <span className={styles.teamName}>{homeLabel}</span>
          {COUNTRY_ISO[homeLabel] && <FlagImg country={homeLabel} />}
        </div>

        <div className={styles.scoreBlock}>
          <span className={styles.scoreDisplay}>{result?.home || '–'}</span>
          <span className={styles.scoreSep}>:</span>
          <span className={styles.scoreDisplay}>{result?.away || '–'}</span>
        </div>

        <div className={`${styles.team} ${styles.teamAway}`}>
          {COUNTRY_ISO[awayLabel] && <FlagImg country={awayLabel} />}
          <span className={styles.teamName}>{awayLabel}</span>
        </div>
      </div>

      {result && (result.etHome !== undefined || result.pkHome !== undefined) && (
        <div className={styles.etNote}>
          {result.etHome !== undefined && (
            <span>Po dogrywce: {result.etHome}:{result.etAway}</span>
          )}
          {result.pkHome !== undefined && (
            <span>{result.etHome !== undefined ? ' · ' : ''}Karne: {result.pkHome}:{result.pkAway}</span>
          )}
        </div>
      )}

      {players.length > 0 && (
        <div className={styles.betsRow}>
          {players.map(p => (
            <BetCell key={p} player={p} match={match} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
