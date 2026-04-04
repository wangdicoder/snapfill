# iOS

`@snapfill/ios` is a Swift package for integrating SnapFill with `WKWebView`. Requires iOS 15+.

## Setup

### 1. Generate JavaScript Assets

The JS assets must be generated from `@snapfill/core` before building:

```bash
pnpm install
pnpm build
pnpm generate:native
```

This copies `snapfill.js` and `snapfill-fill.js` into `packages/ios/Sources/Snapfill/Resources/`.

### 2. Add to Your Project

Add the package as a local dependency in Xcode or in `Package.swift`:

```swift
.package(path: "path/to/packages/ios")
```

Then add `Snapfill` to your target's dependencies.

## Usage

### Option A: Helper Class

Attach to any existing `WKWebView`:

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
}
```

### Option B: `SnapfillWebView`

A pre-configured `WKWebView` subclass:

```swift
let webView = SnapfillWebView()
webView.snapfillDelegate = self
webView.load(URLRequest(url: URL(string: "https://example.com/checkout")!))
```

## Filling Forms

```swift
snapfill.fillForm([
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "postalAddressLine1": "123 Main St",
    "postalState": "NY",
    "postalPostCode": "10001"
])
```

## SPA Navigation

For single-page apps, call `reinject()` to re-run detection:

```swift
snapfill.reinject()
```

## Cleanup

```swift
snapfill.detach()
```

## Data Types

```swift
public struct SnapfillCart {
    public let total: Int               // cents
    public let currency: String?
    public let products: [SnapfillCartProduct]
}

public struct SnapfillCartProduct {
    public let name: String?
    public let quantity: Int
    public let itemPrice: Int           // cents
    public let lineTotal: Int           // cents
    public let url: String?
    public let imageUrl: String?
}

public struct SnapfillFillResult {
    public let filled: Int
    public let total: Int
    public let failed: [String]
}
```
