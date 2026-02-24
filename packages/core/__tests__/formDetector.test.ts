import { describe, it, expect, beforeEach } from 'vitest';
import {
  scanForFields,
  classifyByAutocomplete,
  classifyByRegex,
  isBillingContext,
  getAssociatedLabelText,
} from '../src/detectors/formDetector';

describe('formDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('classifyByAutocomplete', () => {
    it('maps standard autocomplete tokens', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'given-name');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBe('firstName');
    });

    it('handles shipping section token', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'shipping address-line1');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBe('postalAddressLine1');
    });

    it('remaps to billing with billing section token', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'billing address-line1');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBe('billingAddressLine1');
    });

    it('returns null for autocomplete="off"', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'off');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBeNull();
    });

    it('skips hidden inputs', () => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.setAttribute('autocomplete', 'given-name');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBeNull();
    });

    it('skips radio/checkbox', () => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('autocomplete', 'given-name');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBeNull();
    });

    it('maps cc-number', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'cc-number');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBe('ccNumber');
    });

    it('maps email', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'email');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBe('email');
    });

    it('maps tel', () => {
      const input = document.createElement('input');
      input.setAttribute('autocomplete', 'tel');
      document.body.appendChild(input);
      expect(classifyByAutocomplete(input)).toBe('phoneNumber');
    });
  });

  describe('classifyByRegex', () => {
    it('detects firstName by name attribute', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'firstName');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('firstName');
    });

    it('detects lastName by id', () => {
      const input = document.createElement('input');
      input.id = 'last_name';
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('lastName');
    });

    it('detects email by placeholder', () => {
      const input = document.createElement('input');
      input.setAttribute('placeholder', 'Enter your email');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('email');
    });

    it('detects phone by aria-label', () => {
      const input = document.createElement('input');
      input.setAttribute('aria-label', 'Phone number');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('phoneNumber');
    });

    it('detects ccNumber by name', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'cardNumber');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('ccNumber');
    });

    it('detects securityCode/cvv', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'securityCode');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('ccCCV');
    });

    it('falls back to type attribute for email', () => {
      const input = document.createElement('input');
      input.type = 'email';
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('email');
    });

    it('falls back to type attribute for tel', () => {
      const input = document.createElement('input');
      input.type = 'tel';
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('phoneNumber');
    });

    it('detects postalPostCode by name', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'postal_code');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('postalPostCode');
    });

    it('detects address line 2', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'address_line_2');
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('postalAddressLine2');
    });
  });

  describe('classifyByRegex - label fallback', () => {
    it('classifies by label text when no other signal', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'field_x');
      label.textContent = 'City';
      const input = document.createElement('input');
      input.id = 'field_x';
      document.body.appendChild(label);
      document.body.appendChild(input);
      expect(classifyByRegex(input)).toBe('postalSuburb');
    });
  });

  describe('isBillingContext', () => {
    it('detects billing from field name', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'billingAddress');
      document.body.appendChild(input);
      expect(isBillingContext(input)).toBe(true);
    });

    it('detects billing from parent class', () => {
      const div = document.createElement('div');
      div.className = 'billing-form';
      const input = document.createElement('input');
      div.appendChild(input);
      document.body.appendChild(div);
      expect(isBillingContext(input)).toBe(true);
    });

    it('detects billing from parent id', () => {
      const div = document.createElement('div');
      div.id = 'billing-section';
      const input = document.createElement('input');
      div.appendChild(input);
      document.body.appendChild(div);
      expect(isBillingContext(input)).toBe(true);
    });

    it('returns false for non-billing context', () => {
      const div = document.createElement('div');
      div.className = 'shipping-form';
      const input = document.createElement('input');
      div.appendChild(input);
      document.body.appendChild(div);
      expect(isBillingContext(input)).toBe(false);
    });
  });

  describe('getAssociatedLabelText', () => {
    it('gets text from label[for]', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'my-input');
      label.textContent = 'First Name';
      const input = document.createElement('input');
      input.id = 'my-input';
      document.body.appendChild(label);
      document.body.appendChild(input);
      expect(getAssociatedLabelText(input)).toBe('First Name');
    });

    it('gets text from parent label', () => {
      const label = document.createElement('label');
      label.textContent = 'Email Address';
      const input = document.createElement('input');
      label.appendChild(input);
      document.body.appendChild(label);
      expect(getAssociatedLabelText(input)).toContain('Email Address');
    });

    it('gets text from aria-labelledby', () => {
      const span = document.createElement('span');
      span.id = 'lbl';
      span.textContent = 'Phone Number';
      const input = document.createElement('input');
      input.setAttribute('aria-labelledby', 'lbl');
      document.body.appendChild(span);
      document.body.appendChild(input);
      expect(getAssociatedLabelText(input)).toBe('Phone Number');
    });
  });

  describe('scanForFields', () => {
    it('detects fields with autocomplete attributes', () => {
      document.body.innerHTML = `
        <input autocomplete="given-name" />
        <input autocomplete="family-name" />
        <input autocomplete="email" />
      `;
      const result = scanForFields(document);
      expect(result.fields).toContain('firstName');
      expect(result.fields).toContain('lastName');
      expect(result.fields).toContain('email');
      expect(result.fieldMap.size).toBe(3);
    });

    it('detects fields with name/id regex patterns', () => {
      document.body.innerHTML = `
        <input name="cardNumber" />
        <input id="expiryMonth" />
        <input name="securityCode" />
      `;
      const result = scanForFields(document);
      expect(result.fields).toContain('ccNumber');
      expect(result.fields).toContain('ccExpiryMonth');
      expect(result.fields).toContain('ccCCV');
    });

    it('prefers autocomplete over regex for the same field type', () => {
      document.body.innerHTML = `
        <input id="phone-select" name="phone_country" />
        <input autocomplete="tel-national" name="phone" />
      `;
      const result = scanForFields(document);
      expect(result.fields).toContain('phoneNumber');
      // The autocomplete match should be in the field map
      const phoneEl = result.fieldMap.get('phoneNumber');
      expect(phoneEl?.getAttribute('autocomplete')).toBe('tel-national');
    });

    it('remaps postal to billing in billing context', () => {
      document.body.innerHTML = `
        <div class="billing-form">
          <label for="field_a">Address</label>
          <input id="field_a" name="address" />
        </div>
      `;
      const result = scanForFields(document);
      expect(result.fields).toContain('billingAddressLine1');
    });

    it('scans within a subtree', () => {
      document.body.innerHTML = `
        <div id="section">
          <input autocomplete="given-name" />
        </div>
        <input autocomplete="email" />
      `;
      const section = document.getElementById('section')!;
      const result = scanForFields(section);
      expect(result.fields).toContain('firstName');
      expect(result.fields).not.toContain('email');
    });
  });
});
