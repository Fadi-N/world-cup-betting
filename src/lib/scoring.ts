import type { Match, Score } from '../context/types';

export type Outcome = 'H' | 'A' | 'D';

export function outcome(home: string, away: string): Outcome | null {
  if (home === '' || away === '') return null;
  const h = parseInt(home, 10);
  const a = parseInt(away, 10);
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return 'H';
  if (a > h) return 'A';
  return 'D';
}

export function isLocked(match: Match): boolean {
  if (!match.ts) return false;
  return Date.now() >= match.ts - 5 * 60 * 1000;
}

/**
 * Computes total points per player across all matches that have results.
 * Matches are processed in id order. A result with no bet resets the streak
 * (mirrors original HTML behavior).
 */
export function calcAllPts(
  players: string[],
  results: Record<number, Score>,
  bets: Record<string, Record<number, Score>>,
): Record<string, number> {
  const totals: Record<string, number> = {};
  const streaks: Record<string, number> = {};

  for (const player of players) {
    totals[player] = 0;
    streaks[player] = 0;
  }

  const matchIds = Object.keys(results).map(Number).sort((a, b) => a - b);

  for (const id of matchIds) {
    const res = results[id];
    if (!res) continue;
    const resOut = outcome(res.home, res.away);
    if (!resOut) continue;

    for (const player of players) {
      const bet = bets[player]?.[id];

      if (!bet) {
        streaks[player] = 0;
        continue;
      }

      const betOut = outcome(bet.home, bet.away);
      if (!betOut) {
        streaks[player] = 0;
        continue;
      }

      const isCorrect = betOut === resOut;

      if (!isCorrect) {
        streaks[player] = 0;
        continue;
      }

      const isExact = bet.home === res.home && bet.away === res.away;
      let pts = isExact ? 10 : 5;
      streaks[player]++;

      if (streaks[player] >= 3) pts *= 3;
      else if (streaks[player] === 2) pts *= 2;

      totals[player] += pts;
    }
  }

  return totals;
}

export function getStreakAt(
  player: string,
  matchId: number,
  results: Record<number, Score>,
  bets: Record<string, Record<number, Score>>,
): number {
  const playerBets = bets[player] ?? {};
  const matchIds = Object.keys(results)
    .map(Number)
    .filter(id => id <= matchId)
    .sort((a, b) => a - b);

  let streak = 0;
  for (const id of matchIds) {
    const res = results[id];
    const bet = playerBets[id];
    if (!res) continue;
    const resOut = outcome(res.home, res.away);

    if (!resOut) continue;
    if (!bet) { streak = 0; continue; }

    const betOut = outcome(bet.home, bet.away);
    if (!betOut || betOut !== resOut) { streak = 0; continue; }
    streak++;
  }
  return streak;
}
