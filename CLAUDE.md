# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm test             # run all tests once
npm run test:watch   # run tests in watch mode

# Run a single test file
npx vitest run src/lib/scoring.test.ts
```

## Environment

Copy `.env.example` to `.env` and fill in values. Required vars:

- `VITE_FIREBASE_*` — Firebase Realtime Database credentials
- `VITE_ROOM_ID` — Firebase room key (all users sharing a room see the same data)
- `VITE_FOOTBALL_API_KEY` — football-data.org API key

The `.env` in this repo points to the **production Firebase database**. There is no separate dev database.

## Architecture

**State management:** `AppContext` (React Context + `useReducer`) holds all app state — `players`, `results`, `bets`, `saveStatus`, `online`, `lastSynced`. Every component reads via `useApp()`. The reducer is a pure function in `src/context/reducer.ts`.

**Persistence:** `App.tsx` wires two persistence layers:
1. **Firebase Realtime DB** (`src/lib/firebase.ts`) — `subscribeToRoom` opens a live listener on mount; any local state change triggers `saveToRoom`. Falls back to localStorage on failure.
2. **localStorage** — loaded on first mount as initial state before Firebase arrives.

**Match data:** All 104 matches are statically defined in `src/data/matches.ts`. Group stage (ids 1–72) have real team names in Polish and timestamps. Knockout rounds (ids 73–104) use placeholder labels (`1A`, `W73`, etc.) until results are known.

**API sync:** `src/hooks/useAutoResults.ts` fetches finished match results from football-data.org via `src/lib/footballApi.ts`. Polling runs every 1 hour and on `window.focus`. It does **not** run on page load. The API is proxied through Vite (`/api/football` → `https://api.football-data.org/v4`) to avoid CORS. The proxy is defined in `vite.config.ts` for both `server` and `preview`. For production static hosting a redirect rule is needed (e.g. Netlify `_redirects` or `vercel.json`).

**Scoring (`src/lib/scoring.ts`):**
- Correct outcome: 5 pts; exact score: 10 pts
- Streak multiplier: ×2 at 2 consecutive correct, ×3 at 3+
- Streak resets on a miss **or** when a result exists but the player has no bet
- `calcAllPts` processes matches in ascending id order — order matters for streak calculation
- A match is locked 5 minutes before its `ts` timestamp

**Testing:** Vitest 2 + happy-dom + `@testing-library/react`. Tests colocate with source files. `src/setupTests.ts` imports `@testing-library/jest-dom`. Use `vi.useFakeTimers()` / `vi.setSystemTime()` when testing anything that depends on `isLocked`.

**Vite version:** Pinned to Vite 5 (not 8) due to a rolldown native binding incompatibility with Node 22.11.0. Do not upgrade Vite without also upgrading Node to ≥22.12.0.
