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

  it('has exactly 16 r32 matches', () => {
    expect(MATCHES.filter(m => m.phase === 'r32')).toHaveLength(16);
  });

  it('has exactly 8 r16 matches', () => {
    expect(MATCHES.filter(m => m.phase === 'r16')).toHaveLength(8);
  });

  it('has exactly 4 qf matches', () => {
    expect(MATCHES.filter(m => m.phase === 'qf')).toHaveLength(4);
  });

  it('has exactly 2 sf matches', () => {
    expect(MATCHES.filter(m => m.phase === 'sf')).toHaveLength(2);
  });

  it('has exactly 1 third-place match', () => {
    expect(MATCHES.filter(m => m.phase === '3rd')).toHaveLength(1);
  });
});

describe('MATCHES – r32 bracket integrity', () => {
  const r32 = MATCHES.filter(m => m.phase === 'r32');

  it('r32 matches have real team names (no group-position placeholders)', () => {
    const placeholderPattern = /^\d+[A-L]$|m\. 3\./;
    r32.forEach(m => {
      expect(m.home).not.toMatch(placeholderPattern);
      expect(m.away).not.toMatch(placeholderPattern);
    });
  });

  it('match 73 is RPA vs Kanada on 28.06', () => {
    const m = MATCHES.find(m => m.id === 73)!;
    expect(m.home).toBe('RPA');
    expect(m.away).toBe('Kanada');
    expect(m.date).toBe('28.06');
  });

  it('match 88 is Kolumbia vs Ghana', () => {
    const m = MATCHES.find(m => m.id === 88)!;
    expect(m.home).toBe('Kolumbia');
    expect(m.away).toBe('Ghana');
  });

  it('all 32 unique teams appear in r32', () => {
    const teams = new Set<string>();
    r32.forEach(m => { teams.add(m.home); teams.add(m.away); });
    expect(teams.size).toBe(32);
  });

  it('no team appears twice in r32', () => {
    const teams: string[] = [];
    r32.forEach(m => { teams.push(m.home, m.away); });
    expect(teams.length).toBe(new Set(teams).size);
  });
});

describe('MATCHES – r16 bracket integrity', () => {
  const r16 = MATCHES.filter(m => m.phase === 'r16');

  it('r16 home/away use W-notation referencing r32 match ids', () => {
    const wPattern = /^W\d+$/;
    r16.forEach(m => {
      expect(m.home).toMatch(wPattern);
      expect(m.away).toMatch(wPattern);
    });
  });

  it('r16 W-references point to valid r32 match ids', () => {
    const r32Ids = new Set(MATCHES.filter(m => m.phase === 'r32').map(m => m.id));
    r16.forEach(m => {
      const homeId = parseInt(m.home.slice(1), 10);
      const awayId = parseInt(m.away.slice(1), 10);
      expect(r32Ids.has(homeId)).toBe(true);
      expect(r32Ids.has(awayId)).toBe(true);
    });
  });

  it('each r32 match feeds exactly one r16 slot', () => {
    const r16Refs = new Set<number>();
    MATCHES.filter(m => m.phase === 'r16').forEach(m => {
      r16Refs.add(parseInt(m.home.slice(1), 10));
      r16Refs.add(parseInt(m.away.slice(1), 10));
    });
    expect(r16Refs.size).toBe(16);
  });

  it('match 89 is W73 vs W76 (verified bracket)', () => {
    const m = MATCHES.find(m => m.id === 89)!;
    expect(m.home).toBe('W73');
    expect(m.away).toBe('W76');
  });

  it('match 92 is W79 vs W80 on 6.07', () => {
    const m = MATCHES.find(m => m.id === 92)!;
    expect(m.home).toBe('W79');
    expect(m.away).toBe('W80');
    expect(m.date).toBe('6.07');
  });

  it('match 95 is W87 vs W86', () => {
    const m = MATCHES.find(m => m.id === 95)!;
    expect(m.home).toBe('W87');
    expect(m.away).toBe('W86');
  });

  it('match 96 is W85 vs W88', () => {
    const m = MATCHES.find(m => m.id === 96)!;
    expect(m.home).toBe('W85');
    expect(m.away).toBe('W88');
  });
});

describe('MATCHES – qf bracket integrity', () => {
  it('match 97 is W89 vs W90', () => {
    const m = MATCHES.find(m => m.id === 97)!;
    expect(m.home).toBe('W89');
    expect(m.away).toBe('W90');
  });

  it('match 98 is W93 vs W94', () => {
    const m = MATCHES.find(m => m.id === 98)!;
    expect(m.home).toBe('W93');
    expect(m.away).toBe('W94');
  });

  it('match 99 is W91 vs W92', () => {
    const m = MATCHES.find(m => m.id === 99)!;
    expect(m.home).toBe('W91');
    expect(m.away).toBe('W92');
  });

  it('match 100 is W95 vs W96', () => {
    const m = MATCHES.find(m => m.id === 100)!;
    expect(m.home).toBe('W95');
    expect(m.away).toBe('W96');
  });

  it('qf W-references point to valid r16 match ids', () => {
    const r16Ids = new Set(MATCHES.filter(m => m.phase === 'r16').map(m => m.id));
    MATCHES.filter(m => m.phase === 'qf').forEach(m => {
      expect(r16Ids.has(parseInt(m.home.slice(1), 10))).toBe(true);
      expect(r16Ids.has(parseInt(m.away.slice(1), 10))).toBe(true);
    });
  });
});

describe('MATCHES – full bracket chain integrity', () => {
  it('every match in later rounds references a match from the previous round', () => {
    const byPhase: Record<string, number[]> = {};
    MATCHES.filter(m => m.id > 72).forEach(m => {
      (byPhase[m.phase] ??= []).push(m.id);
    });

    const r32Ids = new Set(byPhase['r32']);
    const r16Ids = new Set(byPhase['r16']);
    const qfIds  = new Set(byPhase['qf']);
    const sfIds  = new Set(byPhase['sf']);

    // r16 refs → r32
    MATCHES.filter(m => m.phase === 'r16').forEach(m => {
      expect(r32Ids.has(parseInt(m.home.slice(1), 10))).toBe(true);
      expect(r32Ids.has(parseInt(m.away.slice(1), 10))).toBe(true);
    });

    // qf refs → r16
    MATCHES.filter(m => m.phase === 'qf').forEach(m => {
      expect(r16Ids.has(parseInt(m.home.slice(1), 10))).toBe(true);
      expect(r16Ids.has(parseInt(m.away.slice(1), 10))).toBe(true);
    });

    // sf refs → qf
    MATCHES.filter(m => m.phase === 'sf').forEach(m => {
      expect(qfIds.has(parseInt(m.home.slice(1), 10))).toBe(true);
      expect(qfIds.has(parseInt(m.away.slice(1), 10))).toBe(true);
    });

    // final refs → sf winners
    const finalMatch = MATCHES.find(m => m.phase === 'final')!;
    expect(finalMatch.home).toBe('Zwyc. półf. 1');
    expect(finalMatch.away).toBe('Zwyc. półf. 2');

    // 3rd place refs → sf losers
    const thirdMatch = MATCHES.find(m => m.phase === '3rd')!;
    expect(thirdMatch.home).toBe('Przeg. półf. 1');
    expect(thirdMatch.away).toBe('Przeg. półf. 2');

    // sf uses W-notation to qf
    MATCHES.filter(m => m.phase === 'sf').forEach(m => {
      expect(/^W\d+$/.test(m.home)).toBe(true);
      expect(/^W\d+$/.test(m.away)).toBe(true);
      expect(qfIds.has(parseInt(m.home.slice(1), 10))).toBe(true);
      expect(qfIds.has(parseInt(m.away.slice(1), 10))).toBe(true);
    });

    // All 16 r32 matches feed into r16
    const r16Refs = new Set<number>();
    MATCHES.filter(m => m.phase === 'r16').forEach(m => {
      r16Refs.add(parseInt(m.home.slice(1), 10));
      r16Refs.add(parseInt(m.away.slice(1), 10));
    });
    expect(r16Refs.size).toBe(r32Ids.size);

    // All 8 r16 matches feed into qf
    const qfRefs = new Set<number>();
    MATCHES.filter(m => m.phase === 'qf').forEach(m => {
      qfRefs.add(parseInt(m.home.slice(1), 10));
      qfRefs.add(parseInt(m.away.slice(1), 10));
    });
    expect(qfRefs.size).toBe(r16Ids.size);

    // All 4 qf matches feed into sf
    const sfRefs = new Set<number>();
    MATCHES.filter(m => m.phase === 'sf').forEach(m => {
      sfRefs.add(parseInt(m.home.slice(1), 10));
      sfRefs.add(parseInt(m.away.slice(1), 10));
    });
    expect(sfRefs.size).toBe(qfIds.size);
    expect(sfIds.size).toBe(2);
  });
});
