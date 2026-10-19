import test from 'node:test';
import assert from 'node:assert/strict';
import { isTinyFishConfigured, validateTinyFishPayload } from './tinyfish.js';

const validResearch = {
  topic: 'Working memory',
  explanation: 'Working memory briefly keeps information available for current tasks.',
  processes: ['Maintaining recent information'],
  evidence: 'The N-back task is used in cognitive research and has several task demands.',
  sources: [{ title: 'NIH research', url: 'https://www.nih.gov/research' }],
  limitations: 'Task results are affected by many factors and are not diagnostic.'
};

test('TinyFish configuration check never returns the key', () => {
  assert.equal(isTinyFishConfigured(undefined), false);
  assert.equal(isTinyFishConfigured('  '), false);
  assert.equal(isTinyFishConfigured('your_tinyfish_api_key_here'), false);
  assert.equal(isTinyFishConfigured('real-secret-value'), true);
});

test('accepts completed TinyFish research with an HTTPS source on an approved domain', () => {
  assert.deepEqual(validateTinyFishPayload({ status: 'COMPLETED', result: validResearch }), { ok: true, research: validResearch });
});

test('classifies failed, malformed, and empty TinyFish results', () => {
  assert.deepEqual(validateTinyFishPayload({ status: 'FAILED', result: null }), { ok: false, reason: 'failed' });
  assert.deepEqual(validateTinyFishPayload({ status: 'COMPLETED', result: { ...validResearch, explanation: '' } }), { ok: false, reason: 'malformed' });
  assert.deepEqual(validateTinyFishPayload({ status: 'COMPLETED', result: { ...validResearch, sources: [] } }), { ok: false, reason: 'empty' });
  assert.deepEqual(validateTinyFishPayload({ status: 'COMPLETED', result: { ...validResearch, sources: [{ title: 'Untrusted', url: 'https://example.com/page' }] } }), { ok: false, reason: 'empty' });
});
