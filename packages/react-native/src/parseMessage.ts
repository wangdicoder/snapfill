import type { AutofillMessage } from '@snap-fill/core';

const VALID_TYPES = new Set([
  'formDetected',
  'cartDetected',
  'valuesCaptured',
  'formFillComplete',
]);

export type ParseResult =
  | { ok: true; message: AutofillMessage }
  | { ok: false; data: string };

/**
 * Attempt to parse a raw WebView message string as a snapfill message.
 * Returns `{ ok: true, message }` for valid snapfill messages,
 * or `{ ok: false, data }` for anything else (invalid JSON, missing type, unknown type).
 */
export function parseSnapfillMessage(raw: string): ParseResult {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string' && VALID_TYPES.has(parsed.type)) {
      return { ok: true, message: parsed as AutofillMessage };
    }
  } catch {
    // Not JSON — fall through
  }
  return { ok: false, data: raw };
}
