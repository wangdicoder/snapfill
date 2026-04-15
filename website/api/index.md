# API Reference

## Package Exports

`@snap-fill/core` provides two entry points:

### Main Entry (`@snap-fill/core`)

Functions for direct use in a web page — tree-shakeable, no side effects:

- [Form Detection](/api/form-detection) — `scanForFields`, `classifyByAutocomplete`, `classifyByRegex`
- [Form Filling](/api/form-filling) — `fillForm`, `fillElement`
- [Cart Detection](/api/cart-detection) — `detectCart`, `extractFromJsonLd`, etc.
- [Types](/api/types) — `AutofillFieldType`, `AutofillMappings`, `AutofillMessage`, etc.
- [Constants](/api/form-detection#constants) — `AUTOCOMPLETE_MAP`, `REGEX_PATTERNS`, `TYPE_MAP`

### Injectable Entry (`@snap-fill/core/injectable`)

Pre-built script strings for WebView injection:

- [Injectable Scripts](/api/injectable) — `snapfillScript`, `buildFillScript`, `fillScriptTemplate`

## Usage Patterns

### Pattern 1: WebView Injection

Use the injectable entry to inject scripts into a WebView and communicate via messages. Best for native apps (React Native, Android, iOS).

```ts
import { snapfillScript, buildFillScript } from '@snap-fill/core/injectable';
```

### Pattern 2: Direct Web Use

Use the main entry for direct DOM access in a web page or browser extension. Functions are tree-shakeable.

```ts
import { scanForFields, fillForm } from '@snap-fill/core';
```
