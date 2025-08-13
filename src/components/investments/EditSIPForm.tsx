'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
  Edit3,
  Calendar,
  DollarSign,
  Target,
  CheckCircle,
  Sparkles,
  Clock,
  Repeat,
  Settings,
  ToggleLeft,
  ToggleRight,
  Building2,
  Hash
} from 'lucide-react';
import { INVESTMENT_TYPES, INVESTMENT_FREQUENCIES, InvestmentTemplate, UpdateInvestmentTemplateInput, InvestmentType, InvestmentFrequency } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn, getInvestmentIcon } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useSIPFormStore } from '@/store/sipFormStore';

const editSipSchema = z.object({
  name: z.string().min(1, 'SIP name is required'),
  description: z.string().optional(),
  portfolio_id: z.string().min(1, 'Portfolio is required'),
  amount_per_investment: z.number().min(1, 'Investment amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  platform: z.string().optional(),
  account_number: z.string().optional(),
  frequency: z.string().refine(
    (value) => ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(value),
    { message: "Frequency is required" }
  ),
  interval_value: z.number().min(1).default(1),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  target_amount: z.number().optional(),
  auto_execute: z.boolean().default(true),
  market_order: z.boolean().default(true),
  limit_price: z.number().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

type EditSIPFormData = z.infer<typeof editSipSchema>;

interface EditSIPFormProps {
  template: InvestmentTemplate;
  portfolios: { id: string; name: string; currency: string }[];
  onSubmit: (data: UpdateInvestmentTemplateInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function EditSIPForm({
  template,
  portfolios,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: EditSIPFormProps) {
  const { theme } = useTheme();
  const { 
    formData, 
    currentStep, 
    updateFormData, 
    setCurrentStep, 
    loadExistingData,
    resetForm 
  } = useSIPFormStore();
  
  const [step, setStep] = useState<'basic' | 'schedule' | 'advanced'>(currentStep as any || 'basic');

  const form = useForm<EditSIPFormData>({
    resolver: zodResolver(editSipSchema),
    defaultValues: {
      name: template.name || '',
      description: template.description || '',
      portfolio_id: template.portfolio_id || '',
      amount_per_investment: template.amount_per_investment || template.amount || 0,
      currency: template.currency || 'BDT',
      platform: template.platform || '',
      account_number: template.account_number || '',
      frequency: template.frequency || 'monthly',
      interval_value: template.interval_value || 1,
      start_date: template.start_date || '',
      end_date: template.end_date || '',
      target_amount: template.target_amount || undefined,
      auto_execute: template.auto_execute !== false,
      market_order: template.market_order !== false,
      limit_price: template.limit_price || undefined,
      is_active: template.is_active !== false,
      notes: template.notes || ''
    }
  });

  // Load persisted form data when component mounts
  useEffect(() => {
    if (formData && Object.keys(formData).some(key => formData[key as keyof typeof formData])) {
      // If we have persisted data, load it into the form
      const { investment_type, ...editFormData } = formData;
      form.reset(editFormData as any);
    }
  }, [formData, form]);

  // Update step handler with persistence
  const handleStepChange = (newStep: 'basic' | 'schedule' | 'advanced') => {
    // Save current form data before changing step
    const currentFormData = form.getValues();
    // Add investment_type for store compatibility
    const storeData = {
      ...currentFormData,
      investment_type: template?.investment_type || 'sip'
    };
    updateFormData(storeData as any);
    
    setStep(newStep);
    setCurrentStep(newStep);
  };
  
  // Update form when template changes
  useEffect(() => {
    if (template) {
      const templateData = {
        name: template.name || '',
        description: template.description || '',
        portfolio_id: template.portfolio_id || '',
        investment_type: template.investment_type || 'sip', // This is needed for the store
        amount_per_investment: template.amount_per_investment || 0,
        currency: template.currency || 'BDT',
        platform: template.platform || '',
        account_number: template.account_number || '',
        frequency: template.frequency || 'monthly',
        interval_value: template.interval_value || 1,
        start_date: template.start_date || '',
        end_date: template.end_date || '',
        target_amount: template.target_amount || undefined,
        auto_execute: template.auto_execute !== false,
        market_order: template.market_order !== false,
        limit_price: template.limit_price || undefined,
        is_active: template.is_active !== false,
        notes: template.notes || ''
      };
      
      // Load data into Zustand store (needs investment_type field)
      loadExistingData(templateData as any);
      
      // Reset form with template data (without investment_type as it's not editable)
      const { investment_type, ...formData } = templateData;
      form.reset(formData);
    }
  }, [template, form, loadExistingData]);
  
  // Clean up and cancel handler
  const handleCancel = () => {
    resetForm();
    if (onCancel) onCancel();
  };

  const selectedPortfolio = portfolios.find(p => p.id === form.watch('portfolio_id'));
  const selectedType = template?.investment_type ? INVESTMENT_TYPES[template.investment_type as InvestmentType] : null;
  const selectedFrequency = INVESTMENT_FREQUENCIES[form.watch('frequency') as InvestmentFrequency];
  const isActive = form.watch('is_active');

  // Auto-fill currency from selected portfolio
  useEffect(() => {
    if (selectedPortfolio && (!form.getValues('currency') || form.getValues('currency') === 'BDT')) {
      form.setValue('currency', selectedPortfolio.currency);
    }
  }, [selectedPortfolio, form]);

  const handleSubmit = async (data: EditSIPFormData) => {
    console.log('🔥 SIP EDIT: Form submission data:', data);
    
    const requestData: any = {
      name: data.name,
      amount_per_investment: Number(data.amount_per_investment),
      currency: data.currency,
      frequency: data.frequency as any,
      interval_value: Number(data.interval_value),
      start_date: data.start_date,
      auto_execute: data.auto_execute,
      market_order: data.market_order,
      is_active: data.is_active,
    };

    // Add optional fields only if they have meaningful values
    if (data.description && data.description.trim() !== '') {
      requestData.description = data.description;
    }
    if (data.portfolio_id && data.portfolio_id.trim() !== '') {
      requestData.portfolio_id = data.portfolio_id;
    }
    if (data.platform && data.platform.trim() !== '') {
      requestData.platform = data.platform;
    }
    if (data.account_number && data.account_number.trim() !== '') {
      requestData.account_number = data.account_number;
    }
    if (data.end_date && data.end_date.trim() !== '') {
      requestData.end_date = data.end_date;
    }
    if (data.target_amount && data.target_amount > 0) {
      requestData.target_amount = Number(data.target_amount);
    }
    if (data.limit_price && data.limit_price > 0) {
      requestData.limit_price = Number(data.limit_price);
    }
    if (data.notes && data.notes.trim() !== '') {
      requestData.notes = data.notes;
    }

    console.log('🔥 SIP EDIT: Sending update request:', requestData);
    
    try {
      await onSubmit(requestData);
      // Clear persisted data after successful submission
      resetForm();
    } catch (error) {
      console.error('🔥 SIP EDIT: Update failed:', error);
      throw error;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'basic':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Active Status Toggle */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-semibold">SIP Status</FormLabel>
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        !field.value ? "text-green-600" : "text-gray-500"
                      )}>
                        {field.value ? "Active" : "Paused"}
                      </span>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </FormControl>
                      {field.value ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <FormDescription>
                    {field.value ? 
                      "SIP is currently active and will execute as scheduled" : 
                      "SIP is paused and will not execute until reactivated"
                    }
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* SIP Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">SIP Plan Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Monthly Stock SIP, DPS Plan"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Update the name of your SIP plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your SIP plan..."
                      className={cn(
                        "min-h-[80px] text-base resize-none",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add a description to help identify this SIP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Portfolio Selection */}
            <FormField
              control={form.control}
              name="portfolio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Portfolio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}>
                        <SelectValue placeholder="Select a portfolio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white'}>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id} className="text-base py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{portfolio.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {portfolio.currency}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which portfolio this SIP belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Investment Type - Display Only */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-gray-700">Investment Type</label>
              <div className={cn(
                "h-12 px-3 flex items-center rounded-md border bg-gray-50",
                theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
              )}>
                <div className="flex items-center space-x-3">
                  {(() => {
                    const investmentType = INVESTMENT_TYPES[template.investment_type as InvestmentType];
                    const IconComponent = investmentType ? getInvestmentIcon(investmentType.icon) : null;
                    return (
                      <>
                        {IconComponent && <IconComponent className="h-5 w-5 text-blue-500" />}
                        <div>
                          <p className="font-medium">{investmentType?.label || template.investment_type}</p>
                          <p className="text-sm text-gray-500">Investment type cannot be changed</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'schedule':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Investment Amount */}
            <FormField
              control={form.control}
              name="amount_per_investment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Investment Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input 
                        type="number"
                        placeholder="5000"
                        className={cn(
                          "h-12 text-base pl-11",
                          theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        )}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange(0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Amount to invest per execution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white'}>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code} className="text-base">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{currency.symbol}</span>
                            <span>{currency.code} - {currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white'}>
                      {Object.entries(INVESTMENT_FREQUENCIES).map(([key, freq]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          <div className="flex items-center space-x-3">
                            <Repeat className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="font-medium">{freq.label}</p>
                              <p className={cn(
                                "text-sm",
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              )}>
                                Every {freq.days} days
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interval Value */}
            <FormField
              control={form.control}
              name="interval_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Interval Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="1"
                      min="1"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      value={field.value}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Execute every N intervals (e.g., 2 for every 2 months if frequency is monthly)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Start Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    When should the SIP start/restart executing?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date (Optional) */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty for indefinite SIP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 'advanced':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >

            {/* Platform */}
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Platform/Broker (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        placeholder="e.g., BRAC EPL, EBL Securities, UCB Capital"
                        className={cn(
                          "h-12 text-base pl-10",
                          theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        )}
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Investment platform or brokerage name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Number */}
            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Account Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 1234567890"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Your account number with the platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Amount (Optional) */}
            <FormField
              control={form.control}
              name="target_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Target Amount (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input 
                        type="number"
                        placeholder="100000"
                        className={cn(
                          "h-12 text-base pl-11",
                          theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                        )}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange(undefined);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    SIP will stop when this total invested amount is reached
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Auto Execute */}
            <FormField
              control={form.control}
              name="auto_execute"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-semibold">Auto Execute</FormLabel>
                      <FormDescription>
                        Automatically execute investments on schedule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Market Order */}
            <FormField
              control={form.control}
              name="market_order"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-semibold">Market Order</FormLabel>
                      <FormDescription>
                        Execute at market price (vs limit order)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />


            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about this SIP plan..."
                      className={cn(
                        "min-h-[80px] text-base resize-none",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add any relevant information about this SIP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SIP Summary */}
            {form.watch('name') && form.watch('amount_per_investment') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-xl border-2",
                  isActive
                    ? theme === 'dark' 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-green-50 border-green-200'
                    : theme === 'dark'
                      ? 'bg-orange-900/20 border-orange-800'
                      : 'bg-orange-50 border-orange-200'
                )}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className={cn("h-5 w-5", isActive ? "text-green-500" : "text-orange-500")} />
                  <h3 className={cn(
                    "font-semibold",
                    isActive 
                      ? theme === 'dark' ? 'text-green-300' : 'text-green-800'
                      : theme === 'dark' ? 'text-orange-300' : 'text-orange-800'
                  )}>
                    Updated SIP Plan Summary
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={cn(
                      "font-medium",
                      isActive 
                        ? theme === 'dark' ? 'text-green-300' : 'text-green-800'
                        : theme === 'dark' ? 'text-orange-300' : 'text-orange-800'
                    )}>
                      {form.watch('name')}
                    </p>
                    <p className={cn(
                      isActive 
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                        : theme === 'dark' ? 'text-orange-400' : 'text-orange-700'
                    )}>
                      {selectedType?.label} • {isActive ? 'Active' : 'Paused'}
                    </p>
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      isActive 
                        ? theme === 'dark' ? 'text-green-300' : 'text-green-800'
                        : theme === 'dark' ? 'text-orange-300' : 'text-orange-800'
                    )}>
                      {form.watch('amount_per_investment')} {form.watch('currency')}
                    </p>
                    <p className={cn(
                      isActive 
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                        : theme === 'dark' ? 'text-orange-400' : 'text-orange-700'
                    )}>
                      Every {form.watch('interval_value')} {selectedFrequency?.label?.toLowerCase()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <Card className={cn(
        "border-0 shadow-xl",
        theme === 'dark' 
          ? 'bg-gray-900/95 backdrop-blur-md' 
          : 'bg-white/95 backdrop-blur-md'
      )}>
        <CardHeader className="text-center pb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CardTitle className={cn(
              "text-2xl font-bold mb-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Edit SIP Plan
            </CardTitle>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Update your systematic investment plan settings
            </p>
          </motion.div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8 mt-6">
            {[
              { key: 'basic', label: 'Basic Info', icon: <Edit3 className="h-4 w-4" /> },
              { key: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" /> },
              { key: 'advanced', label: 'Advanced', icon: <Settings className="h-4 w-4" /> }
            ].map((stepInfo, index) => {
              const isCurrent = step === stepInfo.key;
              const isCompleted = ['basic', 'schedule', 'advanced'].indexOf(stepInfo.key) < ['basic', 'schedule', 'advanced'].indexOf(step);
              
              return (
                <div key={stepInfo.key} className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                      isCurrent 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" 
                        : isCompleted
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                        : theme === 'dark'
                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                    onClick={() => handleStepChange(stepInfo.key as any)}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepInfo.icon}
                  </motion.div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-blue-600" : isCompleted ? "text-blue-600" : theme === 'dark' ? "text-gray-400" : "text-gray-500"
                  )}>
                    {stepInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                <div className="flex space-x-3">
                  {step !== 'basic' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (step === 'schedule') handleStepChange('basic');
                        if (step === 'advanced') handleStepChange('schedule');
                      }}
                      className={cn(
                        "px-6",
                        theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
                      )}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {onCancel && (
                    <Button type="button" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {step !== 'advanced' ? (
                    <Button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Validate current step before proceeding
                        let fieldsToValidate: (keyof EditSIPFormData)[] = [];
                        
                        if (step === 'basic') {
                          fieldsToValidate = ['name', 'portfolio_id'];
                        } else if (step === 'schedule') {
                          fieldsToValidate = ['amount_per_investment', 'currency', 'frequency', 'start_date'];
                        }

                        const isValid = await form.trigger(fieldsToValidate);
                        
                        if (isValid) {
                          if (step === 'basic') handleStepChange('schedule');
                          if (step === 'schedule') handleStepChange('advanced');
                        }
                      }}
                      className="px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      {isLoading ? 'Updating...' : 'Update SIP Plan'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}