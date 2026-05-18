// Bodhi-leaf glyph. Inline SVG so it picks up theme via var(--bc-accent).
// Cross-tradition Buddhist iconography — recognizable across Theravada,
// Mahayana, Zen contexts the app aggregates.
export default function Leaf({ size = 28, color = 'var(--bc-accent)', strokeWidth = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 256 96 C 156 156 116 256 156 336 C 196 416 296 426 256 416 C 216 426 316 416 356 336 C 396 256 356 156 256 96 Z" />
        <path d="M 256 96 L 256 416" />
        <path d="M 256 220 L 196 280" />
        <path d="M 256 220 L 316 280" />
        <path d="M 256 300 L 206 350" />
        <path d="M 256 300 L 306 350" />
      </g>
    </svg>
  );
}
