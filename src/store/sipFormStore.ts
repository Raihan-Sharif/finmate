import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SIPFormData {
  // Basic Info
  name: string;
  description: string;
  portfolio_id: string;
  investment_type: string;
  
  // Schedule
  amount_per_investment: number;
  currency: string;
  platform: string;
  account_number: string;
  frequency: string;
  interval_value: number;
  start_date: string;
  end_date: string;
  
  // Advanced
  target_amount?: number;
  auto_execute: boolean;
  market_order: boolean;
  limit_price?: number;
  is_active: boolean;
  notes: string;
}

export interface SIPFormStore {
  // Form data
  formData: SIPFormData;
  currentStep: 'basic' | 'schedule' | 'settings' | 'advanced';
  
  // Actions
  updateFormData: (data: Partial<SIPFormData>) => void;
  setCurrentStep: (step: 'basic' | 'schedule' | 'settings' | 'advanced') => void;
  resetForm: () => void;
  loadExistingData: (data: SIPFormData) => void;
}

const defaultFormData: SIPFormData = {
  name: '',
  description: '',
  portfolio_id: '',
  investment_type: '',
  amount_per_investment: 0,
  currency: 'BDT',
  platform: '',
  account_number: '',
  frequency: 'monthly',
  interval_value: 1,
  start_date: '',
  end_date: '',
  target_amount: undefined,
  auto_execute: true,
  market_order: true,
  limit_price: undefined,
  is_active: true,
  notes: '',
};

export const useSIPFormStore = create<SIPFormStore>()(
  persist(
    (set, get) => ({
      formData: defaultFormData,
      currentStep: 'basic',
      
      updateFormData: (data: Partial<SIPFormData>) => {
        set((state) => ({
          formData: { ...state.formData, ...data }
        }));
      },
      
      setCurrentStep: (step: 'basic' | 'schedule' | 'settings' | 'advanced') => {
        set({ currentStep: step });
      },
      
      resetForm: () => {
        set({
          formData: defaultFormData,
          currentStep: 'basic'
        });
      },
      
      loadExistingData: (data: SIPFormData) => {
        set({
          formData: data,
          currentStep: 'basic'
        });
      }
    }),
    {
      name: 'sip-form-storage',
      // Only persist form data, not current step
      partialize: (state) => ({ formData: state.formData })
    }
  )
);