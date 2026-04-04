# Cart Detection

Functions for extracting shopping cart data from web pages. Import from `@snapfill/core`.

## `detectCart()`

```ts
function detectCart(): AutofillCartInfo | null
```

Detects cart data using all sources in priority order. Returns the first successful result or `null`.

Priority: JSON-LD → Microdata → Open Graph → DOM Heuristics

```ts
import { detectCart } from '@snapfill/core';

const cart = detectCart();
if (cart) {
  console.log(`${cart.products.length} items, total: ${cart.total} cents`);
  console.log('Currency:', cart.currency);
  console.log('Source:', cart.source);
}
```

## Individual Extractors

### `extractFromJsonLd()`

```ts
function extractFromJsonLd(): AutofillCartInfo | null
```

Extracts products from `<script type="application/ld+json">` blocks. Handles `Product`, `IndividualProduct`, `Order`, and `Invoice` types. Supports `@graph` arrays.

### `extractFromMicrodata()`

```ts
function extractFromMicrodata(): AutofillCartInfo | null
```

Extracts products from `schema.org/Product` microdata (`itemscope`/`itemprop` attributes).

### `extractFromOpenGraph()`

```ts
function extractFromOpenGraph(): AutofillCartInfo | null
```

Extracts product data from Open Graph meta tags (`og:type="product"`).

### `extractFromDomHeuristics()`

```ts
function extractFromDomHeuristics(): AutofillCartInfo | null
```

Extracts cart data by finding cart containers (by class/ID patterns like `cart`, `basket`, `order-summary`) and parsing line items with price regex.

## Utilities

### `priceToCents(priceStr)`

```ts
function priceToCents(priceStr: string | number): number
```

Parses a price string to an integer in cents. Handles multiple formats:

```ts
priceToCents('$29.99');     // → 2999
priceToCents('1,234.56');   // → 123456
priceToCents('29,99');      // → 2999  (EU format)
priceToCents('1.234,56');   // → 123456 (EU format)
priceToCents(89.99);        // → 8999
```

### `detectCurrency(priceStr, metaCurrency)`

```ts
function detectCurrency(
  priceStr: string | null,
  metaCurrency: string | null
): string | null
```

Detects ISO 4217 currency code from a price string or metadata. Falls back to domain-based inference (`.co.uk` → `GBP`, `.com.au` → `AUD`).
