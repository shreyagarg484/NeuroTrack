import type { SqlValue } from 'sql.js';

export type CompletedNbackSession = {
  n: number;
  trials: number;
  accuracy: number;
  medianRt: number;
  misses: number;
  trialResults: Array<{ trialType: 'match' | 'no-match'; correct: boolean; responseMs: number | null }>;
};

type PreparedStore = {
  all(...params: SqlValue[]): Array<Record<string, SqlValue>>;
  run(...params: SqlValue[]): { lastInsertRowid: number };
};

type SessionStore = { prepare(sql: string): PreparedStore };

export function createSessionRepository(store: SessionStore) {
  return {
    list() {
      return store.prepare('SELECT id, createdAt, n, trials, accuracy, medianRt, misses, isSynthetic FROM sessions ORDER BY createdAt DESC LIMIT 200').all();
    },
    save(session: CompletedNbackSession, createdAt: string) {
      const result = store.prepare('INSERT INTO sessions (createdAt,n,trials,accuracy,medianRt,misses,isSynthetic,detailsJson) VALUES (?,?,?,?,?,?,0,?)').run(
        createdAt,
        session.n,
        session.trials,
        session.accuracy,
        session.medianRt,
        Math.min(session.misses, session.trials),
        JSON.stringify(session.trialResults)
      );
      return Number(result.lastInsertRowid);
    }
  };
}
