import { useApp } from '../../context/AppContext';
import { calcAllPts } from '../../lib/scoring';
import styles from './RankingTab.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export function RankingTab() {
  const { state } = useApp();

  if (!state.players.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🏆</div>
        Dodaj graczy i zacznij typować!
      </div>
    );
  }

  const pts = calcAllPts(state.players, state.results, state.bets);
  const sorted = [...state.players].sort((a, b) => (pts[b] ?? 0) - (pts[a] ?? 0));

  return (
    <div>
      <h2>Ranking</h2>
      <ol className={styles.list}>
        {sorted.map((p, i) => (
          <li key={p} className={styles.card}>
            <span className={styles.medal}>{MEDALS[i] ?? i + 1}</span>
            <div className={styles.avatar}>{p.slice(0, 2).toUpperCase()}</div>
            <div className={styles.info}>
              <div className={styles.name}>{p}</div>
              <div className={styles.sub}>punkty łącznie</div>
            </div>
            <span className={styles.pts}>{pts[p] ?? 0}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
