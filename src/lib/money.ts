/**
 * lib/money.ts — The ONLY place that formats monetary values for display
 * or parses user input back to santim.
 * All monetary DB columns are integers in santim (1 ETB = 100 santim).
 * No component ever formats money directly.
 */

/** Format santim integer to display string: 14500 → "145 ETB" */
export function formatSantim(santim: number, locale: string = 'en'): string {
  const birr = santim / 100;
  if (locale === 'am') {
    return `${birr.toLocaleString('am-ET')} ብር`;
  }
  return `${birr.toLocaleString('en-ET')} ETB`;
}

/** Format santim as a simple number string without currency: 14500 → "145.00" */
export function formatSantimNumeric(santim: number): string {
  return (santim / 100).toFixed(2);
}

/** Parse a Birr string to santim integer: "145" or "145.50" → 14500 or 14550 */
export function parseBirrToSantim(birr: string): number {
  const value = parseFloat(birr.replace(/[^0-9.]/g, ''));
  if (isNaN(value)) throw new Error(`Invalid Birr value: ${birr}`);
  return Math.round(value * 100);
}

/** Add santim amounts safely */
export function addSantim(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}
