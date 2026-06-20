-- 1. object footprint by layer-class (distinct passages containing the object term)
WITH p AS (SELECT CASE
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
  WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
  WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
  WHEN work_slug='pli-vinaya' THEN 'vinaya'
  WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
  WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
  ELSE 'sutta' END AS lc, original AS o FROM passages)
SELECT lc,
 count(*) FILTER (WHERE o ~* 'asubh') asubha,
 count(*) FILTER (WHERE o ~* 'mettā|mettaṃ|mettaṁ|mettāya|mettacitt') metta,
 count(*) FILTER (WHERE o ~* 'ānāpān') anapana,
 count(*) FILTER (WHERE o ~* 'kasiṇ') kasina,
 count(*) FILTER (WHERE o ~* 'aniccasaññ') aniccasanna,
 count(*) FILTER (WHERE o ~* 'maraṇasati|maraṇassati|maraṇaṃ anussar|maraṇaṁ anussar') marana,
 count(*) FILTER (WHERE o ~* 'kāyagatāsati|kāyagatā sati|kāyagatāya sati') kayagata,
 count(*) FILTER (WHERE o ~* 'paṭikūl') patikula,
 count(*) FILTER (WHERE o ~* 'dhātumanasikār|catudhātuvavatthān|catunnaṃ dhātūnaṃ|catunnaṁ dhātūnaṁ') dhatu_analysis,
 count(*) FILTER (WHERE o ~* 'buddhānussati|dhammānussati|saṅghānussati|cāgānussati|sīlānussati|devatānussati') six_recoll
FROM p GROUP BY lc ORDER BY lc;
;;;
-- 2. develop-imperative + object (canonical directed-assignment candidates)
WITH p AS (SELECT CASE
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
  WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
  WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
  WHEN work_slug='pli-vinaya' THEN 'vinaya'
  WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
  WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
  ELSE 'sutta' END AS lc, original AS o FROM passages)
SELECT lc,
 count(*) FILTER (WHERE o ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb') AS develop_directive,
 count(*) FILTER (WHERE (o ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb')
   AND o ~* 'asubh|mettā|mettaṃ|ānāpān|kasiṇ|aniccasaññ|maraṇasati|maraṇassati|kāyagatā|paṭikūl|dhātumanasikār|anussati') AS develop_with_object,
 count(*) FILTER (WHERE o ~* 'manasi karohi|manasi karotha|manasikarohi|manasikarotha') AS attend_directive
FROM p GROUP BY lc ORDER BY lc;
;;;
-- 3. commentarial assignment-narrative formula (kammatthana + assignment verb)
WITH p AS (SELECT CASE
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
  WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
  WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
  WHEN work_slug='pli-vinaya' THEN 'vinaya'
  WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
  WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
  ELSE 'sutta' END AS lc, original AS o FROM passages)
SELECT lc,
 count(*) FILTER (WHERE o ~* 'kammaṭṭhān') AS has_kammatthana,
 count(*) FILTER (WHERE o ~* 'kammaṭṭhān' AND o ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi|katheti|deti') AS kammatthana_assigned
FROM p GROUP BY lc ORDER BY lc;
;;;
-- 4. carita matrix footprint by layer
WITH p AS (SELECT CASE
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
  WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
  WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
  WHEN work_slug='pli-vinaya' THEN 'vinaya'
  WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
  WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
  ELSE 'sutta' END AS lc, original AS o FROM passages)
SELECT lc,
 count(*) FILTER (WHERE o ~* 'carit') AS carita_any,
 count(*) FILTER (WHERE o ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit') AS carita_typed,
 count(*) FILTER (WHERE o ~* 'rāgacaritassa|dosacaritassa|mohacaritassa|vitakkacaritassa|saddhācaritassa|buddhicaritassa|ñāṇacaritassa') AS carita_assigned
FROM p GROUP BY lc ORDER BY lc;
;;;
-- 5. samatha vipassana co-occurrence
WITH p AS (SELECT CASE
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
  WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
  WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
  WHEN work_slug='pli-vinaya' THEN 'vinaya'
  WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
  WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
  ELSE 'sutta' END AS lc, original AS o FROM passages)
SELECT lc,
 count(*) FILTER (WHERE o ~* 'samath') samatha,
 count(*) FILTER (WHERE o ~* 'vipassan') vipassana,
 count(*) FILTER (WHERE o ~* 'samath' AND o ~* 'vipassan') both,
 count(*) FILTER (WHERE o ~* 'yuganaddh|yuganandh|yuganaḍḍh') yuganaddha
FROM p GROUP BY lc ORDER BY lc;
;;;
-- 6. understanding-types and puggala typologies
WITH p AS (SELECT CASE
  WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
  WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
  WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
  WHEN work_slug='pli-vinaya' THEN 'vinaya'
  WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
  WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
  ELSE 'sutta' END AS lc, original AS o FROM passages)
SELECT lc,
 count(*) FILTER (WHERE o ~* 'ugghaṭitaññ') ugghatita,
 count(*) FILTER (WHERE o ~* 'vipañcitaññ|vipaccitaññ') vipancita,
 count(*) FILTER (WHERE o ~* 'indriyaparopariya|indriyaparopariyatt') indriya_paropariya,
 count(*) FILTER (WHERE o ~* 'gilānapaccayabhesajj') gilana_support
FROM p GROUP BY lc ORDER BY lc;
