import styles from './MatchesTab.module.css';

export type FilterMode = 'all' | 'open' | 'played';

interface Props { mode: FilterMode; onChange: (m: FilterMode) => void }

export function Toolbar({ mode, onChange }: Props) {
  const buttons: { id: FilterMode; label: string }[] = [
    { id: 'all',    label: 'Wszystkie' },
    { id: 'open',   label: 'Bez wyniku' },
    { id: 'played', label: 'Rozegrane' },
  ];
  return (
    <div className={styles.toolbar}>
      <span style={{ fontSize: '12px', color: '#9aa0aa', marginRight: '2px' }}>Pokaż:</span>
      {buttons.map(b => (
        <button
          key={b.id}
          className={`${styles.filterBtn} ${mode === b.id ? styles.filterActive : ''}`}
          onClick={() => onChange(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
