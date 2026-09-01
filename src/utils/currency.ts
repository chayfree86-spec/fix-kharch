/**
 * Formats a number into Indian Rupee format.
 * e.g., 3200 -> ₹3,200
 *       120000 -> ₹1,20,000
 *       -23034 -> -₹23,034
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(absVal);

  if (isNegative) {
    return `-₹${formattedNumber}`;
  }
  return `₹${formattedNumber}`;
}

/**
 * Parses a string input into a valid positive number
 */
export function parseAmount(value: string | number): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.max(0, value);
  }
  // Remove non-numeric characters except decimal
  const clean = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}
