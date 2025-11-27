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
 * Format number for input field - returns empty string for 0 or empty values
 * Preserves decimal point during typing
 * @param value - Number or string to format
 * @returns Formatted string with commas, or empty string if 0/null/undefined
 */
export const formatNumberForInput = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '' || value === 0) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '';
  // Format with commas but without forcing decimals during typing
  return num.toLocaleString('en-US');
};

/**
 * Format input string while typing - preserves decimal point and trailing zeros
 * Only adds commas, doesn't change decimals
 * @param inputValue - Raw input string from user
 * @returns Formatted string with commas, preserving decimal input
 */
export const formatInputWhileTyping = (inputValue: string): string => {
  if (!inputValue || inputValue === '') return '';

  // Remove all non-numeric characters except decimal point
  let cleaned = inputValue.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Split into integer and decimal parts
  const [intPart, decPart] = cleaned.split('.');

  // Format integer part with commas
  const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';

  // If there's a decimal point in input, preserve it
  if (cleaned.includes('.')) {
    return formattedInt + '.' + (decPart || '');
  }

  return formattedInt || '';
};

/**
 * Format number with commas and ensure 2 decimal places on blur
 * @param value - Number or string to format
 * @returns Formatted string with commas and 2 decimal places, or empty string if 0
 */
export const formatNumberOnBlur = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '' || value === 0) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '';
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
