import { ConnectionBadge } from '../ConnectionBadge/ConnectionBadge';
import styles from './Header.module.css';

interface Props {
  online: boolean;
  lastSynced: number | null;
  syncing: boolean;
  onSync: () => void;
}

function formatSynced(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mo} ${hh}:${mm}`;
}

export function Header({ online, lastSynced, syncing, onSync }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.icon}>⚽</div>
        <div>
          <h1 className={styles.title}>Typer mundialowy 2026</h1>
          <p className={styles.sub}>synchronizacja na żywo · 104 mecze</p>
        </div>
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.syncBtn} ${syncing ? styles.spinning : ''}`}
          onClick={onSync}
          disabled={syncing}
          title={lastSynced ? `Ostatnia sync: ${formatSynced(lastSynced)}` : 'Pobierz wyniki'}
          aria-label="Odśwież wyniki"
        >
          🔄
          <span className={styles.syncLabel}>
            {syncing
              ? 'pobieranie…'
              : lastSynced
              ? formatSynced(lastSynced)
              : 'brak sync'}
          </span>
        </button>
        <ConnectionBadge online={online} />
      </div>
    </header>
  );
}
