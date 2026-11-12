import { ChromaColor } from '@/core/deltachroma';
import { MAX_PALETTE_SIZE, MIN_PALETTE_SIZE, PaletteState } from './palette-state';
import type { SeedMode } from './seed-entry';
import { randomHex, SeedEntry } from './seed-entry';
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

/** Vision types for Delta E comparison, in display order. */
const VISION_TYPES: readonly { label: string; transform: (c: ChromaColor) => ChromaColor }[] = [
  { label: 'Normal vision', transform: (c) => c },
  { label: 'Protanomaly', transform: (c) => c.protan() },
  { label: 'Deuteranomaly', transform: (c) => c.deutan() },
  { label: 'Tritanomaly', transform: (c) => c.tritan() },
];

/** Render a single Delta E matrix table for a given palette and vision type. */
function renderDeltaETable(
  container: HTMLElement,
  palette: readonly ChromaColor[],
  vision: { label: string; transform: (c: ChromaColor) => ChromaColor },
  threshold: number,
): void {
  const section = document.createElement('div');
  section.className = 'vision-section';

  const title = document.createElement('h4');
  title.className = 'vision-section-title';
  title.textContent = vision.label;
  section.appendChild(title);

  const table = document.createElement('table');
  table.className = 'delta-e-table';

  const n = palette.length;
  const transformed = palette.map(vision.transform);

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.appendChild(document.createElement('th')); // top-left corner
  for (let j = 0; j < n; j++) {
    const th = document.createElement('th');
    th.style.backgroundColor = transformed[j].toCss('hex');
    th.textContent = String(j + 1);
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 0; i < n; i++) {
    const row = document.createElement('tr');
    const rowLabel = document.createElement('td');
    rowLabel.style.backgroundColor = transformed[i].toCss('hex');
    rowLabel.textContent = String(i + 1);
    row.appendChild(rowLabel);
    for (let j = 0; j < n; j++) {
      const cell = document.createElement('td');
      const deltaE = transformed[i].deltaE(transformed[j]);
      cell.textContent = deltaE.toFixed(1);
      if (i === j) cell.classList.add('delta-e-cell-zero');
      else if (deltaE < threshold) cell.classList.add('delta-e-cell-too-similar');
      else if (deltaE < 3) cell.classList.add('delta-e-cell-low');
      else if (deltaE < 7.5) cell.classList.add('delta-e-cell-mid');
      else cell.classList.add('delta-e-cell-high');
      row.appendChild(cell);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  section.appendChild(table);
  container.appendChild(section);
}

/** Render paint swatches and delta E tables for one mode, across all vision types. */
function renderPaletteSide(root: ParentNode, mode: 'light' | 'dark', state: PaletteState): void {
  const swatchesContainer = root.querySelector(`#${mode}-palette-swatches`) as HTMLElement;
  const tableContainer = root.querySelector(`#${mode}-palette-table-container`) as HTMLElement;
  if (!swatchesContainer || !tableContainer) return;

  const palette = state.getPalette(mode);

  // --- Paint swatches (always show base colours) ---
  swatchesContainer.innerHTML = '';
  palette.forEach((color, _index) => {
    const swatch = document.createElement('div');
    swatch.className = 'paint-swatch';
    swatch.innerHTML = `
      <div class="paint-colour-patch" style="background-color: ${color.toCss('hex')}"></div>
      <div class="paint-colour-info">
        <div class="paint-format-row">
          <span class="paint-format-label">Hex:</span>
          <span class="paint-format-value">${color.toCss('hex')}</span>
        </div>
        <div class="paint-format-row">
          <span class="paint-format-label">RGB:</span>
          <span class="paint-format-value">${color.toCss('rgb')}</span>
        </div>
        <div class="paint-format-row">
          <span class="paint-format-label">OKLCH:</span>
          <span class="paint-format-value">${color.toCss('oklch', 2)}</span>
        </div>
      </div>
    `;
    swatchesContainer.appendChild(swatch);
  });

  // --- Delta E tables for each vision type ---
  tableContainer.innerHTML = '';
  for (const vision of VISION_TYPES) {
    renderDeltaETable(tableContainer, palette, vision, state.deltaEThreshold);
  }
}

/** Render both palette outputs. */
function renderPaletteOutputs(root: ParentNode, state: PaletteState): void {
  renderPaletteSide(root, 'light', state);
  renderPaletteSide(root, 'dark', state);
}

/**
 * Wire the light/dark background cards: attach listeners and render the
 * initial state. Scoped to `root` so it can be exercised in tests without a
 * real document.
 */
export function initDeltaChromaUI(root: ParentNode = document): void {
  const state = new PaletteState();
  const seedEntries: SeedEntry[] = [];

  const onSeedChange = () => renderPaletteOutputs(root, state);

  // Palette size slider
  const paletteSizeInput = root.querySelector('#palette-size-input') as HTMLInputElement;
  const paletteSizeValue = root.querySelector('#palette-size-value') as HTMLElement;

  const updatePaletteSize = () => {
    state.setSize(
      Math.max(MIN_PALETTE_SIZE, Math.min(MAX_PALETTE_SIZE, Number(paletteSizeInput.value))),
    );
    if (paletteSizeValue) paletteSizeValue.textContent = String(state.size);
    renderPaletteOutputs(root, state);
  };

  if (paletteSizeInput) {
    paletteSizeInput.addEventListener('input', updatePaletteSize);
    paletteSizeInput.addEventListener('change', updatePaletteSize);
    updatePaletteSize();
  }

  // Delta E threshold slider
  const deltaEThresholdInput = root.querySelector('#delta-e-threshold-input') as HTMLInputElement;
  const deltaEThresholdValue = root.querySelector('#delta-e-threshold-value') as HTMLElement;

  const updateDeltaEThreshold = () => {
    state.setThreshold(Number(deltaEThresholdInput.value));
    if (deltaEThresholdValue) deltaEThresholdValue.textContent = state.deltaEThreshold.toFixed(3);
    renderPaletteOutputs(root, state);
  };

  if (deltaEThresholdInput) {
    deltaEThresholdInput.addEventListener('input', updateDeltaEThreshold);
    deltaEThresholdInput.addEventListener('change', updateDeltaEThreshold);
    updateDeltaEThreshold();
  }

  // Seed buttons
  const seedCounts: { light: number; dark: number } = { light: 0, dark: 0 };
  ['light', 'dark'].forEach((mode) => {
    const addBtn = root.querySelector(`#add-${mode}-seed-btn`) as HTMLButtonElement;
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const index = seedCounts[mode as SeedMode];
        if (index >= state.size) return;
        const randomColor = new ChromaColor(randomHex());
        state.setSeed(mode as SeedMode, index, randomColor);
        const entry = new SeedEntry(root, mode as SeedMode, index, state, onSeedChange);
        const container = root.querySelector(`#${mode}-seeds`) as HTMLElement;
        const button = root.querySelector(`#add-${mode}-seed-btn`) as HTMLButtonElement;
        if (container && button) {
          container.parentNode?.insertBefore(entry.element, button.nextSibling);
        }
        seedEntries.push(entry);
        seedCounts[mode as SeedMode] = index + 1;
      });
    }
  });

  // Generate palette button
  const generateBtn = root.querySelector('#generate-palette-btn') as HTMLButtonElement;
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      state.generatePalettes();
      renderPaletteOutputs(root, state);
    });
  }

  // Background input listeners - wired once, not per seed
  ['light', 'dark'].forEach((mode) => {
    const bgInput = root.querySelector(`#${mode}-bg-input`) as HTMLInputElement;
    if (bgInput) {
      bgInput.addEventListener('input', () => {
        seedEntries
          .filter((e) => e.mode === mode)
          .forEach((e) => {
            e.updateFromBackground();
          });
        renderPaletteOutputs(root, state);
      });
    }
  });

  // Render initial palette outputs
  renderPaletteOutputs(root, state);

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
}
