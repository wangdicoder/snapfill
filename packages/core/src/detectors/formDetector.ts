import { AUTOCOMPLETE_MAP, REGEX_PATTERNS, TYPE_MAP } from '../constants';
import type { AutofillFieldType, ScanResult } from '../types';

/** Check if an element is in a billing context (field name/id or parent containers). */
export function isBillingContext(element: HTMLElement): boolean {
  const name = element.getAttribute('name') ?? '';
  const id = element.id ?? '';
  if (/bill/i.test(name) || /bill/i.test(id)) return true;

  let parent = element.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    const cls = parent.className ?? '';
    const pid = parent.id ?? '';
    const pname = parent.getAttribute('name') ?? '';
    if (/bill/i.test(cls) || /bill/i.test(pid) || /bill/i.test(pname)) return true;
    if (parent.tagName === 'FIELDSET') {
      const legend = parent.querySelector('legend');
      if (legend && /bill/i.test(legend.textContent ?? '')) return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

/** Remap a postal field to its billing equivalent if the element is in billing context. */
export function applyBillingContext(
  field: AutofillFieldType | null,
  element: HTMLElement,
): AutofillFieldType | null {
  if (field && field.startsWith('postal') && isBillingContext(element)) {
    return field.replace('postal', 'billing') as AutofillFieldType;
  }
  return field;
}

/** Get the text of the label associated with an element. */
export function getAssociatedLabelText(element: HTMLElement): string {
  if (element.id) {
    try {
      const label = document.querySelector('label[for="' + CSS.escape(element.id) + '"]');
      if (label) return label.textContent ?? '';
    } catch {
      // CSS.escape may not be available
    }
  }
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent ?? '';

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.textContent ?? '';
  }

  const prev = element.previousElementSibling;
  if (
    prev &&
    (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'TD')
  ) {
    return prev.textContent ?? '';
  }

  if (element.parentElement?.tagName === 'TD') {
    const prevTd = element.parentElement.previousElementSibling;
    if (prevTd?.tagName === 'TD') return prevTd.textContent ?? '';
  }

  return '';
}

/** Classify a field by autocomplete attribute (highest confidence). */
export function classifyByAutocomplete(element: HTMLElement): AutofillFieldType | null {
  const el = element as HTMLInputElement;
  if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return null;
  if (el.type === 'radio' || el.type === 'checkbox') return null;
  if (el.disabled || el.readOnly) return null;

  const autocomplete = (element.getAttribute('autocomplete') ?? '').trim().toLowerCase();
  if (!autocomplete || autocomplete === 'off' || autocomplete === 'on') return null;

  const tokens = autocomplete.split(/\s+/);
  let section: string | null = null;
  let fieldToken: string | null = null;

  for (const token of tokens) {
    if (token === 'shipping' || token === 'billing') {
      section = token;
    } else if (AUTOCOMPLETE_MAP[token]) {
      fieldToken = token;
    }
  }

  if (!fieldToken) return null;

  let mapped = AUTOCOMPLETE_MAP[fieldToken];
  if (section === 'billing' && mapped.startsWith('postal')) {
    mapped = mapped.replace('postal', 'billing') as AutofillFieldType;
  }
  if (!section) {
    mapped = applyBillingContext(mapped, element) ?? mapped;
  }
  return mapped;
}

/** Classify a field by regex patterns, type attribute, or label text. */
export function classifyByRegex(element: HTMLElement): AutofillFieldType | null {
  const el = element as HTMLInputElement;
  if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return null;
  if (el.type === 'radio' || el.type === 'checkbox') return null;
  if (el.disabled || el.readOnly) return null;

  // Signal: name / id / placeholder / aria-label
  const signals = [
    element.getAttribute('name') ?? '',
    element.getAttribute('id') ?? '',
    element.getAttribute('placeholder') ?? '',
    element.getAttribute('aria-label') ?? '',
  ].join(' ');

  if (signals.trim()) {
    for (const entry of REGEX_PATTERNS) {
      if (entry.pattern.test(signals)) {
        return applyBillingContext(entry.field, element) ?? entry.field;
      }
    }
  }

  // Signal: type attribute
  const type = (element.getAttribute('type') ?? '').toLowerCase();
  if (TYPE_MAP[type]) {
    return TYPE_MAP[type];
  }

  // Signal: associated label text
  const labelText = getAssociatedLabelText(element);
  if (labelText.trim()) {
    for (const entry of REGEX_PATTERNS) {
      if (entry.pattern.test(labelText)) {
        return applyBillingContext(entry.field, element) ?? entry.field;
      }
    }
  }

  return null;
}

/** Check if an element is visible. */
export function isVisible(el: HTMLElement): boolean {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    (el as HTMLElement).offsetParent !== null
  );
}

/**
 * Two-pass scan: autocomplete matches first (high confidence),
 * then regex/type/label for remaining unclassified elements.
 */
export function scanForFields(root?: Document | HTMLElement): ScanResult {
  const container = root ?? document;
  const elements = container.querySelectorAll<HTMLElement>('input, select, textarea');
  const detectedFields = new Set<AutofillFieldType>();
  const fieldMap = new Map<string, HTMLElement>();

  // Pass 1: autocomplete attribute (highest confidence)
  elements.forEach((el) => {
    const field = classifyByAutocomplete(el);
    if (field) {
      detectedFields.add(field);
      if (!fieldMap.has(field) || !isVisible(fieldMap.get(field)!)) {
        fieldMap.set(field, el);
      }
    }
  });

  // Pass 2: regex, type, and label
  elements.forEach((el) => {
    const field = classifyByRegex(el);
    if (field) {
      detectedFields.add(field);
      if (!fieldMap.has(field) || !isVisible(fieldMap.get(field)!)) {
        fieldMap.set(field, el);
      }
    }
  });

  return {
    fields: Array.from(detectedFields),
    fieldMap,
  };
}
