import '@melloware/coloris/dist/coloris.css';
import Coloris from '@melloware/coloris';

/** Initialize the bundled Coloris picker for elements marked `data-coloris`. */
export function initColorisPicker(): void {
  Coloris.init();
  Coloris({
    el: '.coloris-input',
    themeMode: 'auto',
    alpha: false,
  });
}
