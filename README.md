<p align="center">
  <img src="assets/logo.svg" alt="SnapFill" width="480" />
</p>

<p align="center">
  <strong>Cross-platform WebView autofill engine.</strong><br/>
  Detects, classifies, and fills form fields inside WebViews. Also extracts shopping cart data.
</p>

---

## Quick Start

```bash
pnpm install
pnpm build
```

### Usage

```ts
import { snapfillScript, buildFillScript } from '@snapfill/core';
import type { AutofillMappings, AutofillMessage } from '@snapfill/core';

// 1. Inject the detection script into any WebView
webview.evaluateJavaScript(snapfillScript);

// 2. Listen for messages
webview.onMessage((msgStr: string) => {
  const msg: AutofillMessage = JSON.parse(msgStr);

  switch (msg.type) {
    case 'formDetected':
      console.log('Detected fields:', msg.fields);
      break;
    case 'cartDetected':
      console.log('Cart total:', msg.cart.total, msg.cart.currency);
      break;
    case 'valuesCaptured':
      console.log('Current values:', msg.mappings);
      break;
    case 'formFillComplete':
      console.log(`Filled ${msg.result.filled}/${msg.result.total}`);
      break;
  }
});

// 3. Fill form fields
const mappings: AutofillMappings = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  postalAddressLine1: '123 Main St',
  postalSuburb: 'New York',
  postalState: 'NY',
  postalPostCode: '10001',
};

webview.evaluateJavaScript(buildFillScript(mappings));
```

## How It Works

### Form Detection

Fields are classified using four signal types (in priority order):

1. **autocomplete attribute** - HTML5 standard (`autocomplete="given-name"`)
2. **name/id/placeholder regex** - Heuristic pattern matching
3. **type attribute** - `type="email"`, `type="tel"`
4. **label text** - Associated `<label>` content

A two-pass scan ensures autocomplete matches (high confidence) take priority over regex matches.

### Cart Detection

Shopping cart data is extracted from (in priority order):

1. **JSON-LD** - `<script type="application/ld+json">`
2. **Microdata** - `schema.org/Product` itemscope
3. **Open Graph** - `og:type="product"` meta tags
4. **DOM heuristics** - Cart container patterns + price regex

### Form Filling

Uses native property setters to bypass React/Vue/Angular framework interceptors. Events are dispatched in the correct order: `focus` -> `input` -> `change` -> `blur`.

## Packages

| Package | Description |
|---------|-------------|
| `@snapfill/core` | Core detection + filling engine |

## Development

```bash
pnpm install    # Install dependencies
pnpm build      # Build all packages
pnpm test       # Run tests
pnpm lint       # Lint code
```

## Architecture

```
@snapfill/core
├── detectors/
│   ├── formDetector   # Field detection + classification
│   ├── cartDetector   # Shopping cart extraction
│   └── valueCapture   # Form value monitoring
├── fillers/
│   └── formFiller     # Field filling with native setters
├── injectable         # WebView-injectable script strings
├── constants          # Regex patterns, autocomplete maps
└── types              # TypeScript type definitions
```

Each module exports both:
- **Functions** for direct use in web context (tree-shakeable)
- **Script strings** (via `injectable.ts`) for WebView injection
