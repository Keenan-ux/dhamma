// node --test server/src/paliStem.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { paliStem, stemForPrefix, foldDiacritics } from './paliStem.js';

test('strips ṃ-form (U+1E43) endings', () => {
  assert.equal(paliStem('arahattaṃ'), 'arahatt');
});

test('strips ṁ-form (U+1E41) endings as used by the corpus text', () => {
  assert.equal(paliStem('arahattaṁ'), 'arahatt');
  assert.equal(paliStem('jāgarataṁ'), paliStem('jāgarataṃ'));
  assert.equal(paliStem('bhikkhūnaṁ'), 'bhikkhūn');
});

test('stemForPrefix handles ṁ-final terms', () => {
  assert.equal(stemForPrefix('arahattaṁ'), 'arahatt');
  assert.equal(stemForPrefix('sati'), 'sati'); // stem too short, falls back
});

test('foldDiacritics folds both anusvara forms identically', () => {
  assert.equal(foldDiacritics('evaṁ'), foldDiacritics('evaṃ'));
});
