import type { AppState, AppAction } from './types';

export const initialState: AppState = {
  players: [],
  results: {},
  bets: {},
  saveStatus: 'idle',
  online: true,
  lastSynced: null,
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'ADD_PLAYER': {
      if (state.players.includes(action.payload)) return state;
      return { ...state, players: [...state.players, action.payload] };
    }
    case 'REMOVE_PLAYER': {
      const players = state.players.filter(p => p !== action.payload);
      const bets = { ...state.bets };
      delete bets[action.payload];
      return { ...state, players, bets };
    }
    case 'SET_RESULT':
      return {
        ...state,
        results: { ...state.results, [action.payload.id]: action.payload.score },
      };
    case 'SET_BET':
      return {
        ...state,
        bets: {
          ...state.bets,
          [action.payload.player]: {
            ...(state.bets[action.payload.player] ?? {}),
            [action.payload.id]: action.payload.score,
          },
        },
      };
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };
    case 'SET_ONLINE':
      return { ...state, online: action.payload };
    case 'SET_LAST_SYNCED':
      return { ...state, lastSynced: action.payload };
    default:
      return state;
  }
}
