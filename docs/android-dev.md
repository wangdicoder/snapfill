# Android Development Guide

## Architecture Overview

```
packages/android/                  Kotlin library (AAR)
    ↓ loads at runtime
packages/android/src/main/assets/  snapfill.js + snapfill-fill.js (generated from @snapfill/core)
```

The Android library loads the same injectable scripts that `@snapfill/react-native` uses. It creates a `window.ReactNativeWebView` shim that routes `postMessage` calls to a native `@JavascriptInterface` bridge, so the scripts work unchanged.

## Setup

### Generate JavaScript Assets

The JS assets must be generated from `@snapfill/core` before building:

```bash
pnpm install
pnpm build                    # Build @snapfill/core
pnpm generate:native          # Generates snapfill.js + snapfill-fill.js into assets/
```

### Gradle Integration

Add the library as a module in your Android project's `settings.gradle.kts`:

```kotlin
include(":snapfill")
project(":snapfill").projectDir = file("path/to/packages/android")
```

Then add the dependency:

```kotlin
dependencies {
    implementation(project(":snapfill"))
}
```

## Usage

### Option A: Helper class (attach to any WebView)

```kotlin
val webView = findViewById<WebView>(R.id.webview)
val snapfill = Snapfill(webView)

snapfill.listener = object : SnapfillListener {
    override fun onFormDetected(fields: List<String>) {
        Log.d("Snapfill", "Detected fields: $fields")
    }

    override fun onCartDetected(cart: SnapfillCart) {
        Log.d("Snapfill", "Cart total: ${cart.total} ${cart.currency}")
    }

    override fun onValuesCaptured(mappings: Map<String, String>) {
        Log.d("Snapfill", "Captured: $mappings")
    }

    override fun onFormFillComplete(result: SnapfillFillResult) {
        Log.d("Snapfill", "Filled ${result.filled}/${result.total}")
    }
}

snapfill.attach()
webView.loadUrl("https://example.com/checkout")

// Fill a form
snapfill.fillForm(mapOf(
    "firstName" to "John",
    "lastName" to "Doe",
    "email" to "john@example.com"
))
```

### Option B: SnapfillWebView subclass

```kotlin
val webView = SnapfillWebView(context)

webView.snapfillListener = object : SnapfillListener {
    override fun onFormDetected(fields: List<String>) { ... }
}

webView.loadUrl("https://example.com/checkout")
webView.fillForm(mapOf("email" to "john@example.com"))
```

## Bridge Mechanism

1. **`@JavascriptInterface`** — `webView.addJavascriptInterface(bridge, "SnapfillBridge")` exposes a native `onMessage(msg)` method to JavaScript
2. **Bridge shim** — injected at page start: `window.ReactNativeWebView={postMessage:function(m){SnapfillBridge.onMessage(m);}};`
3. **Detection scripts** — injected via `WebViewClient.onPageFinished()` using `evaluateJavascript()`
4. **Messages** — parsed from JSON and dispatched to `SnapfillListener` on the main thread

## API Reference

### `Snapfill`

| Method | Description |
|---|---|
| `attach()` | Sets up the JavaScript bridge and WebViewClient |
| `fillForm(mappings)` | Injects a fill script with the given field mappings |
| `reinject()` | Re-injects bridge shim and detection scripts |
| `detach()` | Removes the JavaScript bridge |

### `SnapfillListener`

All methods have default no-op implementations.

| Callback | Trigger |
|---|---|
| `onFormDetected(fields)` | Form fields detected on the page |
| `onCartDetected(cart)` | Shopping cart data extracted |
| `onValuesCaptured(mappings)` | User-entered values captured |
| `onFormFillComplete(result)` | Form fill operation completed |

### `SnapfillOptions`

| Field | Default | Description |
|---|---|---|
| `detectForms` | `true` | Enable form field detection |
| `detectCart` | `true` | Enable cart detection |
| `captureValues` | `true` | Enable value capture |

## Running Tests

```bash
cd packages/android
./gradlew test
```

## Key Design Decisions

**No external dependencies**: The library uses only `android.webkit.WebView` and `org.json` (both part of the Android SDK).

**Main thread dispatch**: All `SnapfillListener` callbacks are dispatched on the main thread via `Handler(Looper.getMainLooper())`.

**Min SDK 24**: Android 7.0+ is required for `WebView.evaluateJavascript()` stability and consistent `@JavascriptInterface` behavior.
