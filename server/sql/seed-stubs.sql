-- Seed un-ingested traditions and works so the UI can render the full
-- "shape of the canon" before those corpora are actually ingested. Rows
-- here have is_stub=true; the BrowseView renders them visible-but-muted.
-- Real ingest pipelines for each tradition will INSERT real rows
-- (is_stub=false) alongside these — they coexist, they don't replace.
--
-- Mirrors the original mock layout in src/data/corpus.js. Idempotent —
-- ON CONFLICT (slug) DO NOTHING preserves any work that the ingest has
-- already promoted out of stub state.

-- Traditions
INSERT INTO traditions (slug, name, subtitle, display_order) VALUES
  ('mahayana', 'Mahāyāna', 'Sarvāstivāda parallel · Chinese', 2),
  ('zen',      'Zen',      'Sōtō tradition · Japanese',      3)
ON CONFLICT (slug) DO NOTHING;

-- Theravāda commentary branch (tipitaka itself is seeded live by ingest.mjs)
-- Per-work commentary slugs (pli-{work}-attha) are inserted by the CST ingest
-- itself — these umbrellas just shape the Browse tree before ingest fills them.
INSERT INTO works (slug, tradition_slug, parent_slug, name, subtitle, is_stub, display_order) VALUES
  ('pli-commentary',    'theravada', NULL,             'Commentaries',      'Aṭṭhakathā',                 true, 2),
  ('pli-vism',          'theravada', 'pli-commentary', 'Visuddhimagga',     'Buddhaghosa, 5th c. CE',     true, 0),
  ('pli-mn-attha',      'theravada', 'pli-commentary', 'Papañcasūdanī',     'MN commentary',              true, 1),
  ('pli-dn-attha',      'theravada', 'pli-commentary', 'Sumaṅgalavilāsinī', 'DN commentary',              true, 2),
  ('pli-subcommentary', 'theravada', NULL,             'Sub-commentaries',  'Ṭīkā',                       true, 3),
  ('pli-anya',          'theravada', NULL,             'Extra-canonical',   'Anya · Mahāvaṃsa, etc.',     true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Mahāyāna tree
INSERT INTO works (slug, tradition_slug, parent_slug, name, subtitle, is_stub, display_order) VALUES
  ('taisho-tripitaka',      'mahayana', NULL,                'Taishō Tripiṭaka', '大正新脩大藏經',              true, 0),
  ('taisho-agamas',         'mahayana', 'taisho-tripitaka',  'Āgamas',           'Parallels to Pali Nikāyas',  true, 0),
  ('taisho-da',             'mahayana', 'taisho-agamas',     'Dīrgha Āgama',     '長阿含 · parallel to DN',     true, 0),
  ('taisho-ma',             'mahayana', 'taisho-agamas',     'Madhyama Āgama',   '中阿含 · parallel to MN',     true, 1),
  ('taisho-sa',             'mahayana', 'taisho-agamas',     'Saṃyukta Āgama',   '雜阿含 · parallel to SN',     true, 2),
  ('taisho-ea',             'mahayana', 'taisho-agamas',     'Ekottarika Āgama', '增一阿含 · parallel to AN',   true, 3),
  ('taisho-mahayana-sutras','mahayana', 'taisho-tripitaka',  'Mahāyāna Sūtras',  'Prajñāpāramitā, Lotus, etc.',true, 1)
ON CONFLICT (slug) DO NOTHING;

-- Zen tree
INSERT INTO works (slug, tradition_slug, parent_slug, name, subtitle, is_stub, display_order) VALUES
  ('zen-shobogenzo',    'zen', NULL, 'Shōbōgenzō',    'Dōgen, 13th c. CE · 正法眼蔵', true, 0),
  ('zen-eihei-koroku',  'zen', NULL, 'Eihei Kōroku',  'Extensive record',              true, 1),
  ('zen-fukan-zazengi', 'zen', NULL, 'Fukan Zazengi', 'Universal recommendation',      true, 2)
ON CONFLICT (slug) DO NOTHING;
