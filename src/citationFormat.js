// Citation formatter — Chicago-ish. Real bibliographers will sniff at it, but
// it produces a paste-able reference for notes and bibliographies.
//
// Format:  MN 10.4, Satipaṭṭhāna Sutta, Majjhima Nikāya. Trans. Bhikkhu Sujato.
//          https://dhamma.fly.dev/p/mn10-4

export function formatCitation(passage, { includeUrl = true } = {}) {
  if (!passage) return '';
  const parts = [];
  if (passage.citation) parts.push(passage.citation);
  if (passage.title) parts.push(passage.title);
  if (passage.work) parts.push(passage.work);

  const main = parts.join(', ') + (parts.length ? '.' : '');
  const lines = [main];

  if (passage.translation && passage.tradition?.toLowerCase().includes('therav')) {
    lines.push('Trans. Bhikkhu Sujato.');
  }

  if (includeUrl && passage.id) {
    const origin = (typeof window !== 'undefined' && window.location.origin) || 'https://dhamma.fly.dev';
    lines.push(`${origin}/p/${passage.id}`);
  }

  return lines.filter(Boolean).join(' ');
}
