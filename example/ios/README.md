# Snapfill iOS Example

Minimal iOS app demonstrating the Snapfill library with a WKWebView checkout form.

## Prerequisites

- Xcode 15+
- iOS 15+ simulator or device

## Setup

```bash
# From the monorepo root:
pnpm install
pnpm build
pnpm generate:native    # Generates JS assets into packages/ios/Sources/Snapfill/Resources/
```

## Running

1. Open `example/ios/SnapfillExample.xcodeproj` in Xcode (or open the folder and use the Swift Package)
2. Select a simulator (iPhone 15 or later recommended)
3. Build and run

Alternatively, from the command line:

```bash
cd example/ios
swift build    # Verify it compiles
```

The app loads a local checkout HTML page into a WKWebView, detects form fields and cart data, and provides buttons to autofill shipping and payment fields.
