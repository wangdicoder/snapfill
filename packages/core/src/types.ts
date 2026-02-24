/** All recognized autofill field types. */
export type AutofillFieldType =
  // Credit card
  | 'ccNumber'
  | 'ccName'
  | 'ccExpiry'
  | 'ccExpiryMonth'
  | 'ccExpiryYear'
  | 'ccCCV'
  | 'ccType'
  // Personal
  | 'firstName'
  | 'lastName'
  | 'middleName'
  | 'fullName'
  | 'honorific'
  | 'nameSuffix'
  // Contact
  | 'email'
  | 'phoneNumber'
  | 'phoneCountryCode'
  // Postal address
  | 'postalAddressLine1'
  | 'postalAddressLine2'
  | 'postalStreetNumber'
  | 'postalStreetName'
  | 'postalStreetType'
  | 'postalSuburb'
  | 'postalState'
  | 'postalPostCode'
  | 'postalCountry'
  // Billing address (same fields, billing context)
  | 'billingAddressLine1'
  | 'billingAddressLine2'
  | 'billingStreetNumber'
  | 'billingStreetName'
  | 'billingStreetType'
  | 'billingSuburb'
  | 'billingState'
  | 'billingPostCode'
  | 'billingCountry';

/** Mapping of field types to their values for filling. */
export type AutofillMappings = Partial<Record<AutofillFieldType, string>>;

/** A detected form field with its classification and element reference. */
export interface DetectedField {
  field: AutofillFieldType;
  element: HTMLElement;
  confidence: 'autocomplete' | 'regex' | 'type' | 'label';
}

/** Result of a form scan. */
export interface ScanResult {
  fields: AutofillFieldType[];
  fieldMap: Map<string, HTMLElement>;
}

/** Result of a form fill operation. */
export interface FillResult {
  filled: number;
  total: number;
  failed: string[];
}

/** A product detected in a shopping cart. */
export interface AutofillCartProduct {
  name: string | null;
  quantity: number;
  itemPrice: number; // cents
  lineTotal: number; // cents
  url: string | null;
  imageUrl: string | null;
}

/** Shopping cart info extracted from a page. */
export interface AutofillCartInfo {
  total: number; // cents
  currency: string | null;
  products: AutofillCartProduct[];
  source: 'json-ld' | 'microdata' | 'opengraph' | 'dom';
}

/** Messages posted from the injected scripts. */
export type AutofillMessage =
  | { type: 'formDetected'; fields: AutofillFieldType[] }
  | { type: 'cartDetected'; cart: Omit<AutofillCartInfo, 'source'> }
  | { type: 'valuesCaptured'; mappings: Record<string, string> }
  | { type: 'formFillComplete'; result: FillResult };

/** Configuration options for the autofill engine. */
export interface AutofillOptions {
  /** Debounce interval for form detection (ms). Default: 500 */
  detectDebounce?: number;
  /** Debounce interval for value capture (ms). Default: 1000 */
  captureDebounce?: number;
  /** Enable cart detection. Default: true */
  detectCart?: boolean;
  /** Enable value capture. Default: true */
  captureValues?: boolean;
}

/** Regex pattern entry for field classification. */
export interface RegexPatternEntry {
  pattern: RegExp;
  field: AutofillFieldType;
}
