import { ChromaColor } from '@/core/deltachroma';

/**
 * Generates a perceptually uniform palette from seed colours using linear
 * interpolation in OKLCH space between consecutive seed anchors.
 *
 * @param seeds - Ordered array of ChromaColor seed colours
 * @param size - Number of output colours to generate
 * @returns Array of ChromaColor palette colours
 */
export function generatePalette(seeds: ChromaColor[], size: number): ChromaColor[] {
  if (seeds.length === 0 || size <= 0) return [];

  if (seeds.length === 1) {
    const single = seeds[0];
    return Array.from({ length: size }, () => single.clone());
  }

  const palette: ChromaColor[] = [];
  const seedCount = seeds.length;
  const stepSize = (size - 1) / (seedCount - 1);

  for (let i = 0; i < size; i++) {
    const pos = i / stepSize;
    const seedIndex = Math.floor(pos);
    const t = pos - seedIndex;

    const seedIndexClamped = Math.min(seedIndex, seedCount - 2);
    const nextIndex = Math.min(seedIndex + 1, seedCount - 1);

    const colorA = seeds[seedIndexClamped];
    const colorB = seeds[nextIndex];

    palette.push(interpolate(colorA, colorB, t));
  }

  return palette;
}

/**
 * Linearly interpolate between two colours in OKLCH space.
 * Handles achromatic hue gracefully.
 */
function interpolate(a: ChromaColor, b: ChromaColor, t: number): ChromaColor {
  const [la, ca, ha] = a.oklchCoords;
  const [lb, cb, hb] = b.oklchCoords;

  // Handle hue wraparound for achromatic or near-achromatic colours
  let h = ha;
  if (ca > 0.01 && cb > 0.01) {
    let dh = hb - ha;
    if (Math.abs(dh) > 180) {
      if (dh > 0) h = ha - 360 + dh * t;
      else h = ha + 360 + dh * t;
    } else {
      h = ha + dh * t;
    }
  }

  const l = la + (lb - la) * t;
  const c = ca + (cb - ca) * t;

  return ChromaColor.fromOkLCH(l, c, h);
}
