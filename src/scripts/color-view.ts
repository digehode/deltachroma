import { ChromaColor } from '@/core/deltachroma';

export interface ColorPresentation {
  hex: string;
  rgb: string;
  oklch: string;
}

/**
 * Format a CSS color string for display. Returns null when the input is not a
 * valid color, so callers can leave the previous presentation untouched while
 * the user is still typing.
 */
export function presentColor(input: string): ColorPresentation | null {
  try {
    const color = new ChromaColor(input);

    return {
      hex: color.toCss('hex'),
      rgb: color.toCss('rgb'),
      oklch: color.toCss('oklch', 2),
    };
  } catch {
    return null;
  }
}
