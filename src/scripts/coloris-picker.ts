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

/** Re-scan and attach Coloris to dynamically added color inputs. */
export function refreshColoris(): void {
  Coloris({
    el: '.coloris-input',
    themeMode: 'auto',
    alpha: false,
  });
}
