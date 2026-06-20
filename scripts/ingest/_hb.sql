-- 1. Abhidhammattha-saṅgaha citta-vīthi (vīthisaṅgaha) — find the work + the citta-vīthi section
SELECT id, work_slug, citation, left(title,50) t, left(original,90) head
FROM passages
WHERE (title ~* 'vīthi|saṅgaha' OR original ~* 'cittavīthi|vīthicittā|sattarasa')
  AND (work_slug ~* 'cst|abh')
ORDER BY id LIMIT 12;
;;;
-- 2. Vibhaṅga Dhātuvibhaṅga (vb3) + confirm vb1/vb2/vb6 ids/titles
SELECT id, work_slug, citation, left(title,40) t FROM passages
WHERE id IN ('vb1','vb2','vb3','vb4','vb5','vb6') ORDER BY id;
;;;
-- 3. Paṭisambhidāmagga Ñāṇakathā: does ps1.1 carry the named insight-ñāṇas?
SELECT id, citation, left(title,40) t,
 (original ~* 'udayabbay') has_udayabbaya, (original ~* 'bhaṅgānupassan|bhaṅgañāṇ') has_bhanga,
 (original ~* 'ñāṇ') has_nana
FROM passages WHERE id='ps1.1';
