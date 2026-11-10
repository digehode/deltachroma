import { ChromaColor } from '@/core/deltachroma';
import { refreshColoris } from './coloris-picker';
import '@melloware/coloris/dist/coloris.css';

interface ColorCardRefs {
  inputId: string;
  swatchId: string;
  hexId: string;
  rgbId: string;
  oklchId: string;
  validationId: string;
}

const COLOR_CARDS: readonly ColorCardRefs[] = [
  {
    inputId: 'light-bg-input',
    swatchId: 'light-swatch',
    hexId: 'light-hex',
    rgbId: 'light-rgb',
    oklchId: 'light-oklch',
    validationId: 'light-validation',
  },
  {
    inputId: 'dark-bg-input',
    swatchId: 'dark-swatch',
    hexId: 'dark-hex',
    rgbId: 'dark-rgb',
    oklchId: 'dark-oklch',
    validationId: 'dark-validation',
  },
];

function createValidationSpan(className: string, text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

function renderColorCard(root: ParentNode, card: ColorCardRefs): void {
  const input = root.querySelector(`#${card.inputId}`);
  const swatch = root.querySelector<HTMLElement>(`#${card.swatchId}`);
  const hex = root.querySelector<HTMLElement>(`#${card.hexId}`);
  const rgb = root.querySelector<HTMLElement>(`#${card.rgbId}`);
  const oklch = root.querySelector<HTMLElement>(`#${card.oklchId}`);
  const validationDiv = root.querySelector<HTMLElement>(`#${card.validationId}`);

  if (!(input instanceof HTMLInputElement) || !swatch || !hex || !rgb || !oklch || !validationDiv) {
    return;
  }

  let color: ChromaColor;
  try {
    color = new ChromaColor(input.value);
  } catch {
    // Ignore intermediate malformed values while the user is still typing.
    // Clear any previous validation results.
    validationDiv.innerHTML = '';
    return;
  }

  // Update color displays
  swatch.style.backgroundColor = color.toCss('hex');
  hex.textContent = color.toCss('hex');
  rgb.textContent = color.toCss('rgb');
  oklch.textContent = color.toCss('oklch', 2);

  // Run background validation
  const isLight = card.inputId.includes('light');
  let validationResult: { success: boolean; messages: string[] };

  if (isLight) {
    validationResult = color.validateLightBackground();
  } else {
    validationResult = color.validateDarkBackground();
  }

  // Clear previous validation results
  validationDiv.innerHTML = '';

  if (validationResult.success) {
    // Success: show green checkmark
    const successSpan = createValidationSpan('fg-green', 'Colour appropriate for background');
    validationDiv.appendChild(successSpan);
  } else {
    // Failure: show each message in red, one per line
    validationResult.messages.forEach((message) => {
      const msgSpan = createValidationSpan('fg-red', message);
      validationDiv.appendChild(msgSpan);
      // Add line break after each message except the last
      if (message !== validationResult.messages[validationResult.messages.length - 1]) {
        const br = document.createElement('br');
        validationDiv.appendChild(br);
      }
    });
  }
}

/** Initialize seed button event listeners */
function initSeedButtons(root: ParentNode): void {
  const modes = ['light', 'dark'] as const;
  modes.forEach((mode) => {
    const addBtn = root.querySelector(`#add-${mode}-seed-btn`) as HTMLButtonElement;
    if (addBtn) {
      addBtn.addEventListener('click', () => createSeedEntry(root, mode));
    }
  });

  // Delete button handlers: remove seed entry on click
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('btn-delete-seed')) {
      const seedEntry = target.closest('.seed-entry');
      if (seedEntry) {
        seedEntry.remove();
      }
    }
  });
}

/** Create a new seed entry with colour picker and displays */
function createSeedEntry(root: ParentNode, mode: 'light' | 'dark'): void {
  const seedDiv = document.createElement('div');
  seedDiv.className = 'seed-entry';
  seedDiv.innerHTML = `
    <input
      type="text"
      class="coloris-input"
      data-coloris
      value="#ffffff"
    />
    <div class="seed-colour-displays">
      <span class="seed-hex-display"></span>
      <span class="seed-rgb-display"></span>
      <span class="seed-oklch-display"></span>
    </div>
    <button type="button" class="btn-delete-seed">×</button>
  `;

  const container = root.querySelector(`#${mode}-seeds`) as HTMLElement;
  const button = root.querySelector(`#add-${mode}-seed-btn`) as HTMLButtonElement;
  if (container && button) {
    container.parentNode?.insertBefore(seedDiv, button.nextSibling);
  }

  // Attach Coloris to the new colour input
  refreshColoris();

  // Update colour displays when the input changes
  const colourInput = seedDiv.querySelector('.coloris-input') as HTMLInputElement;
  if (colourInput) {
    colourInput.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      try {
        const color = new ChromaColor(input.value);
        const hexDisplay = seedDiv.querySelector('.seed-hex-display') as HTMLElement;
        const rgbDisplay = seedDiv.querySelector('.seed-rgb-display') as HTMLElement;
        const oklchDisplay = seedDiv.querySelector('.seed-oklch-display') as HTMLElement;
        if (hexDisplay) hexDisplay.textContent = color.toCss('hex');
        if (rgbDisplay) rgbDisplay.textContent = color.toCss('rgb');
        if (oklchDisplay) oklchDisplay.textContent = color.toCss('oklch', 2);
      } catch {
        // Invalid colour value - leave displays empty
      }
    });
  }
}

/**
 * Wire the light/dark background cards: attach listeners and render the
 * initial state. Scoped to `root` so it can be exercised in tests without a
 * real document.
 */
export function initDeltaChromaUI(root: ParentNode = document): void {
  for (const card of COLOR_CARDS) {
    const input = root.querySelector(`#${card.inputId}`);
    if (!(input instanceof HTMLInputElement)) {
      continue;
    }

    const render = () => renderColorCard(root, card);
    input.addEventListener('input', render);
    input.addEventListener('change', render);
    render();
  }

  // Seed buttons
  initSeedButtons(root);
}
