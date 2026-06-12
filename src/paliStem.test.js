// node --test src/paliStem.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { paliStem, stemMatch, tokenize } from './paliStem.js';

test('strips ṃ-form (U+1E43) endings', () => {
  assert.equal(paliStem('arahattaṃ'), 'arahatt');
  assert.equal(paliStem('bhikkhūnaṃ'), 'bhikkhūn');
});

test('strips ṁ-form (U+1E41) endings as used by the corpus text', () => {
  // SuttaCentral bilara + CST write anusvara as ṁ
  assert.equal(paliStem('arahattaṁ'), 'arahatt');
  assert.equal(paliStem('jāgarataṁ'), paliStem('jāgarataṃ'));
  assert.equal(paliStem('dhammasmiṁ'), paliStem('dhammasmiṃ'));
  assert.equal(paliStem('bhikkhūnaṁ'), 'bhikkhūn');
});

test('non-anusvara stemming unchanged', () => {
  assert.equal(paliStem('sampajāno'), 'sampaj'); // 'āno' ending strips first

  assert.equal(paliStem(''), '');
});

test('stemMatch finds ṁ-final corpus words from ṃ or ā queries', () => {
  const corpus = 'niddā tandī vijambhitā, aratī bhattasammado jāgarataṁ';
  assert.ok(stemMatch(corpus, 'jāgarataṃ'));
  assert.ok(stemMatch(corpus, 'jāgarataṁ'));
});

test('tokenize splits on punctuation', () => {
  assert.deepEqual(tokenize('evaṁ me, sutaṁ.'), ['evaṁ', 'me', 'sutaṁ']);
});
