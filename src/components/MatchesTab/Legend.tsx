import styles from './MatchesTab.module.css';

export function Legend() {
  return (
    <div className={styles.legend}>
      <span className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: '#2f5c38' }} />
        trafiony wynik · 5 pkt
      </span>
      <span className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: '#2a4f78' }} />
        dokładny wynik · 10 pkt
      </span>
      <span className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: '#854F0B' }} />
        🔥 seria ×2 / ×3
      </span>
      <span className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: '#f0a0a0' }} />
        🔒 zamknięte 5 min przed meczem
      </span>
    </div>
  );
}
