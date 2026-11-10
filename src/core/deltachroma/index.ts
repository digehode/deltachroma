// Export the core color engine wrapper
export { ChromaColor } from './colorEngine';

// Export all public domain types
export type { ColorFormat, PaletteConfig, PaletteSlot, SeedColor, ThemePair } from './types';

export function echo<T>(value: T): T {
  return value;
}
