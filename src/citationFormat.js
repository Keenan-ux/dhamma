// Citation formatter — Chicago-ish. Real bibliographers will sniff at it, but
// it produces a paste-able reference for notes and bibliographies.
//
// Format:  MN 10.4, Satipaṭṭhāna Sutta, Majjhima Nikāya. Trans. Bhikkhu Sujato.
//          https://dhamma.fly.dev/p/mn10-4

// Theravāda Vinaya citations sometimes arrive as raw SuttaCentral UIDs in
// upper case — e.g. "PLI-TV-BI-VB-PJ1-4" — which a scholar can't read at a
// glance. The readable form is "Bhi. Pj. 1-4". The server prettifies most
// of these on ingest, but range-form rule passages (and any future ingest
// that skips the mapping) can still leak a raw UID through, so the display
// layer cleans it defensively and idempotently. Already-readable citations
// ("Bhi. Pj. 1-4", "Vin. Kd. 13", "MN 10", the CST "E0806N-NRF §354" forms)
// don't start with "PLI-TV-" and pass through untouched. Abbreviations
// match the server's own scheme (title-cased class code + ".").
function titleDot(code) {
  return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase() + '.';
}

export function prettifyVinayaCitation(citation) {
  if (!citation || typeof citation !== 'string') return citation;
  const raw = citation.trim();
  // Suttavibhaṅga rule references: PLI-TV-<who>-VB-<class><number(range)>.
  // who = BU (bhikkhu) / BI (bhikkhunī); class = PJ, SS, NP, PC, PD, SK, …;
  // number can be a single rule ("PJ1") or a range ("PJ1-4") or dotted.
  let m = /^PLI-TV-(BU|BI)-VB-([A-Z]+)(\d[\d.\-]*)$/i.exec(raw);
  if (m) {
    const who = m[1].toUpperCase() === 'BI' ? 'Bhi.' : 'Bhu.';
    return `${who} ${titleDot(m[2])} ${m[3]}`;
  }
  // Khandhaka / Parivāra sections: PLI-TV-KD13, PLI-TV-PVR18, PLI-TV-PVR2.1.
  m = /^PLI-TV-(KD|PVR)(\d[\d.\-]*)$/i.exec(raw);
  if (m) {
    return `Vin. ${titleDot(m[1])} ${m[2]}`;
  }
  return citation;
}

export function formatCitation(passage, { includeUrl = true, translatorName } = {}) {
  if (!passage) return '';
  const parts = [];
  if (passage.citation) parts.push(prettifyVinayaCitation(passage.citation));
  if (passage.title) parts.push(passage.title);
  if (passage.work) parts.push(passage.work);

  const main = parts.join(', ') + (parts.length ? '.' : '');
  const lines = [main];

  // Translator attribution. Use the display name the caller resolved for
  // the passage's selected translator. This used to hard-code "Bhikkhu
  // Sujato" for every Theravāda translation, which mis-attributed every
  // other translator (Thanissaro, Bodhi, Ireland, Walshe, ...). Only
  // assert attribution when we actually know who did the translation.
  const tr = translatorName && String(translatorName).trim();
  if (passage.translation && tr) {
    lines.push(`Trans. ${tr}.`);
  }

  if (includeUrl && passage.id) {
    const origin = (typeof window !== 'undefined' && window.location.origin) || 'https://dhamma.fly.dev';
    lines.push(`${origin}/p/${passage.id}`);
  }

  return lines.filter(Boolean).join(' ');
}
