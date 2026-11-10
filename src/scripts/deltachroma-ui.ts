// src/scripts/deltachroma-ui.ts
import { ChromaColor } from '@/core/deltachroma';

// Extend Window interface for Coloris plugin
declare global {
  interface Window {
    Coloris: (options?: unknown) => void;
  }
}

// Initialize Coloris picker popup when DOM is ready
if (typeof window !== 'undefined' && window.Coloris) {
  window.Coloris({
    el: '.coloris-input',
    themeMode: 'auto',
    alpha: false,
  });
}

// Core update handler utilizing our ChromaColor engine wrapper
function updateColorCard(
  inputId: string,
  swatchId: string,
  hexId: string,
  rgbId: string,
  oklchId: string,
) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const swatch = document.getElementById(swatchId);
  const hexEl = document.getElementById(hexId);
  const rgbEl = document.getElementById(rgbId);
  const oklchEl = document.getElementById(oklchId);

  if (!input || !swatch || !hexEl || !rgbEl || !oklchEl) return;

  try {
    // Instantiate through our wrapped engine class
    const color = new ChromaColor(input.value);
    const hex = color.toHex();
    const oklch = color.toOklchString(2);

    // Extract sRGB integer channels for standard rgb() string
    const rawRgb = color.raw.to('srgb');
    const r = Math.round(Math.max(0, Math.min(1, rawRgb.coords[0] ?? 0)) * 255);
    const g = Math.round(Math.max(0, Math.min(1, rawRgb.coords[1] ?? 0)) * 255);
    const b = Math.round(Math.max(0, Math.min(1, rawRgb.coords[2] ?? 0)) * 255);
    const rgbStr = `rgb(${r}, ${g}, ${b})`;

    // Apply updates to UI elements
    swatch.style.backgroundColor = hex;
    hexEl.textContent = hex;
    rgbEl.textContent = rgbStr;
    oklchEl.textContent = oklch;
  } catch {
    // Gracefully ignore intermediate malformed string states while typing
  }
}

// Attach listeners for Light Mode input
const lightInput = document.getElementById('light-bg-input');
['input', 'change'].forEach((evt) => {
  lightInput?.addEventListener(evt, () => {
    updateColorCard('light-bg-input', 'light-swatch', 'light-hex', 'light-rgb', 'light-oklch');
  });
});

// Attach listeners for Dark Mode input
const darkInput = document.getElementById('dark-bg-input');
['input', 'change'].forEach((evt) => {
  darkInput?.addEventListener(evt, () => {
    updateColorCard('dark-bg-input', 'dark-swatch', 'dark-hex', 'dark-rgb', 'dark-oklch');
  });
});

// Run initial state calculation on load
updateColorCard('light-bg-input', 'light-swatch', 'light-hex', 'light-rgb', 'light-oklch');
updateColorCard('dark-bg-input', 'dark-swatch', 'dark-hex', 'dark-rgb', 'dark-oklch');
