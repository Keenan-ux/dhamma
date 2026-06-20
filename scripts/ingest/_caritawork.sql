-- exact work + title for the 9 sutta-layer temperament-carita ids
SELECT id, work_slug, citation, left(title,40) t,
 substring(original from position(c in original) for 24) AS form
FROM (
 SELECT id, work_slug, citation, title, original,
   (regexp_match(original, '\S*(?:rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit)\S*'))[1] c
 FROM passages
 WHERE id IN ('cst-s0515m.mul-kn15_14','cst-s0515m.mul-kn15_16','cst-s0516m.mul-kn16_1','cst-s0518m.nrf-kn18_2','cst-s0519m.mul-kn19_4','cst-s0519m.mul-kn19_5','cst-s0519m.mul-kn19_6','cst-s0520m.nrf-kn20_2','cst-s0520m.nrf-kn20_7')
) q ORDER BY id;
;;;
-- what work is each cst-s05NNm? probe the opening of each work's first row
SELECT DISTINCT ON (work_prefix) work_prefix, id, left(original,60) opening FROM (
 SELECT substring(id from '^(cst-s05[0-9]+m)') work_prefix, id, original, position FROM passages
 WHERE id ~ '^cst-s05(15|16|17|18|19|20)m'
) z ORDER BY work_prefix, position LIMIT 12;
;;;
-- confirm the Puggalapannatti abhidhamma-mula row exists (the abhidhamma=1 tier)
SELECT id, work_slug, citation, left(title,50) t FROM passages WHERE id='cst-abh03m2.mul-014';
