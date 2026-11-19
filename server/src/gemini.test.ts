import test from 'node:test';
import assert from 'node:assert/strict';
import { isGeminiConfigured, insightSchema, learningSchema, recipeSchema } from './gemini.js';

test('Gemini configuration check never treats placeholders as configured', () => {
  assert.equal(isGeminiConfigured(undefined), false);
  assert.equal(isGeminiConfigured('   '), false);
  assert.equal(isGeminiConfigured('your_gemini_api_key_here'), false);
  assert.equal(isGeminiConfigured('real-secret-value'), true);
});

test('AI response schemas reject incomplete or unsafe payloads', () => {
  assert.equal(insightSchema.safeParse({ headline: 'Short', summary: '', observations: [], suggestions: [], caution: '' }).success, false);
  assert.equal(recipeSchema.safeParse({ band: 'High', items: [{ category: 'Fresh Fruit', title: 'Fruit', detail: 'A fruit snack.' }] }).success, false);
  assert.equal(learningSchema.safeParse({ title: 'Working memory', explanation: 'x'.repeat(21), processes: ['Attention', 'Memory', 'Control'], evidence: 'x'.repeat(21), limitations: 'x'.repeat(11) }).success, true);
});
