import styles from './Tabs.module.css';

export type TabId = 'matches' | 'players' | 'ranking';

const TAB_LABELS: Record<TabId, string> = {
  matches: '⚽ Mecze',
  players: '👥 Gracze',
  ranking: '🏆 Ranking',
};

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
}

export function Tabs({ active, onChange }: Props) {
  return (
    <nav className={styles.nav}>
      {(Object.keys(TAB_LABELS) as TabId[]).map(id => (
        <button
          key={id}
          className={`${styles.tab} ${active === id ? styles.active : ''}`}
          onClick={() => onChange(id)}
        >
          {TAB_LABELS[id]}
        </button>
      ))}
    </nav>
  );
}
