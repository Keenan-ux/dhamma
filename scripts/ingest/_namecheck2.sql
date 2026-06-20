-- in-house translation rows by key / source
SELECT translator, source, copyright, count(*) n FROM translations
WHERE translator ILIKE '%isaac%' OR translator ILIKE '%cyr%' OR translator ILIKE '%keenan%'
   OR source ILIKE '%dhamma%' OR copyright ILIKE '%isaac%' OR copyright ILIKE '%keenan%' OR copyright ILIKE '%cyr%'
GROUP BY translator, source, copyright;
;;;
-- any article carrying the name in author/copyright
SELECT author, copyright, count(*) n FROM articles
WHERE author ILIKE '%isaac%' OR author ILIKE '%keenan%' OR author ILIKE '%cyr%'
   OR copyright ILIKE '%isaac%' OR copyright ILIKE '%keenan%' OR copyright ILIKE '%cyr%'
GROUP BY author, copyright;
;;;
-- any passage whose translation text or notes carries the name
SELECT count(*) n FROM passages WHERE translation ILIKE '%Isaac Keenan%' OR translation ILIKE '%Keenan Cyr%' OR notes ILIKE '%Keenan Cyr%';
