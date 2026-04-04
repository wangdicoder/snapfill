<script setup lang="ts">
import { ref, onMounted } from 'vue';

const eventLog = ref<Array<{ type: string; time: string; data: string }>>([]);
const detectedFields = ref<string[]>([]);
const mounted = ref(false);

let fillFormFn: ((mappings: Record<string, string>) => void) | null = null;

function fieldClass(f: string) {
  if (f.startsWith('cc')) return 'cc';
  if (['email', 'phoneNumber', 'phoneCountryCode'].includes(f)) return 'contact';
  if (f.includes('postal') || f.includes('billing')) return 'address';
  return 'personal';
}

function logEvent(data: Record<string, unknown>) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  eventLog.value.unshift({
    type: data.type as string,
    time,
    data: JSON.stringify(data, null, 2),
  });
  if (data.type === 'formDetected') {
    detectedFields.value = data.fields as string[];
  }
}

function fillCard() {
  fillFormFn?.({
    ccNumber: '4111111111111111',
    ccName: 'JOHN SMITH',
    ccExpiryMonth: '06',
    ccExpiryYear: '2028',
    ccCCV: '737',
  });
}

function fillAddress() {
  fillFormFn?.({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    phoneNumber: '+1 555-867-5309',
    postalAddressLine1: '350 Fifth Avenue',
    postalSuburb: 'New York',
    postalState: 'NY',
    postalPostCode: '10118',
    postalCountry: 'US',
  });
}

function detectCartNow() {
  const detectCart = (window as any).__snapfillDetectCart;
  if (detectCart) {
    const c = detectCart();
    if (c) logEvent({ type: 'cartDetected', cart: c });
  }
}

function captureNow() {
  const captureFn = (window as any).__snapfillCaptureNow;
  if (captureFn) captureFn();
}

function clearFields() {
  const root = document.getElementById('snapfill-demo-root');
  if (!root) return;
  root
    .querySelectorAll<HTMLInputElement>('input[type="text"],input[type="email"],input[type="tel"]')
    .forEach((e) => (e.value = ''));
  root.querySelectorAll<HTMLSelectElement>('select').forEach((e) => (e.selectedIndex = 0));
}

function clearLog() {
  eventLog.value = [];
}

onMounted(async () => {
  // Set up the RN bridge shim so injectable scripts can post messages
  (window as any).ReactNativeWebView = {
    postMessage(msgStr: string) {
      try {
        logEvent(JSON.parse(msgStr));
      } catch {
        /* ignore */
      }
    },
  };

  const {
    formDetectorScript,
    cartDetectorScript,
    valueCaptureScript,
    buildFillScript,
  } = await import('@snapfill/core');

  // Execute detection scripts in global scope
  (0, eval)(formDetectorScript);
  (0, eval)(cartDetectorScript);
  (0, eval)(valueCaptureScript);

  fillFormFn = (mappings) => {
    (0, eval)(buildFillScript(mappings));
  };

  mounted.value = true;
});
</script>

<template>
  <div id="snapfill-demo-root" class="demo-layout">
    <!-- JSON-LD for cart detection -->
    <component is="script" type="application/ld+json">
      {{ JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Premium Wireless Headphones",
        "image": "https://placehold.co/100x100/e3e3e3/999?text=H",
        "offers": { "@type": "Offer", "price": "89.99", "priceCurrency": "USD" }
      }) }}
    </component>
    <component is="script" type="application/ld+json">
      {{ JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "USB-C Charging Cable",
        "image": "https://placehold.co/100x100/e3e3e3/999?text=C",
        "offers": { "@type": "Offer", "price": "12.50", "priceCurrency": "USD" }
      }) }}
    </component>

    <div class="merchant-page">
      <h2 class="merchant-title">Demo Merchant - Checkout</h2>
      <p class="merchant-subtitle">Mock checkout page for testing SnapFill detection + filling.</p>

      <!-- Order Summary -->
      <div class="section">
        <h3 class="section-title">Order Summary</h3>
        <div class="cart-container">
          <div class="cart-item">
            <img src="https://placehold.co/48x48/e3e3e3/999?text=H" alt="Headphones" />
            <div class="details"><div class="item-name">Premium Wireless Headphones</div></div>
            <div class="item-price">$89.99</div>
          </div>
          <div class="cart-item">
            <img src="https://placehold.co/48x48/e3e3e3/999?text=C" alt="Cable" />
            <div class="details"><div class="item-name">USB-C Charging Cable</div></div>
            <div class="item-price">$12.50</div>
          </div>
          <div class="cart-total"><span>Total</span><span>$102.49</span></div>
        </div>
      </div>

      <!-- Shipping Address -->
      <div class="section">
        <h3 class="section-title">Shipping Address</h3>
        <div class="form-row">
          <div class="form-group"><label for="sf-ship-first">First Name</label><input type="text" id="sf-ship-first" autocomplete="shipping given-name" placeholder="John" /></div>
          <div class="form-group"><label for="sf-ship-last">Last Name</label><input type="text" id="sf-ship-last" autocomplete="shipping family-name" placeholder="Smith" /></div>
        </div>
        <div class="form-row single"><div class="form-group"><label for="sf-ship-email">Email</label><input type="email" id="sf-ship-email" autocomplete="email" placeholder="john@example.com" /></div></div>
        <div class="form-row single"><div class="form-group"><label for="sf-ship-phone">Phone</label><input type="tel" id="sf-ship-phone" autocomplete="tel" placeholder="+1 (555) 123-4567" /></div></div>
        <div class="form-row single"><div class="form-group"><label for="sf-ship-addr1">Address Line 1</label><input type="text" id="sf-ship-addr1" autocomplete="shipping address-line1" placeholder="123 Main Street" /></div></div>
        <div class="form-row single"><div class="form-group"><label for="sf-ship-addr2">Address Line 2</label><input type="text" id="sf-ship-addr2" autocomplete="shipping address-line2" placeholder="Apt 4B" /></div></div>
        <div class="form-row triple">
          <div class="form-group"><label for="sf-ship-city">City</label><input type="text" id="sf-ship-city" autocomplete="shipping address-level2" placeholder="New York" /></div>
          <div class="form-group">
            <label for="sf-ship-state">State</label>
            <select id="sf-ship-state" autocomplete="shipping address-level1"><option value="">Select...</option><option value="NY">New York</option><option value="CA">California</option><option value="TX">Texas</option></select>
          </div>
          <div class="form-group"><label for="sf-ship-zip">ZIP Code</label><input type="text" id="sf-ship-zip" autocomplete="shipping postal-code" placeholder="10001" /></div>
        </div>
        <div class="form-row single">
          <div class="form-group">
            <label for="sf-ship-country">Country</label>
            <select id="sf-ship-country" autocomplete="shipping country"><option value="">Select...</option><option value="US">United States</option><option value="AU">Australia</option><option value="GB">United Kingdom</option></select>
          </div>
        </div>
      </div>

      <!-- Payment Details -->
      <div class="section">
        <h3 class="section-title">Payment Details</h3>
        <div class="form-row single"><div class="form-group"><label for="sf-cardNumber">Card Number</label><input type="text" id="sf-cardNumber" name="cardNumber" placeholder="4111 1111 1111 1111" maxlength="19" /></div></div>
        <div class="form-row single"><div class="form-group"><label for="sf-nameOnCard">Name on Card</label><input type="text" id="sf-nameOnCard" name="nameOnCard" placeholder="JOHN SMITH" /></div></div>
        <div class="form-row triple">
          <div class="form-group">
            <label for="sf-expiryMonth">Exp Month</label>
            <select id="sf-expiryMonth" name="expiryMonth"><option value="">MM</option><option value="01">01</option><option value="06">06</option><option value="12">12</option></select>
          </div>
          <div class="form-group">
            <label for="sf-expiryYear">Exp Year</label>
            <select id="sf-expiryYear" name="expiryYear"><option value="">YYYY</option><option value="2026">2026</option><option value="2028">2028</option><option value="2030">2030</option></select>
          </div>
          <div class="form-group"><label for="sf-securityCode">Security Code</label><input type="text" id="sf-securityCode" name="securityCode" placeholder="123" maxlength="4" /></div>
        </div>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug-panel">
      <h3 class="debug-title">SnapFill Debug Panel</h3>
      <span v-if="mounted" class="status-badge active">Engine Active</span>
      <span v-else class="status-badge loading">Loading...</span>

      <div class="debug-section">
        <h4 class="debug-subtitle">Actions</h4>
        <div class="btn-group">
          <button class="dbtn primary" @click="fillAddress">Fill Address</button>
          <button class="dbtn success" @click="fillCard">Fill Card</button>
          <button class="dbtn warning" @click="detectCartNow">Detect Cart</button>
          <button class="dbtn" @click="captureNow">Capture Values</button>
          <button class="dbtn danger" @click="clearFields">Clear</button>
          <button class="dbtn" @click="clearLog">Clear Log</button>
        </div>
      </div>

      <div class="debug-section">
        <h4 class="debug-subtitle">Detected Fields</h4>
        <div class="field-tags">
          <span v-if="!detectedFields.length" class="waiting">Waiting...</span>
          <span v-for="f in detectedFields" :key="f" class="field-tag" :class="fieldClass(f)">{{ f }}</span>
        </div>
      </div>

      <div class="debug-section">
        <h4 class="debug-subtitle">Event Log</h4>
        <div class="event-log">
          <div v-for="(evt, i) in eventLog" :key="i" class="event" :class="evt.type">
            <span class="timestamp">{{ evt.time }}</span>
            <div class="event-type">{{ evt.type }}</div>
            <pre>{{ evt.data }}</pre>
          </div>
          <div v-if="!eventLog.length" class="waiting">No events yet.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  min-height: calc(100vh - var(--vp-nav-height));
  margin: calc(-1 * var(--vp-layout-top-height, 0px)) calc(-1 * (50vw - 50%));
  width: 100vw;
}

@media (max-width: 960px) {
  .demo-layout {
    grid-template-columns: 1fr;
  }
}

/* Merchant page */
.merchant-page {
  padding: 24px 32px;
  background: #fff;
  overflow-y: auto;
}

.merchant-title {
  font-size: 20px;
  margin-bottom: 4px;
  border: none;
  padding: 0;
}

.merchant-subtitle {
  color: #888;
  font-size: 13px;
  margin-bottom: 24px;
}

.section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
  color: #555;
  letter-spacing: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-row.single {
  grid-template-columns: 1fr;
}

.form-row.triple {
  grid-template-columns: 1fr 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: #fff;
  color: #333;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
}

/* Cart */
.cart-container {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: #eee;
}

.cart-item .details {
  flex: 1;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 2px solid #ddd;
  font-weight: 700;
  font-size: 16px;
}

/* Debug panel */
.debug-panel {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 16px;
  overflow-y: auto;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  border-left: 1px solid #313244;
}

.debug-title {
  color: #89b4fa;
  font-size: 14px;
  margin-bottom: 12px;
  border: none;
  padding: 0;
  letter-spacing: 0;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-subtitle {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c7086;
  margin-bottom: 8px;
  border: none;
  padding: 0;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.dbtn {
  padding: 6px 12px;
  border: 1px solid #45475a;
  border-radius: 6px;
  background: #313244;
  color: #cdd6f4;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.dbtn:hover {
  background: #45475a;
}

.dbtn.primary {
  background: #89b4fa;
  color: #1e1e2e;
  border-color: #89b4fa;
  font-weight: 600;
}

.dbtn.success {
  background: #a6e3a1;
  color: #1e1e2e;
  border-color: #a6e3a1;
  font-weight: 600;
}

.dbtn.warning {
  background: #fab387;
  color: #1e1e2e;
  border-color: #fab387;
  font-weight: 600;
}

.dbtn.danger {
  background: #f38ba8;
  color: #1e1e2e;
  border-color: #f38ba8;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-badge.active {
  background: #a6e3a1;
  color: #1e1e2e;
}

.status-badge.loading {
  background: #585b70;
  color: #cdd6f4;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.field-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.field-tag.cc {
  background: #f38ba8;
  color: #1e1e2e;
}

.field-tag.personal {
  background: #89b4fa;
  color: #1e1e2e;
}

.field-tag.contact {
  background: #a6e3a1;
  color: #1e1e2e;
}

.field-tag.address {
  background: #f9e2af;
  color: #1e1e2e;
}

.event-log {
  overflow-y: auto;
}

.event {
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: #313244;
  border-left: 3px solid #585b70;
  word-break: break-all;
}

.event .event-type {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.event.formDetected {
  border-left-color: #89b4fa;
}
.event.formDetected .event-type {
  color: #89b4fa;
}

.event.cartDetected {
  border-left-color: #a6e3a1;
}
.event.cartDetected .event-type {
  color: #a6e3a1;
}

.event.valuesCaptured {
  border-left-color: #f9e2af;
}
.event.valuesCaptured .event-type {
  color: #f9e2af;
}

.event.formFillComplete {
  border-left-color: #cba6f7;
}
.event.formFillComplete .event-type {
  color: #cba6f7;
}

.event pre {
  font-size: 11px;
  line-height: 1.5;
  color: #a6adc8;
  white-space: pre-wrap;
  margin: 0;
  background: none;
}

.event .timestamp {
  font-size: 10px;
  color: #585b70;
  float: right;
}

.waiting {
  color: #585b70;
  font-style: italic;
}
</style>
