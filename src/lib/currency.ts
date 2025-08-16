import { CURRENCY_SYMBOLS } from '@/types';
import { useAuth } from '@/hooks/useAuth';

// Get user's preferred currency from their profile or default to BDT
export function useUserCurrency() {
  const { profile } = useAuth();
  return profile?.currency || 'BDT';
}

// Get currency symbol for any currency code
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
}

// Format currency with proper symbol based on user's preference
export function formatCurrencyWithSymbol(
  amount: number,
  currency?: string,
  compact: boolean = false
): string {
  const currencyCode = currency || 'BDT';
  const symbol = getCurrencySymbol(currencyCode);
  
  // Handle BDT currency specially
  if (currencyCode === 'BDT') {
    const formatter = new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
      notation: compact ? 'compact' : 'standard'
    });
    return `${symbol}${formatter.format(amount)}`;
  }

  // Handle other currencies
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? 'compact' : 'standard'
  });
  
  return `${symbol}${formatter.format(amount)}`;
}

// Get currency display info
export function getCurrencyInfo(currency: string) {
  const symbol = getCurrencySymbol(currency);
  
  const currencyNames: Record<string, string> = {
    USD: "US Dollar",
    BDT: "Bangladeshi Taka",
    INR: "Indian Rupee",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
  };

  return {
    code: currency,
    symbol,
    name: currencyNames[currency] || currency
  };
}