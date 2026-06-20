-- the 9 sutta-layer temperament-carita passages: locate + forms
SELECT id, work_slug, citation,
 (SELECT string_agg(left(mm[1],50),' | ') FROM regexp_matches(original, '\S*(?:rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit)\S*','g') mm) AS forms
FROM passages
WHERE work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-kn','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-vv','pli-pv','pli-cp','pli-bv','pli-ja','pli-ap','pli-kp')
  AND original ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit'
ORDER BY work_slug, id;
