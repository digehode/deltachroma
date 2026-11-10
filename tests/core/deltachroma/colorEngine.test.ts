import { describe, expect, it } from 'vitest';
import { ChromaColor } from '@/core/deltachroma';

function expectCoords(actual: readonly number[], expected: readonly number[], precision = 4): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, index) => {
    expect(actual[index]).toBeCloseTo(value, precision);
  });
}

describe('ChromaColor', () => {
  describe('parsing', () => {
    it.each(['#3b82f6', 'rgb(59, 130, 246)', 'oklch(62.3083% 0.188015 259.815)'])(
      'accepts %s',
      (value) => {
        expect(new ChromaColor(value).toCss()).toBe('#3b82f6');
      },
    );

    it('throws a descriptive error for invalid color strings', () => {
      expect(() => new ChromaColor('not-a-color')).toThrowError(/Failed to parse color value/);
    });
  });

  describe('serialization', () => {
    it('serializes to CSS formats', () => {
      const color = new ChromaColor('#3b82f6');

      expect(color.toCss()).toBe('#3b82f6');
      expect(color.toCss('hex')).toBe('#3b82f6');
      expect(color.toCss('rgb')).toBe('rgb(59, 130, 246)');
      expect(color.toCss('oklch', 6)).toBe('oklch(62.3083% 0.188015 259.815)');
      expect(color.toCss('oklab', 6)).toBe('oklab(62.3083% -0.033248 -0.185052)');
    });
  });

  describe('coordinates', () => {
    it('exposes known OKLCH coordinates for sRGB primaries', () => {
      const cases: Array<[string, [number, number, number]]> = [
        ['#ff0000', [0.6279553639, 0.2576833038, 29.2338802796]],
        ['#00ff00', [0.8664396175, 0.2948272245, 142.4953450414]],
        ['#0000ff', [0.4520137182, 0.3132143886, 264.0520226164]],
      ];

      for (const [hex, expected] of cases) {
        expectCoords(new ChromaColor(hex).oklchCoords, expected, 5);
      }
    });

    it('exposes known Oklab coordinates', () => {
      expectCoords(
        new ChromaColor('#ff0000').oklabCoords,
        [0.6279553639, 0.2248630684, 0.1258462773],
        5,
      );
    });

    it('uses zero hue for achromatic colors', () => {
      for (const hex of ['#ffffff', '#000000', '#808080']) {
        const [, chroma, hue] = new ChromaColor(hex).oklchCoords;

        expect(chroma).toBeCloseTo(0, 10);
        expect(hue).toBe(0);
      }
    });
  });

  describe('perceptual distance', () => {
    it('returns zero for identical colors', () => {
      const red = new ChromaColor('#ff0000');

      expect(red.deltaE(red)).toBeCloseTo(0, 10);
    });

    it('matches known Delta E OK values', () => {
      const red = new ChromaColor('#ff0000');
      const blue = new ChromaColor('#0000ff');
      const white = new ChromaColor('#ffffff');
      const black = new ChromaColor('#000000');

      expect(red.deltaE(blue)).toBeCloseTo(0.5370898165, 5);
      expect(white.deltaE(black)).toBeCloseTo(1, 5);
    });

    it('is symmetric', () => {
      const red = new ChromaColor('#ff0000');
      const blue = new ChromaColor('#0000ff');

      expect(red.deltaE(blue)).toBeCloseTo(blue.deltaE(red), 12);
    });
  });

  describe('contrast', () => {
    it('calculates the known black/white extremes', () => {
      const white = new ChromaColor('#ffffff');
      const black = new ChromaColor('#000000');

      expect(white.contrast(black)).toBeCloseTo(21, 5);
      expect(white.contrast(white)).toBeCloseTo(1, 10);
    });

    it('calculates known WCAG ratios for grey on white', () => {
      const white = new ChromaColor('#ffffff');
      const grey = new ChromaColor('#777777');

      expect(grey.contrast(white)).toBeCloseTo(4.4780894536, 5);
    });

    it('is symmetric', () => {
      const white = new ChromaColor('#ffffff');
      const grey = new ChromaColor('#777777');

      expect(grey.contrast(white)).toBeCloseTo(white.contrast(grey), 12);
    });
  });

  describe('gamut handling', () => {
    it('clamps wide-gamut colors without mutating the original', () => {
      const wide = new ChromaColor('color(display-p3 1 0 0)');
      const originalCoords = wide.oklchCoords;
      const clamped = wide.toGamut();

      expect(clamped.toCss()).toBe('#ff0b0c');
      expect(clamped.oklchCoords).not.toEqual(originalCoords);
      expect(wide.oklchCoords).toEqual(originalCoords);
    });

    it('is idempotent', () => {
      const clamped = new ChromaColor('color(display-p3 1 0 0)').toGamut();
      const clampedAgain = clamped.toGamut();

      expect(clampedAgain.toCss()).toBe(clamped.toCss());
      expectCoords(clampedAgain.oklchCoords, clamped.oklchCoords, 10);
    });
  });

  describe('cloning', () => {
    it('returns an independent color with the same value', () => {
      const original = new ChromaColor('#3b82f6');
      const clone = original.clone();

      expect(clone).not.toBe(original);
      expect(clone.toCss()).toBe(original.toCss());
      expect(clone.oklchCoords).toEqual(original.oklchCoords);
    });
  });
});
