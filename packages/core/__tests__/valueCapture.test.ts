import { describe, it, expect, beforeEach, vi } from 'vitest';
import { attachValueCapture, isSensitiveField } from '../src/detectors/valueCapture';

describe('valueCapture', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  describe('isSensitiveField', () => {
    it('flags password fields', () => {
      const input = document.createElement('input');
      input.type = 'password';
      expect(isSensitiveField(input)).toBe(true);
    });

    it('flags SSN fields by name', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'ssn');
      expect(isSensitiveField(input)).toBe(true);
    });

    it('flags social security fields', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'socialSecurity');
      expect(isSensitiveField(input)).toBe(true);
    });

    it('flags tax ID fields', () => {
      const input = document.createElement('input');
      input.setAttribute('id', 'tax_id');
      expect(isSensitiveField(input)).toBe(true);
    });

    it('does not flag normal fields', () => {
      const input = document.createElement('input');
      input.setAttribute('name', 'firstName');
      expect(isSensitiveField(input)).toBe(false);
    });

    it('does not flag email fields', () => {
      const input = document.createElement('input');
      input.type = 'email';
      expect(isSensitiveField(input)).toBe(false);
    });
  });

  describe('attachValueCapture', () => {
    it('calls callback with field values on input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      const fieldMap = new Map<string, HTMLElement>([['firstName', input]]);
      const callback = vi.fn();

      attachValueCapture(fieldMap, callback, 100);

      (input as HTMLInputElement).value = 'Jane';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledWith({ firstName: 'Jane' });
    });

    it('calls callback on change event', () => {
      const select = document.createElement('select');
      select.innerHTML = '<option value="">Pick</option><option value="NY">NY</option>';
      document.body.appendChild(select);
      const fieldMap = new Map<string, HTMLElement>([['postalState', select]]);
      const callback = vi.fn();

      attachValueCapture(fieldMap, callback, 100);

      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledWith({ postalState: 'NY' });
    });

    it('excludes sensitive fields', () => {
      const password = document.createElement('input');
      password.type = 'password';
      const name = document.createElement('input');
      document.body.appendChild(password);
      document.body.appendChild(name);

      const fieldMap = new Map<string, HTMLElement>([
        ['password', password],
        ['firstName', name],
      ]);
      const callback = vi.fn();

      attachValueCapture(fieldMap, callback, 100);

      (password as HTMLInputElement).value = 'secret';
      password.dispatchEvent(new Event('input'));
      (name as HTMLInputElement).value = 'Jane';
      name.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledWith({ firstName: 'Jane' });
    });

    it('debounces multiple rapid inputs', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      const fieldMap = new Map<string, HTMLElement>([['email', input]]);
      const callback = vi.fn();

      attachValueCapture(fieldMap, callback, 500);

      (input as HTMLInputElement).value = 'j';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      (input as HTMLInputElement).value = 'ja';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      (input as HTMLInputElement).value = 'jane@ex.com';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(600);

      // Should only have been called once (debounced)
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ email: 'jane@ex.com' });
    });

    it('returns cleanup function', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      const fieldMap = new Map<string, HTMLElement>([['firstName', input]]);
      const callback = vi.fn();

      const cleanup = attachValueCapture(fieldMap, callback, 100);
      cleanup();

      (input as HTMLInputElement).value = 'Jane';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      expect(callback).not.toHaveBeenCalled();
    });

    it('captures checkbox state', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);
      const fieldMap = new Map<string, HTMLElement>([['agreeTerms', checkbox]]);
      const callback = vi.fn();

      attachValueCapture(fieldMap, callback, 100);

      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledWith({ agreeTerms: 'true' });
    });
  });
});
