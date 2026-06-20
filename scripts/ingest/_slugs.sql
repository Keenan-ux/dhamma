-- all canonical (non-attha non-tika) work_slugs
SELECT work_slug, count(*) AS n FROM passages
WHERE work_slug NOT LIKE '%-attha' AND work_slug NOT LIKE '%-tika'
GROUP BY work_slug ORDER BY n DESC;
