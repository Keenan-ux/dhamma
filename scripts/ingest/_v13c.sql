-- Vism III carita-suitability matrix + 40-object list (verbatim)
SELECT id, citation, title, original
FROM passages
WHERE id IN ('cst-e0101n.mul-36_p024','cst-e0101n.mul-36_p031','cst-e0101n.mul-37_p004','cst-e0101n.mul-37_p010','cst-e0101n.mul-37_p020','cst-e0101n.mul-37_p023')
ORDER BY id;
;;;
-- Mettasutta nidana: which Mettasuttavannana paragraphs carry the tree-deva (devata/rukkha) story
SELECT id, citation, title, left(original, 600) AS head
FROM passages
WHERE work_slug='pli-kn-attha' AND title ~* 'mettasutta'
  AND original ~* 'devatā|rukkh|vāsūpag|araññ'
ORDER BY id LIMIT 8;
;;;
-- the 9 sutta-layer temperament-carita passages: where do they live?
SELECT id, work_slug, citation,
 (SELECT string_agg(left(mm[1],60),' | ') FROM regexp_matches(original, '\S*(?:rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit)\S*','g') mm) AS forms
FROM passages
WHERE work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-kn','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-vv','pli-pv','pli-cp','pli-bv','pli-ja','pli-ap','pli-kp')
  AND original ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit'
ORDER BY work_slug, id;
