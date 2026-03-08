/**
 * Inline HTML for the mock merchant checkout page.
 * Loaded in the WebView via `source={{ html }}`.
 * Snapfill scripts are injected by the adapter — this is just a vanilla page.
 */
export const CHECKOUT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Demo Checkout</title>

  <!-- JSON-LD for cart detection -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Premium Wireless Headphones",
    "image": "https://placehold.co/48x48/e3e3e3/999?text=H",
    "offers": { "@type": "Offer", "price": "89.99", "priceCurrency": "USD" }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "USB-C Charging Cable",
    "image": "https://placehold.co/48x48/e3e3e3/999?text=C",
    "offers": { "@type": "Offer", "price": "12.50", "priceCurrency": "USD" }
  }
  </script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #fff; color: #333; padding: 16px; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    .subtitle { color: #888; font-size: 12px; margin-bottom: 20px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; font-weight: 600; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; color: #555; }
    .form-row { display: flex; gap: 10px; margin-bottom: 10px; }
    .form-group { flex: 1; display: flex; flex-direction: column; }
    .form-group label { font-size: 11px; font-weight: 500; color: #666; margin-bottom: 3px; }
    .form-group input, .form-group select {
      padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;
      -webkit-appearance: none; background: #fff;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.15); }
    .cart { background: #f9f9f9; border-radius: 10px; padding: 12px; margin-bottom: 8px; }
    .cart-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #eee; }
    .cart-item:last-of-type { border-bottom: none; }
    .cart-item .name { flex: 1; font-size: 13px; font-weight: 500; }
    .cart-item .price { font-size: 14px; font-weight: 600; }
    .cart-total { display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd; font-weight: 700; font-size: 15px; margin-top: 6px; }
  </style>
</head>
<body>
  <h1>Demo Merchant</h1>
  <p class="subtitle">Mock checkout &mdash; form fields detected &amp; filled by Snapfill</p>

  <div class="section">
    <h2>Order Summary</h2>
    <div class="cart" id="cart-container">
      <div class="cart-item"><span class="name">Premium Wireless Headphones</span><span class="price">$89.99</span></div>
      <div class="cart-item"><span class="name">USB-C Charging Cable</span><span class="price">$12.50</span></div>
      <div class="cart-total"><span>Total</span><span>$102.49</span></div>
    </div>
  </div>

  <div class="section">
    <h2>Contact</h2>
    <div class="form-row"><div class="form-group"><label>Email</label><input type="email" autocomplete="email" placeholder="john@example.com"></div></div>
    <div class="form-row"><div class="form-group"><label>Phone</label><input type="tel" autocomplete="tel" placeholder="+1 (555) 123-4567"></div></div>
  </div>

  <div class="section">
    <h2>Shipping Address</h2>
    <div class="form-row">
      <div class="form-group"><label>First Name</label><input type="text" autocomplete="shipping given-name" placeholder="John"></div>
      <div class="form-group"><label>Last Name</label><input type="text" autocomplete="shipping family-name" placeholder="Smith"></div>
    </div>
    <div class="form-row"><div class="form-group"><label>Address</label><input type="text" autocomplete="shipping address-line1" placeholder="123 Main Street"></div></div>
    <div class="form-row"><div class="form-group"><label>Apt / Suite</label><input type="text" autocomplete="shipping address-line2" placeholder="Apt 4B"></div></div>
    <div class="form-row">
      <div class="form-group"><label>City</label><input type="text" autocomplete="shipping address-level2" placeholder="New York"></div>
      <div class="form-group" style="max-width:100px"><label>State</label>
        <select autocomplete="shipping address-level1"><option value="">--</option><option value="NY">NY</option><option value="CA">CA</option><option value="TX">TX</option></select>
      </div>
      <div class="form-group" style="max-width:100px"><label>ZIP</label><input type="text" autocomplete="shipping postal-code" placeholder="10001"></div>
    </div>
    <div class="form-row"><div class="form-group"><label>Country</label>
      <select autocomplete="shipping country"><option value="">Select...</option><option value="US">United States</option><option value="AU">Australia</option><option value="GB">United Kingdom</option></select>
    </div></div>
  </div>

  <div class="section">
    <h2>Payment</h2>
    <div class="form-row"><div class="form-group"><label>Card Number</label><input type="text" name="cardNumber" placeholder="4111 1111 1111 1111" maxlength="19"></div></div>
    <div class="form-row"><div class="form-group"><label>Name on Card</label><input type="text" name="nameOnCard" placeholder="JOHN SMITH"></div></div>
    <div class="form-row">
      <div class="form-group"><label>Exp Month</label>
        <select name="expiryMonth"><option value="">MM</option><option value="01">01</option><option value="06">06</option><option value="12">12</option></select>
      </div>
      <div class="form-group"><label>Exp Year</label>
        <select name="expiryYear"><option value="">YYYY</option><option value="2026">2026</option><option value="2028">2028</option><option value="2030">2030</option></select>
      </div>
      <div class="form-group"><label>CVV</label><input type="text" name="securityCode" placeholder="123" maxlength="4"></div>
    </div>
  </div>
</body>
</html>`;
