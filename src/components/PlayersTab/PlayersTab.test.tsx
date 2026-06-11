import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PlayersTab } from './PlayersTab';
import { AppProvider } from '../../context/AppContext';

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

  it('removes a player when × button clicked', () => {
    renderTab();
    const input = screen.getByPlaceholderText(/imię gracza/i);
    fireEvent.change(input, { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: /dodaj/i }));
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/usuń Charlie/i));
    expect(screen.queryByText(/Charlie/)).not.toBeInTheDocument();
  });
});
