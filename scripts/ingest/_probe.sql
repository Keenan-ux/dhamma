-- columns of passages
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='passages' ORDER BY ordinal_position;
;;;
-- distinct layers + counts
SELECT layer, count(*) FROM passages GROUP BY layer ORDER BY 2 DESC;
;;;
-- sample work_slugs
SELECT work_slug, count(*) FROM passages GROUP BY work_slug ORDER BY 2 DESC LIMIT 25;
