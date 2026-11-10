import Color from 'colorjs.io';

export type ColorFormat = 'hex' | 'rgb' | 'oklch' | 'oklab';

function parseColor(value: string): Color {
  try {
    return new Color(value);
  } catch (error) {
    throw new Error(
      `Failed to parse color value: "${value}". Error: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}

function toByte(channel: number | null | undefined): number {
  const normalized = Math.min(1, Math.max(0, channel ?? 0));
  return Math.round(normalized * 255);
}

export interface ColorValidationResult {
  success: boolean;
  messages: string[];
}

/**
 * ChromaColor wraps colorjs.io to provide a stable internal representation
 * for DeltaChroma, insulating the rest of the application from direct third-party API changes.
 */
export class ChromaColor {
  private _internal: Color;

  constructor(value: string) {
    this._internal = parseColor(value);
  }

  private static fromInternal(value: Color): ChromaColor {
    const instance = Object.create(ChromaColor.prototype) as ChromaColor;
    instance._internal = value;
    return instance;
  }

  /** Serialize to standard Hex sRGB string */
  toHex(): string {
    return this._internal.to('srgb').toString({ format: 'hex' });
  }

  /** Serialize to OKLCH CSS string format */
  toOklchString(precision = 3): string {
    // colorjs.io serializes achromatic hue as "none"; normalise to 0
    return this._internal
      .to('oklch')
      .toString({ format: 'oklch', precision })
      .replace(/\bnone\b/g, '0');
  }

  /** Serialize to Oklab CSS string format */
  toOklabString(precision = 3): string {
    return this._internal.to('oklab').toString({ format: 'oklab', precision });
  }

  /** Serialize to a supported CSS color format */
  toCss(format: ColorFormat = 'hex', precision = 3): string {
    switch (format) {
      case 'hex':
        return this.toHex();
      case 'rgb':
        return this.toRgbString();
      case 'oklch':
        return this.toOklchString(precision);
      case 'oklab':
        return this.toOklabString(precision);
      default:
        throw new Error(`Unsupported color format: ${format}`);
    }
  }

  private toRgbString(): string {
    const [r, g, b] = this._internal.to('srgb').coords;
    return `rgb(${toByte(r)}, ${toByte(g)}, ${toByte(b)})`;
  }

  /** Get raw Oklab coordinates [L, a, b] */
  get oklabCoords(): [number, number, number] {
    const oklab = this._internal.to('oklab');
    return [oklab.coords[0] || 0, oklab.coords[1] || 0, oklab.coords[2] || 0];
  }

  /** Get raw OKLCH coordinates [L, C, H], safely handling achromatic hue NaN values */
  get oklchCoords(): [number, number, number] {
    const oklch = this._internal.to('oklch');
    return [
      oklch.coords[0] || 0,
      oklch.coords[1] || 0,
      Number.isNaN(oklch.coords[2]) ? 0 : (oklch.coords[2] ?? 0),
    ];
  }

  /**
   * Calculate perceptual distance (Delta E OK) between this color and another.
   * Utilizes 3D Euclidean distance in Oklab space.
   */
  deltaE(other: ChromaColor): number {
    return Color.deltaE(this._internal, other._internal, 'OK');
  }

  /** Calculate WCAG 2.1 contrast ratio against another color surface */
  contrast(against: ChromaColor): number {
    return this._internal.contrast(against._internal, 'WCAG21');
  }

  /** Ensure the color fits safely within the target sRGB gamut */
  toGamut(): ChromaColor {
    const cloned = this._internal.clone();
    cloned.toGamut('srgb');
    return ChromaColor.fromInternal(cloned);
  }

  /** Create an independent clone of the current ChromaColor */
  clone(): ChromaColor {
    return ChromaColor.fromInternal(this._internal.clone());
  }

  /**
   * Validate this color specifically as a Light Mode background surface.
   * Checks for pure white glare and excessive chroma/saturation.
   */
  validateLightBackground(): ColorValidationResult {
    const messages: string[] = [];
    const [l, c] = this.oklchCoords;

    // Check for pure white / extreme high lightness glare
    if (l >= 0.99) {
      messages.push(
        'Warning: Pure white backgrounds produce high-luminance glare and eye fatigue. Consider using a soft off-white.',
      );
    } else if (l < 0.79) {
      messages.push(
        'Warning: Background lightness is low for a standard light theme; it will crush dark text contrast.',
      );
    }

    // Check for excessive background chroma (tint saturation)
    if (c > 0.06) {
      messages.push(
        'Warning: Background chroma is high. Tinted surface backgrounds should remain desaturated to preserve UI readability.',
      );
    }

    return {
      success: messages.length === 0,
      messages,
    };
  }

  /**
   * Validate this color specifically as a Dark Mode background surface.
   * Checks for absolute black crushing and excessive chroma.
   */
  validateDarkBackground(): ColorValidationResult {
    const messages: string[] = [];
    const [l, c] = this.oklchCoords;

    // Check for pure black / extreme low lightness
    if (l <= 0.01) {
      messages.push(
        'Warning: Pure black backgrounds can cause optical smearing and harsh contrast halos on OLED screens. Consider using a deep slate or navy.',
      );
    } else if (l > 0.4) {
      messages.push('Warning: Background lightness is high for a standard dark theme.');
    }

    // Check for excessive background chroma
    if (c > 0.07) {
      messages.push(
        'Warning: Dark background chroma is high. Tinted dark surfaces should remain deeply muted.',
      );
    }

    return {
      success: messages.length === 0,
      messages,
    };
  }
}
