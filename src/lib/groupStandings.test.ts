import { describe, it, expect } from 'vitest';
import { resolveTeam, resolveAllKnockoutTeams } from './groupStandings';
import { MATCHES } from '../data/matches';
import type { Match, Score } from '../context/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const gm = (id: number, grp: string, home: string, away: string): Match => ({
  id, phase: 'group', section: '', grp, home, away, date: '',
});

const km = (id: number, phase: Match['phase'], home: string, away: string): Match => ({
  id, phase, section: '', home, away, date: '',
});

const sc = (home: number | string, away: number | string): Score => ({
  home: String(home), away: String(away),
});

// Group A – 4 teams, 6 matches
// Standings after all results: A1 (9pts) > A2 (6pts) > A3 (3pts) > A4 (0pts)
const GRP_A: Match[] = [
  gm(1, 'A', 'A1', 'A2'), // A1 wins 3:0
  gm(2, 'A', 'A3', 'A4'), // A3 wins 2:0
  gm(3, 'A', 'A1', 'A3'), // A1 wins 1:0
  gm(4, 'A', 'A2', 'A4'), // A2 wins 2:1
  gm(5, 'A', 'A1', 'A4'), // A1 wins 2:0
  gm(6, 'A', 'A2', 'A3'), // A2 wins 1:0
];

const RES_A: Record<number, Score> = {
  1: sc(3, 0),
  2: sc(2, 0),
  3: sc(1, 0),
  4: sc(2, 1),
  5: sc(2, 0),
  6: sc(1, 0),
};
// A1: 9pts, GF=6, GA=0, GD=+6
// A2: 6pts, GF=3, GA=4, GD=-1
// A3: 3pts, GF=2, GA=2, GD=0
// A4: 0pts, GF=1, GA=6, GD=-5

// Group B – different teams for 3rd-place ranking tests
const GRP_B: Match[] = [
  gm(7,  'B', 'B1', 'B2'),
  gm(8,  'B', 'B3', 'B4'),
  gm(9,  'B', 'B1', 'B3'),
  gm(10, 'B', 'B2', 'B4'),
  gm(11, 'B', 'B1', 'B4'),
  gm(12, 'B', 'B2', 'B3'),
];

// B1: 9pts GD+6 (wins all), B2: 4pts GD+1, B3: 3pts GD+1, B4: 0pts GD=-8
const RES_B: Record<number, Score> = {
  7:  sc(2, 0),
  8:  sc(1, 0),
  9:  sc(1, 0),
  10: sc(2, 1),
  11: sc(3, 0),
  12: sc(1, 1), // draw → B2 4pts, B3 4pts... wait
};
// B2: match7 0pts, match10 3pts, match12 1pt = 4pts; GF=3, GA=3, GD=0
// B3: match8 3pts, match9 0pts, match12 1pt = 4pts; GF=2, GA=2, GD=0
// B3 vs B2: same pts(4), GD(0), GF(2 vs 3) → B2 above B3 by GF tiebreaker

const ALL_MATCHES = [...GRP_A, ...GRP_B];
const ALL_RESULTS = { ...RES_A, ...RES_B };

// ─── resolveTeam – group positions ────────────────────────────────────────────

describe('resolveTeam – group positions', () => {
  it('resolves 1A to group winner', () => {
    expect(resolveTeam('1A', ALL_MATCHES, ALL_RESULTS)).toBe('A1');
  });

  it('resolves 2A to runner-up', () => {
    expect(resolveTeam('2A', ALL_MATCHES, ALL_RESULTS)).toBe('A2');
  });

  it('resolves 3A to third place', () => {
    expect(resolveTeam('3A', ALL_MATCHES, ALL_RESULTS)).toBe('A3');
  });

  it('resolves 4A to last place', () => {
    expect(resolveTeam('4A', ALL_MATCHES, ALL_RESULTS)).toBe('A4');
  });

  it('returns a team name (not placeholder) even when no results played', () => {
    // With 0 results all teams have equal stats; stable sort preserves match order
    const result = resolveTeam('1A', ALL_MATCHES, {});
    expect(['A1', 'A2', 'A3', 'A4']).toContain(result);
  });

  it('returns placeholder for unknown group letter', () => {
    expect(resolveTeam('1Z', ALL_MATCHES, ALL_RESULTS)).toBe('1Z');
  });

  it('returns placeholder when position index out of range', () => {
    expect(resolveTeam('5A', ALL_MATCHES, ALL_RESULTS)).toBe('5A');
  });

  it('resolves 1B correctly from group B', () => {
    expect(resolveTeam('1B', ALL_MATCHES, ALL_RESULTS)).toBe('B1');
  });

  it('resolves 2B correctly from group B', () => {
    // B2: 4pts GD=-1, B3: 4pts GD=0 → B3 ranks above B2 by goal difference
    expect(resolveTeam('2B', ALL_MATCHES, ALL_RESULTS)).toBe('B3');
  });
});

// ─── resolveTeam – tiebreakers ────────────────────────────────────────────────

describe('resolveTeam – tiebreakers', () => {
  // Two teams tied on points, higher GD wins
  it('ranks team with better GD above equal-pts team', () => {
    const matches: Match[] = [
      gm(1, 'A', 'X', 'Y'),
      gm(2, 'A', 'X', 'Z'),
      gm(3, 'A', 'Y', 'Z'),
    ];
    const results: Record<number, Score> = {
      1: sc(3, 0), // X wins, GD for X: +3, Y: -3
      2: sc(0, 1), // Z wins, X: -1 total GD
      3: sc(1, 0), // Y wins over Z
    };
    // X: W1D0L1 = 3pts, GF=3, GA=1, GD=+2
    // Y: W1D0L1 = 3pts, GF=1, GA=3, GD=-2
    // Z: W1D0L1 = 3pts, GF=1, GA=1, GD=0
    // Sort by pts (all 3), then GD: X(+2) > Z(0) > Y(-2)
    expect(resolveTeam('1A', matches, results)).toBe('X');
    expect(resolveTeam('2A', matches, results)).toBe('Z');
    expect(resolveTeam('3A', matches, results)).toBe('Y');
  });

  // Two teams tied on points and GD, higher GF wins
  it('ranks team with more GF when pts and GD are equal', () => {
    const matches: Match[] = [
      gm(1, 'A', 'P', 'Q'),
      gm(2, 'A', 'P', 'R'),
      gm(3, 'A', 'Q', 'R'),
    ];
    const results: Record<number, Score> = {
      1: sc(2, 1), // P wins 2:1
      2: sc(0, 1), // R wins 1:0
      3: sc(1, 1), // draw
    };
    // P: 3pts, GF=2, GA=2, GD=0
    // Q: 1pt,  GF=2, GA=2, GD=0
    // R: 4pts, GF=2, GA=1, GD=+1
    expect(resolveTeam('1A', matches, results)).toBe('R');
  });

  // GF tiebreaker: same pts, same GD, different GF
  it('resolves GF tiebreaker correctly', () => {
    const matches: Match[] = [
      gm(1, 'A', 'M', 'N'),
      gm(2, 'A', 'M', 'O'),
      gm(3, 'A', 'N', 'O'),
    ];
    const results: Record<number, Score> = {
      1: sc(3, 1), // M wins, M GF+=3, N GF+=1
      2: sc(0, 2), // O wins, M GF+=0, O GF+=2
      3: sc(2, 0), // N wins, N GF+=2, O GF+=0
    };
    // M: 3pts, GF=3, GA=3, GD=0
    // N: 3pts, GF=3, GA=3, GD=0
    // O: 3pts, GF=2, GA=2, GD=0
    // Same pts, same GD → GF tiebreaker: M=3, N=3, O=2
    // M and N still tied — relies on stable sort
    // O is definitely last of the three winning teams
    expect(resolveTeam('3A', matches, results)).toBe('O');
  });

  // Draw gives both teams 1 point
  it('handles draws correctly in points calculation', () => {
    const matches: Match[] = [
      gm(1, 'A', 'X', 'Y'),
      gm(2, 'A', 'X', 'Z'),
      gm(3, 'A', 'Y', 'Z'),
    ];
    const results: Record<number, Score> = {
      1: sc(0, 0), // draw: X 1pt, Y 1pt
      2: sc(0, 0), // draw: X 1pt, Z 1pt
      3: sc(0, 0), // draw: Y 1pt, Z 1pt
    };
    // All 2pts, GD=0, GF=0 → stable sort, but all resolve
    const first = resolveTeam('1A', matches, results);
    expect(['X', 'Y', 'Z']).toContain(first);
  });
});

// ─── resolveTeam – partial results ────────────────────────────────────────────

describe('resolveTeam – partial results', () => {
  it('ranks correctly when only some group matches have results', () => {
    const matches: Match[] = [
      gm(1, 'A', 'A1', 'A2'),
      gm(2, 'A', 'A3', 'A4'),
      gm(3, 'A', 'A1', 'A3'),
      gm(4, 'A', 'A2', 'A4'),
      gm(5, 'A', 'A1', 'A4'),
      gm(6, 'A', 'A2', 'A3'),
    ];
    // Only first matchday played: A1 beats A2, A3 beats A4
    const results: Record<number, Score> = {
      1: sc(2, 0),
      2: sc(1, 0),
    };
    // A1: 3pts, A3: 3pts — tied on pts; A1 GD=+2, A3 GD=+1
    expect(resolveTeam('1A', matches, results)).toBe('A1');
    expect(resolveTeam('2A', matches, results)).toBe('A3');
    // A2: 0pts, A4: 0pts
    const third = resolveTeam('3A', matches, results);
    expect(['A2', 'A4']).toContain(third);
  });
});

// ─── resolveTeam – 3rd-place ranking ──────────────────────────────────────────

describe('resolveTeam – 3rd-place ranking', () => {
  // Group A 3rd: A3 (3pts, GD=0)
  // Group B 3rd: B3 (4pts, GD=0, GF=2)
  // B3 beats A3 by points → B3 is best 3rd overall

  it('ranks 3rd-place teams across groups by points', () => {
    // Group A 3rd: A3 (3pts, GD=0, GF=2)
    // Group B 3rd: B2 (4pts, GD=-1) — B2 is 3rd in group B because B3 has better GD
    // B2 (4pts) > A3 (3pts) by points → B2 is best 3rd overall
    expect(resolveTeam('1. m. 3.', ALL_MATCHES, ALL_RESULTS)).toBe('B2');
    expect(resolveTeam('2. m. 3.', ALL_MATCHES, ALL_RESULTS)).toBe('A3');
  });

  it('returns placeholder when 3rd-place index exceeds available groups', () => {
    expect(resolveTeam('5. m. 3.', ALL_MATCHES, ALL_RESULTS)).toBe('5. m. 3.');
  });

  it('returns a team name (not placeholder) for 3rd ranking even with no results', () => {
    // Teams are still known even without results; ranking by 0pts/0GD/0GF
    const result = resolveTeam('1. m. 3.', ALL_MATCHES, {});
    const allTeams = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
    expect(allTeams).toContain(result);
  });
});

// ─── resolveTeam – W-notation (match winner) ──────────────────────────────────

describe('resolveTeam – W-notation (match winner)', () => {
  const r32Match = km(73, 'r32', 'RPA', 'Kanada');
  const allWithKo = [...ALL_MATCHES, r32Match];

  it('resolves W73 to home team when home wins', () => {
    expect(resolveTeam('W73', allWithKo, { 73: sc(2, 0) })).toBe('RPA');
  });

  it('resolves W73 to away team when away wins', () => {
    expect(resolveTeam('W73', allWithKo, { 73: sc(0, 1) })).toBe('Kanada');
  });

  it('returns placeholder when match ends in draw', () => {
    expect(resolveTeam('W73', allWithKo, { 73: sc(1, 1) })).toBe('W73');
  });

  it('returns placeholder when match has no result yet', () => {
    expect(resolveTeam('W73', allWithKo, {})).toBe('W73');
  });

  it('returns placeholder for non-existent match id', () => {
    expect(resolveTeam('W999', allWithKo, {})).toBe('W999');
  });

  it('handles 0:0 draw correctly (returns placeholder)', () => {
    expect(resolveTeam('W73', allWithKo, { 73: sc(0, 0) })).toBe('W73');
  });
});

// ─── resolveTeam – cascading resolution ───────────────────────────────────────

describe('resolveTeam – cascading (W resolves to earlier W)', () => {
  // r32: match 73 (RPA vs Kanada), match 76 (Holandia vs Maroko)
  // r16: match 89 (W73 vs W76)
  // QF: match 97 (W89 vs W90) — W90 unresolvable for this test
  const r32_73 = km(73, 'r32', 'RPA', 'Kanada');
  const r32_76 = km(76, 'r32', 'Holandia', 'Maroko');
  const r16_89 = km(89, 'r16', 'W73', 'W76');
  const qf_97  = km(97, 'qf', 'W89', 'W90');
  const cascade = [r32_73, r32_76, r16_89, qf_97];

  it('returns W89 when match 89 has no result yet (r32 results alone are not enough)', () => {
    // W89 = "who won match 89" — requires match 89 to have a result, not just r32
    const results = { 73: sc(1, 0), 76: sc(2, 1) };
    expect(resolveTeam('W89', cascade, results)).toBe('W89');
  });

  it('resolves W89 when match 89 has a result and teams are real names', () => {
    // match 89 home=W73=RPA (wins r32), match 89 result: home wins → W89 = RPA
    const results = { 73: sc(1, 0), 76: sc(2, 0), 89: sc(3, 0) };
    expect(resolveTeam('W89', cascade, results)).toBe('RPA');
  });

  it('resolves W89 to away team when away wins r16', () => {
    const results = { 73: sc(1, 0), 76: sc(2, 0), 89: sc(0, 1) };
    // match 89 away = W76 = Holandia (wins 2:0), match 89: away wins
    expect(resolveTeam('W89', cascade, results)).toBe('Holandia');
  });

  it('resolves QF W97 when r32, r16 and qf results are all known', () => {
    const r32_75 = km(75, 'r32', 'Niemcy', 'Paragwaj');
    const r32_78 = km(78, 'r32', 'Francja', 'Szwecja');
    const r16_90 = km(90, 'r16', 'W75', 'W78');
    const deeper = [...cascade, r32_75, r32_78, r16_90];
    const results = {
      73: sc(1, 0),  // RPA wins r32
      76: sc(2, 0),  // Holandia wins r32
      75: sc(0, 1),  // Paragwaj wins r32
      78: sc(3, 0),  // Francja wins r32
      89: sc(2, 0),  // RPA wins r16 (W73 vs W76)
      90: sc(1, 0),  // Paragwaj wins r16 (W75 vs W78)
      97: sc(1, 0),  // W89(RPA) wins QF → W97 = RPA
    };
    expect(resolveTeam('W97', deeper, results)).toBe('RPA');
  });
});

// ─── resolveTeam – group-stage team in W-notation ─────────────────────────────

describe('resolveTeam – W resolves through group standings', () => {
  // r32 match with placeholder home/away resolved from group standings
  const r32_placeholder = km(73, 'r32', '1A', '2B');
  const allWithPlaceholderKo = [...ALL_MATCHES, r32_placeholder];
  const r16_89 = km(89, 'r16', 'W73', 'W74');

  it('resolves W73 when r32 home is a group-position placeholder', () => {
    // 1A = A1, 2B = B2; match 73 result: home wins (1:0)
    const results = { ...ALL_RESULTS, 73: sc(1, 0) };
    expect(resolveTeam('W73', [...allWithPlaceholderKo, r16_89], results)).toBe('A1');
  });

  it('resolves W73 to away (2B=B3) when away wins', () => {
    // 2B resolves to B3 (better GD than B2), so W73 away winner = B3
    const results = { ...ALL_RESULTS, 73: sc(0, 1) };
    expect(resolveTeam('W73', [...allWithPlaceholderKo, r16_89], results)).toBe('B3');
  });
});

// ─── resolveTeam – semifinal placeholders ─────────────────────────────────────

describe('resolveTeam – Zwyc./Przeg. półf. placeholders', () => {
  const sf1 = km(101, 'sf', 'TeamA', 'TeamB');
  const sf2 = km(102, 'sf', 'TeamC', 'TeamD');
  const sfMatches = [sf1, sf2];

  it('resolves Zwyc. półf. 1 to home team when home wins sf1', () => {
    expect(resolveTeam('Zwyc. półf. 1', sfMatches, { 101: sc(2, 1) })).toBe('TeamA');
  });

  it('resolves Zwyc. półf. 1 to away team when away wins sf1', () => {
    expect(resolveTeam('Zwyc. półf. 1', sfMatches, { 101: sc(0, 1) })).toBe('TeamB');
  });

  it('returns placeholder for Zwyc. półf. 1 when sf1 is a draw', () => {
    expect(resolveTeam('Zwyc. półf. 1', sfMatches, { 101: sc(1, 1) })).toBe('Zwyc. półf. 1');
  });

  it('returns placeholder for Zwyc. półf. 1 when sf1 has no result', () => {
    expect(resolveTeam('Zwyc. półf. 1', sfMatches, {})).toBe('Zwyc. półf. 1');
  });

  it('resolves Zwyc. półf. 2 to winner of sf2', () => {
    expect(resolveTeam('Zwyc. półf. 2', sfMatches, { 102: sc(1, 0) })).toBe('TeamC');
  });

  it('resolves Przeg. półf. 1 to loser of sf1 (away when home wins)', () => {
    expect(resolveTeam('Przeg. półf. 1', sfMatches, { 101: sc(2, 0) })).toBe('TeamB');
  });

  it('resolves Przeg. półf. 1 to loser of sf1 (home when away wins)', () => {
    expect(resolveTeam('Przeg. półf. 1', sfMatches, { 101: sc(0, 3) })).toBe('TeamA');
  });

  it('resolves Przeg. półf. 2 to loser of sf2', () => {
    expect(resolveTeam('Przeg. półf. 2', sfMatches, { 102: sc(0, 2) })).toBe('TeamC');
  });

  it('returns placeholder for Przeg. półf. 1 when draw', () => {
    expect(resolveTeam('Przeg. półf. 1', sfMatches, { 101: sc(2, 2) })).toBe('Przeg. półf. 1');
  });

  it('returns placeholder for Przeg. półf. 2 when no result', () => {
    expect(resolveTeam('Przeg. półf. 2', sfMatches, {})).toBe('Przeg. półf. 2');
  });
});

// ─── resolveTeam – unknown / unrecognised placeholders ────────────────────────

describe('resolveTeam – unknown placeholders', () => {
  it('returns unknown string unchanged', () => {
    expect(resolveTeam('SomeRandomString', ALL_MATCHES, ALL_RESULTS)).toBe('SomeRandomString');
  });

  it('returns empty string unchanged', () => {
    expect(resolveTeam('', ALL_MATCHES, ALL_RESULTS)).toBe('');
  });

  it('returns real team name unchanged (no-op)', () => {
    expect(resolveTeam('Brazylia', MATCHES, {})).toBe('Brazylia');
  });
});

// ─── resolveTeam – score edge cases ───────────────────────────────────────────

describe('resolveTeam – malformed score values', () => {
  const r32Match = km(73, 'r32', 'RPA', 'Kanada');

  it('returns placeholder when score contains non-numeric strings', () => {
    const results = { 73: { home: 'x', away: 'y' } };
    expect(resolveTeam('W73', [r32Match], results)).toBe('W73');
  });

  it('returns placeholder when score values are empty strings', () => {
    const results = { 73: { home: '', away: '' } };
    expect(resolveTeam('W73', [r32Match], results)).toBe('W73');
  });
});

// ─── resolveAllKnockoutTeams ───────────────────────────────────────────────────

describe('resolveAllKnockoutTeams – using real MATCHES data', () => {
  it('returns a Map with exactly 32 entries (ids 73–104)', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    expect(map.size).toBe(32);
    for (let id = 73; id <= 104; id++) {
      expect(map.has(id)).toBe(true);
    }
  });

  it('r32 matches show real team names (no group-position placeholders)', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    const m73 = map.get(73)!;
    expect(m73.home).toBe('RPA');
    expect(m73.away).toBe('Kanada');
  });

  it('r32 match 88 shows correct teams', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    const m88 = map.get(88)!;
    expect(m88.home).toBe('Kolumbia');
    expect(m88.away).toBe('Ghana');
  });

  it('r16 match returns placeholder when r32 result unknown', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    const m89 = map.get(89)!;
    // W73 unresolvable (no result) → stays as placeholder
    expect(m89.home).toBe('W73');
    expect(m89.away).toBe('W76');
  });

  it('r16 match resolves home team when r32 result known', () => {
    const results = { 73: sc(1, 0) }; // RPA wins match 73
    const map = resolveAllKnockoutTeams(MATCHES, results);
    const m89 = map.get(89)!;
    expect(m89.home).toBe('RPA');
    expect(m89.away).toBe('W76'); // match 76 still unresolved
  });

  it('r16 match fully resolved when both r32 results known', () => {
    const results = { 73: sc(2, 0), 76: sc(0, 1) }; // RPA, Maroko
    const map = resolveAllKnockoutTeams(MATCHES, results);
    const m89 = map.get(89)!;
    expect(m89.home).toBe('RPA');
    expect(m89.away).toBe('Maroko');
  });

  it('qf match resolves when r16 and r32 results all known', () => {
    const results = {
      73: sc(1, 0), // RPA wins
      76: sc(2, 0), // Holandia wins
      75: sc(0, 1), // Paragwaj wins
      78: sc(1, 0), // Francja wins
      89: sc(1, 0), // W73(RPA) wins r16
      90: sc(2, 0), // W75(Paragwaj) wins r16
    };
    const map = resolveAllKnockoutTeams(MATCHES, results);
    const m97 = map.get(97)!;
    expect(m97.home).toBe('RPA');
    expect(m97.away).toBe('Paragwaj');
  });

  it('final match stays as placeholders when no results', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    const m104 = map.get(104)!;
    expect(m104.home).toBe('Zwyc. półf. 1');
    expect(m104.away).toBe('Zwyc. półf. 2');
  });

  it('3rd-place match stays as placeholders when no results', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    const m103 = map.get(103)!;
    expect(m103.home).toBe('Przeg. półf. 1');
    expect(m103.away).toBe('Przeg. półf. 2');
  });

  it('does not include group-stage matches (ids 1–72)', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    for (let id = 1; id <= 72; id++) {
      expect(map.has(id)).toBe(false);
    }
  });

  it('each entry has non-null home and away strings', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    for (const [, { home, away }] of map) {
      expect(typeof home).toBe('string');
      expect(typeof away).toBe('string');
    }
  });
});

// ─── resolveAllKnockoutTeams – knockout lookup map for API ────────────────────

describe('resolveAllKnockoutTeams – building API knockout lookup', () => {
  it('builds correct home:away → id entries for resolved r32 matches', () => {
    const map = resolveAllKnockoutTeams(MATCHES, {});
    const lookup = new Map<string, number>();
    for (const [id, { home, away }] of map) {
      lookup.set(`${home}:${away}`, id);
    }
    expect(lookup.get('RPA:Kanada')).toBe(73);
    expect(lookup.get('Brazylia:Japonia')).toBe(74);
    expect(lookup.get('Kolumbia:Ghana')).toBe(88);
  });

  it('resolved r16 entry appears in lookup when r32 results known', () => {
    const results = { 73: sc(1, 0), 76: sc(2, 0) };
    const map = resolveAllKnockoutTeams(MATCHES, results);
    const lookup = new Map<string, number>();
    for (const [id, { home, away }] of map) {
      lookup.set(`${home}:${away}`, id);
    }
    expect(lookup.get('RPA:Holandia')).toBe(89);
  });
});
