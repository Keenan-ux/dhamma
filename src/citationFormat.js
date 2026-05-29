// Citation formatter — Chicago-ish. Real bibliographers will sniff at it, but
// it produces a paste-able reference for notes and bibliographies.
//
// Format:  MN 10.4, Satipaṭṭhāna Sutta, Majjhima Nikāya. Trans. Bhikkhu Sujato.
//          https://dhamma.fly.dev/p/mn10-4

export function formatCitation(passage, { includeUrl = true, translatorName } = {}) {
  if (!passage) return '';
  const parts = [];
  if (passage.citation) parts.push(passage.citation);
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
