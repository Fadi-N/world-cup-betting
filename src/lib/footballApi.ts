import { MATCHES } from '../data/matches';
import type { Score } from '../context/types';

const API_BASE = '/api/football';
const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY as string;

// Maps football-data.org English team names → Polish names used in matches.ts
const TEAM_EN_TO_PL: Record<string, string> = {
  'Mexico':                    'Meksyk',
  'South Africa':              'RPA',
  'Korea Republic':            'Korea Płd.',
  'South Korea':               'Korea Płd.',
  'Czechia':                   'Czechy',
  'Czech Republic':            'Czechy',
  'Canada':                    'Kanada',
  'Bosnia and Herzegovina':    'Bośnia',
  'Bosnia-Herzegovina':        'Bośnia',
  'United States':             'USA',
  'USA':                       'USA',
  'Paraguay':                  'Paragwaj',
  'Qatar':                     'Katar',
  'Switzerland':               'Szwajcaria',
  'Brazil':                    'Brazylia',
  'Morocco':                   'Maroko',
  'Haiti':                     'Haiti',
  'Scotland':                  'Szkocja',
  'Australia':                 'Australia',
  'Turkey':                    'Turcja',
  'Türkiye':                   'Turcja',
  'Germany':                   'Niemcy',
  'Curaçao':                   'Curaçao',
  'Curacao':                   'Curaçao',
  'Netherlands':               'Holandia',
  'Japan':                     'Japonia',
  "Côte d'Ivoire":             'W. K. Słoniowej',
  'Ivory Coast':               'W. K. Słoniowej',
  'Ecuador':                   'Ekwador',
  'Sweden':                    'Szwecja',
  'Tunisia':                   'Tunezja',
  'Spain':                     'Hiszpania',
  'Cape Verde':                'W. Z. Przylądka',
  'Cabo Verde':                'W. Z. Przylądka',
  'Cape Verde Islands':        'W. Z. Przylądka',
  'Belgium':                   'Belgia',
  'Egypt':                     'Egipt',
  'Saudi Arabia':              'Arabia Saud.',
  'Uruguay':                   'Urugwaj',
  'Iran':                      'Iran',
  'New Zealand':               'Nowa Zelandia',
  'France':                    'Francja',
  'Senegal':                   'Senegal',
  'Iraq':                      'Irak',
  'Norway':                    'Norwegia',
  'Argentina':                 'Argentyna',
  'Algeria':                   'Algeria',
  'Austria':                   'Austria',
  'Jordan':                    'Jordania',
  'Portugal':                  'Portugalia',
  'DR Congo':                  'DR Kongo',
  'Congo DR':                  'DR Kongo',
  'Democratic Republic of Congo': 'DR Kongo',
  'England':                   'Anglia',
  'Croatia':                   'Chorwacja',
  'Ghana':                     'Ghana',
  'Panama':                    'Panama',
  'Uzbekistan':                'Uzbekistan',
  'Colombia':                  'Kolumbia',
};

// Build a lookup: "PolishHome:PolishAway" → matchId (group stage only)
const MATCH_LOOKUP = new Map<string, number>(
  MATCHES.filter(m => m.phase === 'group').map(m => [`${m.home}:${m.away}`, m.id]),
);

interface ApiMatch {
  utcDate: string;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | null;
    fullTime: { home: number | null; away: number | null } | null;
    extraTime: { home: number | null; away: number | null } | null;
    penalties: { home: number | null; away: number | null } | null;
  };
}

interface ApiResponse {
  matches: ApiMatch[];
}

function toPolish(name: string): string {
  return TEAM_EN_TO_PL[name] ?? name;
}

/**
 * Fetches all finished WC 2026 matches from football-data.org and returns
 * them keyed by our local match id. Pass knockoutLookup (resolved team names
 * → match id) to also capture knockout-stage results.
 */
export async function fetchWC2026Results(
  knockoutLookup?: Map<string, number>,
): Promise<Record<number, Score>> {
  if (!API_KEY) return {};

  const res = await fetch(
    `${API_BASE}/competitions/WC/matches?season=2026&status=FINISHED`,
    { headers: { 'X-Auth-Token': API_KEY }, cache: 'no-store' },
  );

  if (!res.ok) {
    throw new Error(`football-data.org ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as ApiResponse;
  const results: Record<number, Score> = {};

  for (const m of data.matches) {
    const fullTime = m.score?.fullTime;
    if (!fullTime) continue;
    if (fullTime.home === null || fullTime.away === null) continue;

    const duration = m.score?.duration;
    const etGoals = m.score?.extraTime;
    const pkGoals = m.score?.penalties;

    // The API's fullTime is cumulative (90min + ET goals + penalty kicks).
    // Subtract ET and PK goals to recover the 90-minute result (what players bet on).
    let home90 = fullTime.home;
    let away90 = fullTime.away;
    if (duration === 'EXTRA_TIME' || duration === 'PENALTY_SHOOTOUT') {
      home90 -= etGoals?.home ?? 0;
      away90 -= etGoals?.away ?? 0;
    }
    if (duration === 'PENALTY_SHOOTOUT') {
      home90 -= pkGoals?.home ?? 0;
      away90 -= pkGoals?.away ?? 0;
    }

    const plHome = toPolish(m.homeTeam.name);
    const plAway = toPolish(m.awayTeam.name);

    const matchId =
      MATCH_LOOKUP.get(`${plHome}:${plAway}`) ??
      knockoutLookup?.get(`${plHome}:${plAway}`);

    if (matchId !== undefined) {
      const score: import('../context/types').Score = {
        home: String(home90),
        away: String(away90),
      };

      // ET display = score after 120 min = fullTime minus penalty goals
      if (duration === 'EXTRA_TIME' || duration === 'PENALTY_SHOOTOUT') {
        const etFinalH = fullTime.home - (pkGoals?.home ?? 0);
        const etFinalA = fullTime.away - (pkGoals?.away ?? 0);
        score.etHome = String(etFinalH);
        score.etAway = String(etFinalA);
      }
      if (duration === 'PENALTY_SHOOTOUT' && pkGoals?.home != null && pkGoals?.away != null) {
        score.pkHome = String(pkGoals.home);
        score.pkAway = String(pkGoals.away);
      }

      results[matchId] = score;
    }
  }

  return results;
}
