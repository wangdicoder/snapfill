# How It Works

## Architecture

SnapFill is built as a core JavaScript engine with thin platform adapters:

```
packages/
├── core/src/                  # @snap-fill/core — JS engine
│   ├── detectors/
│   │   ├── formDetector       # Field detection + classification
│   │   ├── cartDetector       # Shopping cart extraction
│   │   └── valueCapture       # Form value monitoring
│   ├── fillers/
│   │   └── formFiller         # Field filling with native setters
│   ├── injectable             # WebView-injectable script strings
│   ├── constants              # Regex patterns, autocomplete maps
│   └── types                  # TypeScript type definitions
│
├── react-native/              # React Native WebView adapter
├── android/                   # Kotlin library for Android WebView
└── ios/                       # Swift package for WKWebView
```

The core engine exports both **functions** for direct web use (tree-shakeable) and **script strings** for WebView injection. Native libraries inject the same scripts via platform-specific WebView APIs.

## Form Detection

Fields are classified using four signal types, applied in priority order:

### 1. Autocomplete Attribute (Highest Confidence)

HTML5 standard `autocomplete` values are mapped directly:

```html
<input autocomplete="given-name" />  <!-- → firstName -->
<input autocomplete="cc-number" />   <!-- → ccNumber -->
<input autocomplete="billing address-line1" /> <!-- → billingAddressLine1 -->
```

### 2. Name / ID / Placeholder Regex

Heuristic pattern matching against element attributes:

```html
<input name="firstName" />     <!-- → firstName -->
<input id="card_number" />     <!-- → ccNumber -->
<input placeholder="Email" />  <!-- → email -->
```

### 3. Type Attribute

Fallback for `type="email"` and `type="tel"`:

```html
<input type="email" />  <!-- → email -->
<input type="tel" />    <!-- → phoneNumber -->
```

### 4. Label Text

Associated `<label>` content is matched as a last resort:

```html
<label for="f1">City</label>
<input id="f1" />  <!-- → postalSuburb -->
```

### Two-Pass Scan

Detection runs in two passes:

1. **Pass 1** — Scan all elements for `autocomplete` matches (high confidence)
2. **Pass 2** — Scan remaining elements using regex, type, and label signals

This ensures autocomplete-tagged elements always win when both signals are present.

### Billing Context

Address fields are automatically remapped to billing equivalents (`postalState` → `billingState`) when the element is inside a billing container — detected by walking up to 5 parent elements checking class names, IDs, and `<legend>` text.

## Cart Detection

Shopping cart data is extracted using four strategies in priority order:

| Priority | Source | Selector |
|----------|--------|----------|
| 1 | **JSON-LD** | `<script type="application/ld+json">` |
| 2 | **Microdata** | `[itemtype*="schema.org/Product"]` |
| 3 | **Open Graph** | `<meta property="og:type" content="product">` |
| 4 | **DOM Heuristics** | Cart container patterns + price regex |

The first source that returns results is used. Each returns structured product data with names, prices (in cents), quantities, and totals.

### Currency Detection

Currency is inferred from:
1. Structured data (JSON-LD, microdata, OG tags)
2. Currency symbols in price strings (`$`, `£`, `€`, `¥`)
3. Domain TLD (`.co.uk` → GBP, `.com.au` → AUD)

## Form Filling

### Native Property Setters

Modern frameworks (React, Vue, Angular) override the standard `input.value` setter. Setting `value` directly doesn't trigger framework state updates. SnapFill uses native property descriptors to bypass this:

```ts
const nativeSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype, 'value'
)?.set;

nativeSetter.call(element, value);
```

### Event Dispatch

Events are dispatched in the correct order to mimic real user interaction:

```
focus → focusin → [value set] → input → change → blur → focusout
```

All events bubble and are cancelable, matching browser behavior.

### Select Matching

`<select>` elements are filled using a three-tier strategy:
1. Exact value match (`option.value`)
2. Exact text match (`option.textContent`)
3. Partial text match (contains)

## Live Detection

The injected scripts use a `MutationObserver` to detect DOM changes and re-scan for fields automatically. This handles:

- SPAs that render forms dynamically
- Multi-step checkout flows
- Lazy-loaded form sections

Scans are debounced (300–500ms) and deduplicated — messages are only posted when the detected field set actually changes.
