# Injectable Scripts

Pre-built script strings for WebView injection. Import from `@snapfill/core` or `@snapfill/core/injectable`.

## `snapfillScript`

```ts
const snapfillScript: string
```

Combined injectable containing form detection, cart detection, and value capture. Inject this single string into a WebView for full autofill support.

When evaluated, the script:
1. Scans the DOM for form fields and posts a `formDetected` message
2. Scans for shopping cart data and posts a `cartDetected` message
3. Attaches listeners to detected fields and posts `valuesCaptured` on change
4. Watches for DOM mutations and re-scans automatically

```ts
// Inject once after page load
webview.evaluateJavaScript(snapfillScript);
```

The script is idempotent — injecting it multiple times has no effect.

## `buildFillScript(mappings)`

```ts
function buildFillScript(mappings: AutofillMappings): string
```

Builds a fill script string for WebView injection. The returned string fills form fields using the field map created by `snapfillScript`.

**Parameters:**
- `mappings` — Object mapping [field types](/api/types#autofillFieldType) to values

**Returns:** A JavaScript string to evaluate in the WebView

```ts
const script = buildFillScript({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
});

webview.evaluateJavaScript(script);
```

The fill script posts a `formFillComplete` message with the result.

::: warning
`snapfillScript` must be injected first — the fill script depends on the field map it creates.
:::

## `fillScriptTemplate`

```ts
const fillScriptTemplate: string
```

Raw fill script with a `__SNAPFILL_MAPPINGS__` placeholder. Used internally by `buildFillScript` and by native libraries (Android/iOS) that perform their own JSON serialization.

```ts
// Native usage (Kotlin/Swift)
val script = fillScriptTemplate.replace("__SNAPFILL_MAPPINGS__", jsonMappings)
webView.evaluateJavascript(script, null)
```

## Individual Scripts

You can also inject detection scripts individually:

### `formDetectorScript`

```ts
const formDetectorScript: string
```

Only form detection — no cart detection or value capture. Posts `formDetected` messages.

### `cartDetectorScript`

```ts
const cartDetectorScript: string
```

Only cart detection. Posts `cartDetected` messages.

### `valueCaptureScript`

```ts
const valueCaptureScript: string
```

Only value capture. Requires `formDetectorScript` to be injected first. Posts `valuesCaptured` messages.
