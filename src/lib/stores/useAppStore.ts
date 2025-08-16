import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'

// Currency configuration with icons and symbols
export const CURRENCIES = {
  BDT: { symbol: '৳', icon: '🇧🇩', name: 'Bangladeshi Taka' },
  USD: { symbol: '$', icon: '🇺🇸', name: 'US Dollar' },
  EUR: { symbol: '€', icon: '🇪🇺', name: 'Euro' },
  GBP: { symbol: '£', icon: '🇬🇧', name: 'British Pound' },
  INR: { symbol: '₹', icon: '🇮🇳', name: 'Indian Rupee' },
  JPY: { symbol: '¥', icon: '🇯🇵', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', icon: '🇨🇦', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', icon: '🇦🇺', name: 'Australian Dollar' },
} as const

export type Currency = keyof typeof CURRENCIES

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role_id: string | null
  currency: Currency
  timezone: string | null
  theme: string | null
  date_format: string
  time_format: string
  language: string | null
  email_verified: boolean
  phone_number: string | null
  phone_verified: boolean
  two_factor_enabled: boolean
  last_login: string | null
  login_count: number
  is_active: boolean
  role_name: string | null
  role_display_name: string | null
  created_at: string
  updated_at: string
}

export interface AppState {
  // Authentication
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Settings
  currency: Currency
  theme: 'light' | 'dark' | 'system'
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setCurrency: (currency: Currency) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLoading: (loading: boolean) => void
  
  // Utility functions
  getCurrencySymbol: () => string
  getCurrencyIcon: () => string
  getCurrencyName: () => string
  formatAmount: (amount: number) => string
  
  // Reset function
  reset: () => void
}

const initialState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  currency: 'BDT' as Currency,
  theme: 'system' as const,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setProfile: (profile) => {
        set({ profile })
        // Auto-update currency from profile if available
        if (profile?.currency) {
          set({ currency: profile.currency })
        }
      },
      
      setCurrency: (currency) => set({ currency }),
      
      setTheme: (theme) => set({ theme }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      getCurrencySymbol: () => {
        const { currency } = get()
        return CURRENCIES[currency]?.symbol || '₹'
      },
      
      getCurrencyIcon: () => {
        const { currency } = get()
        return CURRENCIES[currency]?.icon || '🇧🇩'
      },
      
      getCurrencyName: () => {
        const { currency } = get()
        return CURRENCIES[currency]?.name || 'Bangladeshi Taka'
      },
      
      formatAmount: (amount: number) => {
        const { currency } = get()
        const symbol = CURRENCIES[currency]?.symbol || '৳'
        
        // Format with proper locale formatting
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount)
        
        return `${symbol}${formatted}`
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'finmate-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currency: state.currency,
        theme: state.theme,
        // Don't persist user/profile for security
      }),
    }
  )
)