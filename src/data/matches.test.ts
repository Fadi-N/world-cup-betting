import { describe, it, expect } from 'vitest';
import { MATCHES } from './matches';

describe('MATCHES data integrity', () => {
  it('has exactly 104 matches', () => {
    expect(MATCHES).toHaveLength(104);
  });

  it('has no duplicate ids', () => {
    const ids = MATCHES.map(m => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(MATCHES.length);
  });

  it('all ids are positive integers', () => {
    MATCHES.forEach(m => {
      expect(m.id).toBeGreaterThan(0);
      expect(Number.isInteger(m.id)).toBe(true);
    });
  });

  it('group-stage matches (ids 1–72) all have grp', () => {
    const groupMatches = MATCHES.filter(m => m.id <= 72);
    expect(groupMatches).toHaveLength(72);
    groupMatches.forEach(m => {
      expect(m.grp).toBeTruthy();
    });
  });

  it('group-stage matches all have a numeric ts', () => {
    const groupMatches = MATCHES.filter(m => m.id <= 72);
    groupMatches.forEach(m => {
      expect(typeof m.ts).toBe('number');
      expect(m.ts).toBeGreaterThan(0);
    });
  });

  it('all matches have non-empty date strings', () => {
    MATCHES.forEach(m => {
      expect(m.date).toBeTruthy();
    });
  });

  it('all matches have non-empty home and away', () => {
    MATCHES.forEach(m => {
      expect(m.home).toBeTruthy();
      expect(m.away).toBeTruthy();
    });
  });

  it('group-stage matches all have non-empty home and away team names', () => {
    const groupMatches = MATCHES.filter(m => m.id <= 72);
    groupMatches.forEach(m => {
      expect(m.home.length).toBeGreaterThan(1);
      expect(m.away.length).toBeGreaterThan(1);
    });
  });

  it('knockout matches (ids 73–104) have correct phases', () => {
    const ko = MATCHES.filter(m => m.id > 72);
    expect(ko).toHaveLength(32);
    ko.forEach(m => {
      expect(['r32', 'r16', 'qf', 'sf', '3rd', 'final']).toContain(m.phase);
    });
  });

  it('has exactly 1 final match', () => {
    expect(MATCHES.filter(m => m.phase === 'final')).toHaveLength(1);
    expect(MATCHES.find(m => m.phase === 'final')?.id).toBe(104);
  });
});
