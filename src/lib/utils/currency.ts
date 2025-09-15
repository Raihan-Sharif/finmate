export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  BDT: '৳',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$'
}

export const CURRENCY_NAMES: { [key: string]: string } = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  INR: 'Indian Rupee',
  BDT: 'Bangladeshi Taka',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar'
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] || currencyCode || '৳'
}

export function formatCurrency(amount: number | string, currencyCode: string = 'BDT'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = getCurrencySymbol(currencyCode)

  // Format with comma separators for readability
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numAmount || 0)

  return `${symbol}${formattedAmount}`
}

export function formatCurrencyCompact(amount: number | string, currencyCode: string = 'BDT'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = getCurrencySymbol(currencyCode)

  // For large amounts, use compact notation
  if (numAmount >= 1000000) {
    return `${symbol}${(numAmount / 1000000).toFixed(1)}M`
  } else if (numAmount >= 1000) {
    return `${symbol}${(numAmount / 1000).toFixed(1)}K`
  }

  return `${symbol}${numAmount.toFixed(0)}`
}