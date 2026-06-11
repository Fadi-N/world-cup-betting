import styles from './ConnectionBadge.module.css';

interface Props { online: boolean }

export function ConnectionBadge({ online }: Props) {
  return (
    <span className={online ? styles.online : styles.offline}>
      <span className={online ? styles.dot : undefined} />
      {online ? 'online' : 'offline'}
    </span>
  );
}
