import type { Match, Score } from '../context/types';

interface TeamStats {
  team: string;
  group: string;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
}

function parseGoals(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? -1 : n;
}

function sortTeams(a: TeamStats, b: TeamStats): number {
  if (b.pts !== a.pts) return b.pts - a.pts;
  if (b.gd !== a.gd) return b.gd - a.gd;
  return b.gf - a.gf;
}

function buildStats(matches: Match[], results: Record<number, Score>): TeamStats[] {
  const statsMap = new Map<string, TeamStats>();

  for (const m of matches) {
    if (m.phase !== 'group' || !m.grp) continue;
    if (!statsMap.has(m.home)) statsMap.set(m.home, { team: m.home, group: m.grp, pts: 0, gf: 0, ga: 0, gd: 0 });
    if (!statsMap.has(m.away)) statsMap.set(m.away, { team: m.away, group: m.grp, pts: 0, gf: 0, ga: 0, gd: 0 });

    const r = results[m.id];
    if (!r) continue;
    const hg = parseGoals(r.home);
    const ag = parseGoals(r.away);
    if (hg < 0 || ag < 0) continue;

    const home = statsMap.get(m.home)!;
    const away = statsMap.get(m.away)!;
    home.gf += hg; home.ga += ag; home.gd += hg - ag;
    away.gf += ag; away.ga += hg; away.gd += ag - hg;

    if (hg > ag)      { home.pts += 3; }
    else if (ag > hg) { away.pts += 3; }
    else              { home.pts += 1; away.pts += 1; }
  }

  return [...statsMap.values()];
}

function calcGroupStandings(
  matches: Match[],
  results: Record<number, Score>,
): Record<string, string[]> {
  const stats = buildStats(matches, results);
  const byGroup: Record<string, TeamStats[]> = {};
  for (const s of stats) {
    (byGroup[s.group] ??= []).push(s);
  }
  const standings: Record<string, string[]> = {};
  for (const [grp, teams] of Object.entries(byGroup)) {
    standings[grp] = teams.sort(sortTeams).map(t => t.team);
  }
  return standings;
}

function calcBest3rdTeams(
  matches: Match[],
  results: Record<number, Score>,
): string[] {
  const stats = buildStats(matches, results);
  const byGroup: Record<string, TeamStats[]> = {};
  for (const s of stats) {
    (byGroup[s.group] ??= []).push(s);
  }
  const thirds: TeamStats[] = [];
  for (const teams of Object.values(byGroup)) {
    const sorted = [...teams].sort(sortTeams);
    if (sorted[2]) thirds.push(sorted[2]);
  }
  return thirds.sort(sortTeams).map(t => t.team);
}

function resolveWinner(
  matchId: number,
  matches: Match[],
  results: Record<number, Score>,
  standings: Record<string, string[]>,
  thirds: string[],
): string {
  const r = results[matchId];
  if (!r) return `W${matchId}`;
  const hg = parseGoals(r.home);
  const ag = parseGoals(r.away);
  if (hg < 0 || ag < 0 || hg === ag) return `W${matchId}`;

  const m = matches.find(x => x.id === matchId);
  if (!m) return `W${matchId}`;

  const home = resolveInner(m.home, matches, results, standings, thirds);
  const away = resolveInner(m.away, matches, results, standings, thirds);
  return hg > ag ? home : away;
}

function resolveLoser(
  matchId: number,
  matches: Match[],
  results: Record<number, Score>,
  standings: Record<string, string[]>,
  thirds: string[],
  fallback: string,
): string {
  const r = results[matchId];
  if (!r) return fallback;
  const hg = parseGoals(r.home);
  const ag = parseGoals(r.away);
  if (hg < 0 || ag < 0 || hg === ag) return fallback;

  const m = matches.find(x => x.id === matchId);
  if (!m) return fallback;

  const home = resolveInner(m.home, matches, results, standings, thirds);
  const away = resolveInner(m.away, matches, results, standings, thirds);
  return hg > ag ? away : home;
}

function resolveInner(
  placeholder: string,
  matches: Match[],
  results: Record<number, Score>,
  standings: Record<string, string[]>,
  thirds: string[],
): string {
  // '1A', '2C' etc.
  const groupPos = /^(\d+)([A-L])$/.exec(placeholder);
  if (groupPos) {
    const pos = parseInt(groupPos[1], 10) - 1;
    return standings[groupPos[2]]?.[pos] ?? placeholder;
  }

  // '1. m. 3.' through '8. m. 3.'
  const thirdPos = /^(\d+)\. m\. 3\.$/.exec(placeholder);
  if (thirdPos) {
    return thirds[parseInt(thirdPos[1], 10) - 1] ?? placeholder;
  }

  // 'W73' etc.
  const winnerOf = /^W(\d+)$/.exec(placeholder);
  if (winnerOf) {
    return resolveWinner(parseInt(winnerOf[1], 10), matches, results, standings, thirds);
  }

  if (placeholder === 'Zwyc. półf. 1') return resolveWinner(101, matches, results, standings, thirds);
  if (placeholder === 'Zwyc. półf. 2') return resolveWinner(102, matches, results, standings, thirds);
  if (placeholder === 'Przeg. półf. 1') return resolveLoser(101, matches, results, standings, thirds, placeholder);
  if (placeholder === 'Przeg. półf. 2') return resolveLoser(102, matches, results, standings, thirds, placeholder);

  return placeholder;
}

export function resolveTeam(
  placeholder: string,
  matches: Match[],
  results: Record<number, Score>,
): string {
  const standings = calcGroupStandings(matches, results);
  const thirds = calcBest3rdTeams(matches, results);
  return resolveInner(placeholder, matches, results, standings, thirds);
}

export function resolveAllKnockoutTeams(
  matches: Match[],
  results: Record<number, Score>,
): Map<number, { home: string; away: string }> {
  const standings = calcGroupStandings(matches, results);
  const thirds = calcBest3rdTeams(matches, results);
  const resolved = new Map<number, { home: string; away: string }>();

  for (const m of matches) {
    if (m.phase === 'group') continue;
    resolved.set(m.id, {
      home: resolveInner(m.home, matches, results, standings, thirds),
      away: resolveInner(m.away, matches, results, standings, thirds),
    });
  }

  return resolved;
}
