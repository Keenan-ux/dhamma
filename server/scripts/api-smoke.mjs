// End-to-end smoke for step 5 modules. Hits the live (partial) corpus via
// the local fly proxy on 15432. Requires DATABASE_URL pointing at the proxy.
//
// Run from C:\Dev\Dhamma\server:
//   $env:DATABASE_URL = "postgres://dhamma:PASSWORD@localhost:15432/dhamma"
//   $env:MODEL_CACHE_DIR = "C:\Dev\Dhamma\scripts\ingest\.cache\models"
//   node scripts/api-smoke.mjs

import { applySchema } from '../src/db.js';
import { aliasesReady, aliasesFor } from '../src/aliases.js';
import { embedReady } from '../src/embed.js';
import { parseQuery, buildTsquery, runSearch } from '../src/search.js';
import { runCorpus, getPassage, getPassages } from '../src/corpus.js';

function header(s) { console.log('\n--- ' + s + ' ---'); }
function show(label, value) {
  console.log(`${label}: ${JSON.stringify(value, null, 2).slice(0, 1200)}`);
}

const t0 = Date.now();

header('schema + aliases');
await applySchema();
await aliasesReady();
show('aliases for "sati"', aliasesFor('sati'));
show('aliases for "dhamma"', aliasesFor('dhamma'));
show('aliases for "nope"', aliasesFor('nope'));

header('parseQuery');
show('parse "sampajāna -bhante \\"mindfulness of breathing\\""',
     parseQuery('sampajāna -bhante "mindfulness of breathing"'));

header('buildTsquery');
show('exact (no expand)',
     buildTsquery(parseQuery('sati AND mindfulness'), { expandAliases: false }));
show('stem  (expand)',
     buildTsquery(parseQuery('sati AND mindfulness'), { expandAliases: true }));
show('exclude + phrase',
     buildTsquery(parseQuery('sampajāna -monks "of breathing"'), { expandAliases: true }));

header('runCorpus');
const corpus = await runCorpus();
console.log('traditions:', corpus.traditions.length);
for (const t of corpus.traditions) {
  console.log(`  ${t.name} — ${t.works.length} top-level works`);
  for (const w of t.works) {
    console.log(`    ${w.name}: ${w.total_passage_count} passages (children: ${w.children.length})`);
  }
}

header('getPassage("mn10")');
const p = await getPassage('mn10');
show('passage', p ? { id: p.id, citation: p.citation, canon: p.canon, hasEmbedding: undefined, originalLen: p.original?.length, translationLen: p.translation?.length } : null);

header('getPassages(["mn10","mn1","an1.1"])');
const ps = await getPassages(['mn10', 'mn1', 'an1.1']);
show('passages', ps.map((x) => ({ id: x.id, citation: x.citation })));

header('runSearch exact "sampajāna"');
show('result', await runSearch({ q: 'sampajāna', mode: 'exact', field: 'all', limit: 5 }));

header('runSearch stem "sati" (alias-expanded)');
show('result', await runSearch({ q: 'sati', mode: 'stem', field: 'all', limit: 5 }));

header('runSearch exact "monks" field=original');
show('result', await runSearch({ q: 'monks', mode: 'exact', field: 'original', limit: 3 }));

header('runSearch exact "monks" field=translation');
show('result', await runSearch({ q: 'monks', mode: 'exact', field: 'translation', limit: 3 }));

header('runSearch exact boolean "mindfulness -breathing"');
show('result', await runSearch({ q: 'mindfulness -breathing', mode: 'exact', field: 'translation', limit: 3 }));

header('warming embed for meaning mode...');
await embedReady();

header('runSearch meaning "mindfulness of breathing"');
show('result', await runSearch({ q: 'mindfulness of breathing', mode: 'meaning', field: 'all', limit: 5 }));

header('runSearch meaning "正念" (no FTS hits expected — vector-only)');
show('result', await runSearch({ q: '正念', mode: 'meaning', field: 'all', limit: 5 }));

console.log(`\n[smoke done in ${Date.now() - t0}ms]`);
process.exit(0);
