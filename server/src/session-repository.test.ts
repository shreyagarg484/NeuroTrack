import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs, { type SqlValue } from 'sql.js';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { createSessionRepository } from './session-repository.js';

test('a completed N-back session saved by the task appears in the Analytics session list', async () => {
  const require = createRequire(import.meta.url);
  const wasmDirectory = dirname(require.resolve('sql.js'));
  const SQL = await initSqlJs({ locateFile: (file) => resolve(wasmDirectory, file) });
  const db = new SQL.Database();
  db.run(`CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    createdAt TEXT NOT NULL,
    n INTEGER NOT NULL,
    trials INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    medianRt INTEGER NOT NULL,
    misses INTEGER NOT NULL,
    isSynthetic INTEGER NOT NULL DEFAULT 0,
    detailsJson TEXT NOT NULL DEFAULT '[]'
  )`);
  const store = {
    prepare(sql: string) {
      return {
        all(...params: SqlValue[]) {
          const statement = db.prepare(sql);
          if (params.length) statement.bind(params);
          const rows: Array<Record<string, SqlValue>> = [];
          while (statement.step()) rows.push(statement.getAsObject());
          statement.free();
          return rows;
        },
        run(...params: SqlValue[]) {
          db.run(sql, params);
          const id = db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0];
          return { lastInsertRowid: Number(id ?? 0) };
        }
      };
    }
  };
  const repository = createSessionRepository(store);
  db.run("INSERT INTO sessions (createdAt,n,trials,accuracy,medianRt,misses,isSynthetic) VALUES ('2026-10-12T09:20:00.000Z',2,20,75,612,1,1)");
  repository.save({
    n: 2,
    trials: 2,
    accuracy: 50,
    medianRt: 525,
    misses: 0,
    trialResults: [
      { trialType: 'no-match', correct: true, responseMs: 480 },
      { trialType: 'match', correct: false, responseMs: 570 }
    ]
  }, '2026-10-18T12:00:00.000Z');

  assert.deepEqual(repository.list(), [
    { id: 2, createdAt: '2026-10-18T12:00:00.000Z', n: 2, trials: 2, accuracy: 50, medianRt: 525, misses: 0, isSynthetic: 0 },
    { id: 1, createdAt: '2026-10-12T09:20:00.000Z', n: 2, trials: 20, accuracy: 75, medianRt: 612, misses: 1, isSynthetic: 1 }
  ]);
  db.close();
});
