-- F4 unresolved cells: extract samatha/vipassana/yuganaddha sentences
SELECT id, citation, work_slug, length(original) len,
 (SELECT string_agg(left(mm[1],260), '  ⋯  ') FROM regexp_matches(original, '[^.।]*(?:samath|vipassan|yuganaddh)[^.।]*[.।]','gi') mm) AS sv
FROM passages WHERE id IN ('ps2.1','sn43.2','an4.92','an4.93','an4.94','an10.54','an9.4','an4.170','an4.94') ORDER BY id;
;;;
-- F3 maranasati canonical loci
SELECT id, citation, work_slug, length(original) len,
 (SELECT string_agg(left(mm[1],260), '  ⋯  ') FROM regexp_matches(original, '[^.।]*(?:maraṇasati|maraṇassati|maraṇaṃ anussar|maraṇaṁ anussar)[^.।]*[.।]','gi') mm) AS marana
FROM passages WHERE id IN ('an6.19','an8.73','an10.60') ORDER BY id;
;;;
-- F3 four-element analysis canonical loci
SELECT id, citation, work_slug, length(original) len,
 (SELECT string_agg(left(mm[1],240), '  ⋯  ') FROM regexp_matches(original, '[^.।]*(?:pathavīdhātu|catudhātu|catunnaṃ dhātūnaṃ|dhātumanasikār|imameva kāyaṃ)[^.।]*[.।]','gi') mm) AS dhatu
FROM passages WHERE id IN ('mn10','mn28','mn62','mn140') ORDER BY id;
