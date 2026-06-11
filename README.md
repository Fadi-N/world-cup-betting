# Typer Mundial 2026

A Polish football prediction app for the 2026 FIFA World Cup. Players enter score predictions (typy) for all 104 matches, earn points for correct outcomes and exact scores, and compete on a live leaderboard.

## How scoring works

| Result | Points |
|--------|--------|
| Correct outcome (win/draw) | 5 pts |
| Exact score | 10 pts |
| 2 correct predictions in a row | ×2 multiplier |
| 3+ correct predictions in a row | ×3 multiplier |

A streak resets on any miss or when a result is entered but no prediction was placed.

Betting closes 5 minutes before each match kicks off.

## Features

- All 104 World Cup 2026 matches (group stage + knockouts)
- Real-time sync across all devices via Firebase — everyone in the same room sees live updates
- Match results auto-fetched from [football-data.org](https://www.football-data.org/) every hour and on tab focus
- Works offline — falls back to localStorage when Firebase is unreachable
- Three tabs: Matches (with bet inputs), Players (manage participants), Ranking (live leaderboard)

## Getting started

**Prerequisites:** Node 22+ and npm.

```bash
git clone https://github.com/Fadi-N/world-cup-betting.git
cd world-cup-betting
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase project credentials and a [football-data.org](https://www.football-data.org/) API key (free tier works).

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_ROOM_ID` | Room key — all users with the same room ID share one dataset |
| `VITE_FOOTBALL_API_KEY` | football-data.org API key for auto-fetching results |

## Available commands

```bash
npm run dev        # development server with hot reload
npm run build      # production build
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm test           # run all tests
```

## Tech stack

- React 19 + TypeScript
- Vite 5
- Firebase Realtime Database (modular SDK v10)
- Vitest + Testing Library
