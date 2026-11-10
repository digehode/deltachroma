import { describe, expect, it } from 'vitest';
import { echo } from '../../../src/core/deltachroma';

describe('core/deltachroma entry point', () => {
  it('can be imported from the directory', () => {
    expect(echo(12)).toBe(12);
  });
});
