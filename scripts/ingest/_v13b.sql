-- MN119 kayagatasati directed framing
SELECT id, citation, work_slug, length(original) len,
 (SELECT string_agg(left(mm[1],240), '  ⋯  ') FROM regexp_matches(original, '[^.।]*(?:kāyagatāsati|kāyagataṁ sati|bhāvitā bahulīkat)[^.।]*[.।]','gi') mm) AS kg
FROM passages WHERE id='mn119';
;;;
-- Mettasutta nidana in Sn-a (Khuddaka commentary): tree-deva backstory
SELECT id, citation, work_slug, title, length(original) len
FROM passages
WHERE work_slug='pli-kn-attha' AND title ~* 'mettasutta|karaṇīyametta'
ORDER BY id LIMIT 20;
;;;
-- carita sense-split in the sutta layer: temperament-compound vs other
WITH s AS (SELECT id, original o FROM passages
  WHERE work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-kn','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-vv','pli-pv','pli-cp','pli-bv','pli-ja','pli-ap','pli-kp'))
SELECT
 count(*) FILTER (WHERE o ~* 'carit') AS any_carita,
 count(*) FILTER (WHERE o ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit') AS temperament_compound,
 count(*) FILTER (WHERE o ~* 'carit' AND o !~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit') AS other_sense
FROM s;
;;;
-- sample sutta carita occurrences (non-temperament) to confirm verb/other sense
SELECT id, (SELECT string_agg(left(mm[1],110),' | ') FROM regexp_matches(original, '\S*carit\S*','g') mm) AS forms
FROM passages
WHERE work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-snp','pli-dhp','pli-iti','pli-ud')
  AND original ~* 'carit'
  AND original !~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit'
LIMIT 18;
;;;
-- Vism III: carita-suitability matrix + the 40-object enumeration rows
SELECT id, citation, title, length(original) len,
 left(original, 70) AS head,
 (original ~* 'rāgacaritassa') AS has_carita_matrix,
 (original ~* 'dasa kasiṇā|kasiṇānaṁ|kasiṇāni') AS lists_kasina,
 (original ~* 'asubhā|asubhānaṁ') AS lists_asubha,
 (original ~* 'cattāro brahmavihārā|brahmavihār') AS lists_brahmavihara
FROM passages WHERE work_slug='pli-vism'
  AND (original ~* 'rāgacaritassa' OR original ~* 'dasa kasiṇā|kasiṇānaṁ' OR original ~* 'cattāḷīsa.{0,12}kammaṭṭhān|kammaṭṭhānāni')
ORDER BY id LIMIT 30;
