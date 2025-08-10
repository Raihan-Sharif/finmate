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
import { Label } from '@/components/ui/label';
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
  Plus,
  DollarSign,
  TrendingUp,
  Target,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Sparkles,
  PieChart,
  Bitcoin,
  Scroll,
  Lock,
  Repeat,
  PiggyBank,
  Award,
  Calendar,
  Crown,
  Home,
  UserCheck,
  MoreHorizontal
} from 'lucide-react';
import { INVESTMENT_TYPES, RISK_LEVELS, CreateInvestmentRequest } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn, getInvestmentIcon } from '@/lib/utils';
import { useTheme } from 'next-themes';

const investmentSchema = z.object({
  name: z.string().min(1, 'Investment name is required'),
  symbol: z.string().optional(),
  type: z.enum(['stock', 'mutual_fund', 'crypto', 'bond', 'fd', 'sip', 'dps', 'shanchay_potro', 'recurring_fd', 'gold', 'real_estate', 'pf', 'pension', 'other']),
  portfolio_id: z.string().min(1, 'Portfolio is required'),
  initial_amount: z.number().min(0.01, 'Initial amount must be greater than 0'),
  current_price: z.number().min(0.01, 'Current price must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  risk_level: z.string().min(1, 'Risk level is required'),
  platform: z.string().optional(),
  account_number: z.string().optional(),
  folio_number: z.string().optional(),
  maturity_date: z.string().optional(),
  interest_rate: z.number().optional(),
  exchange: z.string().optional(),
  target_amount: z.number().optional(),
  target_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional()
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface CreateInvestmentFormProps {
  portfolios: { id: string; name: string; currency: string }[];
  onSubmit: (data: CreateInvestmentRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function CreateInvestmentForm({
  portfolios,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: CreateInvestmentFormProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<'basic' | 'details' | 'targets'>('basic');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Debug step changes
  console.log('🔥 FORM: Current step:', step);

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      symbol: '',
      type: 'sip',
      portfolio_id: '',
      initial_amount: 0,
      current_price: 0,
      currency: '',
      risk_level: '',
      platform: '',
      account_number: '',
      folio_number: '',
      maturity_date: '',
      interest_rate: undefined,
      exchange: '',
      target_amount: undefined,
      target_date: '',
      notes: '',
      tags: ''
    }
  });

  const selectedPortfolio = portfolios.find(p => p.id === form.watch('portfolio_id'));
  const selectedType = INVESTMENT_TYPES[form.watch('type')];
  const selectedRisk = RISK_LEVELS[form.watch('risk_level')];
  

  const handleSubmit = async (data: InvestmentFormData) => {
    console.log('🔥 FORM: handleSubmit called with:', data);
    console.log('🔥 FORM: Current step when submitting:', step);
    
    try {
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const requestData: any = {
        name: data.name,
        type: data.type,
        portfolio_id: data.portfolio_id,
        initial_amount: data.initial_amount,
        current_price: data.current_price,
        currency: data.currency,
        risk_level: data.risk_level
      };

      // Add optional fields only if they have values
      if (data.symbol) requestData.symbol = data.symbol;
      if (tags.length > 0) requestData.tags = tags;
      if (data.platform) requestData.platform = data.platform;
      if (data.account_number) requestData.account_number = data.account_number;
      if (data.folio_number) requestData.folio_number = data.folio_number;
      if (data.maturity_date) requestData.maturity_date = data.maturity_date;
      if (data.interest_rate) requestData.interest_rate = data.interest_rate;
      if (data.exchange) requestData.exchange = data.exchange;
      if (data.target_amount) requestData.target_amount = data.target_amount;
      if (data.target_date) requestData.target_date = data.target_date;
      if (data.notes) requestData.notes = data.notes;

      console.log('🔥 FORM: Raw form data:', data);
      console.log('🔥 FORM: Request data being sent:', requestData);
      console.log('🔥 FORM: initial_amount value:', data.initial_amount);
      console.log('🔥 FORM: current_price value:', data.current_price);
      await onSubmit(requestData);
    } catch (error) {
      console.error('CreateInvestmentForm handleSubmit error:', error);
      throw error;
    }
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      form.setValue('tags', newTags.join(', '));
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue('tags', newTags.join(', '));
  };

  const suggestedTags = ['Long Term', 'Retirement', 'Emergency Fund', 'Growth', 'Income', 'Diversification'];

  const getStepIcon = (currentStep: string) => {
    switch (currentStep) {
      case 'basic': return <Briefcase className="h-5 w-5" />;
      case 'details': return <TrendingUp className="h-5 w-5" />;
      case 'targets': return <Target className="h-5 w-5" />;
      default: return <Briefcase className="h-5 w-5" />;
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
            {/* Investment Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Investment Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., IFIC Bank DPS, Grameen Phone Share"
                      className="h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a descriptive name for your investment
                  </FormDescription>
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
                      className="h-12 text-base"
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

            {/* Investment Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Investment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(INVESTMENT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              {(() => {
                                const IconComponent = getInvestmentIcon(type.icon);
                                return IconComponent ? <IconComponent className="h-4 w-4 text-white" /> : <TrendingUp className="h-4 w-4 text-white" />;
                              })()}
                            </div>
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

            {/* Portfolio Selection */}
            <FormField
              control={form.control}
              name="portfolio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Portfolio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a portfolio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                    Choose which portfolio this investment belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 'details':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Initial Amount */}
            <FormField
              control={form.control}
              name="initial_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Initial Investment Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input 
                        type="number"
                        placeholder="10000"
                        className="h-12 text-base pl-11"
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
                    The amount you're investing initially
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Price */}
            <FormField
              control={form.control}
              name="current_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Current Price per Unit</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        className="h-12 text-base pl-11"
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
                    Current market price per unit/share
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
                    onValueChange={(value) => {
                      field.onChange(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code} className="text-base">
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Level */}
            <FormField
              control={form.control}
              name="risk_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Risk Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(RISK_LEVELS).map(([key, risk]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: risk.color }}
                            />
                            <div>
                              <p className="font-medium">{risk.label}</p>
                              <p className="text-sm text-gray-500">{risk.description}</p>
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

            {/* Platform & Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Platform/Broker (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., IFIC Securities, Dhaka Stock Exchange"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Account Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your account number"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="folio_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Folio Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Folio/certificate number"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="maturity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Maturity Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      For fixed deposits, bonds, or time-bound investments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Interest Rate % (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="5.5"
                        className="h-12 text-base"
                        {...field}
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
                    </FormControl>
                    <FormDescription>
                      Annual interest rate for fixed income investments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="exchange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Exchange (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., DSE, CSE, NYSE, NASDAQ"
                      className="h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Stock exchange where the investment is traded
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
                      placeholder="Any additional notes about this investment..."
                      className="min-h-[100px] text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add any relevant information about this investment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 'targets':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Target Amount */}
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
                        className="h-12 text-base pl-11"
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
                    Set a target value for this investment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Date */}
            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Target Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    When do you want to reach your target?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Tags (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input 
                        placeholder="Enter tags separated by commas"
                        className="h-12 text-base"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setSelectedTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean));
                        }}
                      />
                      
                      {/* Selected Tags */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag, index) => (
                            <Badge 
                              key={index}
                              variant="secondary"
                              className="px-3 py-1 cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => removeTag(tag)}
                            >
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Suggested Tags */}
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Suggested tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              onClick={() => addTag(tag)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add tags to categorize and organize your investments
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <Card className={cn(
        "border-0 backdrop-blur-md shadow-xl",
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-900/90'
          : 'bg-gradient-to-br from-white via-white/95 to-white/90'
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
              Create New Investment
            </CardTitle>
            <p className={cn(
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>
              Add a new investment to your portfolio
            </p>
          </motion.div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8 mt-6">
            {[
              { key: 'basic', label: 'Basic Info', icon: <Briefcase className="h-4 w-4" /> },
              { key: 'details', label: 'Details', icon: <TrendingUp className="h-4 w-4" /> },
              { key: 'targets', label: 'Targets', icon: <Target className="h-4 w-4" /> }
            ].map((stepInfo, index) => {
              const isCurrent = step === stepInfo.key;
              const isCompleted = ['basic', 'details', 'targets'].indexOf(stepInfo.key) < ['basic', 'details', 'targets'].indexOf(step);
              
              return (
                <div key={stepInfo.key} className="flex items-center space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                      isCurrent 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" 
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
                    isCurrent 
                      ? "text-blue-600" 
                      : isCompleted 
                      ? "text-green-600" 
                      : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
              {/* Dynamic Content */}
              {renderStepContent()}

              {/* Summary Card (shown on targets step) */}
              {step === 'targets' && form.watch('name') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-6 rounded-xl border",
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-800/50'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                  )}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <h3 className={cn(
                      "font-semibold",
                      theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                    )}>Investment Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={cn(
                        "font-medium",
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      )}>{form.watch('name')}</p>
                      <p className={cn(
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      )}>{selectedType?.label}</p>
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      )}>
                        {form.watch('initial_amount')} {form.watch('currency')}
                      </p>
                      <p className={cn(
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      )}>{selectedRisk?.label} Risk</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                <div className="flex space-x-3">
                  {step !== 'basic' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (step === 'details') setStep('basic');
                        if (step === 'targets') setStep('details');
                      }}
                      className="px-6"
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
                  {step !== 'targets' ? (
                    <Button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault(); // Prevent form submission
                        e.stopPropagation(); // Stop event bubbling
                        
                        // Validate current step before proceeding
                        let fieldsToValidate: (keyof InvestmentFormData)[] = [];
                        
                        if (step === 'basic') {
                          fieldsToValidate = ['name', 'type', 'portfolio_id'];
                        } else if (step === 'details') {
                          // Only validate required fields in details step
                          fieldsToValidate = ['initial_amount', 'current_price', 'currency', 'risk_level'];
                        }

                        const isValid = await form.trigger(fieldsToValidate);
                        
                        if (isValid) {
                          if (step === 'basic') {
                            console.log('🔥 FORM: Moving from basic to details');
                            setStep('details');
                          }
                          if (step === 'details') {
                            console.log('🔥 FORM: Moving from details to targets');
                            setStep('targets');
                          }
                        } else {
                          console.log('🔥 FORM: Validation failed for step:', step, 'Fields:', fieldsToValidate);
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
                      className="px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      {isLoading ? 'Creating...' : 'Create Investment'}
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