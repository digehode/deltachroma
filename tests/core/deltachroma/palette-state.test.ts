import { describe, expect, it } from 'vitest';
import { ChromaColor } from '@/core/deltachroma';
import {
  DEFAULT_DELTA_E_THRESHOLD,
  DEFAULT_PALETTE_SIZE,
  MAX_DELTA_E_THRESHOLD,
  MAX_PALETTE_SIZE,
  MIN_DELTA_E_THRESHOLD,
  MIN_PALETTE_SIZE,
  PaletteState,
} from '@/scripts/palette-state';

describe('PaletteState', () => {
  describe('construction', () => {
    it('creates palettes with default size of 7 white seeds per mode', () => {
      const state = new PaletteState();

      expect(state.size).toBe(DEFAULT_PALETTE_SIZE);
      expect(state.deltaEThreshold).toBe(DEFAULT_DELTA_E_THRESHOLD);
      expect(state.getSeeds('light').length).toBe(DEFAULT_PALETTE_SIZE);
      expect(state.getSeeds('dark').length).toBe(DEFAULT_PALETTE_SIZE);

      for (const color of state.getSeeds('light')) {
        expect(color.toCss('hex')).toBe('#fff');
      }
      for (const color of state.getSeeds('dark')) {
        expect(color.toCss('hex')).toBe('#fff');
      }
    });

    it('creates palettes with custom size and threshold', () => {
      const state = new PaletteState(5, 0.1);

      expect(state.size).toBe(5);
      expect(state.deltaEThreshold).toBe(0.1);
      expect(state.getSeeds('light').length).toBe(5);
      expect(state.getSeeds('dark').length).toBe(5);
    });

    it('clamps size to min-max range', () => {
      const state = new PaletteState(MIN_PALETTE_SIZE - 1, 0.05);
      expect(state.size).toBe(MIN_PALETTE_SIZE);

      const state2 = new PaletteState(MAX_PALETTE_SIZE + 1, 0.05);
      expect(state2.size).toBe(MAX_PALETTE_SIZE);
    });

    it('clamps threshold to min-max range', () => {
      const state = new PaletteState(7, MIN_DELTA_E_THRESHOLD - 1);
      expect(state.deltaEThreshold).toBe(MIN_DELTA_E_THRESHOLD);

      const state2 = new PaletteState(7, MAX_DELTA_E_THRESHOLD + 1);
      expect(state2.deltaEThreshold).toBe(MAX_DELTA_E_THRESHOLD);
    });
  });

  describe('setSize', () => {
    it('preserves existing colours when growing', () => {
      const state = new PaletteState(3, 0.05);
      state.setSeed('light', 0, new ChromaColor('#ff0000'));
      state.setSeed('light', 1, new ChromaColor('#00ff00'));

      state.setSize(MAX_PALETTE_SIZE);

      expect(state.getSeeds('light')[0].toCss('hex')).toBe('#f00');
      expect(state.getSeeds('light')[1].toCss('hex')).toBe('#0f0');
      expect(state.getSeeds('light')[2].toCss('hex')).toBe('#fff');
      expect(state.getSeeds('light')[3].toCss('hex')).toBe('#fff');
    });

    it('truncates when shrinking', () => {
      const state = new PaletteState(MAX_PALETTE_SIZE, 0.05);
      state.setSeed('light', 5, new ChromaColor('#ff0000'));

      state.setSize(MIN_PALETTE_SIZE);

      expect(state.getSeeds('light').length).toBe(MIN_PALETTE_SIZE);
    });

    it('does not affect dark seeds when growing light', () => {
      const state = new PaletteState(MIN_PALETTE_SIZE, 0.05);
      state.setSeed('light', 0, new ChromaColor('#ff0000'));

      state.setSize(5);

      expect(state.getSeeds('dark').length).toBe(5);
      expect(state.getSeeds('dark')[0].toCss('hex')).toBe('#fff');
    });
  });

  describe('setSeed', () => {
    it('sets seed colour at index', () => {
      const state = new PaletteState(5, 0.05);
      state.setSeed('light', 2, new ChromaColor('#ff0000'));

      expect(state.getSeeds('light')[2].toCss('hex')).toBe('#f00');
    });

    it('ignores out of range index', () => {
      const state = new PaletteState(MIN_PALETTE_SIZE, 0.05);
      state.setSeed('light', MAX_PALETTE_SIZE, new ChromaColor('#ff0000'));

      expect(state.getSeeds('light').length).toBe(MIN_PALETTE_SIZE);
      expect(state.getSeeds('light')[0].toCss('hex')).toBe('#fff');
    });

    it('works independently for light and dark modes', () => {
      const state = new PaletteState(MIN_PALETTE_SIZE, 0.05);
      state.setSeed('light', 0, new ChromaColor('#ff0000'));
      state.setSeed('dark', 0, new ChromaColor('#00ff00'));

      expect(state.getSeeds('light')[0].toCss('hex')).toBe('#f00');
      expect(state.getSeeds('dark')[0].toCss('hex')).toBe('#0f0');
    });
  });

  describe('resetSeed', () => {
    it('resets seed to white', () => {
      const state = new PaletteState(3, 0.05);
      state.setSeed('light', 1, new ChromaColor('#ff0000'));

      state.resetSeed('light', 1);

      expect(state.getSeeds('light')[1].toCss('hex')).toBe('#fff');
    });

    it('ignores out of range index', () => {
      const state = new PaletteState(3, 0.05);
      state.resetSeed('light', MAX_PALETTE_SIZE);

      expect(state.getSeeds('light').length).toBe(MIN_PALETTE_SIZE);
      expect(state.getSeeds('light')[0].toCss('hex')).toBe('#fff');
    });
  });

  describe('setThreshold', () => {
    it('sets threshold value', () => {
      const state = new PaletteState(7, DEFAULT_DELTA_E_THRESHOLD);
      state.setThreshold(0.1);

      expect(state.deltaEThreshold).toBe(0.1);
    });

    it('clamps to minimum threshold', () => {
      const state = new PaletteState(7, DEFAULT_DELTA_E_THRESHOLD);
      state.setThreshold(MIN_DELTA_E_THRESHOLD - 1);

      expect(state.deltaEThreshold).toBe(MIN_DELTA_E_THRESHOLD);
    });

    it('clamps to maximum threshold', () => {
      const state = new PaletteState(7, DEFAULT_DELTA_E_THRESHOLD);
      state.setThreshold(MAX_DELTA_E_THRESHOLD + 1);

      expect(state.deltaEThreshold).toBe(MAX_DELTA_E_THRESHOLD);
    });
  });
});
