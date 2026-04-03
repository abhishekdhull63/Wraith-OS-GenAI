/**
 * WraithHexIcon — Tactical hexagon with dual downward chevrons.
 * Precisely matched to the reference image:
 *   - Pointy-top hexagon (vertex at top & bottom, flat sides left & right)
 *   - Thick stroke with sharp miter joins
 *   - Two compact downward chevrons below the hex
 * Uses `currentColor` so the icon inherits the parent's text color.
 */
interface WraithHexIconProps {
  size?: number;
  className?: string;
}

export default function WraithHexIcon({ size = 24, className = '' }: WraithHexIconProps) {
  // --- Hexagon geometry (pointy-top) ---
  // Regular hexagon centered at (50, 40), circumradius 30
  // Pointy-top: start angle at -90° so first vertex is at the top
  const cx = 50;
  const cy = 40;
  const r = 30;
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angleDeg = 60 * i - 90; // -90° start = pointy-top
    const angleRad = (Math.PI / 180) * angleDeg;
    return `${+(cx + r * Math.cos(angleRad)).toFixed(2)},${+(cy + r * Math.sin(angleRad)).toFixed(2)}`;
  }).join(' ');

  // --- Chevron geometry ---
  // Two downward-pointing chevrons, tightly stacked below the hexagon
  const chevHalf = 11;     // half-width of each chevron
  const chevDepth = 5.5;   // vertical depth of each "V"
  const chev1Y = 82;       // top chevron start
  const chev2Y = 92;       // bottom chevron start

  const chev1 = `M${cx - chevHalf},${chev1Y} L${cx},${chev1Y + chevDepth} L${cx + chevHalf},${chev1Y}`;
  const chev2 = `M${cx - chevHalf},${chev2Y} L${cx},${chev2Y + chevDepth} L${cx + chevHalf},${chev2Y}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 105"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Deep-Cover"
    >
      {/* Hexagon — pointy-top, sharp joins */}
      <polygon
        points={hexPoints}
        strokeWidth="8"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {/* Chevron 1 */}
      <path
        d={chev1}
        strokeWidth="4.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
        fill="none"
      />
      {/* Chevron 2 */}
      <path
        d={chev2}
        strokeWidth="4.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  );
}
