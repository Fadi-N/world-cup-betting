export interface Match {
  id: number;
  phase: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd';
  section: string;   // display label for section headers in the UI
  grp?: string;      // group letter (A–L), only for group stage
  home: string;
  away: string;
  date: string;      // human-readable Polish time, e.g. "11.06 21:00"
  ts?: number;       // UTC kick-off in ms (group stage only)
}

export interface Score {
  home: string;  // 90-minute result
  away: string;  // 90-minute result
  etHome?: string; // score after extra time (cumulative, only set if match went to ET)
  etAway?: string;
  pkHome?: string; // penalty kicks only (not cumulative)
  pkAway?: string;
}

export interface AppState {
  players: string[];
  results: Record<number, Score>;
  bets: Record<string, Record<number, Score>>;
  saveStatus: 'idle' | 'firebase' | 'local';
  online: boolean;
  lastSynced: number | null;   // timestamp of last successful football-data.org sync
}

export type AppAction =
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_PLAYER'; payload: string }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'SET_RESULT'; payload: { id: number; score: Score } }
  | { type: 'SET_BET'; payload: { player: string; id: number; score: Score } }
  | { type: 'SET_SAVE_STATUS'; payload: AppState['saveStatus'] }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_LAST_SYNCED'; payload: number };
