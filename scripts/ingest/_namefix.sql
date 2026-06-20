-- scrub the name from the in-house translation row
UPDATE translations SET translator='dhamma', copyright=NULL
WHERE translator='isaac-cyr' OR source='dhamma' OR copyright ILIKE '%isaac%' OR copyright ILIKE '%keenan%' OR copyright ILIKE '%cyr%';
;;;
-- confirm nothing name-bearing remains
SELECT translator, source, copyright FROM translations WHERE source='dhamma' OR translator='dhamma';
