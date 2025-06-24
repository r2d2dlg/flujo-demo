/**
 * Formats a number as currency in USD format
 * @param value - The number to format
 * @returns A string representing the formatted currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

/**
 * Formats a number with thousands separators
 * @param value - The number to format
 * @returns A string representing the formatted number
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0);
}; 