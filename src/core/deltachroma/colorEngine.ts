import Color from 'colorjs.io';

/**
 * ChromaColor wraps colorjs.io to provide a stable internal representation
 * for DeltaChroma, insulating the rest of the application from direct third-party API changes.
 */
export class ChromaColor {
  private _internal: Color;

  constructor(value: string | Color) {
    try {
      this._internal = value instanceof Color ? value.clone() : new Color(value);
    } catch (e) {
      throw new Error(
        `Failed to parse color value: "${value}". Error: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /**
   * Returns the raw underlying colorjs.io instance.
   * @internal For core engine use only.
   */
  get raw(): Color {
    return this._internal;
  }

  /** Serialize to standard Hex sRGB string */
  toHex(): string {
    return this._internal.to('srgb').toString({ format: 'hex' });
  }

  /** Serialize to OKLCH CSS string format */
  toOklchString(precision = 3): string {
    return this._internal.to('oklch').toString({ format: 'oklch', precision });
  }

  /** Serialize to Oklab CSS string format */
  toOklabString(precision = 3): string {
    return this._internal.to('oklab').toString({ format: 'oklab', precision });
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
    return new ChromaColor(cloned);
  }

  /** Create an independent clone of the current ChromaColor */
  clone(): ChromaColor {
    return new ChromaColor(this._internal.clone());
  }
}
