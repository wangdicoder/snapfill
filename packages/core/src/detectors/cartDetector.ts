import type { AutofillCartInfo, AutofillCartProduct } from '../types';

/**
 * Parse a price string to cents (integer).
 * Handles: "$29.99", "29.99", "1,234.56", "£29.99", "A$29.99", "29,99" (EU format)
 */
export function priceToCents(priceStr: string | number): number {
  if (typeof priceStr === 'number') {
    return Math.round(priceStr * 100);
  }
  if (!priceStr || typeof priceStr !== 'string') return 0;

  const cleaned = priceStr.replace(/[^0-9.,-]/g, '').trim();
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');

  let amount: number;
  if (lastComma > lastPeriod) {
    // EU format: comma is decimal separator
    amount = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  } else {
    // US/UK format: period is decimal separator
    amount = parseFloat(cleaned.replace(/,/g, ''));
  }

  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

/** Detect currency from a price string or meta tags. */
export function detectCurrency(priceStr: string | null, metaCurrency: string | null): string | null {
  if (metaCurrency) return metaCurrency.toUpperCase();
  if (!priceStr || typeof priceStr !== 'string') return null;

  if (/A\$/.test(priceStr)) return 'AUD';
  if (/NZ\$/.test(priceStr)) return 'NZD';
  if (/US\$/.test(priceStr)) return 'USD';
  if (/CA\$|C\$/.test(priceStr)) return 'CAD';
  if (/£/.test(priceStr)) return 'GBP';
  if (/€/.test(priceStr)) return 'EUR';
  if (/¥/.test(priceStr)) return 'JPY';

  // Domain-based inference
  const hostname = window.location.hostname;
  if (/\.co\.uk$|\.uk$/.test(hostname)) return 'GBP';
  if (/\.com\.au$|\.au$/.test(hostname)) return 'AUD';
  if (/\.co\.nz$|\.nz$/.test(hostname)) return 'NZD';
  if (/\.ca$/.test(hostname)) return 'CAD';

  return null;
}

/** Extract cart data from JSON-LD structured data. */
export function extractFromJsonLd(): AutofillCartInfo | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const products: AutofillCartProduct[] = [];
  let currency: string | null = null;
  let total = 0;

  scripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent ?? '');
      const items: Record<string, unknown>[] = Array.isArray(data)
        ? data
        : (data['@graph'] as Record<string, unknown>[]) ?? [data];

      for (const item of items) {
        const type = item['@type'] as string;

        if (type === 'Product' || type === 'IndividualProduct') {
          let offer = (item.offers ?? item.offer ?? {}) as Record<string, unknown>;
          if (Array.isArray(offer)) offer = (offer[0] ?? {}) as Record<string, unknown>;

          const price = (offer.price ?? item.price ?? 0) as string | number;
          const priceCurrency = (offer.priceCurrency ?? item.priceCurrency ?? null) as
            | string
            | null;
          if (priceCurrency) currency = priceCurrency;

          const image = item.image as string | { url?: string } | string[] | undefined;
          let imageUrl: string | null = null;
          if (typeof image === 'string') imageUrl = image;
          else if (Array.isArray(image)) imageUrl = image[0] ?? null;
          else if (image && typeof image === 'object') imageUrl = image.url ?? null;

          products.push({
            name: (item.name as string) ?? null,
            quantity: 1,
            itemPrice: priceToCents(price),
            lineTotal: priceToCents(price),
            url: (item.url as string) ?? null,
            imageUrl,
          });
        }

        if (type === 'Order' || type === 'Invoice') {
          const totalPaymentDue = item.totalPaymentDue as
            | { value?: string | number; priceCurrency?: string }
            | undefined;
          total = priceToCents(
            (totalPaymentDue?.value ?? (item.total as string | number) ?? 0) as string | number,
          );
          currency =
            totalPaymentDue?.priceCurrency ?? (item.priceCurrency as string) ?? currency;
        }
      }
    } catch {
      // Skip malformed JSON-LD
    }
  });

  if (products.length === 0) return null;

  if (total === 0) {
    total = products.reduce((sum, p) => sum + p.lineTotal, 0);
  }

  return { total, currency, products, source: 'json-ld' };
}

/** Extract cart data from schema.org microdata. */
export function extractFromMicrodata(): AutofillCartInfo | null {
  const productElements = document.querySelectorAll('[itemtype*="schema.org/Product"]');
  if (productElements.length === 0) return null;

  const products: AutofillCartProduct[] = [];
  let currency: string | null = null;

  productElements.forEach((el) => {
    const nameEl = el.querySelector('[itemprop="name"]');
    const priceEl = el.querySelector('[itemprop="price"]');
    const currencyEl = el.querySelector('[itemprop="priceCurrency"]');
    const imageEl = el.querySelector('[itemprop="image"]');
    const urlEl = el.querySelector('[itemprop="url"]');

    const price = priceEl
      ? priceEl.getAttribute('content') ?? priceEl.textContent ?? '0'
      : '0';
    const detectedCurrency = currencyEl
      ? currencyEl.getAttribute('content') ?? currencyEl.textContent
      : null;
    if (detectedCurrency) currency = detectedCurrency;

    products.push({
      name: nameEl ? nameEl.textContent?.trim() ?? null : null,
      quantity: 1,
      itemPrice: priceToCents(price),
      lineTotal: priceToCents(price),
      url: urlEl ? urlEl.getAttribute('href') ?? urlEl.getAttribute('content') : null,
      imageUrl: imageEl
        ? (imageEl as HTMLImageElement).src ?? imageEl.getAttribute('content')
        : null,
    });
  });

  if (products.length === 0) return null;

  const total = products.reduce((sum, p) => sum + p.lineTotal, 0);
  return { total, currency, products, source: 'microdata' };
}

/** Extract cart data from Open Graph meta tags. */
export function extractFromOpenGraph(): AutofillCartInfo | null {
  const ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType || ogType.getAttribute('content') !== 'product') return null;

  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogPrice = document.querySelector('meta[property="product:price:amount"]');
  const ogCurrency = document.querySelector('meta[property="product:price:currency"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');

  if (!ogPrice) return null;

  const price = priceToCents(ogPrice.getAttribute('content') ?? '0');
  const currency = ogCurrency ? ogCurrency.getAttribute('content') : null;

  const product: AutofillCartProduct = {
    name: ogTitle ? ogTitle.getAttribute('content') : null,
    quantity: 1,
    itemPrice: price,
    lineTotal: price,
    url: ogUrl ? ogUrl.getAttribute('content') : null,
    imageUrl: ogImage ? ogImage.getAttribute('content') : null,
  };

  return { total: price, currency, products: [product], source: 'opengraph' };
}

/** Extract cart data using DOM heuristics (cart containers, price patterns). */
export function extractFromDomHeuristics(): AutofillCartInfo | null {
  const cartSelectors = [
    '[class*="cart"]',
    '[class*="basket"]',
    '[class*="order-summary"]',
    '[class*="checkout-summary"]',
    '[class*="order_summary"]',
    '[id*="cart"]',
    '[id*="basket"]',
    '[id*="order-summary"]',
    '[data-testid*="cart"]',
    '[data-testid*="order"]',
  ];

  let cartContainer: Element | null = null;
  for (const selector of cartSelectors) {
    cartContainer = document.querySelector(selector);
    if (cartContainer) break;
  }
  if (!cartContainer) return null;

  const priceRegex = /(?:[$£€])\s*[\d,]+\.?\d{0,2}/g;

  const lineItems = cartContainer.querySelectorAll(
    '[class*="item"], [class*="product"], [class*="line"], li, tr',
  );

  const products: AutofillCartProduct[] = [];
  const seenNames = new Set<string>();

  lineItems.forEach((item) => {
    const nameEl =
      item.querySelector(
        '[class*="name"], [class*="title"], [class*="description"], h2, h3, h4, a',
      ) ?? item.querySelector('td:first-child, span:first-child');
    const name = nameEl?.textContent?.trim() ?? null;

    if (!name || name.length < 2 || name.length > 200 || seenNames.has(name)) return;

    const priceText = item.textContent ?? '';
    const priceMatches = priceText.match(priceRegex);
    if (!priceMatches || priceMatches.length === 0) return;

    const itemPrice = priceToCents(priceMatches[priceMatches.length - 1]);
    if (itemPrice <= 0) return;

    const qtyEl = item.querySelector(
      'input[type="number"], [class*="qty"], [class*="quantity"]',
    );
    const quantity = qtyEl
      ? parseInt((qtyEl as HTMLInputElement).value || qtyEl.textContent || '1', 10) || 1
      : 1;

    const imgEl = item.querySelector('img');
    const imageUrl = imgEl ? imgEl.src : null;

    seenNames.add(name);
    products.push({
      name: name.substring(0, 200),
      quantity,
      itemPrice,
      lineTotal: itemPrice * quantity,
      url: null,
      imageUrl,
    });
  });

  if (products.length === 0) return null;

  const totalEl = cartContainer.querySelector(
    '[class*="total"]:not([class*="sub"]), [class*="grand-total"], [class*="order-total"]',
  );
  let total = 0;
  if (totalEl) {
    const totalPrices = totalEl.textContent?.match(priceRegex);
    if (totalPrices) {
      total = priceToCents(totalPrices[totalPrices.length - 1]);
    }
  }
  if (total === 0) {
    total = products.reduce((sum, p) => sum + p.lineTotal, 0);
  }

  const allText = cartContainer.textContent ?? '';
  const anyPrice = allText.match(priceRegex);
  const currency = anyPrice ? detectCurrency(anyPrice[0], null) : null;

  return { total, currency, products, source: 'dom' };
}

/** Detect cart info using all sources in priority order. */
export function detectCart(): AutofillCartInfo | null {
  return (
    extractFromJsonLd() ?? extractFromMicrodata() ?? extractFromOpenGraph() ?? extractFromDomHeuristics()
  );
}
