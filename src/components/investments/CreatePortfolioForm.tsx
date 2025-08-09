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
  Briefcase,
  Target,
  Palette,
  Calendar,
  DollarSign,
  Shield,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { RISK_LEVELS, CreateInvestmentPortfolioInput } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  target_amount: z.number().optional(),
  target_date: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Icon is required'),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

interface CreatePortfolioFormProps {
  onSubmit: (data: CreateInvestmentPortfolioInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const PORTFOLIO_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Orange', value: '#F59E0B', bg: 'bg-orange-500' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
];

const PORTFOLIO_ICONS = [
  { name: 'Briefcase', value: 'briefcase', icon: '💼' },
  { name: 'Target', value: 'target', icon: '🎯' },
  { name: 'Rocket', value: 'rocket', icon: '🚀' },
  { name: 'Chart', value: 'chart', icon: '📈' },
  { name: 'Diamond', value: 'diamond', icon: '💎' },
  { name: 'Crown', value: 'crown', icon: '👑' },
  { name: 'Star', value: 'star', icon: '⭐' },
  { name: 'Fire', value: 'fire', icon: '🔥' },
];

export function CreatePortfolioForm({
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: CreatePortfolioFormProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<'basic' | 'details' | 'goals'>('basic');

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'BDT',
      risk_level: 'medium',
      color: '#3B82F6',
      icon: 'briefcase',
      target_amount: undefined,
      target_date: ''
    }
  });

  const selectedRisk = RISK_LEVELS[form.watch('risk_level')];
  const selectedColor = form.watch('color');
  const selectedIcon = form.watch('icon');

  const handleSubmit = async (data: PortfolioFormData) => {
    const requestData: any = {
      name: data.name,
      risk_level: data.risk_level,
      currency: data.currency,
      color: data.color,
      icon: data.icon
    };

    // Add optional fields only if they have values
    if (data.description) requestData.description = data.description;
    if (data.target_amount) requestData.target_amount = data.target_amount;
    if (data.target_date) requestData.target_date = data.target_date;

    await onSubmit(requestData);
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
            {/* Portfolio Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Portfolio Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., My Growth Portfolio, Retirement Fund"
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a descriptive name for your portfolio
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
                      placeholder="Brief description of your investment strategy..."
                      className={cn(
                        "min-h-[100px] text-base resize-none",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your investment goals and strategy
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Risk Level */}
            <FormField
              control={form.control}
              name="risk_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Risk Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white'}>
                      {Object.entries(RISK_LEVELS).map(([key, risk]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: risk.color }}
                            />
                            <div>
                              <p className="font-medium">{risk.label}</p>
                              <p className={cn(
                                "text-sm",
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              )}>
                                {risk.description}
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
            {/* Color Selection */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Portfolio Color</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      {PORTFOLIO_COLORS.map((color) => (
                        <motion.button
                          key={color.value}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => field.onChange(color.value)}
                          className={cn(
                            "h-16 w-full rounded-xl flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 relative",
                            color.bg,
                            field.value === color.value ? 'ring-4 ring-offset-2 ring-blue-500 shadow-lg' : 'hover:shadow-md',
                            theme === 'dark' ? 'ring-offset-gray-800' : 'ring-offset-white'
                          )}
                        >
                          {color.name}
                          {field.value === color.value && (
                            <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-white bg-blue-500 rounded-full" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a color theme for your portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon Selection */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Portfolio Icon</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      {PORTFOLIO_ICONS.map((iconItem) => (
                        <motion.button
                          key={iconItem.value}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => field.onChange(iconItem.value)}
                          className={cn(
                            "h-16 w-full rounded-xl flex flex-col items-center justify-center font-semibold text-xs transition-all duration-300 relative",
                            field.value === iconItem.value 
                              ? 'ring-4 ring-offset-2 ring-blue-500 shadow-lg' 
                              : 'hover:shadow-md',
                            theme === 'dark' 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white ring-offset-gray-800' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 ring-offset-white'
                          )}
                        >
                          <span className="text-2xl mb-1">{iconItem.icon}</span>
                          <span>{iconItem.name}</span>
                          {field.value === iconItem.value && (
                            <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-white bg-blue-500 rounded-full" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Pick an icon to represent your portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 'goals':
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
                    Set a target value for this portfolio
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
                      className={cn(
                        "h-12 text-base",
                        theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
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

            {/* Preview Card */}
            {form.watch('name') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-xl border-2",
                  theme === 'dark' 
                    ? 'bg-gray-800/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h3 className={cn(
                    "font-semibold",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Portfolio Preview
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <span className="text-white text-xl">
                      {PORTFOLIO_ICONS.find(i => i.value === selectedIcon)?.icon || '💼'}
                    </span>
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-lg font-bold",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {form.watch('name')}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <Badge variant="outline" style={{ borderColor: selectedRisk.color, color: selectedRisk.color }}>
                        {selectedRisk.label}
                      </Badge>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {form.watch('currency')}
                      </span>
                    </div>
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
              Create Investment Portfolio
            </CardTitle>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Build a new portfolio to organize your investments
            </p>
          </motion.div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8 mt-6">
            {[
              { key: 'basic', label: 'Basic Info', icon: <Briefcase className="h-4 w-4" /> },
              { key: 'details', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
              { key: 'goals', label: 'Goals', icon: <Target className="h-4 w-4" /> }
            ].map((stepInfo, index) => {
              const isCurrent = step === stepInfo.key;
              const isCompleted = ['basic', 'details', 'goals'].indexOf(stepInfo.key) < ['basic', 'details', 'goals'].indexOf(step);
              
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
                    isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : theme === 'dark' ? "text-gray-400" : "text-gray-500"
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
                        if (step === 'details') setStep('basic');
                        if (step === 'goals') setStep('details');
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
                  {step !== 'goals' ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (step === 'basic') setStep('details');
                        if (step === 'details') setStep('goals');
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
                      {isLoading ? 'Creating...' : 'Create Portfolio'}
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