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

function renderCard(
  match: Match,
  result?: { home: string; away: string },
  displayHome?: string,
  displayAway?: string,
) {
  return render(
    <AppProvider>
      <MatchCard
        match={match}
        result={result}
        players={['Alice', 'Bob']}
        displayHome={displayHome}
        displayAway={displayAway}
      />
    </AppProvider>,
  );
}

const knockoutMatch: Match = {
  id: 10, phase: 'r32', section: '1/32 finału', home: 'W73', away: 'W76',
  date: '4.07',
};

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

describe('MatchCard – displayHome / displayAway props', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows displayHome instead of match.home when provided', () => {
    renderCard(knockoutMatch, undefined, 'RPA', 'Kanada');
    expect(screen.getByText('RPA')).toBeInTheDocument();
    expect(screen.queryByText('W73')).not.toBeInTheDocument();
  });

  it('shows displayAway instead of match.away when provided', () => {
    renderCard(knockoutMatch, undefined, 'RPA', 'Kanada');
    expect(screen.getByText('Kanada')).toBeInTheDocument();
    expect(screen.queryByText('W76')).not.toBeInTheDocument();
  });

  it('falls back to match.home when displayHome is undefined', () => {
    renderCard(knockoutMatch, undefined, undefined, 'Kanada');
    expect(screen.getByText('W73')).toBeInTheDocument();
  });

  it('falls back to match.away when displayAway is undefined', () => {
    renderCard(knockoutMatch, undefined, 'RPA', undefined);
    expect(screen.getByText('W76')).toBeInTheDocument();
  });

  it('shows both placeholders when neither displayHome nor displayAway provided', () => {
    renderCard(knockoutMatch);
    expect(screen.getByText('W73')).toBeInTheDocument();
    expect(screen.getByText('W76')).toBeInTheDocument();
  });

  it('shows flag img when displayHome is a known country', () => {
    renderCard(knockoutMatch, undefined, 'Brazylia', 'Argentyna');
    const imgs = screen.getAllByRole('img');
    const alts = imgs.map(img => img.getAttribute('alt'));
    expect(alts).toContain('Brazylia');
    expect(alts).toContain('Argentyna');
  });

  it('does not show flag img for placeholder team names', () => {
    renderCard(knockoutMatch);
    const imgs = screen.queryAllByRole('img');
    expect(imgs).toHaveLength(0);
  });

  it('shows flag for resolved knockout team but not for unresolved', () => {
    // Only home resolved
    renderCard(knockoutMatch, undefined, 'RPA', undefined);
    const imgs = screen.queryAllByRole('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('alt')).toBe('RPA');
  });
});
