import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayersTab } from './PlayersTab';
import { AppProvider } from '../../context/AppContext';

// Never-resolving promise prevents async dispatch from firing outside act()
vi.mock('../../lib/firebase', () => ({
  savePlayers: vi.fn().mockReturnValue(new Promise(() => {})),
}));

function renderTab() {
  return render(
    <AppProvider>
      <PlayersTab />
    </AppProvider>,
  );
}

describe('PlayersTab', () => {
  it('shows empty state when no players', () => {
    renderTab();
    expect(screen.getByText(/brak graczy/i)).toBeInTheDocument();
  });

  it('adds a player and renders their name', () => {
    renderTab();
    const input = screen.getByPlaceholderText(/imię gracza/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /dodaj/i }));
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('ignores duplicate player names', () => {
    renderTab();
    const input = screen.getByPlaceholderText(/imię gracza/i);
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /dodaj/i }));
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /dodaj/i }));
    // Bob should appear exactly once as a player tag
    expect(screen.getAllByText(/👤 Bob/)).toHaveLength(1);
  });

  it('added player stays in the list (removal disabled)', () => {
    renderTab();
    const input = screen.getByPlaceholderText(/imię gracza/i);
    fireEvent.change(input, { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: /dodaj/i }));
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
    expect(screen.queryByTitle(/usuń Charlie/i)).not.toBeInTheDocument();
  });

  it('calls savePlayers when a player is added', async () => {
    const { savePlayers } = await import('../../lib/firebase');
    renderTab();
    const input = screen.getByPlaceholderText(/imię gracza/i);
    fireEvent.change(input, { target: { value: 'Diana' } });
    fireEvent.click(screen.getByRole('button', { name: /dodaj/i }));
    expect(savePlayers).toHaveBeenCalledWith(['Diana']);
  });
});
