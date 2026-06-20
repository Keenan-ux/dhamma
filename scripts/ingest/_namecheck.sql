-- tables with a translator/source/copyright-ish column
SELECT table_name, column_name FROM information_schema.columns
WHERE column_name ~* 'translat|source|copyright|attribution|author' AND table_schema='public'
ORDER BY table_name, column_name;
;;;
-- any rows anywhere referencing the name or the isaac-cyr key (translations table)
SELECT 'translations' tbl, count(*) n FROM information_schema.tables WHERE table_name='translations';
