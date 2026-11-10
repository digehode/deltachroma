import { presentColor } from './color-view';

interface ColorCardRefs {
  inputId: string;
  swatchId: string;
  hexId: string;
  rgbId: string;
  oklchId: string;
}

const COLOR_CARDS: readonly ColorCardRefs[] = [
  {
    inputId: 'light-bg-input',
    swatchId: 'light-swatch',
    hexId: 'light-hex',
    rgbId: 'light-rgb',
    oklchId: 'light-oklch',
  },
  {
    inputId: 'dark-bg-input',
    swatchId: 'dark-swatch',
    hexId: 'dark-hex',
    rgbId: 'dark-rgb',
    oklchId: 'dark-oklch',
  },
];

function renderColorCard(root: ParentNode, card: ColorCardRefs): void {
  const input = root.querySelector(`#${card.inputId}`);
  const swatch = root.querySelector<HTMLElement>(`#${card.swatchId}`);
  const hex = root.querySelector<HTMLElement>(`#${card.hexId}`);
  const rgb = root.querySelector<HTMLElement>(`#${card.rgbId}`);
  const oklch = root.querySelector<HTMLElement>(`#${card.oklchId}`);

  if (!(input instanceof HTMLInputElement) || !swatch || !hex || !rgb || !oklch) {
    return;
  }

  const presentation = presentColor(input.value);
  if (!presentation) {
    // Ignore intermediate malformed values while the user is still typing.
    return;
  }

  swatch.style.backgroundColor = presentation.hex;
  hex.textContent = presentation.hex;
  rgb.textContent = presentation.rgb;
  oklch.textContent = presentation.oklch;
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
}
