# @snap-fill/core

Core autofill detection, classification, and form-filling engine for WebViews and browser contexts.

## Install

```bash
pnpm add @snap-fill/core
```

## Usage

```ts
import { snapfillScript, buildFillScript } from '@snap-fill/core';
import type { AutofillMappings, AutofillMessage } from '@snap-fill/core';

webview.evaluateJavaScript(snapfillScript);

const mappings: AutofillMappings = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
};

webview.evaluateJavaScript(buildFillScript(mappings));
```

## Exports

- `snapfillScript`, `buildFillScript`, `fillScriptTemplate`
- `scanForFields`, `detectCart`, `fillForm`, `attachValueCapture`
- Autofill and cart-related TypeScript types

## Development

```bash
pnpm --filter @snap-fill/core build
pnpm --filter @snap-fill/core test
```
