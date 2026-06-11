import { describe, it, expect } from 'vitest';
import { reducer, initialState } from './reducer';

describe('reducer', () => {
  describe('ADD_PLAYER', () => {
    it('adds a new player', () => {
      const state = reducer(initialState, { type: 'ADD_PLAYER', payload: 'Alice' });
      expect(state.players).toEqual(['Alice']);
    });

    it('ignores duplicate player', () => {
      let state = reducer(initialState, { type: 'ADD_PLAYER', payload: 'Alice' });
      state = reducer(state, { type: 'ADD_PLAYER', payload: 'Alice' });
      expect(state.players).toHaveLength(1);
    });

    it('adds multiple distinct players', () => {
      let state = reducer(initialState, { type: 'ADD_PLAYER', payload: 'Alice' });
      state = reducer(state, { type: 'ADD_PLAYER', payload: 'Bob' });
      expect(state.players).toEqual(['Alice', 'Bob']);
    });
  });

  describe('REMOVE_PLAYER', () => {
    it('removes the player', () => {
      let state = reducer(initialState, { type: 'ADD_PLAYER', payload: 'Alice' });
      state = reducer(state, { type: 'REMOVE_PLAYER', payload: 'Alice' });
      expect(state.players).toEqual([]);
    });

    it('also removes their bets', () => {
      let state = reducer(initialState, { type: 'ADD_PLAYER', payload: 'Alice' });
      state = reducer(state, {
        type: 'SET_BET',
        payload: { player: 'Alice', id: 1, score: { home: '1', away: '0' } },
      });
      state = reducer(state, { type: 'REMOVE_PLAYER', payload: 'Alice' });
      expect(state.bets['Alice']).toBeUndefined();
    });

    it('does not affect other players', () => {
      let state = reducer(initialState, { type: 'ADD_PLAYER', payload: 'Alice' });
      state = reducer(state, { type: 'ADD_PLAYER', payload: 'Bob' });
      state = reducer(state, { type: 'REMOVE_PLAYER', payload: 'Alice' });
      expect(state.players).toEqual(['Bob']);
    });
  });

  describe('SET_RESULT', () => {
    it('stores result for a match', () => {
      const state = reducer(initialState, {
        type: 'SET_RESULT',
        payload: { id: 1, score: { home: '2', away: '1' } },
      });
      expect(state.results[1]).toEqual({ home: '2', away: '1' });
    });

    it('overwrites an existing result', () => {
      let state = reducer(initialState, {
        type: 'SET_RESULT',
        payload: { id: 1, score: { home: '2', away: '1' } },
      });
      state = reducer(state, {
        type: 'SET_RESULT',
        payload: { id: 1, score: { home: '3', away: '0' } },
      });
      expect(state.results[1]).toEqual({ home: '3', away: '0' });
    });
  });

  describe('SET_BET', () => {
    it('stores bet for a player and match', () => {
      const state = reducer(initialState, {
        type: 'SET_BET',
        payload: { player: 'Alice', id: 1, score: { home: '1', away: '0' } },
      });
      expect(state.bets['Alice'][1]).toEqual({ home: '1', away: '0' });
    });

    it('does not overwrite other player bets', () => {
      let state = reducer(initialState, {
        type: 'SET_BET',
        payload: { player: 'Alice', id: 1, score: { home: '1', away: '0' } },
      });
      state = reducer(state, {
        type: 'SET_BET',
        payload: { player: 'Bob', id: 1, score: { home: '2', away: '2' } },
      });
      expect(state.bets['Alice'][1]).toEqual({ home: '1', away: '0' });
      expect(state.bets['Bob'][1]).toEqual({ home: '2', away: '2' });
    });
  });

  describe('SET_SAVE_STATUS', () => {
    it('updates saveStatus', () => {
      const state = reducer(initialState, { type: 'SET_SAVE_STATUS', payload: 'firebase' });
      expect(state.saveStatus).toBe('firebase');
    });
  });

  describe('SET_ONLINE', () => {
    it('updates online flag', () => {
      const state = reducer(initialState, { type: 'SET_ONLINE', payload: false });
      expect(state.online).toBe(false);
    });
  });

  describe('SET_LAST_SYNCED', () => {
    it('stores timestamp', () => {
      const ts = 1_700_000_000_000;
      const state = reducer(initialState, { type: 'SET_LAST_SYNCED', payload: ts });
      expect(state.lastSynced).toBe(ts);
    });
  });

  describe('SET_STATE', () => {
    it('merges partial state', () => {
      const state = reducer(initialState, {
        type: 'SET_STATE',
        payload: { players: ['Alice'], online: false },
      });
      expect(state.players).toEqual(['Alice']);
      expect(state.online).toBe(false);
      expect(state.results).toEqual({});
    });
  });
});
