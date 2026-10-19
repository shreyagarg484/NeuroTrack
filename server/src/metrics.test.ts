import test from 'node:test';
import assert from 'node:assert/strict';
import { median, scoreNback } from './metrics.js';

test('median handles odd and even response sets', () => {
  assert.equal(median([300, 100, 200]), 200);
  assert.equal(median([400, 100, 300, 200]), 250);
  assert.equal(median([]), 0);
});

test('N-back score includes misses in accuracy and excludes them from reaction time', () => {
  assert.deepEqual(scoreNback([{ match: true, response: true, rt: 400 }, { match: false, response: true, rt: 250 }, { match: false, response: null, rt: null }]), { accuracy: 33, medianRt: 325, misses: 1 });
});
