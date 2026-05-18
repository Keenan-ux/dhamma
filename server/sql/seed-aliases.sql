-- Cross-canon term aliases. Authoritative table; mirrors the inline ALIASES
-- map in src/paliStem.js (which becomes informational once /api/search
-- loads from this table). Idempotent — ON CONFLICT (term) DO NOTHING.

INSERT INTO aliases (term, equivalents) VALUES
  ('sampajāna',     ARRAY['sampajañña', 'sampajānakārī', 'samprajāna', '正知']),
  ('sampajañña',    ARRAY['sampajāna', '正知']),
  ('sati',          ARRAY['smṛti', '念']),
  ('smṛti',         ARRAY['sati', '念']),
  ('satipaṭṭhāna',  ARRAY['smṛtyupasthāna', '念處', '念住']),
  ('vipassanā',     ARRAY['vipaśyanā', '觀']),
  ('paññā',         ARRAY['prajñā', '慧']),
  ('nibbāna',       ARRAY['nirvāṇa', '涅槃']),
  ('kamma',         ARRAY['karma', '業']),
  ('dhamma',        ARRAY['dharma', '法']),
  ('saṅgha',        ARRAY['saṃgha', '僧']),
  ('saṃsāra',       ARRAY['saṁsāra', '輪迴']),
  ('dukkha',        ARRAY['duḥkha', '苦']),
  ('anicca',        ARRAY['anitya', '無常']),
  ('anattā',        ARRAY['anātman', '無我'])
ON CONFLICT (term) DO NOTHING;
