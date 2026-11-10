import { ChromaColor } from '@/core/deltachroma';
import { refreshColoris } from './coloris-picker';
import '@melloware/coloris/dist/coloris.css';

interface ColorCardRefs {
  inputId: string;
  mode: 'light' | 'dark';
  swatchId: string;
  hexId: string;
  rgbId: string;
  oklchId: string;
  validationId: string;
}

const COLOR_CARDS: readonly ColorCardRefs[] = [
  {
    inputId: 'light-bg-input',
    mode: 'light',
    swatchId: 'light-swatch',
    hexId: 'light-hex',
    rgbId: 'light-rgb',
    oklchId: 'light-oklch',
    validationId: 'light-validation',
  },
  {
    inputId: 'dark-bg-input',
    mode: 'dark',
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
  const validationResult: { success: boolean; messages: string[] } =
    card.mode === 'light' ? color.validateLightBackground() : color.validateDarkBackground();

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

  // Delete button handlers: use event delegation on `root` because delete buttons
  // are added dynamically inside seed entries after init. Direct listeners would
  // miss them; add buttons above use direct listeners because they exist at init.
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

/** Generate a random hex colour string for default seed entries. */
function randomHex(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

/** Create a new seed entry with colour picker and displays */
function createSeedEntry(root: ParentNode, mode: 'light' | 'dark'): void {
  const seedDiv = document.createElement('div');
  seedDiv.className = 'seed-entry';
  seedDiv.innerHTML = `
    <div class="seed-row1">
      <div class="seed-picker-wrapper">
        <input
          type="text"
          class="coloris-input"
          data-coloris
          value="${randomHex()}"
        />
      </div>
      <button type="button" class="btn-delete-seed">×</button>
    </div>
    <div class="seed-row2">
      <div class="seed-swatch-container">
        <div class="seed-bg-swatch"></div>
        <div class="seed-fg-swatch"></div>
      </div>
      <div class="seed-contrast-message"></div>
    </div>
    <div class="seed-row3">
      <span class="seed-rgb-display"></span>
      <span class="seed-oklch-display"></span>
      <label class="seed-lock">
        <input type="checkbox" class="seed-lock-toggle" />
        Lock
      </label>
    </div>
  </div>
`;

  const container = root.querySelector(`#${mode}-seeds`) as HTMLElement;
  const button = root.querySelector(`#add-${mode}-seed-btn`) as HTMLButtonElement;
  if (container && button) {
    container.parentNode?.insertBefore(seedDiv, button.nextSibling);
  }

  // Attach Coloris to the new colour input
  refreshColoris();

  // Set the mode background colour on the layered swatch container
  const bgInput = root.querySelector(`#${mode}-bg-input`) as HTMLInputElement;
  const bgColour = bgInput ? bgInput.value : '#ffffff';
  const swatchContainer = seedDiv.querySelector('.seed-swatch-container') as HTMLElement;
  if (swatchContainer) swatchContainer.style.backgroundColor = bgColour;

  // Update colour displays (rgb/oklch)
  const updateSeedDisplay = () => {
    const colourInput = seedDiv.querySelector('.coloris-input') as HTMLInputElement;
    try {
      const color = new ChromaColor(colourInput.value);
      const rgbDisplay = seedDiv.querySelector('.seed-rgb-display') as HTMLElement;
      const oklchDisplay = seedDiv.querySelector('.seed-oklch-display') as HTMLElement;
      if (rgbDisplay) rgbDisplay.textContent = color.toCss('rgb');
      if (oklchDisplay) oklchDisplay.textContent = color.toCss('oklch', 2);
    } catch {
      // Invalid colour value - leave displays empty
    }
  };

  // Update swatch and contrast message whenever seed or background changes
  const updateSeedContrast = () => {
    const colourInput = seedDiv.querySelector('.coloris-input') as HTMLInputElement;
    const currentBgInput = root.querySelector(`#${mode}-bg-input`) as HTMLInputElement;
    try {
      const seedColor = new ChromaColor(colourInput.value);
      const bgColor = new ChromaColor(currentBgInput ? currentBgInput.value : '#ffffff');

      // Update swatch container background to match current mode background
      if (swatchContainer) swatchContainer.style.backgroundColor = bgColor.toCss('hex');

      // Update fg swatch to show seed colour
      const fgSwatch = seedDiv.querySelector('.seed-fg-swatch') as HTMLElement;
      if (fgSwatch) fgSwatch.style.backgroundColor = seedColor.toCss('hex');

      // Calculate and display contrast
      const ratio = seedColor.contrast(bgColor);
      const ratioFormatted = ratio.toFixed(1);
      const contrastDiv = seedDiv.querySelector('.seed-contrast-message') as HTMLElement;
      if (!contrastDiv) return;

      contrastDiv.className = 'seed-contrast-message';
      if (ratio < 3) {
        contrastDiv.classList.add('fg-red');
        contrastDiv.textContent = `Contrast ${ratioFormatted}:1 - fails WCAG`;
      } else if (ratio < 4.5) {
        contrastDiv.classList.add('fg-amber');
        contrastDiv.textContent = `Contrast ${ratioFormatted}:1 - large text only`;
      } else {
        contrastDiv.classList.add('fg-green');
        contrastDiv.textContent = `Contrast ${ratioFormatted}:1 - meets WCAG`;
      }
    } catch {
      // Invalid colour - leave contrast message empty
      const contrastDiv = seedDiv.querySelector('.seed-contrast-message') as HTMLElement;
      if (contrastDiv) contrastDiv.textContent = '';
    }
  };

  // Initial display and contrast
  updateSeedDisplay();
  updateSeedContrast();

  // Update on seed colour change
  const colourInput = seedDiv.querySelector('.coloris-input') as HTMLInputElement;
  if (colourInput) {
    colourInput.addEventListener('input', () => {
      updateSeedDisplay();
      updateSeedContrast();
    });

    // Update contrast when background changes too
    if (bgInput) {
      bgInput.addEventListener('input', updateSeedContrast);
    }

    // Lock toggle: track locked state on the seed entry
    const lockToggle = seedDiv.querySelector('.seed-lock-toggle') as HTMLInputElement;
    if (lockToggle) {
      lockToggle.addEventListener('change', (e) => {
        const isLocked = (e.target as HTMLInputElement).checked;
        seedDiv.classList.toggle('seed-locked', isLocked);
      });
    }
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
