import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { outcome, isLocked, calcAllPts } from './scoring';
import type { Match } from '../context/types';

const mockMatch = (ts: number): Match => ({
  id: 1, phase: 'group', section: 'Test', grp: 'A',
  home: 'TeamA', away: 'TeamB',
  date: '01.01.2026', ts,
});

describe('outcome()', () => {
  it('returns H when home wins', () => expect(outcome('2', '1')).toBe('H'));
  it('returns A when away wins', () => expect(outcome('0', '1')).toBe('A'));
  it('returns D on draw', () => expect(outcome('1', '1')).toBe('D'));
  it('returns null for empty home', () => expect(outcome('', '1')).toBeNull());
  it('returns null for empty away', () => expect(outcome('2', '')).toBeNull());
  it('returns null when both empty', () => expect(outcome('', '')).toBeNull());
  it('returns null for NaN home', () => expect(outcome('x', '1')).toBeNull());
  it('returns null for NaN away', () => expect(outcome('1', 'x')).toBeNull());
  it('handles 0-0', () => expect(outcome('0', '0')).toBe('D'));
});

describe('isLocked()', () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => { vi.useRealTimers(); });

  it('is NOT locked 6 minutes before kick-off', () => {
    expect(isLocked(mockMatch(NOW + 6 * 60 * 1000))).toBe(false);
  });

  it('is NOT locked exactly 5 minutes 1 second before kick-off', () => {
    expect(isLocked(mockMatch(NOW + 5 * 60 * 1000 + 1000))).toBe(false);
  });

  it('IS locked exactly 5 minutes before kick-off', () => {
    expect(isLocked(mockMatch(NOW + 5 * 60 * 1000))).toBe(true);
  });

  it('IS locked 4 minutes before kick-off', () => {
    expect(isLocked(mockMatch(NOW + 4 * 60 * 1000))).toBe(true);
  });

  it('IS locked after kick-off', () => {
    expect(isLocked(mockMatch(NOW - 1000))).toBe(true);
  });

  it('returns false when ts is undefined', () => {
    const m: Match = { id: 1, phase: 'r32', section: 'Test', home: 'W1', away: 'W2', date: '01.01.2026' };
    expect(isLocked(m)).toBe(false);
  });
});

describe('calcAllPts()', () => {
  it('returns empty object when no players', () => {
    expect(calcAllPts([], {}, {})).toEqual({});
  });

  it('returns 0 pts for a miss', () => {
    const result = calcAllPts(
      ['Alice'],
      { 1: { home: '2', away: '1' } },
      { Alice: { 1: { home: '0', away: '3' } } },
    );
    expect(result).toEqual({ Alice: 0 });
  });

  it('returns 5 pts for correct outcome (not exact)', () => {
    const result = calcAllPts(
      ['Alice'],
      { 1: { home: '2', away: '1' } },
      { Alice: { 1: { home: '3', away: '0' } } },
    );
    expect(result).toEqual({ Alice: 5 });
  });

  it('returns 10 pts for exact score', () => {
    const result = calcAllPts(
      ['Alice'],
      { 1: { home: '2', away: '1' } },
      { Alice: { 1: { home: '2', away: '1' } } },
    );
    expect(result).toEqual({ Alice: 10 });
  });

  it('two consecutive correct outcomes → 15 pts (5 + 5×2)', () => {
    const result = calcAllPts(
      ['Alice'],
      { 1: { home: '2', away: '1' }, 2: { home: '1', away: '0' } },
      { Alice: { 1: { home: '3', away: '0' }, 2: { home: '2', away: '1' } } },
    );
    expect(result).toEqual({ Alice: 15 });
  });

  it('three consecutive exact scores → 60 pts (10 + 10×2 + 10×3)', () => {
    const result = calcAllPts(
      ['Alice'],
      {
        1: { home: '1', away: '0' },
        2: { home: '2', away: '1' },
        3: { home: '0', away: '0' },
      },
      {
        Alice: {
          1: { home: '1', away: '0' },
          2: { home: '2', away: '1' },
          3: { home: '0', away: '0' },
        },
      },
    );
    expect(result).toEqual({ Alice: 60 });
  });

  it('streak broken by miss resets multiplier', () => {
    // exact, exact, MISS, exact → 10 + 20 + 0 + 10 = 40 pts
    const result = calcAllPts(
      ['Alice'],
      {
        1: { home: '1', away: '0' },
        2: { home: '1', away: '0' },
        3: { home: '1', away: '0' },
        4: { home: '1', away: '0' },
      },
      {
        Alice: {
          1: { home: '1', away: '0' },
          2: { home: '1', away: '0' },
          3: { home: '0', away: '2' }, // opposite outcome
          4: { home: '1', away: '0' },
        },
      },
    );
    expect(result).toEqual({ Alice: 40 });
  });

  it('scores multiple players independently', () => {
    const result = calcAllPts(
      ['Alice', 'Bob'],
      { 1: { home: '2', away: '1' } },
      {
        Alice: { 1: { home: '2', away: '1' } }, // exact → 10
        Bob:   { 1: { home: '0', away: '3' } }, // miss  → 0
      },
    );
    expect(result).toEqual({ Alice: 10, Bob: 0 });
  });

  it('ignores matches without a result', () => {
    const result = calcAllPts(
      ['Alice'],
      {},
      { Alice: { 1: { home: '1', away: '0' } } },
    );
    expect(result).toEqual({ Alice: 0 });
  });

  it('does not crash when a result value is null (corrupt Firebase data)', () => {
    const results = { 1: null } as unknown as Record<number, import('../context/types').Score>;
    expect(() => calcAllPts(['Alice'], results, {})).not.toThrow();
    expect(calcAllPts(['Alice'], results, {})).toEqual({ Alice: 0 });
  });
});
