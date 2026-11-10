// src/scripts/deltachroma-ui.ts
import '@melloware/coloris/dist/coloris.css';
import Coloris from '@melloware/coloris';
import { ChromaColor } from '@/core/deltachroma';

// Initialize the bundled Coloris picker before using it.
Coloris.init();
Coloris({
  el: '.coloris-input',
  themeMode: 'auto',
  alpha: false,
});

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
    const hex = color.toCss('hex');
    const rgbStr = color.toCss('rgb');
    const oklch = color.toCss('oklch', 2);

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
