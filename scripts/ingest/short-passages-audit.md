# Short-original passage audit

Threshold: `LENGTH(original) < 200`. Run via
`audit-short-passages.mjs`. Date column omitted intentionally —
re-run any time for a fresh snapshot.

## Headline

- Total passages: **25,986**
- Short passages (< 200 chars): **3,180** (12.24%)

## Length distribution

| Bucket | Count |
| --- | ---: |
| 100-199 | 2,005 |
| 1-49 | 295 |
| 200+ | 22,806 |
| 50-99 | 880 |

## By work_slug (short rows only)

Concentrated in Abhidhamma + CST grammar/reference works — the
Paṭṭhāna's combinatorial entries and the Saddanīti's grammar
lemmas are genuinely terse. Not noise.

| work_slug | short rows | avg len | min len |
| --- | ---: | ---: | ---: |
| pli-abhidhamma | 1255 | 121.6 | 22 |
| pli-vin-tika | 446 | 118.2 | 20 |
| pli-cst-e0807n-nrf | 386 | 104 | 24 |
| pli-abh-tika | 220 | 121.1 | 19 |
| pli-cst-e0806n-nrf | 200 | 81.4 | 15 |
| pli-sn | 116 | 143.6 | 88 |
| pli-ja | 111 | 173.3 | 155 |
| pli-cst-e0811n-nrf | 72 | 112.2 | 87 |
| pli-thag | 68 | 180.4 | 164 |
| pli-an | 57 | 128 | 61 |
| pli-vin-attha | 44 | 134 | 49 |
| pli-cst-e0902n-nrf | 32 | 157.8 | 132 |
| pli-kn-attha | 20 | 108.9 | 32 |
| pli-cst-e0901n-nrf | 20 | 146.3 | 97 |
| pli-abh-attha | 17 | 146.9 | 41 |
| pli-thig | 14 | 164.1 | 151 |
| pli-cst-e0808n-nrf | 13 | 101.4 | 93 |
| pli-an-attha | 12 | 97.3 | 65 |
| pli-vism-tika | 6 | 105 | 60 |
| pli-sn-attha | 6 | 62.2 | 35 |
| pli-cst-e0605n-nrf | 6 | 124.2 | 87 |
| pli-sn-tika | 6 | 86.7 | 47 |
| pli-cst-e0813n-nrf | 5 | 122.6 | 48 |
| pli-cst-e0201n-nrf | 5 | 145.4 | 92 |
| pli-cst-e0809n-nrf | 4 | 147.3 | 133 |
| pli-cst-e1009n-nrf | 4 | 93 | 86 |
| pli-cst-e0804n-nrf | 4 | 120.3 | 82 |
| pli-dn-tika | 4 | 97.5 | 51 |
| pli-cst-e0812n-nrf | 3 | 110 | 94 |
| pli-dn-attha | 3 | 49.3 | 36 |
| pli-vinaya | 3 | 95 | 38 |
| pli-kn | 2 | 82 | 60 |
| pli-mn-attha | 2 | 75.5 | 36 |
| pli-cst-e1214n-nrf | 2 | 99.5 | 98 |
| pli-cst-e0905n-nrf | 2 | 195 | 191 |
| pli-pv | 2 | 189.5 | 182 |
| pli-mn-tika | 1 | 109 | 109 |
| pli-cst-e1010n-nrf | 1 | 142 | 142 |
| pli-cp | 1 | 182 | 182 |
| pli-cst-e0805n-nrf | 1 | 198 | 198 |
| pli-dn | 1 | 140 | 140 |
| pli-cst-e1001n-nrf | 1 | 184 | 184 |
| pli-cst-e0904n-nrf | 1 | 69 | 69 |
| pli-cst-e0810n-nrf | 1 | 179 | 179 |

## Shortest 40 rows (potential noise)

These are the rows most likely to be parse-truncation or
metadata-only — anything < ~30 chars deserves a manual look.

| len | id | title | original (head) |
| ---: | --- | --- | --- |
| 15 | `cst-e0806n.nrf-257` | 35. Gavā | Duno rukkhassa. |
| 17 | `cst-e0806n.nrf-422` | 158. Lopo | Vaḍḍhanaṃ vaḍḍhi. |
| 19 | `cst-abh09t.nrf-047` | Lakkhaṇamātikā | Sabhāgo. Visabhāgo. |
| 19 | `cst-e0806n.nrf-205` | 58. A | Nto neti sambandho. |
| 20 | `cst-vin09t.nrf-251` | 7. Nisīdanasikkhāpadavaṇṇanā | Sattamaṃ uttānameva. |
| 21 | `cst-e0806n.nrf-248` | 23. Amā | Amāsaha bhavo amacco. |
| 21 | `cst-vin06t.nrf-062` | 11. Dutiyasaṅghabhedasikkhāpadavaṇṇanā | 422. Saññīti saññino. |
| 21 | `cst-vin06t.nrf-448` | Ubbāhikavaggavaṇṇanā | 455. Pasāretā mohetā. |
| 22 | `cst-abh03m1.mul-004` | 4. Lakkhaṇamātikā | 4. Sabhāgo, visabhāgo. |
| 22 | `cst-e0806n.nrf-393` | 108. | Nidhīyitthāti viggaho. |
| 22 | `cst-e0806n.nrf-423` | 159. Kvi | Abhibhavatīti abhibhū. |
| 22 | `cst-e0806n.nrf-466` | 67. Hanā | Cha ca khā ca cha khā. |
| 23 | `cst-e0806n.nrf-316` | 135. Jovu | Yakārassa dvitte jeyyo. |
| 23 | `cst-e0806n.nrf-424` | 162. Māna | Massa lopoti sambandho. |
| 23 | `cst-e0806n.nrf-427` | 165. Tuṃ | Tayopīti tuṃyāna raccā. |
| 23 | `cst-vin06t.nrf-411` | Yatthavārapucchāvāravaṇṇanā | 304. Labbhatīti pucchā. |
| 23 | `cst-vin09t.nrf-309` | 12. Lahupāvuraṇasikkhāpadavaṇṇanā | Dutiyaṃ uttānatthameva. |
| 23 | `cst-vin09t.nrf-328` | 10. Rodanasikkhāpadavaṇṇanā | Dasamaṃ uttānatthameva. |
| 24 | `cst-e0807n.nrf-334` | 40. Samāsantva | Upari aya+madhikarīyati. |
| 24 | `cst-vin09t.nrf-300` | 1. Pattasannicayasikkhāpadavaṇṇanā | Paṭhamaṃ uttānatthameva. |
| 24 | `cst-vin09t.nrf-326` | 8. Paraujjhāpanakasikkhāpadavaṇṇanā | Aṭṭhamaṃ uttānatthameva. |
| 25 | `cst-e0806n.nrf-336` | 20. Ṇiṇā | Yadatthanti yaṃpayojanaṃ. |
| 25 | `cst-e0807n.nrf-702` | 65. Mānoti | Kattari māno. Tiṭṭhamāno. |
| 25 | `cst-vin09t.nrf-325` | 7. Anāpucchāsantharaṇasikkhāpadavaṇṇanā | Kulānīti kulassa gharāni. |
| 25 | `cst-vin09t.nrf-358` | 9. Sokāvāsasikkhāpadavaṇṇanā | Āgacchamānāti āgacchantī. |
| 26 | `cst-vin06t.nrf-122` | 5. Cīvaradānasikkhāpadavaṇṇanā | 169. Sādiyissasīti pucchā. |
| 27 | `cst-e0806n.nrf-460` | 42. Ossa | Ādesānanti aādīnamādesānaṃ. |
| 27 | `cst-e0806n.nrf-461` | 46. Iṃssa | Pubbasminti akāsinti ettha. |
| 27 | `cst-vin07t.nrf-070` | 3. Tatiyapārājikaṃ | Tīhīti kāyavacīmanodvārehi. |
| 27 | `cst-vin09t.nrf-298` | 7-13. Sañcarittādisikkhāpadavaṇṇanā | Sattamādīni uttānatthāneva. |
| 28 | `cst-abh03t.tik-112` | 9. Ariyadhammavipākakathāvaṇṇanā | 500. Vaṭṭanti kammādivaṭṭaṃ. |
| 28 | `cst-e0806n.nrf-201` | 52. Latvī | Paṭimukkakambū āmukkavalayā. |
| 28 | `cst-e0807n.nrf-151` | 174. Ṭi smino | Āravā+desamhā smino ṭi hoti. |
| 28 | `cst-e0807n.nrf-345` | 54. Uttarapade | Idaṃ sabbattha adhikātabbaṃ. |
| 29 | `cst-abh01m.mul-119` | Oghagocchakaṃ | 1501. Katame dhammā oghā…pe…. |
| 29 | `cst-abh01m.mul-120` | Yogagocchakaṃ | 1502. Katame dhammā yogā…pe…. |
| 29 | `cst-e0806n.nrf-266` | 48. Ṇoca | Puriso pamāṇamassāti viggaho. |
| 29 | `cst-e0807n.nrf-253` | 3,102. Ekaṭṭhāna+mā | Ekaaṭṭhānaṃ ā hoti dase pare. |
| 29 | `cst-e0807n.nrf-468` | 85. Ṇo tapāti | Ṇo, tāpaso, sakāgamo. Tāpasī. |
| 29 | `cst-vin06t.nrf-360` | Saṅghebhinnecīvaruppādakathāvaṇṇanā | 376. Parasamuddeti jambudīpe. |

## Non-CST short rows

SuttaCentral-ingested rows (no `cst-` prefix) with short original.
These are mostly genuine short suttas (e.g. SN 1.x verses, Thag
single-stanza verses) but worth scanning for outliers.

| len | id | citation | original (head) |
| ---: | --- | --- | --- |
| 50 | `pli-tv-bi-vb-pj1-4` | Bi Pj 1-4 | Theravāda Vinaya Bhikkhunivibhaṅga Pārājikakaṇḍa ~ |
| 55 | `dt1.4` | DT 1.4 | Dhātukathā Uddesa 4. Lakkhaṇamātikā Sabhāgo, visabhāgo. |
| 61 | `an4.106` | AN 4.106 | Aṅguttara Nikāya 4.106 11. Valāhakavagga [Dutiyaambasutta] () |
| 78 | `dt1.5` | DT 1.5 | Dhātukathā Uddesa 5. Bāhiramātikā Sabbāpi dhammasaṅgaṇī dhātukathāya mātikāti. |
| 86 | `an7.91` | AN 7.91 | Aṅguttara Nikāya 7.91 9. Samaṇavagga Ariyasutta “… Ārakattā ariyo hoti …pe…. Sat |
| 88 | `sn46.68` | SN 46.68 | Saṁyutta Nikāya 46.68 8. Nirodhavagga Maraṇasutta “Maraṇasaññā, bhikkhave …pe…”  |
| 88 | `sn46.75` | SN 46.75 | Saṁyutta Nikāya 46.75 8. Nirodhavagga Virāgasutta “Virāgasaññā, bhikkhave …pe…”  |
| 89 | `sn46.67` | SN 46.67 | Saṁyutta Nikāya 46.67 8. Nirodhavagga Asubhasutta “Asubhasaññā, bhikkhave …pe…”  |
| 89 | `an7.90` | AN 7.90 | Aṅguttara Nikāya 7.90 9. Samaṇavagga Vedagūsutta “… Viditattā vedagū hoti …pe….  |
| 89 | `sn46.74` | SN 46.74 | Saṁyutta Nikāya 46.74 8. Nirodhavagga Pahānasutta “Pahānasaññā, bhikkhave …pe…”  |
| 89 | `sn46.71` | SN 46.71 | Saṁyutta Nikāya 46.71 8. Nirodhavagga Aniccasutta “Aniccasaññā, bhikkhave …pe…”  |
| 90 | `an7.89` | AN 7.89 | Aṅguttara Nikāya 7.89 9. Samaṇavagga Nhātakasutta “… Nhātattā nhātako hoti …pe…. |
| 91 | `sn46.62` | SN 46.62 | Saṁyutta Nikāya 46.62 7. Ānāpānavagga Mettāsutta “Mettā, bhikkhave, bhāvitā …pe… |
| 92 | `sn46.59` | SN 46.59 | Saṁyutta Nikāya 46.59 7. Ānāpānavagga Vinīlakasutta “Vinīlakasaññā, bhikkhave …p |
| 92 | `an7.87` | AN 7.87 | Aṅguttara Nikāya 7.87 9. Samaṇavagga Brāhmaṇasutta “… Bāhitattā brāhmaṇo hoti …p |
| 93 | `sn46.64` | SN 46.64 | Saṁyutta Nikāya 46.64 7. Ānāpānavagga Muditāsutta “Muditā, bhikkhave, bhāvitā …p |
| 93 | `sn46.63` | SN 46.63 | Saṁyutta Nikāya 46.63 7. Ānāpānavagga Karuṇāsutta “Karuṇā, bhikkhave, bhāvitā …p |
| 93 | `an7.88` | AN 7.88 | Aṅguttara Nikāya 7.88 9. Samaṇavagga Sottiyasutta “… Nissutattā sottiyo hoti …pe |
| 94 | `sn46.65` | SN 46.65 | Saṁyutta Nikāya 46.65 7. Ānāpānavagga Upekkhāsutta “Upekkhā, bhikkhave, bhāvitā  |
| 94 | `an9.54` | AN 9.54 | Aṅguttara Nikāya 9.54 6. Khemavagga Amatasutta “‘Amataṁ, amatan’ti, āvuso, vucca |
| 96 | `sn46.72` | SN 46.72 | Saṁyutta Nikāya 46.72 8. Nirodhavagga Dukkhasutta “Anicce dukkhasaññā, bhikkhave |
| 96 | `sn55.71` | SN 55.71 | Saṁyutta Nikāya 55.71 7. Mahāpaññavagga Hāsapaññāsutta “… Hāsapaññatāya saṁvatta |
| 96 | `sn46.73` | SN 46.73 | Saṁyutta Nikāya 46.73 8. Nirodhavagga Anattasutta “Dukkhe anattasaññā, bhikkhave |
| 96 | `sn55.70` | SN 55.70 | Saṁyutta Nikāya 55.70 7. Mahāpaññavagga Lahupaññāsutta “… Lahupaññatāya saṁvatta |
| 97 | `sn55.60` | SN 55.60 | Saṁyutta Nikāya 55.60 6. Sappaññavagga Paññāvuddhisutta “… Paññāvuddhiyā saṁvatt |

## Likely-noise candidates

Rows whose `original` is dominated by punctuation, parenthetical
markup, or section-header crumbs — heuristics for triage:

- contains `niṭṭhito` / `niṭṭhitā` (volume colophon) and < 200 chars
- only digits/punctuation

### Colophon-only-looking (sample of 20)

| len | id | head |
| ---: | --- | --- |
| 36 | `cst-s0102a.att-dn2` | Niṭṭhitā ca mahāvaggassatthavaṇṇanā. |
| 36 | `cst-s0202a.att-mn2` | Majjhimapaṇṇāsa-aṭṭhakathā niṭṭhitā. |
| 38 | `cst-s0103a.att-dn3` | Niṭṭhitā ca pāthikavaggassa vaṇṇanāti. |
| 38 | `cst-vin02m3.mul-vin4` | Cūḷavaggo (cullavaggo (sī.)) niṭṭhito. |
| 51 | `cst-s0102t.tik-dn2` | Niṭṭhitā ca mahāvaggaṭṭhakathāya līnatthappakāsanā. |
| 54 | `cst-s0103t.tik-dn3` | Niṭṭhitā ca pāthikavaggaṭṭhakathāya līnatthappakāsanā. |
| 74 | `cst-s0303a.att-sn3_5` | 312-321. Uppādasaṃyutte sabbaṃ pākaṭameva. Uppādasaṃyuttavaṇṇanā niṭṭhitā. |
| 74 | `cst-s0101a.att-dn1` | Niṭṭhitā ca terasasuttapaṭimaṇḍitassa sīlakkhandhavaggassa Atthavaṇṇanāti. |
| 78 | `cst-s0303t.tik-sn3_5` | 312-321. Sabbaṃ pākaṭameva apubbassa abhāvato. Uppādasaṃyuttavaṇṇanā niṭṭhitā. |
| 87 | `cst-e0807n.nrf-421` | Purisā ṇo hoti mattādayo ca. Puriso parimāṇa+massa porisaṃ, purisamattaṃ+purisatagghaṃ. |
| 94 | `cst-s0101t.tik-dn1` | Niṭṭhitā ca terasasuttapaṭimaṇḍitassa sīlakkhandhavaggassa atthavaṇṇanāya Līnatthappakāsanāti. |
| 140 | `cst-s0101m.mul-dn1` | Sīlakkhandhavaggo niṭṭhito. Tassuddānaṃ – Brahmāsāmaññaambaṭṭha, Soṇakūṭamahālijālinī; Sīhapoṭṭhapād |
| 154 | `pp1.10` | Puggalapaññatti Mātikā 10. Dasakauddesa <b>Dasa puggalā—</b> Pañcannaṁ idha niṭṭhā, pañcannaṁ idha v |
| 161 | `ya4.3` | 4 Dhātuyamaka 4.3. Pariññāvāra Yo cakkhudhātuṁ parijānāti so sotadhātuṁ parijānātīti? Āmantā. …pe… ( |

### Punctuation/digit-only rows

Rows whose original has zero alphabetic characters: **0**

## Recommendation

Most short rows are real canonical content. The 25 CST mūla
volume-header uddāna rows (`cst-…m.mul-{nikāya}N` with no
underscore) are already hidden from `/api/corpus` — see
CLAUDE.md. No other systematic noise pattern jumps out from this
audit. Spot-check the "Shortest 40" table above before any future
cleanup pass.
