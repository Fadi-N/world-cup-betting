import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MatchCard } from './MatchCard';
import { AppProvider } from '../../context/AppContext';
import type { Match } from '../../context/types';

const NOW = 1_700_000_000_000;

const openMatch: Match = {
  id: 1, phase: 'group', section: 'Test', grp: 'A',
  home: 'Brazylia', away: 'Argentyna',
  date: '12.06.2026 21:00',
  ts: NOW + 10 * 60 * 1000,
};

const lockedMatch: Match = {
  ...openMatch,
  id: 2,
  ts: NOW + 3 * 60 * 1000,
};

const finishedMatch: Match = {
  ...openMatch,
  id: 3,
  ts: NOW - 60 * 60 * 1000,
};

function renderCard(match: Match, result?: { home: string; away: string }) {
  return render(
    <AppProvider>
      <MatchCard match={match} result={result} players={['Alice', 'Bob']} />
    </AppProvider>,
  );
}

describe('MatchCard', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders home team name', () => {
    renderCard(openMatch);
    expect(screen.getByText('Brazylia')).toBeInTheDocument();
  });

  it('renders away team name', () => {
    renderCard(openMatch);
    expect(screen.getByText('Argentyna')).toBeInTheDocument();
  });

  it('shows "otwarte" badge when no result and not locked', () => {
    renderCard(openMatch);
    expect(screen.getByText(/otwarte/i)).toBeInTheDocument();
  });

  it('shows "wynik" badge when result is set', () => {
    renderCard(finishedMatch, { home: '2', away: '1' });
    expect(screen.getByText(/wynik/i)).toBeInTheDocument();
  });

  it('bet inputs are disabled when match is locked', () => {
    renderCard(lockedMatch);
    const betInputs = screen.getAllByRole('textbox').filter(
      i => i.getAttribute('aria-label')?.includes('bet'),
    );
    expect(betInputs.length).toBeGreaterThan(0);
    betInputs.forEach(input => expect(input).toBeDisabled());
  });

  it('bet inputs are enabled when match is open', () => {
    renderCard(openMatch);
    const betInputs = screen.getAllByRole('textbox').filter(
      i => i.getAttribute('aria-label')?.includes('bet'),
    );
    betInputs.forEach(input => expect(input).not.toBeDisabled());
  });
});
