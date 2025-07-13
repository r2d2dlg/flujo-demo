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
export const formatNumber = (value: number, decimalPlaces: number = 2): string => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};

/**
 * Formats a number with two decimal places.
 * @param value The number to format.
 * @returns A string representing the formatted number.
 */
export const formatNumberWithTwoDecimals = (value: number): string => {
  return formatNumber(value, 2);
}; 