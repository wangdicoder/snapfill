import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fillForm, fillElement } from '../src/fillers/formFiller';

describe('formFiller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  describe('fillElement', () => {
    it('fills an input with value', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      fillElement(input, 'Jane');
      expect(input.value).toBe('Jane');
    });

    it('fills a textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      fillElement(textarea, 'Some notes');
      expect(textarea.value).toBe('Some notes');
    });

    it('dispatches focus, input, change events', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      const events: string[] = [];
      for (const evt of ['focus', 'focusin', 'input', 'change']) {
        input.addEventListener(evt, () => events.push(evt));
      }
      fillElement(input, 'test');
      expect(events).toContain('focus');
      expect(events).toContain('focusin');
      expect(events).toContain('input');
      expect(events).toContain('change');
    });

    it('dispatches blur events after timeout', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      const events: string[] = [];
      input.addEventListener('blur', () => events.push('blur'));
      input.addEventListener('focusout', () => events.push('focusout'));
      fillElement(input, 'test');
      expect(events).not.toContain('blur');
      vi.advanceTimersByTime(100);
      expect(events).toContain('blur');
      expect(events).toContain('focusout');
    });

    it('selects option by value in a select element', () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">Select...</option>
        <option value="NY">New York</option>
        <option value="CA">California</option>
      `;
      document.body.appendChild(select);
      fillElement(select, 'CA');
      expect(select.selectedIndex).toBe(2);
    });

    it('selects option by text content', () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">Select...</option>
        <option value="NY">New York</option>
        <option value="CA">California</option>
      `;
      document.body.appendChild(select);
      fillElement(select, 'New York');
      expect(select.selectedIndex).toBe(1);
    });

    it('selects option by partial text match', () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="">Select...</option>
        <option value="US">United States</option>
      `;
      document.body.appendChild(select);
      fillElement(select, 'United');
      expect(select.selectedIndex).toBe(1);
    });

    it('fills checkbox', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);
      fillElement(checkbox, 'true');
      expect(checkbox.checked).toBe(true);
    });

    it('unchecks checkbox with "false"', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      document.body.appendChild(checkbox);
      fillElement(checkbox, 'false');
      expect(checkbox.checked).toBe(false);
    });

    it('does nothing for empty value', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      fillElement(input, '');
      expect(input.value).toBe('');
    });
  });

  describe('fillForm', () => {
    it('fills multiple fields from a field map', () => {
      const firstName = document.createElement('input');
      const lastName = document.createElement('input');
      const email = document.createElement('input');
      document.body.appendChild(firstName);
      document.body.appendChild(lastName);
      document.body.appendChild(email);

      const fieldMap = new Map<string, HTMLElement>([
        ['firstName', firstName],
        ['lastName', lastName],
        ['email', email],
      ]);

      const result = fillForm(fieldMap, {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      });

      expect(result.filled).toBe(3);
      expect(result.failed).toHaveLength(0);
      expect((firstName as HTMLInputElement).value).toBe('Jane');
      expect((lastName as HTMLInputElement).value).toBe('Doe');
      expect((email as HTMLInputElement).value).toBe('jane@example.com');
    });

    it('reports failed fields not in the map', () => {
      const fieldMap = new Map<string, HTMLElement>();
      const result = fillForm(fieldMap, {
        firstName: 'Jane',
        phoneNumber: '555-1234',
      });
      expect(result.filled).toBe(0);
      expect(result.failed).toContain('firstName');
      expect(result.failed).toContain('phoneNumber');
    });

    it('synthesizes fullName from first + last', () => {
      const fullNameInput = document.createElement('input');
      document.body.appendChild(fullNameInput);

      const fieldMap = new Map<string, HTMLElement>([['fullName', fullNameInput]]);

      fillForm(fieldMap, {
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect((fullNameInput as HTMLInputElement).value).toBe('Jane Doe');
    });

    it('synthesizes fullName from first + middle + last', () => {
      const fullNameInput = document.createElement('input');
      document.body.appendChild(fullNameInput);

      const fieldMap = new Map<string, HTMLElement>([['fullName', fullNameInput]]);

      fillForm(fieldMap, {
        firstName: 'Jane',
        middleName: 'Marie',
        lastName: 'Doe',
      });

      expect((fullNameInput as HTMLInputElement).value).toBe('Jane Marie Doe');
    });

    it('does not override explicit fullName', () => {
      const fullNameInput = document.createElement('input');
      document.body.appendChild(fullNameInput);

      const fieldMap = new Map<string, HTMLElement>([['fullName', fullNameInput]]);

      fillForm(fieldMap, {
        fullName: 'Dr. Smith',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect((fullNameInput as HTMLInputElement).value).toBe('Dr. Smith');
    });
  });
});
