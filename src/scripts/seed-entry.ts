import Coloris from '@melloware/coloris';
import { ChromaColor } from '@/core/deltachroma';
import type { PaletteState } from './palette-state';

export type SeedMode = 'light' | 'dark';

/** Generate a random hex colour string for default seed entries. */
export function randomHex(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

/**
 * Owns a single seed entry DOM node: the colour picker input, swatch,
 * contrast displays, and lock/delete controls.
 *
 * The entry reads from and writes to a shared PaletteState. It does not
 * own any global state itself.
 */
export class SeedEntry {
  readonly element: HTMLDivElement;
  readonly index: number;
  readonly mode: SeedMode;
  private readonly colourInput: HTMLInputElement;
  private readonly paletteState: PaletteState;
  private readonly onChange: () => void;

  constructor(
    root: ParentNode,
    mode: SeedMode,
    index: number,
    paletteState: PaletteState,
    onChange: () => void,
  ) {
    this.index = index;
    this.mode = mode;
    this.paletteState = paletteState;
    this.onChange = onChange;

    this.element = document.createElement('div');
    this.element.className = 'seed-entry';
    this.element.dataset.seedIndex = String(index);
    this.element.dataset.mode = mode;
    this.element.innerHTML = `
      <div class="seed-row1">
        <div class="seed-picker-wrapper">
          <input
            type="text"
            class="coloris-input"
            data-coloris
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
    `;

    this.colourInput = this.element.querySelector('.coloris-input') as HTMLInputElement;
    this.colourInput.value = this.paletteState.getPalette(this.mode)[this.index].toCss('hex');

    // Attach Coloris directly to the new colour input
    Coloris({ el: this.colourInput, themeMode: 'auto', alpha: false });

    // Set the mode background colour on the layered swatch container
    const bgInput = root.querySelector(`#${mode}-bg-input`) as HTMLInputElement;
    const bgColour = bgInput ? bgInput.value : '#ffffff';
    const swatchContainer = this.element.querySelector('.seed-swatch-container') as HTMLElement;
    if (swatchContainer) swatchContainer.style.backgroundColor = bgColour;

    this.bindListeners();
    this.syncFromState();
  }

  private bindListeners(): void {
    // Colour input changes
    this.colourInput.addEventListener('input', () => this.onColourInput());

    // Lock toggle
    const lockToggle = this.element.querySelector('.seed-lock-toggle') as HTMLInputElement;
    if (lockToggle) {
      lockToggle.addEventListener('change', (e) => {
        const isLocked = (e.target as HTMLInputElement).checked;
        this.element.classList.toggle('seed-locked', isLocked);
      });
    }

    // Delete button
    const deleteBtn = this.element.querySelector('.btn-delete-seed') as HTMLButtonElement;
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.onDelete());
    }
  }

  private onColourInput(): void {
    try {
      const color = new ChromaColor(this.colourInput.value);
      this.paletteState.setSeed(this.mode, this.index, color);
      this.updateDisplays();
      this.updateContrast();
      this.onChange();
    } catch {
      // Invalid colour - leave palette unchanged
    }
  }

  private updateDisplays(): void {
    const color = this.paletteState.getPalette(this.mode)[this.index];
    const rgbDisplay = this.element.querySelector('.seed-rgb-display') as HTMLElement;
    const oklchDisplay = this.element.querySelector('.seed-oklch-display') as HTMLElement;
    if (rgbDisplay) rgbDisplay.textContent = color.toCss('rgb');
    if (oklchDisplay) oklchDisplay.textContent = color.toCss('oklch', 2);
  }

  private updateContrast(): void {
    const seedColor = this.paletteState.getPalette(this.mode)[this.index];
    const bgInput = this.element
      .closest('#deltachroma-root')
      ?.querySelector(`#${this.mode}-bg-input`) as HTMLInputElement;
    const bgColor = new ChromaColor(bgInput ? bgInput.value : '#ffffff');

    // Update swatch container background to match current mode background
    const swatchContainer = this.element.querySelector('.seed-swatch-container') as HTMLElement;
    if (swatchContainer) swatchContainer.style.backgroundColor = bgColor.toCss('hex');

    // Update fg swatch to show seed colour
    const fgSwatch = this.element.querySelector('.seed-fg-swatch') as HTMLElement;
    if (fgSwatch) fgSwatch.style.backgroundColor = seedColor.toCss('hex');

    // Calculate contrasts for normal vision and all CVD types
    // CVD simulation applies the matrix to BOTH seed and background colours
    const contrasts = [
      { label: 'Normal', colorA: seedColor, colorB: bgColor },
      { label: 'Protanomaly', colorA: seedColor.protan(), colorB: bgColor.protan() },
      { label: 'Deuteranomaly', colorA: seedColor.deutan(), colorB: bgColor.deutan() },
      { label: 'Tritanomaly', colorA: seedColor.tritan(), colorB: bgColor.tritan() },
    ];

    const contrastGroup = this.element.querySelector('.seed-contrast-group') as HTMLElement;
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
  }

  /** Sync displays from current palette state (called when palette size changes). */
  syncFromState(): void {
    this.updateDisplays();
    this.updateContrast();
  }

  /** Re-render contrast when the background colour changes externally. */
  updateFromBackground(): void {
    this.updateContrast();
  }

  private onDelete(): void {
    this.paletteState.resetSeed(this.mode, this.index);
    this.element.remove();
    this.onChange();
  }
}
