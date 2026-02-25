import { describe, it, expect } from 'vitest';
import { parseSnapfillMessage } from '../src/parseMessage';

describe('parseSnapfillMessage', () => {
  it('parses formDetected message', () => {
    const raw = JSON.stringify({ type: 'formDetected', fields: ['firstName', 'lastName', 'email'] });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({
      ok: true,
      message: { type: 'formDetected', fields: ['firstName', 'lastName', 'email'] },
    });
  });

  it('parses cartDetected message', () => {
    const cart = { total: 2999, currency: 'USD', products: [] };
    const raw = JSON.stringify({ type: 'cartDetected', cart });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({
      ok: true,
      message: { type: 'cartDetected', cart },
    });
  });

  it('parses valuesCaptured message', () => {
    const mappings = { firstName: 'Jane', email: 'jane@test.com' };
    const raw = JSON.stringify({ type: 'valuesCaptured', mappings });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({
      ok: true,
      message: { type: 'valuesCaptured', mappings },
    });
  });

  it('parses formFillComplete message', () => {
    const resultData = { filled: 3, total: 4, failed: ['postalState'] };
    const raw = JSON.stringify({ type: 'formFillComplete', result: resultData });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({
      ok: true,
      message: { type: 'formFillComplete', result: resultData },
    });
  });

  it('returns ok: false for unknown message type', () => {
    const raw = JSON.stringify({ type: 'unknownType', data: 123 });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({ ok: false, data: raw });
  });

  it('returns ok: false for invalid JSON', () => {
    const raw = 'not json at all';
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({ ok: false, data: raw });
  });

  it('returns ok: false for JSON without type field', () => {
    const raw = JSON.stringify({ fields: ['email'] });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({ ok: false, data: raw });
  });

  it('returns ok: false for JSON with non-string type', () => {
    const raw = JSON.stringify({ type: 42 });
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({ ok: false, data: raw });
  });

  it('returns ok: false for JSON array', () => {
    const raw = JSON.stringify([1, 2, 3]);
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({ ok: false, data: raw });
  });

  it('returns ok: false for JSON null', () => {
    const raw = 'null';
    const result = parseSnapfillMessage(raw);
    expect(result).toEqual({ ok: false, data: raw });
  });

  it('returns ok: false for empty string', () => {
    const result = parseSnapfillMessage('');
    expect(result).toEqual({ ok: false, data: '' });
  });
});
