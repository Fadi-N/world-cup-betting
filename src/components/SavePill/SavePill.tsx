import styles from './SavePill.module.css';
import type { AppState } from '../../context/types';

interface Props { status: AppState['saveStatus'] }

export function SavePill({ status }: Props) {
  if (status === 'idle') return null;
  return (
    <div className={styles.pill}>
      {status === 'firebase' ? 'Zsynchronizowano ✓' : 'Zapisano lokalnie ✓'}
    </div>
  );
}
