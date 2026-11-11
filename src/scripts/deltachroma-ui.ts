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
        const entry = seedEntry as HTMLElement;
        const index = Number(entry.dataset.seedIndex);
        const mode = entry.dataset.mode as 'light' | 'dark';
        if (mode === 'light' && index < lightPalette.length) {
          lightPalette[index] = new ChromaColor('#ffffff');
          renderPaletteOutputs(root);
        } else if (mode === 'dark' && index < darkPalette.length) {
          darkPalette[index] = new ChromaColor('#ffffff');
          renderPaletteOutputs(root);
        }
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

/** Palette state: one array per mode, sized to paletteSize, default white. */
let lightPalette: ChromaColor[] = [];
let darkPalette: ChromaColor[] = [];
let paletteSize = 7;
let deltaEThreshold = 0.05;
let lightSeedCount = 0;
let darkSeedCount = 0;

/** Initialise both palettes to the given size, filled with white. */
function initPalettes(size: number): void {
  const white = new ChromaColor('#ffffff');
  lightPalette = Array.from({ length: size }, () => white.clone());
  darkPalette = Array.from({ length: size }, () => white.clone());
  lightSeedCount = 0;
  darkSeedCount = 0;
}

/** Render paint swatches and delta E table for one mode. */
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
  palette: ChromaColor[],
  vision: { label: string; transform: (c: ChromaColor) => ChromaColor },
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
      else if (deltaE < deltaEThreshold) cell.classList.add('delta-e-cell-too-similar');
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
function renderPaletteSide(root: ParentNode, mode: 'light' | 'dark', palette: ChromaColor[]): void {
  const swatchesContainer = root.querySelector(`#${mode}-palette-swatches`) as HTMLElement;
  const tableContainer = root.querySelector(`#${mode}-palette-table-container`) as HTMLElement;
  if (!swatchesContainer || !tableContainer) return;

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
    renderDeltaETable(tableContainer, palette, vision);
  }
}

/** Render both palette outputs. */
function renderPaletteOutputs(root: ParentNode): void {
  renderPaletteSide(root, 'light', lightPalette);
  renderPaletteSide(root, 'dark', darkPalette);
}

/** Create a new seed entry with colour picker and displays */
function createSeedEntry(root: ParentNode, mode: 'light' | 'dark'): void {
  const seedIndex = mode === 'light' ? lightSeedCount++ : darkSeedCount++;
  const seedDiv = document.createElement('div');
  seedDiv.className = 'seed-entry';
  seedDiv.dataset.seedIndex = String(seedIndex);
  seedDiv.dataset.mode = mode;
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
      <div class="seed-contrast-group"></div>
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

      // Calculate contrasts for normal vision and all CVD types
      // CVD simulation applies the matrix to BOTH seed and background colours
      const contrasts = [
        { label: 'Normal', colorA: seedColor, colorB: bgColor },
        { label: 'Protanomaly', colorA: seedColor.protan(), colorB: bgColor.protan() },
        { label: 'Deuteranomaly', colorA: seedColor.deutan(), colorB: bgColor.deutan() },
        { label: 'Tritanomaly', colorA: seedColor.tritan(), colorB: bgColor.tritan() },
      ];

      const contrastGroup = seedDiv.querySelector('.seed-contrast-group') as HTMLElement;
      if (!contrastGroup) return;

      contrastGroup.innerHTML = '';

      contrasts.forEach(({ label, colorA, colorB }) => {
        const ratio = colorA.contrast(colorB);
        const ratioFormatted = ratio.toFixed(1);

        const item = document.createElement('div');
        item.className = 'seed-contrast-item';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'seed-contrast-label';
        labelSpan.textContent = label;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'seed-contrast-value';
        valueSpan.textContent = `${ratioFormatted}:1`;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'seed-contrast-status';

        if (ratio < 3) {
          statusSpan.classList.add('fg-red');
          statusSpan.textContent = 'fails WCAG';
        } else if (ratio < 4.5) {
          statusSpan.classList.add('fg-amber');
          statusSpan.textContent = 'large text only';
        } else {
          statusSpan.classList.add('fg-green');
          statusSpan.textContent = 'meets WCAG';
        }

        item.appendChild(labelSpan);
        item.appendChild(valueSpan);
        item.appendChild(statusSpan);
        contrastGroup.appendChild(item);
      });
    } catch {
      // Invalid colour - leave contrast message empty
      const contrastGroup = seedDiv.querySelector('.seed-contrast-group') as HTMLElement;
      if (contrastGroup) contrastGroup.innerHTML = '';
    }
  };

  // Initial display and contrast
  updateSeedDisplay();
  updateSeedContrast();

  // Initialise palette slot if within range
  if (seedIndex < paletteSize) {
    try {
      const color = new ChromaColor(
        (seedDiv.querySelector('.coloris-input') as HTMLInputElement).value,
      );
      if (mode === 'light') lightPalette[seedIndex] = color;
      else darkPalette[seedIndex] = color;
    } catch {
      // Invalid colour - leave palette as white
    }
  }

  // Render palette outputs after all seeds are initialised
  renderPaletteOutputs(root);

  // Update on seed colour change
  const colourInput = seedDiv.querySelector('.coloris-input') as HTMLInputElement;
  if (colourInput) {
    colourInput.addEventListener('input', () => {
      updateSeedDisplay();
      updateSeedContrast();

      // Update palette slot if within range
      if (seedIndex < paletteSize) {
        try {
          const color = new ChromaColor(colourInput.value);
          if (mode === 'light') lightPalette[seedIndex] = color;
          else darkPalette[seedIndex] = color;
          renderPaletteOutputs(root);
        } catch {
          // Invalid colour - leave palette unchanged
        }
      }
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
  // Palette size slider
  const paletteSizeInput = root.querySelector('#palette-size-input') as HTMLInputElement;
  const paletteSizeValue = root.querySelector('#palette-size-value') as HTMLElement;

  // Initialise palettes to white
  initPalettes(paletteSize);

  const updatePaletteSize = () => {
    paletteSize = Math.max(3, Math.min(12, Number(paletteSizeInput.value)));
    if (paletteSizeValue) paletteSizeValue.textContent = String(paletteSize);

    // Re-init palettes to new size, preserving existing colours that fit
    const white = new ChromaColor('#ffffff');
    const oldLight = lightPalette;
    const oldDark = darkPalette;
    lightPalette = Array.from({ length: paletteSize }, (_, _index) =>
      _index < oldLight.length ? oldLight[_index].clone() : white.clone(),
    );
    darkPalette = Array.from({ length: paletteSize }, (_, _index) =>
      _index < oldDark.length ? oldDark[_index].clone() : white.clone(),
    );
    renderPaletteOutputs(root);
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
    deltaEThreshold = Math.max(0, Math.min(0.15, Number(deltaEThresholdInput.value)));
    if (deltaEThresholdValue) deltaEThresholdValue.textContent = deltaEThreshold.toFixed(3);
    renderPaletteOutputs(root);
  };

  if (deltaEThresholdInput) {
    deltaEThresholdInput.addEventListener('input', updateDeltaEThreshold);
    deltaEThresholdInput.addEventListener('change', updateDeltaEThreshold);
    updateDeltaEThreshold();
  }

  // Render initial palette outputs
  renderPaletteOutputs(root);

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

  // Render initial palette outputs
  renderPaletteOutputs(root);
}
