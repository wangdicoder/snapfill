import { isSensitiveField } from '../detectors/valueCapture';
import { postSnapfillMessage } from './postMessage';

(function () {
  'use strict';
  if ((window as any).__snapfillValueInit) return;
  (window as any).__snapfillValueInit = true;

  const ATTACHED = new Set<HTMLElement>();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function capture(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const fieldMap: Map<string, HTMLElement> | undefined = (window as any).__snapfillFieldMap;
      if (!fieldMap) return;

      const mappings: Record<string, string> = {};
      let hasValues = false;

      fieldMap.forEach((el, field) => {
        if (isSensitiveField(el)) return;

        let value = '';
        if (el instanceof HTMLSelectElement) {
          const selected = el.options[el.selectedIndex];
          value = selected ? selected.value || selected.textContent?.trim() || '' : '';
        } else if (
          el instanceof HTMLInputElement &&
          (el.type === 'checkbox' || el.type === 'radio')
        ) {
          value = el.checked ? 'true' : 'false';
        } else {
          value = (el as HTMLInputElement).value || '';
        }

        if (value) {
          mappings[field] = value;
          hasValues = true;
        }
      });

      if (hasValues) {
        postSnapfillMessage({ type: 'valuesCaptured', mappings });
      }
    }, 1000);
  }

  function attach(): void {
    const fieldMap: Map<string, HTMLElement> | undefined = (window as any).__snapfillFieldMap;
    if (!fieldMap) return;

    fieldMap.forEach((el) => {
      if (ATTACHED.has(el) || isSensitiveField(el)) return;
      el.addEventListener('input', capture);
      el.addEventListener('change', capture);
      ATTACHED.add(el);
    });
  }

  (window as any).__snapfillAttachCapture = attach;
  (window as any).__snapfillCaptureNow = capture;
  setTimeout(attach, 600);
})();
