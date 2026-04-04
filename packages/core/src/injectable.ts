import type { AutofillMappings } from './types';
import {
  formDetectorScript,
  cartDetectorScript,
  valueCaptureScript,
  fillScriptTemplate,
} from './injectable.gen';

export { formDetectorScript, cartDetectorScript, valueCaptureScript, fillScriptTemplate };

/**
 * Combined injectable script containing all detectors + value capture.
 * Inject this single string into a WebView for full autofill support.
 */
export const snapfillScript = [formDetectorScript, cartDetectorScript, valueCaptureScript].join(
  '\n',
);

/**
 * Build a fill script string for WebView injection.
 * The returned string, when evaluated, fills form fields using the detected field map.
 */
export function buildFillScript(mappings: AutofillMappings): string {
  return fillScriptTemplate.replace('__SNAPFILL_MAPPINGS__', JSON.stringify(mappings));
}
