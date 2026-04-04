<p align="center">
  <img src="assets/logo.svg" alt="SnapFill" width="480" />
</p>

<p align="center">
  <strong>Cross-platform WebView autofill engine.</strong><br/>
  Detects, classifies, and fills form fields inside WebViews. Also extracts shopping cart data.
</p>

---

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

| Package | Description | Platform |
|---------|-------------|----------|
| [`@snapfill/core`](packages/core) | Core detection + filling engine | Any JS runtime |
| [`@snapfill/react-native`](packages/react-native) | React Native WebView adapter (hook + component) | React Native |
| [`@snapfill/android`](packages/android) | Kotlin library for Android `WebView` | Android 7.0+ |
| [`@snapfill/ios`](packages/ios) | Swift package for `WKWebView` | iOS 15+ |

## Platform Guides

- [React Native](docs/react-native-dev.md) — hook, component, and Expo demo setup
- [Android](docs/android-dev.md) — Kotlin `Snapfill` helper and `SnapfillWebView`
- [iOS](docs/ios-dev.md) — Swift `Snapfill` helper and `SnapfillWebView`

## Documentation

The full documentation site (with a live demo) is available at **[wangdicoder.github.io/snapfill](https://wangdicoder.github.io/snapfill/)**.

To run it locally:

```bash
pnpm --filter @snapfill/website dev
```

## Development

```bash
pnpm install           # Install dependencies
pnpm build             # Build all packages
pnpm test              # Run tests
pnpm lint              # Lint code
pnpm generate:native   # Generate JS assets for Android & iOS
```

### Native Libraries

The Android and iOS libraries load the same injectable scripts from `@snapfill/core`. After building core, run `pnpm generate:native` to copy the JS assets into both native packages. See the platform guides above for build and test instructions.

## Architecture

```
packages/
├── core/src/                  # @snapfill/core — JS engine
│   ├── detectors/
│   │   ├── formDetector       # Field detection + classification
│   │   ├── cartDetector       # Shopping cart extraction
│   │   └── valueCapture       # Form value monitoring
│   ├── fillers/
│   │   └── formFiller         # Field filling with native setters
│   ├── scripts/               # Entry points for injectable IIFE bundles
│   ├── injectable             # Re-exports generated script strings
│   ├── constants              # Regex patterns, autocomplete maps
│   └── types                  # TypeScript type definitions
│
├── react-native/src/          # @snapfill/react-native — RN adapter
│   ├── useSnapfill            # Hook for WebView script injection + messaging
│   ├── SnapfillWebView        # Pre-wired WebView component
│   └── parseMessage           # Message type parser
│
├── android/src/               # @snapfill/android — Kotlin library
│   ├── Snapfill               # Script injection + message bridge
│   ├── SnapfillWebView        # Pre-wired Android WebView
│   ├── SnapfillListener       # Callback interface
│   └── SnapfillModels         # Data classes
│
└── ios/Sources/Snapfill/      # @snapfill/ios — Swift package
    ├── Snapfill               # Script injection + message bridge
    ├── SnapfillWebView        # Pre-wired WKWebView
    ├── SnapfillDelegate       # Delegate protocol
    └── SnapfillModels         # Data structs
```

Core exports both **functions** for direct web use (tree-shakeable) and **script strings** for WebView injection. The injectable scripts are generated at build time from the same typed source modules (via `scripts/` entry points bundled with esbuild), ensuring a single source of truth. Native libraries inject these scripts via platform-specific WebView APIs (`evaluateJavascript` on Android, `WKUserScript` on iOS). A bridge shim provides `window.ReactNativeWebView.postMessage()` so the same scripts work across all platforms.
