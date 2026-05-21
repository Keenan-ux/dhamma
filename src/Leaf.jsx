// Bodhi-leaf glyph. Heart-shaped cordate base + long acuminate drip
// tip + pinnate venation, modelled on a real bodhi leaf photo. Inline
// SVG so the fill follows --bc-accent across themes.
//
// At small sizes (~16-32 px favicons) only the silhouette reads —
// the leaf shape itself is the recognisable element. At larger sizes
// (TopNav 26 px, PWA splash 512 px) the veins emerge as low-opacity
// detail without crowding the form.
export default function Leaf({ size = 28, color = 'var(--bc-accent)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      role="img"
    >
      {/* Leaf body — single closed bezier path. Apex at top, heart-
          lobed base at bottom, widest in the upper third (matches the
          ovate-cordate bodhi shape). */}
      <path
        fill={color}
        d="
          M 256 26
          C 246 50 230 78 210 108
          C 178 152 142 192 116 228
          C 92 264 78 304 80 348
          C 84 402 122 442 172 458
          C 196 464 222 466 252 472
          L 256 472
          L 260 472
          C 290 466 316 464 340 458
          C 390 442 428 402 432 348
          C 434 304 420 264 396 228
          C 370 192 334 152 302 108
          C 282 78 266 50 256 26
          Z
        "
      />
      {/* Petiole — short stem extending below the lobed base. */}
      <path
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        d="M 256 472 L 256 498"
      />
      {/* Midrib — central vein from petiole base up through the drip
          tip. Drawn as a darker mark on top of the gold fill for the
          characteristic leaf-vein look. */}
      <path
        stroke="rgba(0,0,0,0.22)"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        d="M 256 470 L 256 90"
      />
      {/* Five pairs of pinnate side veins arcing from the midrib
          outward to the leaf edge. Quadratic curves keep them organic.
          Stroke colour matches the midrib so the venation reads as a
          unified pattern. */}
      <g
        stroke="rgba(0,0,0,0.18)"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      >
        <path d="M 256 420 Q 200 432 152 432" />
        <path d="M 256 420 Q 312 432 360 432" />

        <path d="M 256 348 Q 180 356 110 332" />
        <path d="M 256 348 Q 332 356 402 332" />

        <path d="M 256 276 Q 180 256 108 226" />
        <path d="M 256 276 Q 332 256 404 226" />

        <path d="M 256 204 Q 200 180 152 156" />
        <path d="M 256 204 Q 312 180 360 156" />

        <path d="M 256 138 Q 226 122 198 116" />
        <path d="M 256 138 Q 286 122 314 116" />
      </g>
    </svg>
  );
}
