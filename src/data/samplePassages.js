// Scaffold-time mock corpus. Real ingestion pipeline lands once the standalone
// repo + Postgres are stood up. These six passages all reference sampajāna
// (clear comprehension) — chosen to demonstrate the cross-tradition query the
// app is built for. Original-language text shortened for layout; full passages
// will come from canonical sources (SuttaCentral, CBETA, etc.) at ingest time.

export const SAMPLE_PASSAGES = [
  {
    id: 'mn-10-4',
    tradition: 'Theravāda',
    canon: 'Pali',
    work: 'Majjhima Nikāya',
    citation: 'MN 10.4',
    title: 'Satipaṭṭhāna Sutta',
    original: 'Idha bhikkhave bhikkhu abhikkante paṭikkante sampajānakārī hoti, ālokite vilokite sampajānakārī hoti…',
    translation:
      'Here, monks, a monk acts in clear comprehension (sampajāna) when going forward and returning; when looking ahead and looking aside; when bending and stretching the limbs.',
  },
  {
    id: 'dn-22-2',
    tradition: 'Theravāda',
    canon: 'Pali',
    work: 'Dīgha Nikāya',
    citation: 'DN 22',
    title: 'Mahāsatipaṭṭhāna Sutta',
    original: 'Puna caparaṃ bhikkhave bhikkhu abhikkante paṭikkante sampajānakārī hoti…',
    translation:
      'Again, monks, a monk in going forward or returning practices with clear comprehension. The fourfold formula expanded across daily activities — sitting, standing, eating, drinking — each subject to sampajāna.',
  },
  {
    id: 'sn-47-2',
    tradition: 'Theravāda',
    canon: 'Pali',
    work: 'Saṃyutta Nikāya',
    citation: 'SN 47.2',
    title: 'Sato Sutta',
    original: 'Kathañca bhikkhave bhikkhu sampajāno hoti? Idha bhikkhave bhikkhuno viditā vedanā uppajjanti…',
    translation:
      'And how, monks, does a monk exercise clear comprehension? Here, feelings are known to him as they arise, as they persist, as they pass away. So too perceptions and thoughts.',
  },
  {
    id: 'vism-iii-29',
    tradition: 'Theravāda',
    canon: 'Pali',
    work: 'Visuddhimagga',
    citation: 'Vism III.29',
    title: 'Visuddhimagga, Chapter III',
    original: 'Sampajaññaṃ catubbidhaṃ — sātthakasampajaññaṃ, sappāyasampajaññaṃ, gocarasampajaññaṃ, asammohasampajaññaṃ.',
    translation:
      'Buddhaghosa enumerates four kinds of sampajañña: clear comprehension of purpose, of suitability, of resort (domain of meditation), and of non-delusion. Each is a distinct discipline of mindful action.',
  },
  {
    id: 'ma-98',
    tradition: 'Mahāyāna (Sarvāstivāda parallel)',
    canon: 'Chinese',
    work: 'Madhyama Āgama',
    citation: 'MĀ 98',
    title: '念處經 — Niànchù jīng (Smṛtyupasthāna Sūtra)',
    original: '比丘來往出入。屈伸俯仰。儀容庠序。著僧伽梨。及諸衣鉢。行住坐臥。眠寤語默。皆正知之。',
    translation:
      'The Chinese parallel to MN 10 / DN 22. The Sarvāstivāda recension renders sampajāna as 正知 (zhèng zhī, "right knowing"). Same fourfold formula across postures and activities; vocabulary diverges from Pali while structure holds.',
  },
  {
    id: 'shobogenzo-genjokoan',
    tradition: 'Zen (Sōtō)',
    canon: 'Japanese',
    work: 'Shōbōgenzō',
    citation: 'Shōbōgenzō: Genjōkōan',
    title: 'Actualizing the Fundamental Point',
    original: '自己をはこびて万法を修証するを迷とす。万法すすみて自己を修証するはさとりなり。',
    translation:
      'Dōgen rarely uses the Sanskrit/Pali term directly, but Genjōkōan turns on the same axis sampajāna names: knowing-in-action without the bifurcation of knower and known. "To carry yourself forward and experience the myriad dharmas is delusion; the myriad dharmas advance and experience the self — that is realization."',
  },
];
