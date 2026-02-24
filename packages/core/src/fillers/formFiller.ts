import type { AutofillMappings, FillResult } from '../types';

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
)?.set;

const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  'value',
)?.set;

const nativeSelectSetter = Object.getOwnPropertyDescriptor(
  HTMLSelectElement.prototype,
  'selectedIndex',
)?.set;

function dispatchEvents(element: HTMLElement, eventNames: string[]): void {
  for (const name of eventNames) {
    element.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
  }
}

/** Fill an input or textarea element using native property setters. */
export function fillInputOrTextarea(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  element.focus();
  dispatchEvents(element, ['focus', 'focusin']);

  if (element instanceof HTMLInputElement && nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else if (element instanceof HTMLTextAreaElement && nativeTextareaValueSetter) {
    nativeTextareaValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  dispatchEvents(element, ['input', 'change']);

  setTimeout(() => {
    element.blur();
    dispatchEvents(element, ['blur', 'focusout']);
  }, 50);
}

/** Fill a select element by matching value or text content. */
export function fillSelect(element: HTMLSelectElement, value: string): void {
  const options = element.options;
  let matchIndex = -1;

  // Exact value match
  for (let i = 0; i < options.length; i++) {
    if (options[i].value.toLowerCase() === value.toLowerCase()) {
      matchIndex = i;
      break;
    }
  }

  // Exact text match
  if (matchIndex === -1) {
    for (let i = 0; i < options.length; i++) {
      if (options[i].textContent?.trim().toLowerCase() === value.toLowerCase()) {
        matchIndex = i;
        break;
      }
    }
  }

  // Partial text match
  if (matchIndex === -1) {
    for (let i = 0; i < options.length; i++) {
      if (options[i].textContent?.trim().toLowerCase().includes(value.toLowerCase())) {
        matchIndex = i;
        break;
      }
    }
  }

  if (matchIndex >= 0) {
    element.focus();
    dispatchEvents(element, ['focus', 'focusin']);

    if (nativeSelectSetter) {
      nativeSelectSetter.call(element, matchIndex);
    } else {
      element.selectedIndex = matchIndex;
    }

    dispatchEvents(element, ['input', 'change']);

    setTimeout(() => {
      element.blur();
      dispatchEvents(element, ['blur', 'focusout']);
    }, 50);
  }
}

/** Fill a checkbox or radio element. */
export function fillCheckboxOrRadio(element: HTMLInputElement, value: string): void {
  const shouldCheck = value === 'true' || value === '1' || value === 'yes' || value === 'on';
  if (element.checked !== shouldCheck) {
    element.focus();
    element.checked = shouldCheck;
    dispatchEvents(element, ['click', 'input', 'change']);
  }
}

/** Fill a single element with the appropriate strategy. */
export function fillElement(element: HTMLElement, value: string): void {
  if (!element || !value) return;

  if (element instanceof HTMLSelectElement) {
    fillSelect(element, value);
  } else if (
    element instanceof HTMLInputElement &&
    (element.type === 'checkbox' || element.type === 'radio')
  ) {
    fillCheckboxOrRadio(element, value);
  } else {
    fillInputOrTextarea(element as HTMLInputElement | HTMLTextAreaElement, value);
  }
}

/**
 * Fill form fields using a field map (from scanForFields).
 * Synthesizes fullName from firstName + middleName + lastName if needed.
 */
export function fillForm(
  fieldMap: Map<string, HTMLElement>,
  mappings: AutofillMappings,
): FillResult {
  const mutableMappings = { ...mappings };

  // Synthesize fullName if the form has a fullName field but mappings don't
  if (fieldMap.has('fullName') && !mutableMappings.fullName) {
    const parts = [mutableMappings.firstName, mutableMappings.middleName, mutableMappings.lastName].filter(
      Boolean,
    );
    if (parts.length > 0) {
      mutableMappings.fullName = parts.join(' ');
    }
  }

  let filled = 0;
  const failed: string[] = [];

  for (const [field, value] of Object.entries(mutableMappings)) {
    if (!value) continue;
    const element = fieldMap.get(field);
    if (element) {
      fillElement(element, value);
      filled++;
    } else {
      failed.push(field);
    }
  }

  return { filled, total: Object.keys(mutableMappings).length, failed };
}
