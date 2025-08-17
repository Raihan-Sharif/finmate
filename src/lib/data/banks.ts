// Bank data organized by country/currency
export const BANKS_BY_CURRENCY = {
  BDT: [
    // Government/Nationalized Banks
    { value: 'sonali_bank', label: 'Sonali Bank Limited', category: 'Government' },
    { value: 'janata_bank', label: 'Janata Bank Limited', category: 'Government' },
    { value: 'agrani_bank', label: 'Agrani Bank Limited', category: 'Government' },
    { value: 'rupali_bank', label: 'Rupali Bank Limited', category: 'Government' },
    { value: 'bkb', label: 'Bangladesh Krishi Bank', category: 'Specialized' },
    { value: 'rakub', label: 'Rajshahi Krishi Unnayan Bank', category: 'Specialized' },
    { value: 'bdbl', label: 'Bangladesh Development Bank Limited', category: 'Development' },
    
    // Private Commercial Banks  
    { value: 'ab_bank', label: 'AB Bank Limited', category: 'Private' },
    { value: 'bank_asia', label: 'Bank Asia Limited', category: 'Private' },
    { value: 'brac_bank', label: 'BRAC Bank Limited', category: 'Private' },
    { value: 'city_bank', label: 'City Bank Limited', category: 'Private' },
    { value: 'dhaka_bank', label: 'Dhaka Bank Limited', category: 'Private' },
    { value: 'dutch_bangla', label: 'Dutch-Bangla Bank Limited', category: 'Private' },
    { value: 'eastern_bank', label: 'Eastern Bank Limited', category: 'Private' },
    { value: 'ific_bank', label: 'IFIC Bank Limited', category: 'Private' },
    { value: 'islami_bank', label: 'Islami Bank Bangladesh Limited', category: 'Islamic' },
    { value: 'jamuna_bank', label: 'Jamuna Bank Limited', category: 'Private' },
    { value: 'meghna_bank', label: 'Meghna Bank Limited', category: 'Private' },
    { value: 'mercantile_bank', label: 'Mercantile Bank Limited', category: 'Private' },
    { value: 'mutual_trust_bank', label: 'Mutual Trust Bank Limited', category: 'Private' },
    { value: 'ncc_bank', label: 'NCC Bank Limited', category: 'Private' },
    { value: 'one_bank', label: 'One Bank Limited', category: 'Private' },
    { value: 'premier_bank', label: 'Premier Bank Limited', category: 'Private' },
    { value: 'prime_bank', label: 'Prime Bank Limited', category: 'Private' },
    { value: 'pubali_bank', label: 'Pubali Bank Limited', category: 'Private' },
    { value: 'southeast_bank', label: 'Southeast Bank Limited', category: 'Private' },
    { value: 'standard_bank', label: 'Standard Bank Limited', category: 'Private' },
    { value: 'trust_bank', label: 'Trust Bank Limited', category: 'Private' },
    { value: 'uttara_bank', label: 'Uttara Bank Limited', category: 'Private' },
    
    // Islamic Banks
    { value: 'al_arafah_islami', label: 'Al-Arafah Islami Bank Limited', category: 'Islamic' },
    { value: 'exim_bank', label: 'Export Import Bank of Bangladesh Limited', category: 'Islamic' },
    { value: 'first_security', label: 'First Security Islami Bank Limited', category: 'Islamic' },
    { value: 'global_islami', label: 'Global Islami Bank Limited', category: 'Islamic' },
    { value: 'shahjalal_islami', label: 'Shahjalal Islami Bank Limited', category: 'Islamic' },
    { value: 'social_islami', label: 'Social Islami Bank Limited', category: 'Islamic' },
    { value: 'union_bank', label: 'Union Bank Limited', category: 'Islamic' },
    
    // Foreign Banks
    { value: 'standard_chartered', label: 'Standard Chartered Bank', category: 'Foreign' },
    { value: 'hsbc', label: 'HSBC Limited', category: 'Foreign' },
    { value: 'citibank', label: 'Citibank N.A.', category: 'Foreign' },
    { value: 'commercial_bank_ceylon', label: 'Commercial Bank of Ceylon Limited', category: 'Foreign' },
    { value: 'habib_bank', label: 'Habib Bank Limited', category: 'Foreign' },
    { value: 'national_bank_pakistan', label: 'National Bank of Pakistan', category: 'Foreign' },
    { value: 'state_bank_india', label: 'State Bank of India', category: 'Foreign' },
    
    // Specialized Banks
    { value: 'investment_corp', label: 'Investment Corporation of Bangladesh', category: 'Specialized' },
    { value: 'house_building', label: 'House Building Finance Corporation', category: 'Specialized' },
    { value: 'pksf', label: 'Palli Karma-Sahayak Foundation', category: 'Specialized' },
  ],
  
  USD: [
    { value: 'chase', label: 'JPMorgan Chase Bank', category: 'US Bank' },
    { value: 'bank_of_america', label: 'Bank of America', category: 'US Bank' },
    { value: 'wells_fargo', label: 'Wells Fargo', category: 'US Bank' },
    { value: 'citibank', label: 'Citibank', category: 'US Bank' },
    { value: 'goldman_sachs', label: 'Goldman Sachs Bank', category: 'US Bank' },
    { value: 'morgan_stanley', label: 'Morgan Stanley Bank', category: 'US Bank' },
    { value: 'pnc', label: 'PNC Bank', category: 'US Bank' },
    { value: 'td_bank', label: 'TD Bank', category: 'US Bank' },
    { value: 'us_bank', label: 'U.S. Bank', category: 'US Bank' },
    { value: 'truist', label: 'Truist Bank', category: 'US Bank' },
  ],
  
  EUR: [
    { value: 'deutsche_bank', label: 'Deutsche Bank', category: 'German Bank' },
    { value: 'bnp_paribas', label: 'BNP Paribas', category: 'French Bank' },
    { value: 'ing', label: 'ING Bank', category: 'Dutch Bank' },
    { value: 'santander', label: 'Banco Santander', category: 'Spanish Bank' },
    { value: 'societe_generale', label: 'Société Générale', category: 'French Bank' },
    { value: 'credit_agricole', label: 'Crédit Agricole', category: 'French Bank' },
    { value: 'unicredit', label: 'UniCredit', category: 'Italian Bank' },
    { value: 'rabobank', label: 'Rabobank', category: 'Dutch Bank' },
  ],
  
  GBP: [
    { value: 'barclays', label: 'Barclays', category: 'UK Bank' },
    { value: 'hsbc_uk', label: 'HSBC UK', category: 'UK Bank' },
    { value: 'lloyds', label: 'Lloyds Bank', category: 'UK Bank' },
    { value: 'natwest', label: 'NatWest', category: 'UK Bank' },
    { value: 'santander_uk', label: 'Santander UK', category: 'UK Bank' },
    { value: 'nationwide', label: 'Nationwide Building Society', category: 'UK Bank' },
    { value: 'tesco_bank', label: 'Tesco Bank', category: 'UK Bank' },
    { value: 'metro_bank', label: 'Metro Bank', category: 'UK Bank' },
  ],
  
  INR: [
    { value: 'sbi', label: 'State Bank of India', category: 'Public Bank' },
    { value: 'hdfc', label: 'HDFC Bank', category: 'Private Bank' },
    { value: 'icici', label: 'ICICI Bank', category: 'Private Bank' },
    { value: 'axis', label: 'Axis Bank', category: 'Private Bank' },
    { value: 'kotak_mahindra', label: 'Kotak Mahindra Bank', category: 'Private Bank' },
    { value: 'pnb', label: 'Punjab National Bank', category: 'Public Bank' },
    { value: 'canara_bank', label: 'Canara Bank', category: 'Public Bank' },
    { value: 'bank_of_baroda', label: 'Bank of Baroda', category: 'Public Bank' },
    { value: 'union_bank_india', label: 'Union Bank of India', category: 'Public Bank' },
    { value: 'indian_bank', label: 'Indian Bank', category: 'Public Bank' },
  ],
  
  JPY: [
    { value: 'mizuho', label: 'Mizuho Bank', category: 'Japanese Bank' },
    { value: 'sumitomo_mitsui', label: 'Sumitomo Mitsui Banking Corporation', category: 'Japanese Bank' },
    { value: 'mitsubishi_ufj', label: 'MUFG Bank', category: 'Japanese Bank' },
    { value: 'resona', label: 'Resona Bank', category: 'Japanese Bank' },
    { value: 'nomura', label: 'Nomura Bank', category: 'Japanese Bank' },
  ],
  
  CAD: [
    { value: 'rbc', label: 'Royal Bank of Canada', category: 'Canadian Bank' },
    { value: 'td_canada', label: 'TD Canada Trust', category: 'Canadian Bank' },
    { value: 'scotiabank', label: 'Scotiabank', category: 'Canadian Bank' },
    { value: 'bmo', label: 'Bank of Montreal', category: 'Canadian Bank' },
    { value: 'cibc', label: 'Canadian Imperial Bank of Commerce', category: 'Canadian Bank' },
    { value: 'national_bank', label: 'National Bank of Canada', category: 'Canadian Bank' },
  ],
  
  AUD: [
    { value: 'commonwealth', label: 'Commonwealth Bank', category: 'Australian Bank' },
    { value: 'westpac', label: 'Westpac', category: 'Australian Bank' },
    { value: 'anz', label: 'ANZ Bank', category: 'Australian Bank' },
    { value: 'nab', label: 'National Australia Bank', category: 'Australian Bank' },
    { value: 'macquarie', label: 'Macquarie Bank', category: 'Australian Bank' },
  ],
}

export const BANK_CATEGORIES = {
  BDT: [
    { value: 'Government', label: 'Government Banks', color: 'blue' },
    { value: 'Private', label: 'Private Commercial Banks', color: 'green' },
    { value: 'Islamic', label: 'Islamic Banks', color: 'purple' },
    { value: 'Foreign', label: 'Foreign Banks', color: 'orange' },
    { value: 'Specialized', label: 'Specialized Banks', color: 'teal' },
    { value: 'Development', label: 'Development Banks', color: 'indigo' },
  ],
  USD: [{ value: 'US Bank', label: 'US Banks', color: 'blue' }],
  EUR: [
    { value: 'German Bank', label: 'German Banks', color: 'gray' },
    { value: 'French Bank', label: 'French Banks', color: 'blue' },
    { value: 'Dutch Bank', label: 'Dutch Banks', color: 'orange' },
    { value: 'Spanish Bank', label: 'Spanish Banks', color: 'red' },
    { value: 'Italian Bank', label: 'Italian Banks', color: 'green' },
  ],
  GBP: [{ value: 'UK Bank', label: 'UK Banks', color: 'blue' }],
  INR: [
    { value: 'Public Bank', label: 'Public Sector Banks', color: 'blue' },
    { value: 'Private Bank', label: 'Private Banks', color: 'green' },
  ],
  JPY: [{ value: 'Japanese Bank', label: 'Japanese Banks', color: 'red' }],
  CAD: [{ value: 'Canadian Bank', label: 'Canadian Banks', color: 'red' }],
  AUD: [{ value: 'Australian Bank', label: 'Australian Banks', color: 'green' }],
}

export function getBanksByCategory(currency: string, category?: string) {
  const banks = BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY] || []
  if (!category) return banks
  return banks.filter(bank => bank.category === category)
}

export function getBankCategories(currency: string) {
  return BANK_CATEGORIES[currency as keyof typeof BANK_CATEGORIES] || []
}