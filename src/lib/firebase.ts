import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import type { AppState, Score } from '../context/types';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const ROOM_ID = (import.meta.env.VITE_ROOM_ID as string) ?? 'default';

let db: ReturnType<typeof getDatabase> | null = null;

function getDb() {
  if (!db) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}

export type FirebaseData = Pick<AppState, 'players' | 'results' | 'bets'>;

export function subscribeToRoom(
  onData: (data: FirebaseData) => void,
  onError: (err: Error) => void,
): () => void {
  try {
    const roomRef = ref(getDb(), `rooms/${ROOM_ID}`);
    const unsub = onValue(
      roomRef,
      snap => {
        const val = snap.val() as FirebaseData | null;
        if (val) onData(val);
      },
      onError,
    );
    return unsub;
  } catch (e) {
    onError(e as Error);
    return () => {};
  }
}

// Saves only one player's bet for one match — safe for concurrent writes
export async function saveBet(player: string, matchId: number, score: Score): Promise<void> {
  const betRef = ref(getDb(), `rooms/${ROOM_ID}/bets/${player}/${matchId}`);
  await set(betRef, score);
}

// Saves the players list — called only when adding a player
export async function savePlayers(players: string[]): Promise<void> {
  const playersRef = ref(getDb(), `rooms/${ROOM_ID}/players`);
  await set(playersRef, players);
}
