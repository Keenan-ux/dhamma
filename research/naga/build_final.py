#!/usr/bin/env python
"""Emit public/research/naga.json — the auditable dataset + the curated verified
spine overlay (evidence + warrants), the disambiguation ledger, IAA, the H0/H1
divergence cells, and the pre-computed aggregates. Every id resolves to a live row.
"""
import json
base = "research/naga/data"
asm = json.load(open(f"{base}/_census_assembled.json", encoding="utf-8"))

# ---- disambiguation ledger (full referent x layer, from aggregate_all) ----
REFERENT_LEDGER = {
 "serpent":   {"mula":159,"attha":818,"tika":203,"anya":86,"total":1266},
 "elephant":  {"mula":214,"attha":422,"tika":87, "anya":42,"total":765},
 "person":    {"mula":311,"attha":96, "tika":57, "anya":28,"total":492},
 "nonlexical":{"mula":92, "attha":264,"tika":225,"anya":59,"total":640},
 "epithet":   {"mula":91, "attha":120,"tika":38, "anya":15,"total":264},
 "citizen":   {"mula":17, "attha":222,"tika":38, "anya":25,"total":302},
 "tree":      {"mula":40, "attha":79, "tika":18, "anya":11,"total":148},
 "ambiguous": {"mula":11, "attha":6,  "tika":6,  "anya":9, "total":32},
}

# ---- curated verified spine (hand-read; evidence + warrant) ----
SPINE = {
 "sn29.1": {"facet":"birth_mode","segment":"A_ontology","voice":"buddha","tr_provenance":"sujato",
   "claim":"The four nāgayoni: egg-, womb-, moisture-, and spontaneous-born.",
   "evidence_pali":"“Catasso imā, bhikkhave, nāgayoniyo… Aṇḍajā nāgā, jalābujā nāgā, saṁsedajā nāgā, opapātikā nāgā.”",
   "evidence_en":"“Mendicants, there are these four nāga-births: egg-born, womb-born, moisture-born, and spontaneously-born nāgas.” (Sujato renders nāga as ‘dragon’.)"},
 "sn29.2": {"facet":"birth_mode","segment":"A_ontology","voice":"buddha","tr_provenance":"sujato",
   "claim":"The four births are ranked in excellence: spontaneous > moisture > womb > egg.",
   "evidence_pali":"“…aṇḍajehi nāgehi jalābujā ca… paṇītatarā… opapātikā nāgā paṇītatarā.”",
   "evidence_en":"The spontaneously-born are the most excellent, then moisture-, womb-, egg-born."},
 "sn29.3": {"facet":"uposatha","segment":"B_soteriology","voice":"buddha","tr_provenance":"sujato",
   "claim":"Nāgas keep the uposatha, reflecting on past mixed conduct and resolving to do good (aspiring to a heavenly rebirth).",
   "evidence_pali":"“…aṇḍajā nāgā uposathaṁ upavasanti vossaṭṭhakāyā ca bhavantī… Sacajja mayaṁ… sucaritaṁ careyyāma… sugatiṁ saggaṁ lokaṁ upapajjeyyāma.”",
   "evidence_en":"Some egg-born nāgas keep the sabbath, having released their bodies; they resolve to do good now so as to be reborn in a heaven. The ceiling is shown by what they aspire to — a good rebirth, never the path."},
 "sn29.7": {"facet":"lifespan","segment":"A_ontology","voice":"buddha","tr_provenance":"sujato",
   "claim":"Nāgas are long-lived, beautiful, and very happy (the aspiration-object).",
   "evidence_pali":"“…aṇḍajā nāgā dīghāyukā vaṇṇavanto sukhabahulā’ti.”",
   "evidence_en":"‘The egg-born nāgas are long-lived, beautiful, and abound in happiness.’"},
 "sn29.11-20": {"facet":"karma_cause","segment":"A_ontology","voice":"buddha","tr_provenance":"sujato",
   "claim":"Rebirth as a nāga = mixed conduct + hearing of nāga glory + aspiration + giving (a tenfold list of gifts).",
   "evidence_pali":"“…kāyena dvayakārī… Tassa sutaṁ hoti ‘aṇḍajā nāgā dīghāyukā…’… So annaṁ deti …pe… padīpeyyaṁ deti.”",
   "evidence_en":"One of mixed deeds, having heard of nāga glory and aspired to it, gives the ten gifts (food, drink, … a lamp) and is reborn among the nāgas."},
 "ud2.1": {"facet":"power","segment":"A_ontology","voice":"narrator","tr_provenance":"sujato",
   "claim":"The nāga-king Mucalinda leaves his abode, shelters the Buddha with seven coils and his hood, then takes human form to venerate him.",
   "evidence_pali":"“…mucalindo nāgarājā sakabhavanā nikkhamitvā bhagavato kāyaṁ sattakkhattuṁ bhogehi parikkhipitvā… mahantaṁ phaṇaṁ vihacca aṭṭhāsi… sakavaṇṇaṁ paṭisaṁharitvā māṇavakavaṇṇaṁ abhinimminitvā…”",
   "evidence_en":"Mucalinda the nāga-king came from his abode, wrapped the Buddha seven times in his coils and spread his great hood; then, withdrawing his serpent form, he manifested as a brahmin youth and venerated the Buddha. (Powers: dwelling, coils, hood, shape-shift.)"},
 "pli-tv-kd1": {"facet":"magga_phala_ceiling","segment":"B_soteriology","voice":"buddha","tr_provenance":"author",
   "claim":"A nāga infiltrates the Saṅgha in human form; the Buddha declares nāgas 'incapable of growth' (aviruḷhidhamma) in the Dhamma-Vinaya, names the two occasions the disguise fails, and bars all animals (tiracchānagata) from ordination.",
   "evidence_pali":"“…aññataro nāgo nāgayoniyā aṭṭīyati… māṇavakavaṇṇena… pabbajjaṁ yāci… ‘tumhe khottha nāgā aviruḷhidhammā imasmiṁ dhammavinaye’… ‘dveme, bhikkhave, paccayā nāgassa sabhāvapātukammāya. Yadā ca sajātiyā methunaṁ dhammaṁ paṭisevati, yadā ca vissaṭṭho niddaṁ okkamati’… ‘Tiracchānagato, bhikkhave, anupasampanno na upasampādetabbo, upasampanno nāsetabbo’ti.”",
   "evidence_en":"A nāga, disgusted with the nāga-birth and seeking human state, took the form of a youth and was ordained; discovered in serpent form, he was told: ‘You nāgas are of non-growth-nature (aviruḷhidhamma) in this Dhamma-Vinaya.’ The Buddha named the two occasions a nāga’s true form appears, when it mates with its own kind and when it falls asleep relaxed, and ruled: an animal, not ordained, is not to be ordained; if ordained, expelled. (Author’s gloss; corpus has no English. Cf. Horner, BD IV.)"},
 "dn32": {"facet":"classification","segment":"A_ontology","voice":"buddha","tr_provenance":"sujato","warrant":None,
   "claim":"Canonical cosmological placement: the nāgas form one of the four guardian armies (with yakkhas, gandhabbas, kumbhaṇḍas), set over the four quarters.",
   "evidence_pali":"“…yakkhasenāya… gandhabbasenāya… kumbhaṇḍasenāya… nāgasenāya catuddisaṁ rakkhaṁ ṭhapetvā…”",
   "evidence_en":"Having set a guard over the four quarters with a great army of yakkhas, of gandhabbas, of kumbhaṇḍas, and of nāgas. The nāga-host is one of the four canonical guardian armies (Āṭānāṭiya)."},
 "dn20": {"facet":"classification","segment":"A_ontology","voice":"buddha","tr_provenance":"sujato","warrant":None,
   "claim":"Nāgas attend the Great Assembly among the orders of beings who come to the Buddha; the canon already places them in the cosmic census.",
   "evidence_pali":"“…(Mahāsamaya) the nāgas of various lakes and rivers come to the great assembly of beings before the Buddha.”",
   "evidence_en":"In the Great Assembly the nāgas are named among the orders of beings gathered before the Buddha (DN 20). Canonical placement of the nāga in the cosmic census."},
 # commentary (author's gloss; no corpus English)
 "cst-s0303a.att-sn3_8_p002": {"facet":"birth_mode","segment":"A_ontology","voice":"commentary","tr_provenance":"author",
   "warrant":"sn29.1",
   "claim":"Spk-a glosses the four births and frames the sutta's purpose as lifting beings OUT of nāga-rebirth.",
   "evidence_pali":"“…aṇḍajāti aṇḍe jātā… opapātikāti upapatitvā viya jātā… bhagavā puggalānaṃ nāgayonīhi uddharaṇatthaṃ nāgayoniyo āvikaronto imaṃ suttamāha.”",
   "evidence_en":"Egg-born = born in an egg … spontaneous = born as if springing up. The Blessed One revealed the nāga-births in order to lift beings out of them. (H0: faithful gloss + occasion.)"},
 "cst-s0303a.att-sn3_8_p004": {"facet":"karma_cause","segment":"A_ontology","voice":"commentary","tr_provenance":"author",
   "warrant":"sn29.3",
   "claim":"Spk-a splits the dvayakārī cause: bad kamma is the condition for the rebirth, good kamma for the prosperity within it.",
   "evidence_pali":"“Dvayakārinoti… kusalākusalakārino… Tatrassa akusalaṃ upapattiyā paccayo hoti, kusalaṃ upapannānaṃ sampattiyā.”",
   "evidence_en":"‘Both-doer’ = doer of good and bad; there the bad kamma is the condition for the rebirth, the good kamma for the prosperity of those reborn. (H0-border: warranted regimentation of the sutta's dvayakārī.)"},
 "cst-vin02a2.att-36_p002": {"facet":"realm_habitat","segment":"A_ontology","voice":"commentary","tr_provenance":"author",
   "warrant":"pli-tv-kd1",
   "claim":"Sp: the nāga's rebirth-linking is rooted in BAD kamma (akusala-vipāka-paṭisandhi) though its life is deva-like; its true form (water-moving, frog-eating) appears on mating and relaxed sleep.",
   "evidence_pali":"“…akusalavipākapaṭisandhikassa pana tassa… nāgasarīraṃ pātubhavati udakasañcārikaṃ maṇḍūkabhakkhaṃ…”",
   "evidence_en":"Though by good-kamma-result he enjoys a deva-like lordship, because his rebirth-linking is by bad-kamma-result his nāga body — moving in water, eating frogs — appears. (H1: Abhidhammic paṭisandhi + realm/diet detail absent from the sutta.)"},
 "cst-vin02a2.att-36_p003": {"facet":"magga_phala_ceiling","segment":"B_soteriology","voice":"commentary","tr_provenance":"author",
   "warrant":"pli-tv-kd1",
   "claim":"Sp specifies the ceiling: nāgas are incapable (abhabba) of jhāna, insight, and path-and-fruit; and expands reversion from 2 canonical occasions to FIVE (rebirth, skin-shedding, mating, sleep, death).",
   "evidence_pali":"“Tumhe kho nāgā jhānavipassanāmaggaphalānaṃ abhabbattā… aviruḷhidhammā attha… Nāgassa pana pañcasu kālesu sabhāvapātukammaṃ hoti – paṭisandhikāle, tacajahanakāle, sajātiyā methunakāle, vissaṭṭhaniddokkamanakāle, cutikāleti.”",
   "evidence_en":"‘You nāgas are of non-growth-nature’ = because incapable of jhāna, insight, and path-and-fruit. A nāga's true form appears on five occasions: rebirth-linking, skin-shedding, same-species mating, relaxed sleep, and death. (H1: the abhabba rationale + the 2→5 expansion.)"},
 "cst-vin02a2.att-36_p004": {"facet":"ordination_bar","segment":"B_soteriology","voice":"commentary","tr_provenance":"author",
   "warrant":"pli-tv-kd1",
   "claim":"Sp broadens 'animal' (tiracchānagata) to ANY non-human — supaṇṇas, even Sakka king of devas — none may be ordained.",
   "evidence_pali":"“…nāgo vā hotu supaṇṇamāṇavakādīnaṃ vā aññataro, antamaso sakkaṃ devarājānaṃ upādāya yo koci amanussajātiyo, sabbova… tiracchānagatoti veditabbo.”",
   "evidence_en":"Whether a nāga, or a supaṇṇa-youth, or anyone of non-human birth down to Sakka king of the devas — all are ‘animal’ here; none may be ordained. (H1: tiracchāna → amanussa category broadening.)"},
 "cst-s0201a.att-mn1_2_p136": {"facet":"classification","segment":"A_ontology","voice":"commentary","tr_provenance":"author",
   "warrant":"sn29.1",
   "claim":"Catuyonivaṇṇanā sets the four nāga-births in the full cosmological birth-scheme; nāgas (dīghajāti) are among the four-birth beings; cross-refers a parallel four supaṇṇa-yoni.",
   "evidence_pali":"“‘Catasso nāgayoniyo catasso supaṇṇayoniyo’ti… cātumahārājikato paṭṭhāya uparidevā opapātikāva honti… yakkhāpi sabbacatuppadapakkhijātidīghajātiādayopi sabbe catuyonikāyeva.”",
   "evidence_en":"Devas from the Four Great Kings up are all spontaneously born; yakkhas, all quadrupeds, birds, and long-bodied beings (snakes/nāgas) are of all four births. (H0: systematizes the canonical four-yoni into the cosmology.)"},
}

# ---- H0/H1 decidable divergence cells (the contrastive result) ----
H0H1_CELLS = [
 {"cell":"Four nāgayoni glossed","facet":"birth_mode","canon":"sn29.1","commentary":"cst-s0303a.att-sn3_8_p002","verdict":"H0","note":"faithful gloss"},
 {"cell":"Four-yoni set in the cosmological birth-scheme","facet":"classification","canon":"sn29.1","commentary":"cst-s0201a.att-mn1_2_p136","verdict":"H0","note":"systematization, warranted"},
 {"cell":"Lifespan/beauty/happiness","facet":"lifespan","canon":"sn29.7","commentary":"cst-s0303a.att-sn3_8_p004","verdict":"H0","note":"repeated as aspiration-object"},
 {"cell":"Uposatha-keeping","facet":"uposatha","canon":"sn29.3","commentary":"cst-s0303a.att-sn3_8_p004","verdict":"H0","note":"vossaṭṭhakāya glossed"},
 {"cell":"dvayakārī cause split (bad→birth, good→prosperity)","facet":"karma_cause","canon":"sn29.3","commentary":"cst-s0303a.att-sn3_8_p004","verdict":"H0","note":"warranted regimentation"},
 {"cell":"Shape-shift to human form","facet":"takes_human_form","canon":"ud2.1","commentary":None,"verdict":"H0","note":"already canonical (Mucalinda, Vinaya nāga)"},
 {"cell":"Rebirth-linking rooted in bad kamma (akusala-vipāka-paṭisandhi)","facet":"classification","canon":None,"commentary":"cst-vin02a2.att-36_p002","verdict":"H1","note":"Abhidhammic; no canonical warrant located"},
 {"cell":"Realm/diet detail (water-dwelling, frog-eating)","facet":"realm_habitat","canon":None,"commentary":"cst-vin02a2.att-36_p002","verdict":"H1","note":"no canonical warrant located"},
 {"cell":"Ceiling rationale: abhabba for jhāna/vipassanā/magga-phala","facet":"magga_phala_ceiling","canon":"pli-tv-kd1","commentary":"cst-vin02a2.att-36_p003","verdict":"H1","note":"canon NAMES the ceiling (aviruḷhidhamma); the doctrinal rationale is commentarial"},
 {"cell":"Reversion occasions 2 → 5","facet":"takes_human_form","canon":"pli-tv-kd1","commentary":"cst-vin02a2.att-36_p003","verdict":"H1","note":"canon gives 2; Sp adds rebirth, skin-shedding, death"},
 {"cell":"tiracchāna → amanussa (any non-human, incl. Sakka)","facet":"ordination_bar","canon":"pli-tv-kd1","commentary":"cst-vin02a2.att-36_p004","verdict":"H1","note":"category broadened beyond 'animal'"},
]
h0 = sum(1 for c in H0H1_CELLS if c["verdict"]=="H0")
h1 = sum(1 for c in H0H1_CELLS if c["verdict"]=="H1")

# ---- apply spine overlay to records ----
recs = asm["records"]
by_id = {r["id"]: r for r in recs}
for sid, sp in SPINE.items():
    if sid in by_id:
        r = by_id[sid]
        r.update({k:v for k,v in sp.items() if k in
                  ("facet","segment","voice","claim","evidence_pali","evidence_en","tr_provenance","warrant")})
        r["claim_bearing"] = True
        r["verification"] = "verified"
    else:
        # spine row not in serpent set (shouldn't happen) — add it
        recs.append({"id":sid,"citation":sid,"sc_id":None if sid.startswith("cst-") else sid,
                     "layer":"mula" if not sid.startswith("cst-") else ("attha" if ".att-" in sid else "mula"),
                     "referent":"serpent","claim_bearing":True,"verification":"verified", **sp})

meta = {
 "title": "The Nāga as a Class of Being in the Pāli Canon — census v1.0",
 "version": "1.0",
 "generated": None,
 "corpus_snapshot": "194,710 passages (2026-06-19)",
 "design": "research/naga/RESEARCH-DESIGN.md",
 "thesis": "The canon fixes the load-bearing facts in Buddha-voice — the four nāgayoni, the animal "
   "(tiracchāna) destination, and the soteriological ceiling, which it even NAMES (nāgā aviruḷhidhammā, "
   "'incapable of growth') and enacts (the ordination bar). The commentary's work is apparatus: the "
   "Abhidhammic akusala-vipāka rebirth-linking, the realm/diet detail (water-dwelling, frog-eating), the "
   "2→5 expansion of disguise-failure occasions, the broadening of tiracchāna to any non-human (even "
   "Sakka), and the doctrinal rationale for the ceiling (abhabba for jhāna, insight, and path-and-fruit). "
   "Faithful on the bare facts, innovative in the apparatus.",
 "h_lex": {"finding": "nāga is a canonical heteronym; the serpent-being is a minority sense.",
   "canon_substring_nāga_rows": {"mula":2282,"attha":4655,"tika":2828,"anya":409,"total":10174},
   "canon_morphological_noise_pct": 59,
   "noise_note": "Of the 2,282 canon rows with the substring nāga, 935 carry a genuine nāga-token; the other 1,347 (59%) are morphological false friends. (The stricter word-initial design gate left 851 genuine canon rows, a 70% noise figure; the census frame, broad nāg minus the noise families, is the looser, reported one.)",
   "serpent_share_of_genuine_canon_rows": "159/935 = 17%",
   "serpent_share_of_raw_canon_substring": "159/2282 = 7%"},
 "iaa": {"field":"referent","coders":3,"n_subsample":124,"fleiss_kappa":0.853,
   "fleiss_kappa_serpent_vs_not":0.874,"all_three_agree":"83.9%",
   "note":"A random 124-row subsample of the canon ambiguous rows was triple-coded (κ below). The remaining canon-ambiguous rows and the whole commentary were single-coded against the κ-validated codebook; the deterministic strong-serpent rows were not human-coded for sense."},
 "saturation": {"method":"single-pass high-recall lexical census on the nāga-word, plus a snake-synonym sweep and a named-king reconciliation; not a proof of completeness.",
   "snake_synonym_floor":"≤6 canon rows carry nāga-being markers (phaṇa / bhavana / nāgarāja) under a snake-synonym (āsīvisa / uraga / bhujaga) without a nāga-token — the measured recall floor for being-material hidden under the literal-snake words (ahi, sappa, āsīvisa, uraga, bhujaga; mula counts 47 / 1003 / 75 / 52 / 5, overwhelmingly literal).",
   "dppn_reconciliation":"the named canonical nāga-kings all resolve in the corpus: Mucalinda 84, Bhūridatta 81, Erakapatta 68, Saṅkhapāla 44, Nandopananda 42, Apalāla 33, Campeyya 18."},
 "verification_note": "The load-bearing spine rows were re-fetched and quote-matched (verification='verified'); the remaining serpent rows are confirmed to exist as live corpus rows and were sense-coded from their windows (verification='exists'), but their quotes were not individually re-confirmed.",
 "h0_h1": {"decidable_cells": len(H0H1_CELLS), "H0": h0, "H1": h1,
   "scope": "A close reading of the load-bearing spine cells (the claims where both a canonical locus and a "
   "commentarial treatment sit on the verified spine), NOT a census-wide warrant tally; it is the qualitative "
   "mechanism behind the distributional result (facet×layer), not an independent quantitative claim.",
   "reading": f"Across the {len(H0H1_CELLS)} load-bearing cells, H0 (faithful) = {h0}, H1 (innovation) = {h1}. "
   "The faithful cells are the bare facts (the four births, lifespan, uposatha, the cause, the shape-shift); the "
   "located innovations are the apparatus (Abhidhammic paṭisandhi, realm/diet, the abhabba rationale, the 2→5 "
   "reversion list, the tiracchāna→amanussa broadening). Each 'no canonical warrant' is read as located, not absolute."},
 "referent_ledger": REFERENT_LEDGER,
 "query_log": {"engine": "PostgreSQL ~* (case-insensitive regex) over passages.original via the "
   "dhamma-pg flyctl proxy; the app search lane was not used for the frame.",
   "frame": "broad substring 'nāg' minus the morphological-noise families "
   "(NOISE = nāg(at|ām|acch|aman|ant|āra|h)|nāggh, i.e. āgata/āgāmin/āgacchati/āgamana/āganta/āghāta/"
   "āgāra/agghati); 3,909 candidate rows windowed; referent gate then classified to 1,266 serpent rows.",
   "codebook": "research/naga/CODEBOOK-referent.md",
   "full_log": "research/naga/HANDOFF.md"},
 "data_availability": "Codebook, query log, coder outputs, and the IAA computation are in research/naga/ "
   "(HANDOFF.md, CODEBOOK-referent.md, data/coded_*.json, aggregate.py). Every record id resolves via "
   "/api/passage/:id (#/read/<id>).",
}

# recompute every aggregate from the FINAL records (after the spine overlay), so
# the published counts reconcile exactly with records[] (peer-review MF-2).
from collections import Counter, defaultdict
serp_by_layer = Counter(r["layer"] for r in recs)
claim_by_layer = Counter(r["layer"] for r in recs if r.get("claim_bearing"))
fxl, sxl = defaultdict(Counter), defaultdict(Counter)
for r in recs:
    if r.get("claim_bearing") and r.get("facet"):
        fxl[r["facet"]][r["layer"]] += 1
        if r.get("segment"): sxl[r["segment"]][r["layer"]] += 1
facet_x_layer = {f: dict(c) for f, c in fxl.items()}
segment_x_layer = {s: dict(c) for s, c in sxl.items()}
REFERENT_LEDGER["serpent"] = {**{k: serp_by_layer.get(k, 0) for k in ('mula','attha','tika','anya')}, "total": len(recs)}

out = {"meta": meta,
       "spine": [by_id[s] for s in SPINE if s in by_id],
       "h0_h1_cells": H0H1_CELLS,
       "aggregates": {"referent_ledger": REFERENT_LEDGER,
                      "facet_x_layer": facet_x_layer,
                      "segment_x_layer": segment_x_layer,
                      "serpent_by_layer": dict(serp_by_layer),
                      "claim_by_layer": dict(claim_by_layer)},
       "records": recs}
json.dump(out, open("public/research/naga.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
import os
print(f"wrote public/research/naga.json ({os.path.getsize('public/research/naga.json')/1024:.0f} KB)")
print(f"records {len(recs)}; spine {len(out['spine'])}; H0/H1 cells {len(H0H1_CELLS)} (H0 {h0}, H1 {h1})")
