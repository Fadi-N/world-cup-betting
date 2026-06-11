import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BetCell } from './BetCell';
import { AppProvider } from '../../context/AppContext';
import type { Match } from '../../context/types';

const NOW = 1_700_000_000_000;

const openMatch: Match = {
  id: 1,
  phase: 'group',
  section: 'Grupa A',
  grp: 'A',
  home: 'Brazylia',
  away: 'Argentyna',
  date: '12.06.2026 21:00',
  ts: NOW + 10 * 60 * 1000,
};

const lockedMatch: Match = {
  ...openMatch,
  id: 2,
  ts: NOW + 3 * 60 * 1000,
};

function renderCell(match: Match, result?: { home: string; away: string }) {
  return render(
    <AppProvider>
      <BetCell player="Alice" match={match} result={result} />
    </AppProvider>,
  );
}

describe('BetCell', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders player name', () => {
    renderCell(openMatch);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders home and away inputs', () => {
    renderCell(openMatch);
    expect(screen.getByRole('textbox', { name: 'Alice home bet' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Alice away bet' })).toBeInTheDocument();
  });

  it('inputs are enabled when match is open', () => {
    renderCell(openMatch);
    expect(screen.getByRole('textbox', { name: 'Alice home bet' })).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Alice away bet' })).not.toBeDisabled();
  });

  it('inputs are disabled when match is locked', () => {
    renderCell(lockedMatch);
    expect(screen.getByRole('textbox', { name: 'Alice home bet' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Alice away bet' })).toBeDisabled();
  });

  it('does not show points or fire badge when no result', () => {
    renderCell(openMatch);
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  it('does not show points when result is set but no bet exists', () => {
    renderCell(openMatch, { home: '2', away: '1' });
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });
});
