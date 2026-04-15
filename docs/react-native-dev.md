# React Native Development Guide

## Architecture Overview

```
example/react-native/          Expo example app (consumer)
    ↓ imports
packages/react-native/      @snap-fill/react-native (hook + component)
    ↓ imports
packages/core/               @snap-fill/core (detection scripts + fill logic)
```

Metro (the React Native bundler) resolves these differently than Node/tsup:

| Package | Node / tsup | Metro (RN) |
|---|---|---|
| `@snap-fill/react-native` | `dist/index.js` via `main` field | `src/index.ts` via `react-native` field |
| `@snap-fill/core` | `dist/index.js` via `main` field | `dist/index.js` (same) |
| `@snap-fill/core/injectable` | `dist/injectable.js` via `exports` map | `injectable.js` shim → `dist/injectable.js` |

Metro bundles `@snap-fill/react-native` from **source** so changes are instant. But `@snap-fill/core` is consumed from **dist/** because its main entry (`index.ts`) re-exports DOM-dependent code (`formFiller.ts`, `cartDetector.ts`) that references `HTMLInputElement` — which doesn't exist in the React Native runtime. The `injectable` sub-path entry is safe (only strings), and that's the only runtime import used by the RN adapter.

## Running the Example

```bash
# 1. Install dependencies
pnpm install

# 2. Build packages (required for @snap-fill/core dist/)
pnpm build

# 3. Start the example
cd example/react-native
npx expo start --clear
```

Press `i` for iOS simulator or `a` for Android emulator.

## Development Workflow

### Changing `@snap-fill/react-native` (hook, component, types)

Edit files in `packages/react-native/src/`. Metro bundles from source directly — changes appear instantly via hot reload. No build step needed during development.

### Changing `@snap-fill/core` (detection scripts, fill logic)

Core changes require a rebuild because Metro reads from `dist/`. Run the build in watch mode in a separate terminal:

```bash
# Terminal 1: watch core for changes
cd packages/core && pnpm build --watch

# Terminal 2: run the example
cd example/react-native && npx expo start --clear
```

tsup rebuilds `dist/` on every source change. Metro sees the file change (via `watchFolders`) and hot-reloads.

### Running Everything

```bash
pnpm build          # Build all packages
pnpm test           # Run all tests (core: 88, react-native: 28)
pnpm lint           # Lint all packages (via turbo)
```

## Why the `injectable.js` Shim Exists

Metro doesn't support the `exports` field in `package.json`. When `@snap-fill/react-native` imports `@snap-fill/core/injectable`, Metro looks for a file at `packages/core/injectable` — the shim at `packages/core/injectable.js` redirects to `dist/injectable.js`.

```
@snap-fill/react-native
    → import { buildFillScript } from '@snap-fill/core/injectable'
    → Metro resolves: packages/core/injectable.js (shim)
    → require('./dist/injectable.js')
```

Bundlers that support `exports` (webpack, esbuild, Vite) use the `package.json` exports map directly and never see the shim.

## Why `@snap-fill/core/injectable` Instead of `@snap-fill/core`

The main `@snap-fill/core` entry re-exports everything — including `fillForm()`, `scanForFields()`, and other functions that reference DOM globals (`HTMLInputElement`, `HTMLSelectElement`, `document`). These crash in React Native since there's no DOM.

The `@snap-fill/core/injectable` entry only exports:
- `formDetectorScript` — IIFE string for WebView injection
- `cartDetectorScript` — IIFE string for WebView injection
- `valueCaptureScript` — IIFE string for WebView injection
- `buildFillScript(mappings)` — returns an IIFE string (uses `JSON.stringify`, no DOM)
- `snapfillScript` — combined string of all three scripts

These are all plain strings or functions that return strings — safe in any JS runtime.

## pnpm + Metro Configuration

React Native's Metro bundler requires all transitive dependencies to be resolvable via flat `node_modules` lookup. pnpm's default strict isolation breaks this. The root `.npmrc` has `shamefully-hoist=true` to hoist all packages.

The example's `metro.config.js` configures:
- `projectRoot` — set to the example directory (not the monorepo root)
- `watchFolders` — includes `packages/` and root `node_modules/`
- `nodeModulesPaths` — resolves from both the example's and root's `node_modules/`

## Key Design Decisions

**Peer deps for RN packages**: `react`, `react-native`, and `react-native-webview` are peer dependencies of `@snap-fill/react-native`, not regular or dev dependencies. This prevents pnpm from installing duplicate copies that break native module registration.

**`WebViewLike` interface**: The `useSnapfill` hook accepts any ref with `{ injectJavaScript }` instead of the concrete `WebView` class. This avoids version coupling between the adapter and `react-native-webview`.

**Callback ref pattern**: Callbacks are stored in a `useRef` so the `onMessage` handler is stable and never causes WebView re-renders.

**`true;` suffix**: Android's `react-native-webview` requires injected JavaScript to end with `true;` or it silently fails.
