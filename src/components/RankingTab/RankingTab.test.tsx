import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useEffect } from 'react';
import { RankingTab } from './RankingTab';
import { AppProvider, useApp } from '../../context/AppContext';
import type { Score } from '../../context/types';

function Seeder({
  players,
  results,
  bets,
}: {
  players: string[];
  results: Record<number, Score>;
  bets: Record<string, Record<number, Score>>;
}) {
  const { dispatch } = useApp();
  useEffect(() => {
    players.forEach(p => dispatch({ type: 'ADD_PLAYER', payload: p }));
    Object.entries(results).forEach(([id, score]) =>
      dispatch({ type: 'SET_RESULT', payload: { id: Number(id), score } }),
    );
    Object.entries(bets).forEach(([player, matchBets]) =>
      Object.entries(matchBets).forEach(([id, score]) =>
        dispatch({ type: 'SET_BET', payload: { player, id: Number(id), score } }),
      ),
    );
  }, []);
  return null;
}

function renderRanking(
  players: string[] = [],
  results: Record<number, Score> = {},
  bets: Record<string, Record<number, Score>> = {},
) {
  return render(
    <AppProvider>
      <Seeder players={players} results={results} bets={bets} />
      <RankingTab />
    </AppProvider>,
  );
}

describe('RankingTab', () => {
  it('shows empty state when no players', () => {
    renderRanking();
    expect(screen.getByText(/dodaj graczy/i)).toBeInTheDocument();
  });

  it('renders players sorted by points descending', () => {
    renderRanking(
      ['Alice', 'Bob'],
      { 1: { home: '2', away: '1' } },
      {
        Alice: { 1: { home: '2', away: '1' } }, // exact → 10
        Bob:   { 1: { home: '3', away: '0' } }, // correct → 5
      },
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Alice');
    expect(items[1]).toHaveTextContent('Bob');
  });

  it('top player gets 🥇', () => {
    renderRanking(
      ['Alice', 'Bob'],
      { 1: { home: '1', away: '0' } },
      {
        Alice: { 1: { home: '1', away: '0' } }, // exact → 10
        Bob:   { 1: { home: '0', away: '2' } }, // miss  → 0
      },
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('🥇');
  });
});
