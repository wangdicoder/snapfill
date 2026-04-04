# Types

All types are exported from `@snapfill/core`.

## `AutofillFieldType`

```ts
type AutofillFieldType =
  // Credit card
  | 'ccNumber' | 'ccName' | 'ccExpiry'
  | 'ccExpiryMonth' | 'ccExpiryYear' | 'ccCCV' | 'ccType'
  // Personal
  | 'firstName' | 'lastName' | 'middleName'
  | 'fullName' | 'honorific' | 'nameSuffix'
  // Contact
  | 'email' | 'phoneNumber' | 'phoneCountryCode'
  // Postal address
  | 'postalAddressLine1' | 'postalAddressLine2'
  | 'postalStreetNumber' | 'postalStreetName' | 'postalStreetType'
  | 'postalSuburb' | 'postalState' | 'postalPostCode' | 'postalCountry'
  // Billing address
  | 'billingAddressLine1' | 'billingAddressLine2'
  | 'billingStreetNumber' | 'billingStreetName' | 'billingStreetType'
  | 'billingSuburb' | 'billingState' | 'billingPostCode' | 'billingCountry'
```

Union of all recognized field types. Billing types mirror postal types and are automatically assigned when a field is detected inside a billing context.

## `AutofillMappings`

```ts
type AutofillMappings = Partial<Record<AutofillFieldType, string>>
```

Maps field types to their string values for filling. All fields are optional.

## `AutofillMessage`

```ts
type AutofillMessage =
  | { type: 'formDetected'; fields: AutofillFieldType[] }
  | { type: 'cartDetected'; cart: Omit<AutofillCartInfo, 'source'> }
  | { type: 'valuesCaptured'; mappings: Record<string, string> }
  | { type: 'formFillComplete'; result: FillResult }
```

Discriminated union of messages posted by the injectable scripts. Parse incoming messages with `JSON.parse()` and switch on `type`.

## `DetectedField`

```ts
interface DetectedField {
  field: AutofillFieldType;
  element: HTMLElement;
  confidence: 'autocomplete' | 'regex' | 'type' | 'label';
}
```

A detected form field with its classification and the confidence level of the match.

## `ScanResult`

```ts
interface ScanResult {
  fields: AutofillFieldType[];
  fieldMap: Map<string, HTMLElement>;
}
```

Result of [`scanForFields`](/api/form-detection#scanforfields). `fields` is the list of detected types, `fieldMap` maps each type to its best-matching DOM element.

## `FillResult`

```ts
interface FillResult {
  filled: number;
  total: number;
  failed: string[];
}
```

Result of a fill operation. `failed` lists field types that were in the mappings but had no matching element in the field map.

## `AutofillCartInfo`

```ts
interface AutofillCartInfo {
  total: number;         // cents
  currency: string | null;
  products: AutofillCartProduct[];
  source: 'json-ld' | 'microdata' | 'opengraph' | 'dom';
}
```

## `AutofillCartProduct`

```ts
interface AutofillCartProduct {
  name: string | null;
  quantity: number;
  itemPrice: number;     // cents
  lineTotal: number;     // cents
  url: string | null;
  imageUrl: string | null;
}
```

## `AutofillOptions`

```ts
interface AutofillOptions {
  detectDebounce?: number;   // Default: 500
  captureDebounce?: number;  // Default: 1000
  detectCart?: boolean;       // Default: true
  captureValues?: boolean;    // Default: true
}
```

## `RegexPatternEntry`

```ts
interface RegexPatternEntry {
  pattern: RegExp;
  field: AutofillFieldType;
}
```

Entry in the `REGEX_PATTERNS` array. `pattern` is tested against element attributes; `field` is the resulting classification.
