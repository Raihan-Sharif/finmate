'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Zap,
  Calendar,
  DollarSign,
  Target,
  CheckCircle,
  Sparkles,
  Clock,
  Repeat
} from 'lucide-react';
import { INVESTMENT_TYPES, INVESTMENT_FREQUENCIES, CreateInvestmentTemplateInput } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const sipSchema = z.object({
  name: z.string().min(1, 'SIP name is required'),
  description: z.string().optional(),
  portfolio_id: z.string().min(1, 'Portfolio is required'),
  investment_type: z.enum(['sip', 'dps', 'shanchay_potro', 'recurring_fd', 'gold', 'real_estate', 'pf', 'pension']),
  symbol: z.string().optional(),
  amount_per_investment: z.number().min(1, 'Investment amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  target_amount: z.number().optional(),
  auto_execute: z.boolean().default(true),
  market_order: z.boolean().default(true),
  limit_price: z.number().optional(),
  notes: z.string().optional(),
});

type SIPFormData = z.infer<typeof sipSchema>;

interface CreateSIPFormProps {
  portfolios: { id: string; name: string; currency: string }[];
  onSubmit: (data: CreateInvestmentTemplateInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function CreateSIPForm({
  portfolios,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: CreateSIPFormProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<'basic' | 'schedule' | 'settings'>('basic');
  
  console.log('🔍 SIP FORM: Current step:', step);
  console.log('🔍 SIP FORM: Show submit button:', step === 'settings');

  const form = useForm<SIPFormData>({
    resolver: zodResolver(sipSchema),
    defaultValues: {
      name: '',
      description: '',
      portfolio_id: '',
      investment_type: 'sip',
      symbol: '',
      amount_per_investment: 0,
      currency: 'BDT',
      frequency: 'monthly',
      start_date: '',
      end_date: '',
      target_amount: undefined,
      auto_execute: true,
      market_order: true,
      limit_price: undefined,
      notes: ''
    }
  });

  const selectedPortfolio = portfolios.find(p => p.id === form.watch('portfolio_id'));
  const selectedType = INVESTMENT_TYPES[form.watch('investment_type')];
  const selectedFrequency = INVESTMENT_FREQUENCIES[form.watch('frequency')];

  const handleSubmit = async (data: SIPFormData) => {
    console.log('🎯 SIP FORM: handleSubmit called with data:', data);
    console.log('🎯 SIP FORM: Current step:', step);
    
    const requestData: any = {
      name: data.name,
      investment_type: data.investment_type,
      amount_per_investment: data.amount_per_investment,
      currency: data.currency,
      frequency: data.frequency,
      start_date: data.start_date,
      auto_execute: data.auto_execute,
      market_order: data.market_order,
      template_type: 'user_sip',
      interval_value: 1 // Default interval
    };
    
    console.log('🎯 SIP FORM: Base requestData:', requestData);

    // Add optional fields only if they have values
    if (data.portfolio_id) requestData.portfolio_id = data.portfolio_id;
    if (data.description) requestData.description = data.description;
    if (data.symbol) requestData.symbol = data.symbol.substring(0, 20);
    if (data.end_date) requestData.end_date = data.end_date;
    if (data.target_amount) requestData.target_amount = data.target_amount;
    if (data.limit_price) requestData.limit_price = data.limit_price;
    if (data.notes) requestData.notes = data.notes;

    console.log('🎯 SIP FORM: Final requestData before onSubmit:', requestData);
    console.log('🎯 SIP FORM: Calling parent onSubmit...');
    
    try {
      await onSubmit(requestData);
      console.log('🎯 SIP FORM: onSubmit completed successfully');
    } catch (error) {
      console.error('🎯 SIP FORM: onSubmit failed:', error);
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
                    Choose a descriptive name for your SIP plan
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Investment Type */}
            <FormField
              control={form.control}
              name="investment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Investment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}>
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white'}>
                      {Object.entries(INVESTMENT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{type.icon}</span>
                            <div>
                              <p className="font-medium">{type.label}</p>
                              <p className={cn(
                                "text-sm",
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              )}>
                                {type.description}
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

            {/* Symbol (Optional) */}
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Symbol/Code (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., GP, IFIC, DBBL"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Stock symbol or fund code if applicable
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={selectedPortfolio?.currency || field.value}
                  >
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    When should the SIP start executing?
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

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
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
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    SIP will stop when this amount is reached
                  </FormDescription>
                  <FormMessage />
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
                        "min-h-[100px] text-base resize-none",
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
                  theme === 'dark' 
                    ? 'bg-green-900/20 border-green-800' 
                    : 'bg-green-50 border-green-200'
                )}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  <h3 className={cn(
                    "font-semibold text-green-800",
                    theme === 'dark' ? 'text-green-300' : ''
                  )}>
                    SIP Plan Summary
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={cn(
                      "font-medium",
                      theme === 'dark' ? 'text-green-300' : 'text-green-800'
                    )}>
                      {form.watch('name')}
                    </p>
                    <p className={cn(
                      theme === 'dark' ? 'text-green-400' : 'text-green-700'
                    )}>
                      {selectedType?.label}
                    </p>
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      theme === 'dark' ? 'text-green-300' : 'text-green-800'
                    )}>
                      {form.watch('amount_per_investment')} {form.watch('currency')}
                    </p>
                    <p className={cn(
                      theme === 'dark' ? 'text-green-400' : 'text-green-700'
                    )}>
                      {selectedFrequency?.label}
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
              Create SIP Plan
            </CardTitle>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Set up a systematic investment plan for regular investing
            </p>
          </motion.div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8 mt-6">
            {[
              { key: 'basic', label: 'Basic Info', icon: <Zap className="h-4 w-4" /> },
              { key: 'schedule', label: 'Schedule', icon: <Calendar className="h-4 w-4" /> },
              { key: 'settings', label: 'Settings', icon: <Target className="h-4 w-4" /> }
            ].map((stepInfo, index) => {
              const isCurrent = step === stepInfo.key;
              const isCompleted = ['basic', 'schedule', 'settings'].indexOf(stepInfo.key) < ['basic', 'schedule', 'settings'].indexOf(step);
              
              return (
                <div key={stepInfo.key} className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                      isCurrent 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg" 
                        : isCompleted
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                        : theme === 'dark'
                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                    onClick={() => setStep(stepInfo.key as any)}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepInfo.icon}
                  </motion.div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-green-600" : isCompleted ? "text-green-600" : theme === 'dark' ? "text-gray-400" : "text-gray-500"
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
                        if (step === 'schedule') setStep('basic');
                        if (step === 'settings') setStep('schedule');
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
                    <Button type="button" variant="ghost" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {step !== 'settings' ? (
                    <Button
                      type="button"
                      onClick={() => {
                        console.log('🔍 SIP FORM: Next button clicked, current step:', step);
                        if (step === 'basic') {
                          console.log('🔍 SIP FORM: Moving from basic to schedule');
                          setStep('schedule');
                        }
                        if (step === 'schedule') {
                          console.log('🔍 SIP FORM: Moving from schedule to settings');
                          setStep('settings');
                        }
                      }}
                      className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      onClick={(e) => {
                        console.log('🚨 SIP FORM: Submit button clicked!');
                        console.log('🚨 SIP FORM: Form values:', form.getValues());
                        console.log('🚨 SIP FORM: Form errors:', form.formState.errors);
                        console.log('🚨 SIP FORM: Form is valid:', form.formState.isValid);
                        console.log('🚨 SIP FORM: isLoading:', isLoading);
                      }}
                    >
                      {isLoading ? 'Creating...' : 'Create SIP Plan'}
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