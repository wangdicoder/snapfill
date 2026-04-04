import { scanForFields } from '../detectors/formDetector';
import { postSnapfillMessage } from './postMessage';

(function () {
  'use strict';
  if ((window as any).__snapfillDetectorInit) return;
  (window as any).__snapfillDetectorInit = true;

  (window as any).__snapfillFieldMap = new Map<string, HTMLElement>();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastResult = '';

  function report(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const result = scanForFields(document);

      const globalMap: Map<string, HTMLElement> = (window as any).__snapfillFieldMap;
      globalMap.clear();
      result.fieldMap.forEach((el, key) => globalMap.set(key, el));

      const key = result.fields.sort().join(',');
      if (key !== lastResult) {
        lastResult = key;
        postSnapfillMessage({ type: 'formDetected', fields: result.fields });
      }
    }, 500);
  }

  let mutationTimer: ReturnType<typeof setTimeout> | null = null;
  new MutationObserver(() => {
    if (mutationTimer) clearTimeout(mutationTimer);
    mutationTimer = setTimeout(report, 300);
  }).observe(document.body, { childList: true, subtree: true });

  report();
})();
