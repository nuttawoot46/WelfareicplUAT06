/**
 * Utility functions for formatting and parsing numbers
 */

/**
 * Format number with commas and 2 decimal places (e.g., 10,000.00)
 * @param value - Number or string to format
 * @returns Formatted string with commas and 2 decimal places
 */
export const formatNumberWithCommas = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Parse formatted number string back to plain number
 * Removes commas and converts to number
 * @param value - Formatted string with commas
 * @returns Plain number
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  const cleanedValue = value.replace(/,/g, '');
  const num = parseFloat(cleanedValue);
  return isNaN(num) ? 0 : num;
};
