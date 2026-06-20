-- candidate frame: dedup union count + length stats by frame rule
WITH p AS (SELECT id, work_slug, original AS o,
  CASE
   WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
   WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
   WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
   WHEN work_slug='pli-vinaya' THEN 'vinaya'
   WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
   WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
   ELSE 'sutta' END AS lc FROM passages),
obj AS (SELECT 'asubh|mettā|mettaṃ|mettaṁ|ānāpān|kasiṇ|aniccasaññ|maraṇasati|maraṇassati|kāyagatā|paṭikūl|dhātumanasikār|buddhānussati|dhammānussati|saṅghānussati|cāgānussati|sīlānussati|devatānussati|catunnaṃ dhātūnaṃ|catunnaṁ dhātūnaṁ' AS rx),
cand AS (
  SELECT p.*,
    (lc IN ('commentary','subcommentary','anya') AND o ~* 'kammaṭṭhān' AND o ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi') AS f_assign,
    ((o ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb' OR o ~* 'manasi karohi|manasi karotha') AND o ~* (SELECT rx FROM obj)) AS f_directive_obj,
    (o ~* 'rāgacaritassa|dosacaritassa|mohacaritassa|vitakkacaritassa|saddhācaritassa|buddhicaritassa|ñāṇacaritassa') AS f_carita,
    (lc IN ('sutta','para-canon','abhidhamma') AND o ~* 'samath' AND o ~* 'vipassan') AS f_samvip
  FROM p)
SELECT
  count(*) FILTER (WHERE f_assign) n_assign,
  count(*) FILTER (WHERE f_directive_obj) n_directive_obj,
  count(*) FILTER (WHERE f_carita) n_carita,
  count(*) FILTER (WHERE f_samvip) n_samvip,
  count(*) FILTER (WHERE f_assign OR f_directive_obj OR f_carita OR f_samvip) n_union
FROM cand;
;;;
-- length distribution of the union frame by layer-class
WITH p AS (SELECT id, work_slug, original AS o,
  CASE
   WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
   WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
   WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
   WHEN work_slug='pli-vinaya' THEN 'vinaya'
   WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
   WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
   ELSE 'sutta' END AS lc FROM passages),
obj AS (SELECT 'asubh|mettā|mettaṃ|mettaṁ|ānāpān|kasiṇ|aniccasaññ|maraṇasati|maraṇassati|kāyagatā|paṭikūl|dhātumanasikār|buddhānussati|dhammānussati|saṅghānussati|cāgānussati|sīlānussati|devatānussati|catunnaṃ dhātūnaṃ|catunnaṁ dhātūnaṁ' AS rx),
cand AS (SELECT p.*, length(o) AS len,
    ((lc IN ('commentary','subcommentary','anya') AND o ~* 'kammaṭṭhān' AND o ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi')
     OR ((o ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb' OR o ~* 'manasi karohi|manasi karotha') AND o ~* (SELECT rx FROM obj))
     OR (o ~* 'rāgacaritassa|dosacaritassa|mohacaritassa|vitakkacaritassa|saddhācaritassa|buddhicaritassa|ñāṇacaritassa')
     OR (lc IN ('sutta','para-canon','abhidhamma') AND o ~* 'samath' AND o ~* 'vipassan')) AS in_frame
  FROM p)
SELECT lc, count(*) n, round(avg(len)) avg_len, max(len) max_len,
  percentile_disc(0.5) WITHIN GROUP (ORDER BY len) median_len
FROM cand WHERE in_frame GROUP BY lc ORDER BY n DESC;
