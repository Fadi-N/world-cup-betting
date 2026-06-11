import { ConnectionBadge } from '../ConnectionBadge/ConnectionBadge';
import styles from './Header.module.css';

interface Props { online: boolean }

export function Header({ online }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.icon}>⚽</div>
        <div>
          <h1 className={styles.title}>Typer mundialowy 2026</h1>
          <p className={styles.sub}>synchronizacja na żywo · 104 mecze</p>
        </div>
      </div>
      <ConnectionBadge online={online} />
    </header>
  );
}
