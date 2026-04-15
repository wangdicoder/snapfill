# Form Filling

Functions for filling form fields using native property setters. Import from `@snap-fill/core`.

## `fillForm(fieldMap, mappings)`

```ts
function fillForm(
  fieldMap: Map<string, HTMLElement>,
  mappings: AutofillMappings
): FillResult
```

Fills form fields using a field map from [`scanForFields`](/api/form-detection#scanforfields).

**Parameters:**
- `fieldMap` — Map of field type strings to DOM elements
- `mappings` — Object mapping [field types](/api/types#autofillFieldType) to values

**Returns:** [`FillResult`](/api/types#fillresult) with counts of filled/total fields and a list of failed field names

```ts
import { scanForFields, fillForm } from '@snap-fill/core';

const { fieldMap } = scanForFields();

const result = fillForm(fieldMap, {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  postalAddressLine1: '123 Main St',
  postalState: 'NY',
  postalPostCode: '10001',
});

console.log(`Filled ${result.filled} of ${result.total}`);
console.log('Failed:', result.failed);
```

### fullName Synthesis

If the form has a `fullName` field but your mappings don't include one, `fillForm` automatically synthesizes it from `firstName`, `middleName`, and `lastName`:

```ts
fillForm(fieldMap, {
  firstName: 'Jane',
  middleName: 'Marie',
  lastName: 'Doe',
});
// If fieldMap has 'fullName', it gets filled with "Jane Marie Doe"
```

An explicit `fullName` in the mappings is never overwritten.

## `fillElement(element, value)`

```ts
function fillElement(element: HTMLElement, value: string): void
```

Fills a single element with the appropriate strategy based on its type:

- **`<input>` / `<textarea>`** — Uses native property setter, dispatches `focus` → `input` → `change` → `blur`
- **`<select>`** — Matches by value, then text, then partial text
- **Checkbox / Radio** — Sets `checked` based on value (`"true"`, `"1"`, `"yes"`, `"on"`)

```ts
const input = document.getElementById('email');
fillElement(input, 'jane@example.com');
```

Does nothing if `element` or `value` is falsy.
