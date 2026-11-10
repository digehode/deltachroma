import type { ChromaColor } from './colorEngine';

export interface SeedColor {
  id: string;
  color: ChromaColor; // Using our internal wrapper type directly
  isLocked: boolean;
}

export interface PaletteSlot {
  id: string;
  index: number;
  color: ChromaColor;
  isLocked: boolean;
  contrastRatio: number;
  hasContrastWarning: boolean;
}

export interface ThemePair {
  light: PaletteSlot[];
  dark: PaletteSlot[];
}

export interface PaletteConfig {
  size: number;
  seedColors: SeedColor[];
  lightBackground: string;
  darkBackground: string;
  minContrastRatio: number;
}
