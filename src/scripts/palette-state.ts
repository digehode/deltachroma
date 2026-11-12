import { ChromaColor } from '@/core/deltachroma';
import { generatePalette } from './palette-generator';

export type SeedMode = 'light' | 'dark';

/** Default target palette size (number of colours). */
export const DEFAULT_PALETTE_SIZE = 7;

/** Minimum allowed palette size (inclusive). */
export const MIN_PALETTE_SIZE = 3;

/** Maximum allowed palette size (inclusive). */
export const MAX_PALETTE_SIZE = 12;

/** Default delta-E similarity threshold. */
export const DEFAULT_DELTA_E_THRESHOLD = 0.05;

/** Minimum allowed delta-E threshold (inclusive). */
export const MIN_DELTA_E_THRESHOLD = 0;

/** Maximum allowed delta-E threshold (inclusive). */
export const MAX_DELTA_E_THRESHOLD = 0.15;

/**
 * Holds the mutable palette state: two independent seed colour lists,
 * generated palette colour lists, target palette size, and delta-E
 * similarity threshold.
 *
 * This class owns no DOM and has no side effects, so it can be exercised
 * in pure unit tests without jsdom.
 */
export class PaletteState {
  private lightSeeds: ChromaColor[];
  private darkSeeds: ChromaColor[];
  private lightPalette: ChromaColor[];
  private darkPalette: ChromaColor[];
  private _size: number;
  private _deltaEThreshold: number;

  constructor(size = DEFAULT_PALETTE_SIZE, deltaEThreshold = DEFAULT_DELTA_E_THRESHOLD) {
    this._size = Math.max(MIN_PALETTE_SIZE, Math.min(MAX_PALETTE_SIZE, size));
    this._deltaEThreshold = Math.max(
      MIN_DELTA_E_THRESHOLD,
      Math.min(MAX_DELTA_E_THRESHOLD, deltaEThreshold),
    );
    this.lightSeeds = this._emptySeeds(this._size);
    this.darkSeeds = this._emptySeeds(this._size);
    this.lightPalette = [];
    this.darkPalette = [];
  }

  /** Target number of colours in the generated palette (3 to 12). */
  get size(): number {
    return this._size;
  }

  /** Delta-E similarity threshold used to highlight near-duplicate colours. */
  get deltaEThreshold(): number {
    return this._deltaEThreshold;
  }

  /** Get the seed colour array for the given mode (light or dark). */
  getSeeds(mode: SeedMode): readonly ChromaColor[] {
    return mode === 'light' ? this.lightSeeds : this.darkSeeds;
  }

  /** Get the generated palette colour array for the given mode. */
  getPalette(mode: SeedMode): readonly ChromaColor[] {
    return mode === 'light' ? this.lightPalette : this.darkPalette;
  }

  /** Generate palettes from current seeds using OKLCH interpolation. */
  generatePalettes(): void {
    this.lightPalette = generatePalette(this.lightSeeds, this._size);
    this.darkPalette = generatePalette(this.darkSeeds, this._size);
  }

  /** Resize both palettes, preserving existing colours that fit. */
  setSize(n: number): void {
    n = Math.max(MIN_PALETTE_SIZE, Math.min(MAX_PALETTE_SIZE, n));
    this._size = n;
    this.lightSeeds = this._resize(this.lightSeeds, n);
    this.darkSeeds = this._resize(this.darkSeeds, n);
    this.lightPalette = this._resize(this.lightPalette, n);
    this.darkPalette = this._resize(this.darkPalette, n);
  }

  /** Clamp and store the delta-E similarity threshold. */
  setThreshold(v: number): void {
    this._deltaEThreshold = Math.max(MIN_DELTA_E_THRESHOLD, Math.min(MAX_DELTA_E_THRESHOLD, v));
  }

  /** Replace the seed at index with color. Ignores out-of-range indices. */
  setSeed(mode: SeedMode, index: number, color: ChromaColor): void {
    const arr = mode === 'light' ? this.lightSeeds : this.darkSeeds;
    if (index < 0 || index >= arr.length) return;
    arr[index] = color;
  }

  /** Reset the seed at index to white. Ignores out-of-range indices. */
  resetSeed(mode: SeedMode, index: number): void {
    const arr = mode === 'light' ? this.lightSeeds : this.darkSeeds;
    if (index < 0 || index >= arr.length) return;
    arr[index] = new ChromaColor('#ffffff');
  }

  private _emptySeeds(n: number): ChromaColor[] {
    const white = new ChromaColor('#ffffff');
    return Array.from({ length: n }, () => white.clone());
  }

  private _resize(arr: ChromaColor[], n: number): ChromaColor[] {
    const white = new ChromaColor('#ffffff');
    return arr
      .slice(0, n)
      .concat(Array.from({ length: Math.max(0, n - arr.length) }, () => white.clone()));
  }
}
