# Form Detection

Functions for detecting and classifying form fields. Import from `@snapfill/core`.

## `scanForFields(root?)`

```ts
function scanForFields(root?: Document | HTMLElement): ScanResult
```

Two-pass scan that detects and classifies all form fields in the given root.

**Parameters:**
- `root` — DOM element or document to scan (defaults to `document`)

**Returns:** [`ScanResult`](/api/types#scanresult) with detected field types and a map of field type to element

```ts
import { scanForFields } from '@snapfill/core';

const { fields, fieldMap } = scanForFields(document);
// fields: ['firstName', 'lastName', 'email', ...]
// fieldMap: Map { 'firstName' => <input>, 'lastName' => <input>, ... }
```

You can scope the scan to a subtree:

```ts
const section = document.getElementById('checkout-form');
const { fields, fieldMap } = scanForFields(section);
```

## `classifyByAutocomplete(element)`

```ts
function classifyByAutocomplete(element: HTMLElement): AutofillFieldType | null
```

Classifies a single element using its `autocomplete` attribute. Returns `null` if no match or if the element is hidden/disabled.

Handles compound tokens like `billing address-line1` and section prefixes.

```ts
const input = document.querySelector('input[autocomplete="given-name"]');
classifyByAutocomplete(input); // → 'firstName'
```

## `classifyByRegex(element)`

```ts
function classifyByRegex(element: HTMLElement): AutofillFieldType | null
```

Classifies a single element using regex patterns against `name`, `id`, `placeholder`, `aria-label`, `type`, and associated label text. Returns `null` if no match.

```ts
const input = document.querySelector('input[name="cardNumber"]');
classifyByRegex(input); // → 'ccNumber'
```

## `isBillingContext(element)`

```ts
function isBillingContext(element: HTMLElement): boolean
```

Checks if an element is inside a billing context by inspecting:
- The element's own `name` and `id`
- Parent elements' `className`, `id`, and `name` (up to 5 levels)
- `<legend>` text inside parent `<fieldset>` elements

```ts
// <div class="billing-form"><input id="addr" /></div>
isBillingContext(addrInput); // → true
```

## `getAssociatedLabelText(element)`

```ts
function getAssociatedLabelText(element: HTMLElement): string
```

Returns the text of the label associated with an element. Checks (in order):
1. `<label for="id">` matching the element's ID
2. Parent `<label>` element
3. Element referenced by `aria-labelledby`
4. Previous sibling `<label>`, `<span>`, or `<td>`
5. Previous `<td>` when the element is inside a table cell

## Constants

### `AUTOCOMPLETE_MAP`

```ts
const AUTOCOMPLETE_MAP: Record<string, AutofillFieldType>
```

Maps HTML5 `autocomplete` attribute values to field types:

| Autocomplete Value | Field Type |
|---|---|
| `given-name`, `first-name` | `firstName` |
| `family-name`, `last-name` | `lastName` |
| `email` | `email` |
| `tel`, `tel-national` | `phoneNumber` |
| `address-line1`, `street-address` | `postalAddressLine1` |
| `address-line2` | `postalAddressLine2` |
| `address-level2` | `postalSuburb` |
| `address-level1` | `postalState` |
| `postal-code` | `postalPostCode` |
| `cc-number` | `ccNumber` |
| `cc-name` | `ccName` |
| `cc-exp` | `ccExpiry` |
| `cc-csc` | `ccCCV` |
| ... | ... |

### `REGEX_PATTERNS`

```ts
const REGEX_PATTERNS: RegexPatternEntry[]
```

Ordered array of regex patterns for heuristic field classification. More specific patterns come first. See [`RegexPatternEntry`](/api/types#regexpatternentry).

### `TYPE_MAP`

```ts
const TYPE_MAP: Record<string, AutofillFieldType>
```

Maps `<input type>` values to field types:

| Type | Field Type |
|---|---|
| `email` | `email` |
| `tel` | `phoneNumber` |
