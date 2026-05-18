// Canon structure. Stub nodes (no children, no passageId, marked stub:true)
// are visible-but-muted — they show the SHAPE of the canon even before ingest.
// Real corpora replace these at the standalone-Postgres stage.

export const CORPUS = [
  {
    id: 'theravada',
    name: 'Theravāda',
    subtitle: 'Pali transmission',
    children: [
      {
        id: 'tipitaka',
        name: 'Tipiṭaka',
        subtitle: 'The Three Baskets',
        children: [
          { id: 'vinaya', name: 'Vinaya Piṭaka', subtitle: 'Monastic discipline', stub: true },
          {
            id: 'sutta',
            name: 'Sutta Piṭaka',
            subtitle: 'Discourses',
            children: [
              {
                id: 'dn',
                name: 'Dīgha Nikāya',
                subtitle: '34 long discourses',
                children: [
                  { id: 'dn-22', name: 'DN 22', subtitle: 'Mahāsatipaṭṭhāna Sutta', passageId: 'dn-22-2' },
                  { id: 'dn-1', name: 'DN 1', subtitle: 'Brahmajāla Sutta', stub: true },
                  { id: 'dn-2', name: 'DN 2', subtitle: 'Sāmaññaphala Sutta', stub: true },
                  { id: 'dn-16', name: 'DN 16', subtitle: 'Mahāparinibbāna Sutta', stub: true },
                  { id: 'dn-rest', name: '…30 more', subtitle: 'pending ingest', stub: true },
                ],
              },
              {
                id: 'mn',
                name: 'Majjhima Nikāya',
                subtitle: '152 middle-length',
                children: [
                  { id: 'mn-10', name: 'MN 10', subtitle: 'Satipaṭṭhāna Sutta', passageId: 'mn-10-4' },
                  { id: 'mn-1', name: 'MN 1', subtitle: 'Mūlapariyāya Sutta', stub: true },
                  { id: 'mn-26', name: 'MN 26', subtitle: 'Ariyapariyesanā Sutta', stub: true },
                  { id: 'mn-118', name: 'MN 118', subtitle: 'Ānāpānasati Sutta', stub: true },
                  { id: 'mn-rest', name: '…148 more', subtitle: 'pending ingest', stub: true },
                ],
              },
              { id: 'sn', name: 'Saṃyutta Nikāya', subtitle: 'Connected discourses', stub: true },
              { id: 'an', name: 'Aṅguttara Nikāya', subtitle: 'Numerical discourses', stub: true },
              { id: 'kn', name: 'Khuddaka Nikāya', subtitle: 'Minor collection', stub: true },
            ],
          },
          { id: 'abhidhamma', name: 'Abhidhamma Piṭaka', subtitle: 'Higher doctrine', stub: true },
        ],
      },
      {
        id: 'commentary',
        name: 'Commentaries',
        subtitle: 'Aṭṭhakathā',
        children: [
          {
            id: 'vism',
            name: 'Visuddhimagga',
            subtitle: 'Buddhaghosa, 5th c. CE',
            children: [
              { id: 'vism-iii', name: 'Ch. III', subtitle: 'Camma-kammaṭṭhāna · Sammāsamādhi', passageId: 'vism-iii-29' },
              { id: 'vism-other', name: 'Chs. I–II, IV–XXIII', subtitle: 'pending ingest', stub: true },
            ],
          },
          { id: 'mn-attha', name: 'Papañcasūdanī', subtitle: 'MN commentary', stub: true },
          { id: 'dn-attha', name: 'Sumaṅgalavilāsinī', subtitle: 'DN commentary', stub: true },
        ],
      },
    ],
  },
  {
    id: 'mahayana',
    name: 'Mahāyāna',
    subtitle: 'Sarvāstivāda parallel · Chinese',
    children: [
      {
        id: 'taisho',
        name: 'Taishō Tripiṭaka',
        subtitle: '大正新脩大藏經',
        children: [
          {
            id: 'agamas',
            name: 'Āgamas',
            subtitle: 'Parallels to Pali Nikāyas',
            children: [
              { id: 'da', name: 'Dīrgha Āgama', subtitle: '長阿含 · parallel to DN', stub: true },
              {
                id: 'ma',
                name: 'Madhyama Āgama',
                subtitle: '中阿含 · parallel to MN',
                children: [
                  { id: 'ma-98', name: 'MĀ 98', subtitle: '念處經 Niànchù jīng', passageId: 'ma-98' },
                  { id: 'ma-rest', name: '…221 more', subtitle: 'pending ingest', stub: true },
                ],
              },
              { id: 'sa', name: 'Saṃyukta Āgama', subtitle: '雜阿含 · parallel to SN', stub: true },
              { id: 'ea', name: 'Ekottarika Āgama', subtitle: '增一阿含 · parallel to AN', stub: true },
            ],
          },
          { id: 'mahayana-sutras', name: 'Mahāyāna Sūtras', subtitle: 'Prajñāpāramitā, Lotus, etc.', stub: true },
        ],
      },
    ],
  },
  {
    id: 'zen',
    name: 'Zen',
    subtitle: 'Sōtō tradition · Japanese',
    children: [
      {
        id: 'shobogenzo',
        name: 'Shōbōgenzō',
        subtitle: 'Dōgen, 13th c. CE · 正法眼蔵',
        children: [
          { id: 'genjokoan', name: 'Genjōkōan', subtitle: '現成公案', passageId: 'shobogenzo-genjokoan' },
          { id: 'bendowa', name: 'Bendōwa', subtitle: '弁道話', stub: true },
          { id: 'busshu', name: 'Busshō', subtitle: '佛性', stub: true },
          { id: 'zenki', name: 'Zenki', subtitle: '全機', stub: true },
          { id: 'sg-rest', name: '…71 more fascicles', subtitle: 'pending ingest', stub: true },
        ],
      },
      { id: 'eihei-koroku', name: 'Eihei Kōroku', subtitle: 'Extensive record', stub: true },
      { id: 'fukan-zazengi', name: 'Fukan Zazengi', subtitle: 'Universal recommendation', stub: true },
    ],
  },
];

// Compute breadcrumb path of node names given a path of ids.
export function pathNames(path) {
  const out = [];
  let level = CORPUS;
  for (const id of path) {
    const node = level.find((n) => n.id === id);
    if (!node) break;
    out.push(node.name);
    level = node.children || [];
  }
  return out;
}

// Resolve children at a given path. Returns null if path is invalid.
export function childrenAtPath(path) {
  let level = CORPUS;
  for (const id of path) {
    const node = level.find((n) => n.id === id);
    if (!node?.children) return null;
    level = node.children;
  }
  return level;
}

// Depth-first list of all non-stub leaves (nodes with passageId). Order in
// the tree = order of canonical traversal, which is also the reading order
// for prev/next adjacent navigation.
export function collectLeaves(nodes = CORPUS, out = []) {
  for (const n of nodes) {
    if (n.passageId && !n.stub) out.push(n);
    if (n.children) collectLeaves(n.children, out);
  }
  return out;
}

// Path of parent ids leading to a leaf. Useful when adjacent-nav jumps the
// user into a different branch — the column display follows along.
export function pathToLeaf(leafId, nodes = CORPUS, prefix = []) {
  for (const n of nodes) {
    if (n.id === leafId) return prefix;
    if (n.children) {
      const sub = pathToLeaf(leafId, n.children, [...prefix, n.id]);
      if (sub) return sub;
    }
  }
  return null;
}
