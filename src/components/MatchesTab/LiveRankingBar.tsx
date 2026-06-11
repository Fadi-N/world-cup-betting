import { calcAllPts } from '../../lib/scoring';
import type { AppState } from '../../context/types';
import styles from './MatchesTab.module.css';

interface Props {
  players: AppState['players'];
  results: AppState['results'];
  bets: AppState['bets'];
}

export function LiveRankingBar({ players, results, bets }: Props) {
  if (!players.length) return null;
  const pts = calcAllPts(players, results, bets);
  const sorted = [...players].sort((a, b) => (pts[b] ?? 0) - (pts[a] ?? 0));
  const topPts = pts[sorted[0]] ?? 0;

  return (
    <div className={styles.rankingBar}>
      <div className={styles.rankingBarHead}>
        <span className={styles.rankDot} />
        Ranking na żywo
      </div>
      <div className={styles.rankChips}>
        {sorted.map((p, i) => (
          <span
            key={p}
            className={`${styles.rankChip} ${topPts > 0 && pts[p] === topPts ? styles.lead : ''}`}
          >
            <span className={styles.rankPos}>{i + 1}.</span>
            <span className={styles.rankName}>{p}</span>
            <span className={styles.rankPts}>{pts[p] ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
