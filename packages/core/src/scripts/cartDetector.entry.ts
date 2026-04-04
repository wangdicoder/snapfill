import { detectCart } from '../detectors/cartDetector';
import { postSnapfillMessage } from './postMessage';

(function () {
  'use strict';
  if ((window as any).__snapfillCartInit) return;
  (window as any).__snapfillCartInit = true;

  (window as any).__snapfillDetectCart = detectCart;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastResult = '';

  function report(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const cart = detectCart();
      if (!cart) return;

      const key = JSON.stringify(cart);
      if (key !== lastResult) {
        lastResult = key;
        postSnapfillMessage({
          type: 'cartDetected',
          cart: { total: cart.total, currency: cart.currency, products: cart.products },
        });
      }
    }, 500);
  }

  let mutationTimer: ReturnType<typeof setTimeout> | null = null;
  new MutationObserver(() => {
    if (mutationTimer) clearTimeout(mutationTimer);
    mutationTimer = setTimeout(report, 500);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  report();
})();
