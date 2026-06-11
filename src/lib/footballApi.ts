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
  'Netherlands':               'Holandia',
  'Japan':                     'Japonia',
  "Côte d'Ivoire":             'W. K. Słoniowej',
  'Ivory Coast':               'W. K. Słoniowej',
  'Ecuador':                   'Ekwador',
  'Sweden':                    'Szwecja',
  'Tunisia':                   'Tunezja',
  'Spain':                     'Hiszpania',
  'Cape Verde':                'W. Z. Przylądka',
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
    fullTime: { home: number | null; away: number | null };
  };
}

interface ApiResponse {
  matches: ApiMatch[];
}

function toPolish(name: string): string {
  return TEAM_EN_TO_PL[name] ?? name;
}

/**
 * Fetches all finished WC 2026 group-stage matches from football-data.org
 * and returns them keyed by our local match id.
 */
export async function fetchWC2026Results(): Promise<Record<number, Score>> {
  if (!API_KEY) return {};

  const res = await fetch(
    `${API_BASE}/competitions/WC/matches?season=2026&status=FINISHED`,
    { headers: { 'X-Auth-Token': API_KEY } },
  );

  if (!res.ok) {
    throw new Error(`football-data.org ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as ApiResponse;
  const results: Record<number, Score> = {};

  for (const m of data.matches) {
    const { home: homeGoals, away: awayGoals } = m.score.fullTime;
    if (homeGoals === null || awayGoals === null) continue;

    const plHome = toPolish(m.homeTeam.name);
    const plAway = toPolish(m.awayTeam.name);
    const matchId = MATCH_LOOKUP.get(`${plHome}:${plAway}`);

    if (matchId !== undefined) {
      results[matchId] = {
        home: String(homeGoals),
        away: String(awayGoals),
      };
    }
  }

  return results;
}
