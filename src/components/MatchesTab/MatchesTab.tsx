import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MATCHES } from '../../data/matches';
import { resolveAllKnockoutTeams } from '../../lib/groupStandings';
import { Toolbar, type FilterMode } from './Toolbar';
import { LiveRankingBar } from './LiveRankingBar';
import { Legend } from './Legend';
import { MatchCard } from './MatchCard';
import styles from './MatchesTab.module.css';

export function MatchesTab() {
  const { state } = useApp();
  const [filter, setFilter] = useState<FilterMode>('all');

  const knockoutTeams = useMemo(
    () => resolveAllKnockoutTeams(MATCHES, state.results),
    [state.results],
  );

  const visible = MATCHES.filter(m => {
    const hasResult = !!state.results[m.id];
    if (filter === 'played') return hasResult;
    if (filter === 'open')   return !hasResult;
    return true;
  });

  let lastSection = '';

  return (
    <>
      <LiveRankingBar
        players={state.players}
        results={state.results}
        bets={state.bets}
      />
      <Toolbar mode={filter} onChange={setFilter} />
      <Legend />

      {visible.length === 0 && (
        <div className={styles.empty}>Brak meczów w tym filtrze.</div>
      )}

      {visible.map(m => {
        const showHeader = m.section !== lastSection;
        lastSection = m.section;
        return (
          <div key={m.id}>
            {showHeader && (
              <div className={styles.sectionHeader}>{m.section}</div>
            )}
            <MatchCard
              match={m}
              result={state.results[m.id]}
              players={state.players}
              displayHome={knockoutTeams.get(m.id)?.home}
              displayAway={knockoutTeams.get(m.id)?.away}
            />
          </div>
        );
      })}
    </>
  );
}
