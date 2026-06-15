# Draft email to the Buddhist Publication Society

**To:** info@bps.lk, cnt@bps.lk
**Subject:** Notification: BPS English translations now indexed at dhamma.fly.dev

Dear BPS,

I'm writing to let you know straightforwardly that material from a
number of BPS Online Library titles has been incorporated into a
non-commercial scholarly research tool at <https://dhamma.fly.dev/>,
with full attribution and link-back to bps.lk on every passage. I
wanted to disclose this directly rather than have you find out
through analytics.

The site indexes the Pāli Tipiṭaka, the major Aṭṭhakathā commentaries
and Ṭīkā sub-commentaries via the VRI/CST corpus, multi-translator
English where translations exist, and six integrated dictionaries
(DPD, DPPN, PED, CPED, Monier-Williams, Edgerton's BHS), with
hybrid FTS plus BGE-M3 vector search. No ads, no tracking. ATI's
corpus (under CC BY-NC 4.0) already sits alongside the SuttaCentral
translations under each sutta. The BPS material now joins that
layer for the works listed below.

What's currently live from BPS:

  * Visuddhimagga, *The Path of Purification*, Bhikkhu Ñāṇamoli
    (BP207H, 1956/2010). 2,727 paragraph-level translation rows
    aligned to the fine CST Visuddhimagga divisions, plus the
    Translator's Introduction as a Library article. Marked as
    `bps-online-free` license in our schema, since the BPS Online
    Edition uses the share-alike free-redistribution terms distinct
    from the other Wheel publications.

  * Bhikkhu Bodhi's four BPS commentary books, *The All-Embracing
    Net of Views* (BP209S, 1978), *The Discourse on the Root of
    Existence* (BP210S, 1980), *The Great Discourse on Causation*
    (BP211S, 1984), and *The Discourse on the Fruits of Recluseship*
    (BP212S, 1989). 42 commentary-aligned translation rows plus
    8 articles (per-book introductions and BP209S's Parts III to V
    standalone essays on exegetical method, the pāramīs, and the
    word "Tathāgata").

  * *A Comprehensive Manual of Abhidhamma*, Bhikkhu Bodhi (BP304S,
    1993). The complete book: 305 Bodhi-translated verse blocks
    from Anuruddha's *Abhidhammattha-saṅgaha* aligned across all
    nine chapters of the corresponding CST paragraph rows, with
    Bodhi's "Guide to §N" prose explanation attached as per-row
    notes. Translator's Introduction as a Library article.

  * *Mindfulness of Breathing*, Bhikkhu Ñāṇamoli (BP502S, 1964).
    Part I (the Ānāpānasati Sutta, MN 118) aligned to the canonical
    passage; Parts II, III, IV (the Visuddhimagga commentary
    extracts, the Paṭisambhidāmagga Ānāpānakathā, and the related
    sutta passages) and the front-matter forewords as Library
    articles.

  * *The Udāna and the Itivuttaka*, John D. Ireland (BP214S, 1997).
    All 80 Udāna and 112 Itivuttaka suttas aligned to their
    canonical passages, with the two Introductions combined into
    one Library article.

  * *The Heart of Buddhist Meditation*, Nyanaponika Thera (BP509S,
    1962). Part Two (the Mahāsatipaṭṭhāna-Sutta, DN 22) aligned to
    the canonical passage. Part One (Nyanaponika's extended essay)
    and Part Three (the "Flowers of Deliverance" anthology) as
    Library articles.

  * *The Way of Mindfulness*, Soma Thera (BP501S). The Satipaṭṭhāna
    Sutta with classical commentary and sub-commentary excerpts.
    Because Soma's typesetting weaves the canonical and commentarial
    passages together throughout, the book is presented as Library
    articles (Foreword, Introduction, Discourse and Commentary)
    rather than as a single canonical translation row.

A few representative URLs you can click to see how the material
appears:

  * MN 118 with Ñāṇamoli alongside Sujato and Thanissaro:
    <https://dhamma.fly.dev/#/read/mn118>
  * Udāna 1.1 with Ireland's translation:
    <https://dhamma.fly.dev/#/read/ud1.1>
  * DN 22 Mahāsatipaṭṭhāna with Nyanaponika alongside Sujato:
    <https://dhamma.fly.dev/#/read/dn22>
  * The Mūlapariyāya Sutta with Bodhi's commentary translation
    surfacing on the corresponding CST commentary passages:
    <https://dhamma.fly.dev/#/read/mn1>
  * The opening verse of Anuruddha's Abhidhammattha-saṅgaha with
    Bodhi's translation and Guide commentary:
    <https://dhamma.fly.dev/#/read/cst-abh07t.nrf-1_p001>
  * The Library tab listing the BPS articles:
    <https://dhamma.fly.dev/#/library>

Every passage and article carries a per-card attribution that
names the translator, the book title and BP catalogue number,
the year, and a link back to bps.lk, plus a short note that the
material is used under fair use for non-commercial scholarly
indexing with the original copyright held by the Buddhist
Publication Society, Kandy.

I did not write to you in advance of doing this, and I want to be
clear about why. Permission-first risked an unanswered inbox
blocking real work for months, or a cautious "no" from someone
who hadn't seen the attribution discipline in context. The
posture I took instead, structured scholarly extraction with
attribution and link-back, leaves the PDFs entirely undisturbed
on bps.lk and treats your work the way a citing index treats
its sources. If you would prefer a different attribution form,
particular passages excluded, or any other adjustment, please
tell me and I will honour it. I expect the right answer is
somewhere between "leave as is" and "tighten this specific
thing," and I'd rather hear from you than guess.

With respect, and thanks for the decades of editorial work that
made these translations possible.

[name withheld]
keenan@boothcheck.com

---

## Pre-send checklist

- [ ] Re-read for tone after letting it sit overnight
- [ ] Confirm passage counts above match prod (dbcheck shows
      194,710 passages; translations counts via `/api/translators`)
- [ ] Spot-check each demonstration URL still loads on prod
- [ ] Decide whether to include the BP304s aside or hold for a
      separate follow-up
