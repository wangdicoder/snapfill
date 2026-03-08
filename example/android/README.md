# Snapfill Android Example

Minimal Android app demonstrating the Snapfill library with a WebView checkout form.

## Prerequisites

- Android Studio (Arctic Fox or later)
- Android SDK 35
- JDK 11+

## Setup

```bash
# From the monorepo root:
pnpm install
pnpm build
pnpm generate:native    # Generates JS assets into packages/android/src/main/assets/
```

## Running

1. Open `example/android/` in Android Studio
2. Sync Gradle
3. Run on emulator or device (API 24+)

The app loads a local checkout HTML page into a WebView, detects form fields and cart data, and provides buttons to autofill shipping and payment fields.
