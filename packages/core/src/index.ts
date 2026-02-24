// Public API
export { snapfillScript, buildFillScript, formDetectorScript, cartDetectorScript, valueCaptureScript } from './injectable';

// Types
export type {
  AutofillFieldType,
  AutofillMappings,
  AutofillCartInfo,
  AutofillCartProduct,
  AutofillMessage,
  AutofillOptions,
  DetectedField,
  ScanResult,
  FillResult,
  RegexPatternEntry,
} from './types';

// Constants
export { AUTOCOMPLETE_MAP, REGEX_PATTERNS, TYPE_MAP } from './constants';

// Direct-use functions (for web context, not WebView injection)
export {
  scanForFields,
  classifyByAutocomplete,
  classifyByRegex,
  isBillingContext,
  getAssociatedLabelText,
} from './detectors/formDetector';

export {
  detectCart,
  priceToCents,
  detectCurrency,
  extractFromJsonLd,
  extractFromMicrodata,
  extractFromOpenGraph,
  extractFromDomHeuristics,
} from './detectors/cartDetector';

export { fillForm, fillElement } from './fillers/formFiller';

export { attachValueCapture, isSensitiveField } from './detectors/valueCapture';
