-- exact contiguous clauses for the 4 failing evidence quotes
SELECT 'an9.4' k, substring(original from position('Saddho ca, nandaka' in original) for 130) s FROM passages WHERE id='an9.4'
UNION ALL
SELECT 'an6.19', substring(original from position('maraṇassati, bhikkhave, bhāvitā' in original) for 120) FROM passages WHERE id='an6.19'
UNION ALL
SELECT 'mn119', substring(original from position('Kathaṁ bhāvitā ca, bhikkhave, kāyagatāsati' in original) for 150) FROM passages WHERE id='mn119'
UNION ALL
SELECT 'metta', substring(original from position('Sace pana devatāhi abhayaṃ' in original) for 130) FROM passages WHERE id='cst-s0505a.att-10_p007';
