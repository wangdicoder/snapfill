# Getting Started

## Installation

::: code-group

```sh [pnpm]
pnpm add @snapfill/core
```

```sh [npm]
npm install @snapfill/core
```

```sh [yarn]
yarn add @snapfill/core
```

:::

For React Native, also install the adapter:

```sh
pnpm add @snapfill/react-native
```

## Quick Start

### WebView Injection

The most common usage — inject SnapFill into a WebView and communicate via messages:

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

### Direct Use (Web)

You can also use SnapFill functions directly in a web page without message passing:

```ts
import { scanForFields, fillForm } from '@snapfill/core';

// Detect fields
const { fields, fieldMap } = scanForFields(document);
console.log('Found fields:', fields);

// Fill them
const result = fillForm(fieldMap, {
  firstName: 'Jane',
  email: 'jane@example.com',
});
console.log(`Filled ${result.filled} of ${result.total} fields`);
```

## Packages

| Package | Description | Platform |
|---------|-------------|----------|
| `@snapfill/core` | Core detection + filling engine | Any JS runtime |
| `@snapfill/react-native` | React Native WebView adapter | React Native |
| `@snapfill/android` | Kotlin library for Android `WebView` | Android 7.0+ |
| `@snapfill/ios` | Swift package for `WKWebView` | iOS 15+ |

## Next Steps

- Learn [how it works](/guide/how-it-works) under the hood
- Browse the [API reference](/api/)
- Set up a [platform adapter](/platforms/react-native)
