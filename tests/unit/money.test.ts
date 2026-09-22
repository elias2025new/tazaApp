/**
 * tests/unit/money.test.ts
 * Unit tests for the money formatting utilities.
 * These must always pass — money is critical to correctness.
 */
import { describe, it, expect } from 'vitest';
import { formatSantim, formatSantimNumeric, parseBirrToSantim, addSantim } from '@/lib/money';

describe('formatSantim', () => {
  it('formats whole birr amounts', () => {
    expect(formatSantim(10000)).toBe('100 ETB');
    expect(formatSantim(500)).toBe('5 ETB');
  });

  it('formats amounts with santim fractions', () => {
    expect(formatSantim(14550)).toBe('145.5 ETB');
  });

  it('formats Amharic locale', () => {
    const result = formatSantim(5000, 'am');
    expect(result).toContain('ብር');
  });

  it('handles zero', () => {
    expect(formatSantim(0)).toBe('0 ETB');
  });
});

describe('formatSantimNumeric', () => {
  it('returns 2 decimal places', () => {
    expect(formatSantimNumeric(14500)).toBe('145.00');
    expect(formatSantimNumeric(14550)).toBe('145.50');
    expect(formatSantimNumeric(1)).toBe('0.01');
  });
});

describe('parseBirrToSantim', () => {
  it('parses whole number', () => {
    expect(parseBirrToSantim('145')).toBe(14500);
  });

  it('parses decimal', () => {
    expect(parseBirrToSantim('145.50')).toBe(14550);
  });

  it('strips non-numeric characters', () => {
    expect(parseBirrToSantim('145 ETB')).toBe(14500);
  });

  it('throws on invalid input', () => {
    expect(() => parseBirrToSantim('abc')).toThrow();
  });

  it('handles rounding correctly (no float drift)', () => {
    // Classic float issue: 0.1 + 0.2 !== 0.3
    expect(parseBirrToSantim('0.1')).toBe(10);
    expect(parseBirrToSantim('0.3')).toBe(30);
  });
});

describe('addSantim', () => {
  it('adds multiple amounts', () => {
    expect(addSantim(10000, 5000, 250)).toBe(15250);
  });

  it('returns 0 for no arguments', () => {
    expect(addSantim()).toBe(0);
  });
});
