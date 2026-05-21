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

INSERT INTO aliases (term, equivalents) VALUES
  -- Original Pāli↔Sanskrit↔Chinese spine
  ('sampajāna',     ARRAY['sampajañña', 'sampajānakārī', 'samprajāna', '正知', 'clear comprehension', 'clear knowing', 'alertness']),
  ('sampajañña',    ARRAY['sampajāna', '正知', 'clear comprehension']),
  ('sati',          ARRAY['smṛti', '念', 'mindfulness', 'awareness']),
  ('smṛti',         ARRAY['sati', '念', 'mindfulness']),
  ('satipaṭṭhāna',  ARRAY['smṛtyupasthāna', '念處', '念住', 'foundations of mindfulness', 'establishments of mindfulness']),
  ('vipassanā',     ARRAY['vipaśyanā', '觀', 'insight']),
  ('paññā',         ARRAY['prajñā', '慧', 'wisdom']),
  ('nibbāna',       ARRAY['nirvāṇa', '涅槃', 'extinguishment', 'liberation', 'release', 'awakening']),
  ('kamma',         ARRAY['karma', '業', 'action', 'volitional action']),
  ('dhamma',        ARRAY['dharma', '法']),
  ('saṅgha',        ARRAY['saṃgha', '僧', 'sangha', 'community']),
  ('saṃsāra',       ARRAY['saṁsāra', '輪迴', 'samsara', 'cycle of rebirth', 'transmigration']),
  ('dukkha',        ARRAY['duḥkha', '苦', 'suffering', 'unsatisfactoriness', 'stress']),
  ('anicca',        ARRAY['anitya', '無常', 'impermanence']),
  ('anattā',        ARRAY['anātman', '無我', 'not-self', 'non-self', 'no-self']),
  -- Brahmavihāra (sublime abidings)
  ('mettā',         ARRAY['maitrī', '慈', 'loving-kindness', 'friendliness', 'good-will', 'goodwill']),
  ('karuṇā',        ARRAY['karuṇā', '悲', 'compassion']),
  ('muditā',        ARRAY['muditā', '喜', 'sympathetic joy', 'altruistic joy', 'appreciative joy']),
  ('upekkhā',       ARRAY['upekṣā', '捨', 'equanimity']),
  -- Five aggregates (khandhā)
  ('rūpa',          ARRAY['rūpa', '色', 'form', 'materiality']),
  ('vedanā',        ARRAY['vedanā', '受', 'feeling', 'sensation']),
  ('saññā',         ARRAY['saṃjñā', '想', 'perception']),
  ('saṅkhāra',      ARRAY['saṃskāra', '行', 'volitional formations', 'fabrications', 'mental formations']),
  ('viññāṇa',       ARRAY['vijñāna', '識', 'consciousness']),
  -- Awakening factors / path elements
  ('bodhi',         ARRAY['bodhi', '菩提', 'awakening', 'enlightenment']),
  ('magga',         ARRAY['mārga', '道', 'path']),
  ('citta',         ARRAY['citta', '心', 'mind', 'heart']),
  ('jhāna',         ARRAY['dhyāna', '禪', 'absorption', 'meditation']),
  ('samādhi',       ARRAY['samādhi', '定', 'concentration', 'unification of mind']),
  ('viriya',        ARRAY['vīrya', '精進', 'energy', 'effort'])
ON CONFLICT (term) DO UPDATE SET equivalents = EXCLUDED.equivalents;
