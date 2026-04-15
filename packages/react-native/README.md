# @snap-fill/react-native

React Native WebView adapter for `@snap-fill/core`, including a hook and a drop-in component.

## Install

```bash
pnpm add @snap-fill/core @snap-fill/react-native react-native-webview
```

## Usage

```tsx
import { useRef } from 'react';
import WebView from 'react-native-webview';
import { useSnapfill } from '@snap-fill/react-native';

export function Checkout() {
  const ref = useRef<WebView>(null);
  const { injectedJavaScript, onMessage, fillForm } = useSnapfill(ref, {});

  return (
    <WebView
      ref={ref}
      source={{ uri: 'https://example.com/checkout' }}
      injectedJavaScript={injectedJavaScript}
      onMessage={onMessage}
    />
  );
}
```

## Exports

- `useSnapfill`
- `SnapfillWebView`
- `parseSnapfillMessage`
- React Native adapter types plus re-exported core types

## Development

```bash
pnpm --filter @snap-fill/react-native build
pnpm --filter @snap-fill/react-native test
```
