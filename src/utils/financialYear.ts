/**
 * Financial Year Utilities (Indian FY: April 1 – March 31)
 *
 * Example:
 *   getFinancialYear(new Date('2026-04-10')) → "2025-26"
 *   getFinancialYear(new Date('2026-03-31')) → "2025-26"
 *   getFinancialYear(new Date('2027-04-01')) → "2026-27"
 */

/**
 * Returns the financial year label for a given date.
 * @param date - defaults to current date
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan … 11 = Dec
  const year = date.getFullYear();
  // Indian FY starts in April (month index 3)
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
}

/**
 * Builds the full bill prefix embedding the financial year.
 * If the base prefix is "GRM" and date is in FY 2025-26, returns "GRM-2025-26".
 *
 * @param basePrefix - e.g. "GRM" or "PUL"
 * @param date       - the bill/sale date, defaults to today
 */
export function buildFYPrefix(basePrefix: string, date: Date = new Date()): string {
  return `${basePrefix}-${getFinancialYear(date)}`;
}

/**
 * Extracts the trailing serial number from a bill serial string.
 * Works for both old format (e.g. "GRM050") and new FY format (e.g. "GRM-2025-26-050").
 * Returns 0 if the number cannot be parsed.
 */
export function extractSerialNumber(serial: string): number {
  const parts = serial.split('-');
  const last = parts[parts.length - 1];
  const num = parseInt(last, 10);
  return isNaN(num) ? 0 : num;
}
