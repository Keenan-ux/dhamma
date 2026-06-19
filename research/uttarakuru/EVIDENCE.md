# Uttarakuru — consolidated evidence dossier (verbatim, feature-by-feature)

Internal working file (coder dossier + compaction insurance). Every cite resolves to a live corpus row.
Layers: **canon** = Tipiṭaka mūla (voice=canonical); **para** = work_role=mula but voice=para-canon
(Vism, Milinda); **attha** = Aṭṭhakathā; **tika** = Ṭīkā. Warrant = the canonical id licensing the
feature, or `null` (→ H1). Snapshot 2026-06-19, 194,710 passages.

## Disambiguation tallies (frozen)
- `uttarakuru` substring: **144** rows (mula 20 / attha 64 / tika 46 / anya 14). Exact-FTS token: **15**.
- 20 mula rows by voice: **14 canon** (Kathāvatthu, AN 9.21, DN 32, Apadāna, a KN/Bv book, Vinaya — with
  CST+SC duplicate ids) + **2 Vism** + **4 Milinda** (para-canon).
- Confounds excluded: bare `kuru`≠`uttarakuru` = **977**; `kurudhamma`/`kuruvatta` = **26**.
- Frame (other 3 continents, bare term absent) = **~29**; cakkavatti `cāturanta` epithet = 125 (excluded
  as epithet; DN 17/26 conquest folded selectively).

---

## §A — Ethnography & cosmology

**A1. Northern continent in the four-mahādīpa schema** (N of Sineru; measure; shape).
- canon DN 32 / `dn32` (`cst-s0103m.mul-dn3_9`): "Yena uttarakuruvho, mahāneru sudassano" — Uttarakuru by
  Mt Neru. Sujato EN present.
- para Vism §73.57 (`cst-e0101n.mul-73_p057`): "Uttarakuru aṭṭhasahassayojanaṃ" (8,000 yojanas; Goyāna/
  Pubbavideha 7,000; Jambudīpa 10,000). Also Sp §6.57, KN-a §50.22/§12.36.
- comm shape: Sp-ṭ §9.230 / Vism-mhṭ §75.96: "uttarakuru **pīṭhasaṇṭhāno**" (seat/square-shaped; faces of
  the people match the continent's shape). Sv-a 9 §19: Sineru's four sides (silver E, jewel S, crystal W,
  gold N). **Warrant ✓ (DN 32 location). H0 canonical-seed; size/shape = commentarial-detail.**

**A2. Self-ripening unploughed rice (akaṭṭhapāka-sāli); no sowing/ploughing.**
- canon DN 32: "Na te bījaṃ pavapanti, napi nīyanti naṅgalā; Akaṭṭhapākimaṃ sāliṃ, paribhuñjanti mānusā."
  Same verse in the Apadāna/Buddhavaṃsa-stratum (`tha-ap3`, `cst-s0510m1.mul-kn10_1`: "Aññe gacchanti
  goyānaṃ … aññe ca uttarakuruṃ").
- comm Sv-pṭ 9 §23: "Akaṭṭhapākimameva sāliṃ **akaṇaṃ athusaṃ sugandhaṃ** taṇḍulaphalaṃ paribhuñjantānaṃ"
  (huskless, chaffless, fragrant). **Warrant ✓ (DN 32). H0 canonical-seed.**

**A3. No ownership / no mine-making (amama, apariggaha); no houses (bhūmisaya); no slaves.**
- canon AN 9.21: "amamā, apariggahā"; DN 32: "amamā apariggahā".
- comm Sv-a 9 §19 (`cst-s0103a.att-dn3_9_p019`): "Amamāti vatthābharaṇapānabhojanādīsupi mamattavirahitā.
  Apariggahāti itthipariggahena apariggahā." KN-a §95.217 / Ps-a 5 §307: "bhūmisayā narā nāma … uttarakurukā
  … gehābhāvato" (houseless ground-sleepers). Sv-pṭ 9 §23: "na … dāsadāsikammakarādipariggaho" (no slaves/
  servants). **Warrant ✓ (AN 9.21 / DN 32). H0 canonical-seed.**

**A4. Tree-dwellings + the wish-/cloth-tree (kapparukkha)** dispensing clothes, ornaments, instruments.
- canon: — (NOT in the bare-term canon verses).
- attha As §88.21 (`cst-abh01a.att-88_p021`): each realm's signature tree — "uttarakurumhi **kapparukkhassa**"
  (vs sirīsa Pubbavideha, kadamba Goyāna, pāricchattaka Tāvatiṃsa). KN-a §326.14 (Jotika): "Kapparukkhehi
  vatthāni gaṇhantu, ābharaṇāni gaṇhantū." tika Sv-pṭ 9 §23 (tree-houses, kūṭāgārūpamā) / §25 (clothes,
  gold ornaments, even instruments hang from the kapparukkha). **Warrant null → H1 commentarial-innovation.**

**A5. Perpetual mild climate; no thorns; no disease; no deformity.**
- canon: —. comm Sv-pṭ 9 §23: "sabbakālaṃ samasītuṇhova utu" (always temperate, like the last month of
  summer at dawn); no cold/heat/insects; rice-eaters get "na koci rogo" (no leprosy/boil/consumption/cough/
  asthma/epilepsy/fever); not hunchbacked/dwarf/blind/lame/crippled. §25: "Na tattha
  kaṇṭakatiṇakakkhaḷagacchalatā" (no thorns/rough grass). **Warrant null → H1 commentarial-innovation.**

**A6. Fixed thousand-year lifespan; no premature death.**
- canon AN 9.21: "niyatāyukā" (fixed lifespan — bare qualifier, no figure).
- comm Mp-a vol.9 §63 (`cst-s0404a.att-an9_p063`): "Niyatāyukāti tesañhi **nibaddhaṃ āyu vassasahassameva**"
  (exactly 1,000 years). Sv-pṭ 9 §25: "**Vassasahassameva** ca nesaṃ sabbakālaṃ āyuppamāṇaṃ." No
  premature death — Abh-pṭ §133.2 (`cst-abh07t.nrf-133_p002`): "upacchedakamaraṇaṃ … idaṃ pana nerayikānaṃ
  **uttarakuruvāsīnaṃ** kesañci devānañca na hoti." Sv-pṭ 1 §323 / Mp-pṭ vol.8 §219: "uttarakurukānaṃ pana
  **ekantaniyataparicchedameva**" (absolutely fixed span). **Warrant ✓-partial (AN 9.21 fixed-span). H0
  seed + commentarial-detail (the figure "1,000"; "absolutely fixed").**

**A7. No fixed marriage; abandoned communal children; 7-day sexuality; perpetual youth (♀16/♂25).**
- canon: apariggaha re wife (AN 9.21/DN 32 — oblique).
- attha Sv-a 9 §19: "'ayaṃ mayhaṃ bhariyā'ti mamattaṃ na hoti, mātaraṃ vā bhaginiṃ vā disvā chandarāgo
  nuppajjati" (no "my wife"; no desire toward mother/sister). tika Sv-pṭ 9 §20: no "ayaṃ mayhaṃ bhariyā"
  grasping, no mother/sister conventions; §23: women always look 16, men 25, "na puttadāresu rajjanti";
  §25: "Mātā … puttaṃ vā dhītaraṃ vā vijāyitvā … **anapekkhā yathāruci gacchati**" (mother abandons newborn
  in a public place; passersby's fingers give milk by the child's kamma); "**Sattāhikā eva** … kāmaratikīḷā
  … tato **vītarāgā viya** vicaranti" (sex once in 7 days; otherwise wander like the passion-free).
  **Warrant weak/oblique. H1 commentarial (the abandoned-child & 7-day-sex specifics have no canonical
  warrant; the no-"my-wife" gloss elaborates apariggaha).**

**A8. Physical beauty / extraordinarily fine hair.**
- canon: —. attha Vibh-a §8.3 / tika Sp-ṭ §62.6: the hair of the Uttarakurukas used as a *unit of fineness*
  (a Jambudīpa hair split eightfold = one Uttarakuru hair). Sv-pṭ 9 §23: long beauty description.
  **Warrant null → H1 commentarial-innovation.**

**A9. Iddhi-larder: the Buddha & arahants travel to Uttarakuru by psychic power for almsfood** (returning
to rinse at Anotatta lake). — THE dominant commentarial motif (dozens of vatthus).
- canon Vinaya Mahākhandhaka (`pli-tv-kd1` / `cst-vin02m2.mul-vin3_1`): "bhagavā … uttarakuruṃ gantvā tato
  piṇḍapātaṃ āharitvā anotattadahe paribhuñjitvā" (the Uruvela-Kassapa episode). Vinaya Verañjakaṇḍa
  (`pli-tv-bu-vb-pj1` / `cst-vin01m.mul-vin1_1`): in the Verañjā famine Moggallāna offers "sabbo
  bhikkhusaṅgho uttarakuruṃ piṇḍāya gaccheyyā"; the Buddha forbids ("Alaṃ, moggallāna"). Apadāna verse
  ("Aññe ca uttarakuruṃ, esanāya durāsadā").
- para Milinda 3.7.9 (`mil3.7.9`): "atthi koci, yo iminā sarīrena uttarakuruṃ vā gaccheyya … Atthi,
  mahārāja … iddhimā bhikkhu … vehāsaṃ gacchati" (going there in this very body by iddhi). Sujato EN.
- comm e.g. KN-a §305.18 (Uruvela-Kassapa), Mp-a §361, Ps-a 3 §94, Spk-a 2 §68, Sp-ṭ §53.49 (the vikāla
  rule: food fetched from Uttarakuru in the afternoon, eaten back here in time, no offence).
  **Warrant ✓ (Vinaya/Apadāna). H0 canonical-seed, hugely amplified.**

**A10. Cakkavatti conquest of the four continents; the jewel-woman (itthiratana) comes from Uttarakuru.**
- canon DN 17/DN 26 four-continent (cāturanta) frame.
- comm Sv-a 4 §26 / Ps-a 3 §217 / KN-a §8.77: "aṭṭhayojanasahassappamāṇaṃ uttarakuruṃ vijetuṃ" (conquering
  the 8,000-yojana Uttarakuru). Sv-a 4 §37 / KN-a §50.14 / Ps-a 3 §228: "itthiratanaṃ … uttarakuruto vā
  puññānubhāvena sayaṃ āgacchati" (the jewel-queen comes from Uttarakuru). **Warrant ✓-frame. H0 +
  commentarial-detail.**

---

## §B — The soteriological paradox (the hinge)

**B1. The triangular three-superiorities — AN 9.21 Tiṭhānasutta** (the load-bearing canonical text).
- canon `an9.21`: Uttarakuru ↑ devas+Jambudīpa by **amama / apariggaha / niyatāyuka** (+ visesaguṇā;
  var. *visesabhuno* sī.syā.pī.); devas ↑ by dibba āyu/vaṇṇa/sukha; Jambudīpa ↑ Uttarakuru+devas by
  **sūra / satimanto / idha brahmacariyavāso**. Sujato EN. Quoted in Kathāvatthu (`kv1.3` /
  `cst-abh03m3.mul-026`, Suddhabrahmacariya-kathā). **Warrant ✓✓. The structure itself encodes the paradox
  (Uttarakuru has the fruits of virtue, not the path).**

**B2. The holy life is "here" because Buddhas/Paccekabuddhas arise only in Jambudīpa** (∴ no path elsewhere).
- canon AN 9.21 ("idha brahmacariyavāso" — bare).
- comm Mp-a vol.9 §63: "Idha brahmacariyavāsoti **jambudīpe buddhapaccekabuddhānaṃ uppajjanato**
  aṭṭhaṅgikamaggabrahmacariyavāsopi idheva hoti." **Warrant ✓-partial. H0 canonical-seed + commentarial
  explication (= the 'no Buddhas in Uttarakuru' point).**

**B3. The bar: Uttarakurukas are acchandika (lack wholesome zeal), abhabba (incapable of the path),
grouped with Māra; the holy life there is anokāsa (no opportunity).** — the decisive commentarial sharpening.
- **canonical category + debate (Abhidhamma): Kathāvatthu Suddhabrahmacariya-kathā** (`kv1.3` /
  `cst-abh03m3.mul-026`). The controverted point is *"Natthi devesu brahmacariyavāso"* (is there no holy
  life among the gods?). The Theravādin (sakavādī) supplies the *acchandika / abhabba niyāmaṃ okkamituṃ*
  vocabulary inside a **reductio** ("if you deny the gods the holy life you must absurdly call them all
  acchandika, abhabba, matricides…"), and **softens** AN 9.21's *idha brahmacariyavāso* for the **devas**:
  a non-returner reborn in the Pure Abodes completes the path *there* (so "idha" ≠ "only-in-Jambudīpa"). But
  the debate **leaves Uttarakuru on the no-brahmacariya side** — the relief is carved out for the devas,
  not for Uttarakuru. So the *category* (acchandika/abhabba) and the *deficit* are canonical; the
  identification of the Uttarakurukas with that category is **not** stated here.
- **commentarial identification + hardening:** attha Vibh-a §129.14 (`cst-abh02a.att-129_p014`):
  "Acchandikāti kattukamyatākusalacchandarahitā. **Uttarakurukā manussā acchandikaṭṭhānaṃ paviṭṭhā.** …
  Abhabbā niyāmaṃ okkamituṃ" — positively slots the Uttarakurukas into the abhabba class. Same gloss:
  Sv-pṭ 1 §204, Ps-pṭ 3 §211, Spk-pṭ 6 §21, Mp-pṭ §307, KN-a §63.15. tika Vism-mhṭ §67.11: "Uttarakurukāpi
  manussā **mārādayo viya** … nibbutichandarahitā" (like Māra, lacking the desire for nibbāna). Abh-pṭ
  §279.12: "uttarakurukādayo viya acchandikā … abhabbāgamanā." Abh-pṭ §73.3 (`cst-abh05t.nrf-73_p003`):
  the going-forth is "uttarakurukānaṃ devānañca **anokāsabhāvato dukkarā dullabhā**", and crucially
  "uttarakurukānaṃ pana **visesānadhigamabhāvo**" — they cannot attain the path **even though the devas
  can** (the ṭīkā re-hardens against Uttarakuru exactly where the Kathāvatthu had softened for the devas).
  **Verdict: H0 canonical-category-and-deficit → H1 commentarial-identification (split). The non-obvious
  finding: the trajectory is not "lenient canon → harsh commentary" but "canon debates and partly softens
  (for the devas); commentary re-targets and hardens against Uttarakuru."**

**B4. Automatic virtue: pakati-sīla / tatrupapatti-niyata-sīla / dhammatā-siddha** — non-transgression that
is virtue *fixed by birth*, not undertaken (and so the whole life is `dhammatā-siddha`, accomplished by
nature). The thematic key: effortless ⇒ uncultivable.
- canon: amama/apariggaha (the fact, AN 9.21/DN 32).
- para Vism §6.29 (`cst-e0101n.mul-6_p029`): "uttarakurukānaṃ manussānaṃ **avītikkamo pakatisīlaṃ**."
- tika Vism-mhṭ §7.20 (`cst-e0103n.att-7_p020`): "Pakatisīlanti sabhāvasīlaṃ. **Tatrūpapattiniyataṃ hi
  sīlaṃ uttarakurukānaṃ.**" Sv-pṭ 9 §25: "Sabbametaṃ tesaṃ pañcasīlaṃ viya **dhammatāsiddhaṃ**."
  **Warrant ✓ (the fact is canon). H0 canonical-fact → commentarial-category (clean).**

**B5. Fixed heaven-destiny (sugati-niyata): dying there, reborn only in heaven; never hell/animal/ghost** —
but carefully distinguished from the technical niyata-rāsi.
- canon: — (the destiny is not in the bare-term canon).
- comm Mp-a vol.9 §63: "gatipi nibaddhā, tato cavitvā **saggeyeva nibbattanti**." Sv-pṭ 9 §25: "Na ca tato
  matā nirayaṃ vā … te **devaloke nibbattanti**." Pañca-a §31.23 (`cst-abh03a.att-31_p023`): "Yā pana
  uttarakurukānaṃ niyatagatikatā vuttā, **na sā niyatadhammavasena**" (their 'fixed destiny' is NOT the
  technical niyata of the ānantariya-doers / the ariyas). **Warrant null. H1 commentarial (+ a scholastic
  guard against over-reading 'fixed').**

---

## §C — Disambiguation / transmission (its own chapter)

**C1. The three referents the term blurs, fused by the tradition itself.** The commentary derives the
**Kuru janapada** and its five-precept **Kurudhamma** from migrants out of **Uttarakuru continent**.
- attha Sv-a 2 §5 (`cst-s0102a.att-dn2_2_p005`): the Mandhātu-cakkavatti legend — people brought from the
  three other continents, unable to return, are settled; "**uttarakuruto āgatamanussehi āvasitapadeso
  'kururaṭṭha'nti nāmaṃ labhi**" → "kurūsu viharati." Same: Ps-a 1 §967.
- tika Sv-pṭ 2 §7 (`cst-s0102t.tik-dn2_2_p007`): "te uttarakuruto āgatamanussā tattha rakkhitaniyāmeneva
  **pañca sīlāni rakkhiṃsu** … **kuruvattadhammo**ti paññāyittha. Ayañca attho **kurudhammajātakena**
  dīpetabbo." (continent → migrants → janapada → five precepts → kuru-vatta → Kurudhamma Jātaka). Same:
  Ps-pṭ 1 §926.
- the "like Uttarakuru" climate simile: Ps-pṭ 1 §928 (`cst-s0201t.tik-mn1_1_p928`): "pubbe
  kuruvattadhammānuṭṭhānavāsanāya **uttarakuru viya** … utuādisampannameva" (all three referents in one
  sentence). Same: Sv-pṭ 9 §3, Mp-pṭ vol.10 §34. Milinda 1: city "uttarakurusaṅkāsaṃ" (abundance simile).
  **Warrant null. H1 — the disambiguation IS a finding: the homonyms are genealogically fused by the
  texts.**

---

## Adversarial SQL log (load-bearing negatives reconfirmed, 2026-06-19)
- **kapparukkha in true-canon (mula, ¬Vism, ¬Milinda):** 9 rows anywhere; 1 with uttarakuru = the
  Apadāna anthology (`cst-s0510m1.mul-kn10_1`, 72k chars), terms ~21k apart, different verses → **spurious;
  A4 stays commentarial.**
- **1,000-yr (vassasahassa)+uttarakuru in true-canon:** 1 row = the same Apadāna; the vassasahassa is the
  **Āsāvatī creeper** ("fruits once in 1,000 years"), not the lifespan → **spurious; A6 figure
  commentarial.**
- **akkhaṇa+uttarakuru in mula:** 6 rows, all gaps 930–126,000 chars (Apadāna, Vinaya khandhakas); the
  canonical 8-akkhaṇa list (paccantima-janapada, dīghāyuka-deva) does **not** name Uttarakuru → **the
  akkhaṇa assimilation is commentarial.**
- **acchandika+uttarakuru in mula:** 2 rows = the **Kathāvatthu** (see B3); the acchandika/abhabba list is
  ~7,200 chars from the uttarakuru passage and is applied (in a reductio) to "all the gods, matricides…",
  not to the Uttarakurukas → **category canonical, identification commentarial.**
- **heaven-destiny (sagga/devaloka)+uttarakuru in true-canon:** 5 rows, smallest gap 4,302 chars → **no
  canonical predication of heaven-destiny of the Uttarakurukas; B5 commentarial.**

## Preliminary H0/H1 tally (to be blind-coded)
- **canonical-seed / H0-faithful:** A1, A2, A3, A6(span), A9, A10, B1, B2, B4 (~9).
- **commentarial-innovation / H1 (warrant null):** A4 (kapparukkha), A5 (climate/disease/deformity),
  A6(the "1,000" figure), A7 (abandoned-child/7-day-sex specifics), A8 (beauty/hair), B5 (fixed
  heaven-destiny), C1 (homonym fusion) (~7).
- **split (H0 category/deficit → H1 identification/hardening):** B3 (the acchandika/abhabba bar).
- **Thesis:** canon = skeletal frame (ownerless, unmarried, long-lived rice-eaters who surpass the gods in
  non-grasping yet lack the holy life); commentary = the flesh (wish-trees, perpetual youth, communal
  children, the 1,000-yr figure, fixed heaven-destiny) **and the decisive soteriological verdict**
  (acchandika / abhabba / *like Māra* — incapable of the path). The most consequential addition is
  soteriological, not ethnographic.
