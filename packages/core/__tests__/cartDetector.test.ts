import { describe, it, expect, beforeEach } from 'vitest';
import {
  priceToCents,
  detectCurrency,
  extractFromJsonLd,
  extractFromMicrodata,
  extractFromOpenGraph,
  extractFromDomHeuristics,
  detectCart,
} from '../src/detectors/cartDetector';

describe('cartDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('priceToCents', () => {
    it('converts simple dollar amount', () => {
      expect(priceToCents('29.99')).toBe(2999);
    });

    it('converts with currency symbol', () => {
      expect(priceToCents('$89.99')).toBe(8999);
    });

    it('converts with thousands separator', () => {
      expect(priceToCents('$1,234.56')).toBe(123456);
    });

    it('converts EU format (comma decimal)', () => {
      expect(priceToCents('29,99')).toBe(2999);
    });

    it('converts EU format with dot thousands separator', () => {
      expect(priceToCents('1.234,56')).toBe(123456);
    });

    it('converts number input', () => {
      expect(priceToCents(89.99)).toBe(8999);
    });

    it('handles zero', () => {
      expect(priceToCents('0')).toBe(0);
      expect(priceToCents(0)).toBe(0);
    });

    it('handles empty string', () => {
      expect(priceToCents('')).toBe(0);
    });

    it('handles GBP symbol', () => {
      expect(priceToCents('£29.99')).toBe(2999);
    });

    it('handles EUR symbol', () => {
      expect(priceToCents('€29.99')).toBe(2999);
    });

    it('handles whole numbers', () => {
      expect(priceToCents('100')).toBe(10000);
    });
  });

  describe('detectCurrency', () => {
    it('returns meta currency when provided', () => {
      expect(detectCurrency(null, 'usd')).toBe('USD');
    });

    it('detects AUD', () => {
      expect(detectCurrency('A$89.99', null)).toBe('AUD');
    });

    it('detects GBP', () => {
      expect(detectCurrency('£29.99', null)).toBe('GBP');
    });

    it('detects EUR', () => {
      expect(detectCurrency('€29.99', null)).toBe('EUR');
    });

    it('detects NZD', () => {
      expect(detectCurrency('NZ$29.99', null)).toBe('NZD');
    });

    it('returns null for unknown', () => {
      expect(detectCurrency('29.99', null)).toBeNull();
    });
  });

  describe('extractFromJsonLd', () => {
    it('extracts product from JSON-LD', () => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Widget',
        offers: { '@type': 'Offer', price: '29.99', priceCurrency: 'USD' },
      });
      document.head.appendChild(script);

      const result = extractFromJsonLd();
      expect(result).not.toBeNull();
      expect(result!.products).toHaveLength(1);
      expect(result!.products[0].name).toBe('Widget');
      expect(result!.products[0].itemPrice).toBe(2999);
      expect(result!.currency).toBe('USD');
      expect(result!.source).toBe('json-ld');
    });

    it('sums multiple products', () => {
      for (const p of [
        { name: 'A', price: '10.00' },
        { name: 'B', price: '20.00' },
      ]) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
          '@type': 'Product',
          name: p.name,
          offers: { price: p.price, priceCurrency: 'USD' },
        });
        document.head.appendChild(script);
      }

      const result = extractFromJsonLd();
      expect(result!.products).toHaveLength(2);
      expect(result!.total).toBe(3000);
    });

    it('returns null with no JSON-LD', () => {
      expect(extractFromJsonLd()).toBeNull();
    });

    it('handles @graph arrays', () => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@graph': [
          { '@type': 'Product', name: 'X', offers: { price: '5.00', priceCurrency: 'AUD' } },
        ],
      });
      document.head.appendChild(script);

      const result = extractFromJsonLd();
      expect(result!.products).toHaveLength(1);
      expect(result!.currency).toBe('AUD');
    });
  });

  describe('extractFromMicrodata', () => {
    it('extracts product from microdata', () => {
      document.body.innerHTML = `
        <div itemscope itemtype="https://schema.org/Product">
          <span itemprop="name">Gadget</span>
          <span itemprop="price" content="49.99">$49.99</span>
          <span itemprop="priceCurrency" content="USD">USD</span>
        </div>
      `;

      const result = extractFromMicrodata();
      expect(result).not.toBeNull();
      expect(result!.products[0].name).toBe('Gadget');
      expect(result!.products[0].itemPrice).toBe(4999);
      expect(result!.currency).toBe('USD');
      expect(result!.source).toBe('microdata');
    });

    it('returns null with no microdata', () => {
      expect(extractFromMicrodata()).toBeNull();
    });
  });

  describe('extractFromOpenGraph', () => {
    it('extracts product from OG meta tags', () => {
      document.head.innerHTML = `
        <meta property="og:type" content="product">
        <meta property="og:title" content="Headphones">
        <meta property="product:price:amount" content="89.99">
        <meta property="product:price:currency" content="USD">
        <meta property="og:image" content="https://example.com/img.jpg">
      `;

      const result = extractFromOpenGraph();
      expect(result).not.toBeNull();
      expect(result!.products[0].name).toBe('Headphones');
      expect(result!.products[0].itemPrice).toBe(8999);
      expect(result!.currency).toBe('USD');
      expect(result!.source).toBe('opengraph');
    });

    it('returns null without og:type product', () => {
      document.head.innerHTML = `<meta property="og:type" content="website">`;
      expect(extractFromOpenGraph()).toBeNull();
    });

    it('returns null without price', () => {
      document.head.innerHTML = `<meta property="og:type" content="product">`;
      expect(extractFromOpenGraph()).toBeNull();
    });
  });

  describe('extractFromDomHeuristics', () => {
    it('extracts from cart container', () => {
      document.body.innerHTML = `
        <div class="cart-summary">
          <div class="cart-item">
            <span class="item-name">Widget</span>
            <span class="item-price">$29.99</span>
          </div>
          <div class="total">$29.99</div>
        </div>
      `;

      const result = extractFromDomHeuristics();
      expect(result).not.toBeNull();
      expect(result!.products).toHaveLength(1);
      expect(result!.products[0].name).toBe('Widget');
      expect(result!.source).toBe('dom');
    });

    it('returns null without cart container', () => {
      document.body.innerHTML = `<div><input /></div>`;
      expect(extractFromDomHeuristics()).toBeNull();
    });
  });

  describe('detectCart', () => {
    it('prefers JSON-LD over other sources', () => {
      // Add JSON-LD
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@type': 'Product',
        name: 'LD Widget',
        offers: { price: '10.00', priceCurrency: 'USD' },
      });
      document.head.appendChild(script);

      // Also add OG tags
      document.head.innerHTML += `
        <meta property="og:type" content="product">
        <meta property="og:title" content="OG Widget">
        <meta property="product:price:amount" content="20.00">
      `;

      const result = detectCart();
      expect(result!.source).toBe('json-ld');
      expect(result!.products[0].name).toBe('LD Widget');
    });
  });
});
