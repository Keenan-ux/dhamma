-- Cross-canon term aliases. Authoritative table; mirrors the inline ALIASES
-- map in src/paliStem.js (which becomes informational once /api/search
-- loads from this table). Idempotent — ON CONFLICT (term) DO NOTHING.
--
-- Each row maps a canonical Pāli term to its cross-language equivalents.
-- aliasesFor() looks up bidirectionally so a query for any English
-- rendering ("loving-kindness", "mindfulness", "compassion") resolves
-- to the canonical row and surfaces the full set of synonyms — Stem
-- mode OR-expands them into the tsquery, and Meaning mode concatenates
-- them into the embedding input so cross-language vector search picks
-- up the term's whole semantic neighborhood.
--
-- English equivalents listed here should be tight synonyms (one term,
-- one referent). Polysemous renderings like "phenomenon" for dhamma are
-- deliberately omitted — they'd dilute the OR-group with off-topic
-- matches.

-- Each row includes a diacritic-stripped form of the canonical Pāli term
-- as one of its equivalents (`metta` alongside `mettā`, `karuna` alongside
-- `karuṇā`, etc.). This matters because Postgres's `simple` text-search
-- config compares lexemes byte-for-byte, and Pāli compounds in the corpus
-- often appear as one token (`Mettasutta`, `mettasahagatena`,
-- `satipaṭṭhānaṃ`) which a `mettā:*` prefix query cannot match across the
-- diacritic boundary. Adding the stripped variant gives the prefix-stem
-- search a fallback that does match those compound tokens. Stem-mode
-- search and the embedding-query expansion both benefit.

INSERT INTO aliases (term, equivalents) VALUES
  -- Original Pāli↔Sanskrit↔Chinese spine
  ('sampajāna',     ARRAY['sampajana', 'sampajañña', 'sampajanna', 'sampajānakārī', 'sampajanakari', 'samprajāna', 'samprajana', '正知', 'clear comprehension', 'clear knowing', 'alertness']),
  ('sampajañña',    ARRAY['sampajanna', 'sampajāna', 'sampajana', '正知', 'clear comprehension']),
  ('sati',          ARRAY['smṛti', 'smrti', '念', 'mindfulness', 'awareness']),
  ('smṛti',         ARRAY['smrti', 'sati', '念', 'mindfulness']),
  ('satipaṭṭhāna',  ARRAY['satipatthana', 'smṛtyupasthāna', 'smrtyupasthana', '念處', '念住', 'foundations of mindfulness', 'establishments of mindfulness']),
  ('vipassanā',     ARRAY['vipassana', 'vipaśyanā', 'vipasyana', '觀', 'insight']),
  ('paññā',         ARRAY['panna', 'prajñā', 'prajna', '慧', 'wisdom']),
  ('nibbāna',       ARRAY['nibbana', 'nirvāṇa', 'nirvana', '涅槃', 'extinguishment', 'liberation', 'release', 'awakening']),
  ('kamma',         ARRAY['karma', '業', 'action', 'volitional action']),
  ('dhamma',        ARRAY['dharma', '法']),
  ('saṅgha',        ARRAY['sangha', 'saṃgha', 'samgha', '僧', 'community']),
  ('saṃsāra',       ARRAY['samsara', 'saṁsāra', '輪迴', 'cycle of rebirth', 'transmigration']),
  ('dukkha',        ARRAY['duḥkha', 'duhkha', '苦', 'suffering', 'unsatisfactoriness', 'stress']),
  ('anicca',        ARRAY['anitya', '無常', 'impermanence']),
  ('anattā',        ARRAY['anatta', 'anātman', 'anatman', '無我', 'not-self', 'non-self', 'no-self']),
  -- Brahmavihāra (sublime abidings)
  ('mettā',         ARRAY['metta', 'maitrī', 'maitri', '慈', 'loving-kindness', 'friendliness', 'good-will', 'goodwill']),
  ('karuṇā',        ARRAY['karuna', '悲', 'compassion']),
  ('muditā',        ARRAY['mudita', '喜', 'sympathetic joy', 'altruistic joy', 'appreciative joy']),
  ('upekkhā',       ARRAY['upekkha', 'upekṣā', 'upeksa', '捨', 'equanimity']),
  -- Five aggregates (khandhā)
  ('rūpa',          ARRAY['rupa', '色', 'form', 'materiality']),
  ('vedanā',        ARRAY['vedana', '受', 'feeling', 'sensation']),
  ('saññā',         ARRAY['sanna', 'saṃjñā', 'samjna', '想', 'perception']),
  ('saṅkhāra',      ARRAY['sankhara', 'saṃskāra', 'samskara', '行', 'volitional formations', 'fabrications', 'mental formations']),
  ('viññāṇa',       ARRAY['vinnana', 'vijñāna', 'vijnana', '識', 'consciousness']),
  -- Awakening factors / path elements
  ('bodhi',         ARRAY['菩提', 'awakening', 'enlightenment']),
  ('magga',         ARRAY['mārga', 'marga', '道', 'path']),
  ('citta',         ARRAY['心', 'mind', 'heart']),
  ('jhāna',         ARRAY['jhana', 'dhyāna', 'dhyana', '禪', 'absorption', 'meditation']),
  ('samādhi',       ARRAY['samadhi', '定', 'concentration', 'unification of mind']),
  ('viriya',        ARRAY['vīrya', 'virya', '精進', 'energy', 'effort'])
ON CONFLICT (term) DO UPDATE SET equivalents = EXCLUDED.equivalents;
