# React Native

`@snap-fill/react-native` provides a hook and a pre-wired component for use with [react-native-webview](https://github.com/nicejsonschema/react-native-webview).

## Installation

```sh
pnpm add @snap-fill/core @snap-fill/react-native react-native-webview
```

## Option A: `useSnapfill` Hook

The hook gives you full control — wire it into any WebView:

```tsx
import { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { useSnapfill } from '@snap-fill/react-native';

function CheckoutScreen() {
  const webViewRef = useRef(null);

  const { onMessage, injectedJavaScript, fillForm } = useSnapfill(
    webViewRef,
    {
      onFormDetected: (fields) => {
        console.log('Fields:', fields);
      },
      onCartDetected: (cart) => {
        console.log('Cart:', cart.total, cart.currency);
      },
      onValuesCaptured: (mappings) => {
        console.log('Values:', mappings);
      },
      onFormFillComplete: (result) => {
        console.log(`Filled ${result.filled}/${result.total}`);
      },
    },
  );

  return (
    <>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://example.com/checkout' }}
        injectedJavaScript={injectedJavaScript}
        onMessage={onMessage}
      />
      <Button
        title="Fill Form"
        onPress={() =>
          fillForm({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
          })
        }
      />
    </>
  );
}
```

### Hook Options

```ts
useSnapfill(webViewRef, callbacks, options?)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `detectForms` | `boolean` | `true` | Enable form field detection |
| `detectCart` | `boolean` | `true` | Enable shopping cart detection |
| `captureValues` | `boolean` | `true` | Enable form value capture |

### Hook Return

| Property | Description |
|----------|-------------|
| `onMessage` | Stable handler — pass to `<WebView onMessage>` |
| `injectedJavaScript` | Script string — pass to `<WebView injectedJavaScript>` |
| `fillForm(mappings)` | Fill form fields with the given values |
| `reinject()` | Re-inject detection scripts (for SPA navigations) |
| `injectJavaScript(script)` | Inject arbitrary JS into the WebView |

## Option B: `SnapfillWebView` Component

A pre-wired WebView component with SnapFill built in:

```tsx
import { SnapfillWebView } from '@snap-fill/react-native';

function CheckoutScreen() {
  return (
    <SnapfillWebView
      source={{ uri: 'https://example.com/checkout' }}
      onFormDetected={(fields) => console.log('Fields:', fields)}
      onCartDetected={(cart) => console.log('Cart:', cart)}
      onFormFillComplete={(result) => console.log('Result:', result)}
    />
  );
}
```

The component accepts all standard `WebView` props plus SnapFill callbacks.

## SPA Navigation

For single-page apps where the URL changes without a full page reload, call `reinject()` after navigation:

```ts
const { reinject } = useSnapfill(webViewRef, callbacks);

// After detecting SPA navigation
reinject();
```

## Non-SnapFill Messages

If the WebView page posts messages that aren't from SnapFill, they're forwarded to the `onOtherMessage` callback:

```ts
useSnapfill(webViewRef, {
  onOtherMessage: (data) => {
    console.log('Other message:', data);
  },
});
```
