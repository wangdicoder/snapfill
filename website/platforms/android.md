# Android

`@snap-fill/android` is a Kotlin library for integrating SnapFill with Android `WebView`. Requires Android 7.0+ (API 24).

## Setup

### 1. Generate JavaScript Assets

The JS assets must be generated from `@snap-fill/core` before building:

```bash
pnpm install
pnpm build
pnpm generate:native
```

This copies `snapfill.js` and `snapfill-fill.js` into `packages/android/src/main/assets/`.

### 2. Add to Your Project

Add the library as a local module in `settings.gradle.kts`:

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

### Option A: Helper Class

Attach to any existing `WebView`:

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
```

### Option B: `SnapfillWebView`

A pre-configured `WebView` subclass:

```kotlin
val snapfillWebView = SnapfillWebView(context)
snapfillWebView.snapfillListener = object : SnapfillListener {
    // ... same callbacks
}
snapfillWebView.loadUrl("https://example.com/checkout")
```

## Filling Forms

```kotlin
snapfill.fillForm(mapOf(
    "firstName" to "John",
    "lastName" to "Doe",
    "email" to "john@example.com",
    "postalAddressLine1" to "123 Main St",
    "postalState" to "NY",
    "postalPostCode" to "10001"
))
```

## SPA Navigation

For single-page apps, call `reinject()` to re-run detection:

```kotlin
snapfill.reinject()
```

## Cleanup

```kotlin
snapfill.detach()
```

## Data Classes

```kotlin
data class SnapfillCart(
    val total: Int,                    // cents
    val currency: String?,
    val products: List<SnapfillCartProduct>
)

data class SnapfillCartProduct(
    val name: String?,
    val quantity: Int,
    val itemPrice: Int,                // cents
    val lineTotal: Int,                // cents
    val url: String?,
    val imageUrl: String?
)

data class SnapfillFillResult(
    val filled: Int,
    val total: Int,
    val failed: List<String>
)
```
