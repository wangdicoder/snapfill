# iOS Development Guide

## Architecture Overview

```
packages/ios/                              Swift Package
    ↓ loads at runtime
packages/ios/Sources/Snapfill/Resources/   snapfill.js + snapfill-fill.js (generated from @snapfill/core)
```

The iOS library loads the same injectable scripts that `@snapfill/react-native` uses. It creates a `window.ReactNativeWebView` shim that routes `postMessage` calls to a `WKScriptMessageHandler`, so the scripts work unchanged.

## Setup

### Generate JavaScript Assets

The JS assets must be generated from `@snapfill/core` before building:

```bash
pnpm install
pnpm build                    # Build @snapfill/core
pnpm generate:native          # Generates snapfill.js + snapfill-fill.js into Resources/
```

### Swift Package Manager

Add the package as a local dependency in Xcode or in your `Package.swift`:

```swift
.package(path: "path/to/packages/ios")
```

Then add `Snapfill` to your target's dependencies.

## Usage

### Option A: Helper class (attach to any WKWebView)

```swift
import Snapfill
import WebKit

class CheckoutViewController: UIViewController, SnapfillDelegate {
    let webView = WKWebView()
    var snapfill: Snapfill!

    override func viewDidLoad() {
        super.viewDidLoad()

        snapfill = Snapfill(webView: webView)
        snapfill.delegate = self
        snapfill.attach()

        webView.load(URLRequest(url: URL(string: "https://example.com/checkout")!))
    }

    // MARK: - SnapfillDelegate

    func snapfillDidDetectFields(_ snapfill: Snapfill, fields: [String]) {
        print("Detected fields: \(fields)")
    }

    func snapfillDidDetectCart(_ snapfill: Snapfill, cart: SnapfillCart) {
        print("Cart total: \(cart.total) \(cart.currency ?? "")")
    }

    func snapfillDidCaptureValues(_ snapfill: Snapfill, mappings: [String: String]) {
        print("Captured: \(mappings)")
    }

    func snapfillDidCompleteFill(_ snapfill: Snapfill, result: SnapfillFillResult) {
        print("Filled \(result.filled)/\(result.total)")
    }

    func fillCheckout() {
        snapfill.fillForm([
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
        ])
    }
}
```

### Option B: SnapfillWebView subclass

```swift
import Snapfill

class CheckoutViewController: UIViewController, SnapfillDelegate {
    let webView = SnapfillWebView()

    override func viewDidLoad() {
        super.viewDidLoad()
        webView.snapfillDelegate = self
        webView.load(URLRequest(url: URL(string: "https://example.com/checkout")!))
    }

    func snapfillDidDetectFields(_ snapfill: Snapfill, fields: [String]) { ... }

    func fillCheckout() {
        webView.fillForm(["email": "john@example.com"])
    }
}
```

## Bridge Mechanism

1. **`WKScriptMessageHandler`** — `userContentController.add(self, name: "snapfill")` registers a message handler
2. **Bridge shim** — injected as `WKUserScript` at `.atDocumentStart`: `window.ReactNativeWebView={postMessage:function(m){webkit.messageHandlers.snapfill.postMessage(m);}};`
3. **Detection scripts** — injected as `WKUserScript` at `.atDocumentEnd`
4. **Messages** — parsed from JSON and dispatched to `SnapfillDelegate` on the main thread
5. **Fill** — `webView.evaluateJavaScript()` injects the fill script with mappings

## API Reference

### `Snapfill`

| Method | Description |
|---|---|
| `attach()` | Adds user scripts and message handler to the WKWebView |
| `fillForm(_:)` | Injects a fill script with the given field mappings |
| `reinject()` | Re-injects bridge shim and detection scripts |
| `detach()` | Removes all user scripts and the message handler |

### `SnapfillDelegate`

All methods are optional via default extensions.

| Callback | Trigger |
|---|---|
| `snapfillDidDetectFields(_:fields:)` | Form fields detected on the page |
| `snapfillDidDetectCart(_:cart:)` | Shopping cart data extracted |
| `snapfillDidCaptureValues(_:mappings:)` | User-entered values captured |
| `snapfillDidCompleteFill(_:result:)` | Form fill operation completed |

### `SnapfillOptions`

| Field | Default | Description |
|---|---|---|
| `detectForms` | `true` | Enable form field detection |
| `detectCart` | `true` | Enable cart detection |
| `captureValues` | `true` | Enable value capture |

## Running Tests

```bash
cd packages/ios
swift build
swift test
```

## Key Design Decisions

**No external dependencies**: The library uses only the `WebKit` framework (part of iOS SDK).

**Main thread dispatch**: All `SnapfillDelegate` callbacks are dispatched on the main thread via `DispatchQueue.main.async`.

**`Bundle.module` for resources**: Swift Package Manager's resource processing creates a `Bundle.module` accessor for the generated JS files.

**Min iOS 15**: Required for stable `WKUserScript` injection timing and `async/await` availability in the platform.

**Sendable conformance**: All model structs conform to `Sendable` for safe use with Swift concurrency.
