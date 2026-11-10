import { describe, expect, it } from 'vitest';
import { presentColor } from '@/scripts/color-view';

describe('presentColor', () => {
  it('formats a valid color for display', () => {
    expect(presentColor('#3b82f6')).toEqual({
      hex: '#3b82f6',
      rgb: 'rgb(59, 130, 246)',
      oklch: 'oklch(62% 0.19 260)',
    });
  });

  it('returns null for invalid or empty input', () => {
    expect(presentColor('not-a-color')).toBeNull();
    expect(presentColor('')).toBeNull();
  });
});
