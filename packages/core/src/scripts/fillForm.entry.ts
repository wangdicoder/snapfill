import { fillElement } from '../fillers/formFiller';
import { postSnapfillMessage } from './postMessage';

declare const __SNAPFILL_MAPPINGS__: Record<string, string>;

(function () {
  'use strict';
  const mappings = __SNAPFILL_MAPPINGS__;
  const fieldMap: Map<string, HTMLElement> | undefined = (window as any).__snapfillFieldMap;

  if (!fieldMap) {
    console.warn('[snapfill] No field map found. Inject snapfillScript first.');
    return;
  }

  // Synthesize fullName from parts if needed
  if (fieldMap.has('fullName') && !mappings.fullName) {
    const parts = [mappings.firstName, mappings.middleName, mappings.lastName].filter(Boolean);
    if (parts.length > 0) {
      mappings.fullName = parts.join(' ');
    }
  }

  let filled = 0;
  const failed: string[] = [];

  for (const [field, value] of Object.entries(mappings)) {
    if (!value) continue;
    const element = fieldMap.get(field);
    if (element) {
      fillElement(element, value);
      filled++;
    } else {
      failed.push(field);
    }
  }

  const result = { filled, total: Object.keys(mappings).length, failed };
  postSnapfillMessage({ type: 'formFillComplete', result });
})();
