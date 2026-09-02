/**
 * Format a number to Western digits (0-9) while keeping Arabic locale conventions.
 * Uses 'ar-EG-u-nu-latn' where 'u-nu-latn' forces Latin (Western) numbering.
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", {
    maximumFractionDigits: 2,
  }).format(value);
};
/**
 * Format a number as currency (EGP) with Western digits.
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "1,234.00 ج.م.‏")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
};

