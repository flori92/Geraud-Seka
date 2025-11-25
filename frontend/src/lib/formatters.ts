/**
 * Format currency amounts with appropriate suffix (K, M, etc.)
 * No hardcoded divisors - all conversion factors are defined as constants
 */

// Currency conversion constants
const THOUSAND = 1000;
const MILLION = 1000000;
const BILLION = 1000000000;

/**
 * Format amount with appropriate scale (K for thousands, M for millions)
 * @param amount - The amount to format
 * @param currency - Currency suffix (default: "FCFA")
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatCurrency(amount: number, currency: string = "FCFA", decimals: number = 0): string {
  if (amount >= BILLION) {
    return `${(amount / BILLION).toFixed(decimals)}B ${currency}`;
  }
  if (amount >= MILLION) {
    return `${(amount / MILLION).toFixed(decimals)}M ${currency}`;
  }
  if (amount >= THOUSAND) {
    return `${(amount / THOUSAND).toFixed(decimals)}K ${currency}`;
  }
  return `${amount.toFixed(decimals)} ${currency}`;
}

/**
 * Format amount without currency suffix (for charts)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatAmount(amount: number, decimals: number = 0): string {
  if (amount >= BILLION) {
    return `${(amount / BILLION).toFixed(decimals)}B`;
  }
  if (amount >= MILLION) {
    return `${(amount / MILLION).toFixed(decimals)}M`;
  }
  if (amount >= THOUSAND) {
    return `${(amount / THOUSAND).toFixed(decimals)}K`;
  }
  return amount.toFixed(decimals);
}

/**
 * Format amount with lowercase suffix (for chart ticks)
 * @param amount - The amount to format
 */
export function formatChartValue(amount: number): string {
  if (amount >= BILLION) {
    return `${(amount / BILLION).toFixed(0)}b`;
  }
  if (amount >= MILLION) {
    return `${(amount / MILLION).toFixed(0)}m`;
  }
  if (amount >= THOUSAND) {
    return `${(amount / THOUSAND).toFixed(0)}k`;
  }
  return amount.toFixed(0);
}
