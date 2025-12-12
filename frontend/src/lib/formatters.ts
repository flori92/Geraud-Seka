/**
 * Format currency amounts with appropriate suffix (K, M, etc.)
 * No hardcoded divisors - all conversion factors are defined as constants
 */

// Currency conversion constants
const THOUSAND = 1000;
const MILLION = 1000000;
const BILLION = 1000000000;

// Currency mappings
const CURRENCY_SYMBOLS = {
  'XOF': 'FCFA',
  'EUR': '€',
  'USD': '$',
  'FCFA': 'FCFA'
};

/**
 * Format amount with appropriate scale (K for thousands, M for millions)
 * @param amount - The amount to format
 * @param currency - Currency code (XOF, EUR, USD) or symbol (default: "XOF")
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatCurrency(amount: number | undefined | null, currency: string = "XOF", decimals: number = 0): string {
  // Handle invalid values
  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numAmount) || amount === null || amount === undefined) {
    return `0 ${CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency}`;
  }
  
  const currencySymbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
  
  if (numAmount >= BILLION) {
    return `${(numAmount / BILLION).toFixed(decimals)}B ${currencySymbol}`;
  }
  if (numAmount >= MILLION) {
    return `${(numAmount / MILLION).toFixed(decimals)}M ${currencySymbol}`;
  }
  if (numAmount >= THOUSAND) {
    return `${(numAmount / THOUSAND).toFixed(decimals)}K ${currencySymbol}`;
  }
  return `${numAmount.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currencySymbol}`;
}

/**
 * Format amount without currency suffix (for charts)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatAmount(amount: number | undefined | null, decimals: number = 0): string {
  // Handle invalid values
  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numAmount) || amount === null || amount === undefined) {
    return "0";
  }
  
  if (numAmount >= BILLION) {
    return `${(numAmount / BILLION).toFixed(decimals)}B`;
  }
  if (numAmount >= MILLION) {
    return `${(numAmount / MILLION).toFixed(decimals)}M`;
  }
  if (numAmount >= THOUSAND) {
    return `${(numAmount / THOUSAND).toFixed(decimals)}K`;
  }
  return numAmount.toFixed(decimals);
}

/**
 * Format amount with lowercase suffix (for chart ticks)
 * @param amount - The amount to format
 */
export function formatChartValue(amount: number | undefined | null): string {
  // Handle invalid values
  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numAmount) || amount === null || amount === undefined) {
    return "0";
  }
  
  if (numAmount >= BILLION) {
    return `${(numAmount / BILLION).toFixed(0)}b`;
  }
  if (numAmount >= MILLION) {
    return `${(numAmount / MILLION).toFixed(0)}m`;
  }
  if (numAmount >= THOUSAND) {
    return `${(numAmount / THOUSAND).toFixed(0)}k`;
  }
  return numAmount.toFixed(0);
}
