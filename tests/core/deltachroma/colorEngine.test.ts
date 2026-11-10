import { describe, expect, it } from 'vitest';
import Color from 'colorjs.io';
import { ChromaColor } from '@/core/deltachroma';

describe('ChromaColor Engine Wrapper', () => {
  it('should successfully instantiate from various color formats', () => {
    const fromHex = new ChromaColor('#3b82f6');
    const fromRgb = new ChromaColor('rgb(59, 130, 246)');
    const fromOklch = new ChromaColor('oklch(0.623 0.19 259)');

    expect(fromHex).toBeDefined();
    expect(fromRgb).toBeDefined();
    expect(fromOklch).toBeDefined();
  });

  it('should throw an error on invalid color strings', () => {
    expect(() => new ChromaColor('not-a-color')).toThrowError(/Failed to parse color value/);
  });

  it('should correctly convert to and serialize into various formats', () => {
    const color = new ChromaColor('#f1a0b0'); // Something that won't become shorthand

    // Test hex serialization
    expect(color.toHex()).toBe('#f1a0b0');

    // Test OKLCH and Oklab string output generation
    const oklchStr = color.toOklchString();
    const oklabStr = color.toOklabString();

    expect(oklchStr).toContain('oklch(');
    expect(oklabStr).toContain('oklab(');

    // Verify round-trip consistency by re-parsing generated string back into a new ChromaColor
    const roundTrip = new ChromaColor(oklchStr);
    expect(roundTrip.toHex()).toBe('#f1a0b0');
  });

  it('should correctly expose numerical Oklab and OKLCH coordinate arrays', () => {
    const color = new ChromaColor('#3b82f6');

    const oklab = color.oklabCoords;
    const oklch = color.oklchCoords;

    expect(oklab).toHaveLength(3);
    expect(typeof oklab[0]).toBe('number');
    expect(typeof oklab[1]).toBe('number');
    expect(typeof oklab[2]).toBe('number');

    expect(oklch).toHaveLength(3);
    expect(oklch[0]).toBeGreaterThan(0); // Lightness
    expect(oklch[1]).toBeGreaterThan(0); // Chroma
    expect(oklch[2]).toBeGreaterThanOrEqual(0); // Hue
  });

  it('should calculate perceptual distance (Delta E OK) matching raw colorjs.io calculations', () => {
    const colorA = new ChromaColor('#3b82f6');
    const colorB = new ChromaColor('#ef4444');

    // Calculate via our wrapper
    const wrapperDeltaE = colorA.deltaE(colorB);

    // Calculate directly via raw colorjs.io for verification
    const rawA = new Color('#3b82f6');
    const rawB = new Color('#ef4444');
    const rawDeltaE = Color.deltaE(rawA, rawB, 'OK');

    expect(wrapperDeltaE).toBeCloseTo(rawDeltaE, 5);
  });

  it('should calculate WCAG 2.1 contrast ratios accurately', () => {
    const white = new ChromaColor('#ffffff');
    const black = new ChromaColor('#000000');

    const contrast = white.contrast(black);
    expect(contrast).toBeCloseTo(21, 1); // Maximum WCAG contrast is 21:1
  });

  it('should handle gamut clamping safely', () => {
    // A wide gamut color that might exceed standard sRGB bounds initially
    const wideColor = new ChromaColor('color(display-p3 1 0 0)');
    const clamped = wideColor.toGamut();

    expect(clamped).toBeInstanceOf(ChromaColor);
    expect(clamped.toHex()).toBeDefined();
  });
});
