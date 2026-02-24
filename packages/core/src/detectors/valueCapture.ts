const SENSITIVE_TYPES = ['password'];
const SENSITIVE_PATTERN = /ssn|social.?security|tax.?id/i;

/** Check if a form element contains sensitive data that should not be captured. */
export function isSensitiveField(element: HTMLElement): boolean {
  if (!element) return false;
  const type = ((element as HTMLInputElement).type ?? '').toLowerCase();
  if (SENSITIVE_TYPES.includes(type)) return true;

  const signals = [
    element.getAttribute('name') ?? '',
    element.getAttribute('id') ?? '',
    element.getAttribute('autocomplete') ?? '',
  ].join(' ');

  return SENSITIVE_PATTERN.test(signals);
}

/** Extract the current value from a form element. */
function getElementValue(element: HTMLElement): string {
  if (element instanceof HTMLSelectElement) {
    const selected = element.options[element.selectedIndex];
    return selected ? selected.value || selected.textContent?.trim() || '' : '';
  }
  if (
    element instanceof HTMLInputElement &&
    (element.type === 'checkbox' || element.type === 'radio')
  ) {
    return element.checked ? 'true' : 'false';
  }
  return (element as HTMLInputElement).value ?? '';
}

/**
 * Attach value capture listeners to detected form fields.
 * Returns a cleanup function that removes all listeners.
 *
 * @param fieldMap - Map of field names to their DOM elements (from scanForFields)
 * @param callback - Called with captured field values (debounced)
 * @param debounceMs - Debounce interval in milliseconds (default: 1000)
 */
export function attachValueCapture(
  fieldMap: Map<string, HTMLElement>,
  callback: (mappings: Record<string, string>) => void,
  debounceMs = 1000,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners: Array<{ element: HTMLElement; handler: () => void }> = [];

  function captureAndReport(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const mappings: Record<string, string> = {};
      let hasValues = false;

      fieldMap.forEach((element, field) => {
        if (isSensitiveField(element)) return;
        const value = getElementValue(element);
        if (value) {
          mappings[field] = value;
          hasValues = true;
        }
      });

      if (hasValues) {
        callback(mappings);
      }
    }, debounceMs);
  }

  fieldMap.forEach((element, _field) => {
    if (isSensitiveField(element)) return;

    const handler = () => captureAndReport();
    element.addEventListener('input', handler);
    element.addEventListener('change', handler);
    listeners.push({ element, handler });
  });

  // Return cleanup function
  return () => {
    if (timer) clearTimeout(timer);
    for (const { element, handler } of listeners) {
      element.removeEventListener('input', handler);
      element.removeEventListener('change', handler);
    }
  };
}
