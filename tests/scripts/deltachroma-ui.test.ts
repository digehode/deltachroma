// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { initDeltaChromaUI } from '@/scripts/deltachroma-ui';

const MARKUP = `
  <div id="app">
    <input id="light-bg-input" value="#3b82f6" />
    <div id="light-swatch"></div>
    <span id="light-hex"></span>
    <span id="light-rgb"></span>
    <span id="light-oklch"></span>
    <div id="light-validation"></div>

    <input id="dark-bg-input" value="#121212" />
    <div id="dark-swatch"></div>
    <span id="dark-hex"></span>
    <span id="dark-rgb"></span>
    <span id="dark-oklch"></span>
    <div id="dark-validation"></div>
  </div>
`;

function text(id: string): string | null {
  return document.getElementById(id)?.textContent ?? null;
}

function input(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input #${id}`);
  }
  return element;
}

describe('initDeltaChromaUI', () => {
  beforeEach(() => {
    document.body.innerHTML = MARKUP;
  });

  it('renders the initial state for each card', () => {
    initDeltaChromaUI(document.getElementById('app') ?? document);

    expect(text('light-hex')).toBe('#3b82f6');
    expect(text('light-rgb')).toBe('rgb(59, 130, 246)');
    expect(text('light-oklch')).toBe('oklch(62% 0.19 260)');
    expect(text('dark-hex')).toBe('#121212');
    expect(text('dark-rgb')).toBe('rgb(18, 18, 18)');
  });

  it('updates the presentation when the input changes', () => {
    const root = document.getElementById('app') ?? document;
    initDeltaChromaUI(root);

    const light = input('light-bg-input');
    light.value = '#ef4444';
    light.dispatchEvent(new Event('input'));

    expect(text('light-hex')).toBe('#ef4444');
    expect(text('light-rgb')).toBe('rgb(239, 68, 68)');
    expect(document.getElementById('light-swatch')?.style.backgroundColor).toBe('rgb(239, 68, 68)');
  });

  it('ignores malformed intermediate input and keeps the last presentation', () => {
    initDeltaChromaUI(document.getElementById('app') ?? document);

    const light = input('light-bg-input');
    light.value = '#3b82f6';
    light.dispatchEvent(new Event('input'));
    light.value = 'not-a-color';
    light.dispatchEvent(new Event('input'));

    expect(text('light-hex')).toBe('#3b82f6');
    expect(text('light-rgb')).toBe('rgb(59, 130, 246)');
  });

  it('does nothing for cards that are missing from the root', () => {
    document.body.innerHTML = `
      <div id="app">
        <input id="light-bg-input" value="#3b82f6" />
      </div>
    `;

    expect(() => initDeltaChromaUI(document.getElementById('app') ?? document)).not.toThrow();
  });
});
