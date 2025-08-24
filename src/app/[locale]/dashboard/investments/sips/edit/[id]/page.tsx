'use client';

import { useRouter, useParams } from 'next/navigation';
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
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Sparkles,
  Repeat,
  ToggleLeft,
  ToggleRight,
  Building2,
  Save
} from 'lucide-react';
import { INVESTMENT_TYPES, INVESTMENT_FREQUENCIES, UpdateInvestmentTemplateInput, InvestmentType, InvestmentFrequency } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn, getInvestmentIcon } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useInvestmentTemplate, useUpdateInvestmentTemplate } from '@/hooks/useInvestmentTemplates';
import { useInvestmentPortfolios } from '@/hooks/useInvestmentPortfolios';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

const editSipSchema = (t: any) => z.object({
  name: z.string().min(1, t('errors.nameRequired')),
  description: z.string().optional(),
  portfolio_id: z.string().min(1, t('errors.portfolioRequired')),
  amount_per_investment: z.number().min(1, t('errors.amountPositive')),
  currency: z.string().min(1, 'Currency is required'),
  platform: z.string().optional(),
  account_number: z.string().optional(),
  frequency: z.string().refine(
    (value) => ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(value),
    { message: t('errors.frequencyRequired') }
  ),
  interval_value: z.number().min(1).default(1),
  start_date: z.string().min(1, t('errors.startDateRequired')),
  end_date: z.string().optional(),
  target_amount: z.number().optional(),
  auto_execute: z.boolean().default(true),
  market_order: z.boolean().default(true),
  limit_price: z.number().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

type EditSIPFormData = z.infer<ReturnType<typeof editSipSchema>>;

export default function EditSIPPage() {
  const router = useRouter();
  const params = useParams();
  const sipId = params.id as string;
  const { theme } = useTheme();
  const t = useTranslations('investments.sip.form');
  
  const { data: template, isLoading: templateLoading } = useInvestmentTemplate(sipId);
  const { data: portfolios = [], isLoading: portfoliosLoading } = useInvestmentPortfolios();
  const updateSIPMutation = useUpdateInvestmentTemplate();

  const form = useForm<EditSIPFormData>({
    resolver: zodResolver(editSipSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      portfolio_id: '',
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
      notes: ''
    }
  });

  // Load template data into form when available
  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name || '',
        description: template.description || '',
        portfolio_id: template.portfolio_id || '',
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
      });
    }
  }, [template, form]);

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
    try {
      console.log('🔥 SIP EDIT: Form submission data:', data);
      
      const requestData: UpdateInvestmentTemplateInput = {
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
      
      await updateSIPMutation.mutateAsync({ 
        id: sipId, 
        updates: requestData 
      });
      
      toast.success(t('success.updated'));
      router.push('/dashboard/investments/sips');
    } catch (error) {
      console.error('🔥 SIP EDIT: Update failed:', error);
      toast.error(t('errors.updateFailed'));
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/investments/sips');
  };

  if (templateLoading || portfoliosLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('errors.sipNotFound')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('errors.sipNotFoundDescription')}
            </p>
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('navigation.backToSips')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('navigation.previous')}</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('navigation.editSipPlan')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('navigation.editSipPlanDescription')}
            </p>
          </div>
        </div>

        <Card className={cn(
          "border-0 shadow-xl",
          theme === 'dark' 
            ? 'bg-gray-900/95 backdrop-blur-md' 
            : 'bg-white/95 backdrop-blur-md'
        )}>
          <CardHeader className="pb-6">
            {/* Active Status Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t('sipStatus')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isActive ? 
                    t('activeDescription') : 
                    t('pausedDescription')
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isActive ? "text-green-600" : "text-gray-500"
                )}>
                  {isActive ? t('active') : t('paused')}
                </span>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => form.setValue('is_active', checked)}
                  className="data-[state=checked]:bg-green-500"
                />
                {isActive ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Investment Type Display */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-gray-700 dark:text-gray-300">{t('investmentType')}</label>
              <div className={cn(
                "h-12 px-3 flex items-center rounded-md border bg-gray-50",
                theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
              )}>
                <div className="flex items-center space-x-3">
                  {(() => {
                    const IconComponent = selectedType ? getInvestmentIcon(selectedType.icon) : null;
                    return (
                      <>
                        {IconComponent && <IconComponent className="h-5 w-5 text-blue-500" />}
                        <div>
                          <p className="font-medium">{selectedType?.label || template.investment_type}</p>
                          <p className="text-sm text-gray-500">{t('investmentTypeReadonly')}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SIP Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">{t('name')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('namePlaceholder')}
                            className="h-12 text-base"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('nameDescription')}
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
                        <FormLabel className="text-base font-semibold">{t('portfolio')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder={t('portfolioPlaceholder')} />
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
                          {t('portfolioDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Investment Amount */}
                  <FormField
                    control={form.control}
                    name="amount_per_investment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">{t('amount')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <Input 
                              type="number"
                              placeholder={t('amountPlaceholder')}
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
                          {t('amountDescription')}
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
                        <FormLabel className="text-base font-semibold">{t('currency')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder={t('currencyPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormLabel className="text-base font-semibold">{t('frequency')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder={t('frequencyPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(INVESTMENT_FREQUENCIES).map(([key, freq]) => (
                              <SelectItem key={key} value={key} className="text-base py-3">
                                <div className="flex items-center space-x-3">
                                  <Repeat className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <p className="font-medium">{freq.label}</p>
                                    <p className="text-sm text-gray-500">
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
                        <FormLabel className="text-base font-semibold">{t('intervalValue')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder={t('intervalPlaceholder')}
                            min="1"
                            className="h-12 text-base"
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
                          {t('intervalDescription')}
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
                        <FormLabel className="text-base font-semibold">{t('startDate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('startDateDescription')}
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
                        <FormLabel className="text-base font-semibold">{t('endDate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('endDateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Advanced Settings */}
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold">{t('navigation.steps.settings')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Platform */}
                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">{t('platform')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                placeholder={t('platformPlaceholder')}
                                className="h-12 text-base pl-10"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            {t('platformDescription')}
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
                          <FormLabel className="text-base font-semibold">{t('accountNumber')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('accountNumberPlaceholder')}
                              className="h-12 text-base"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {t('accountNumberDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Amount */}
                    <FormField
                      control={form.control}
                      name="target_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">{t('targetAmount')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                              <Input 
                                type="number"
                                placeholder={t('targetAmountPlaceholder')}
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
                            {t('targetAmountDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Auto Execute & Market Order Switches */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="auto_execute"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-base font-semibold">{t('autoExecute')}</FormLabel>
                              <FormDescription>
                                {t('autoExecuteDescription')}
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

                    <FormField
                      control={form.control}
                      name="market_order"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-base font-semibold">{t('marketOrder')}</FormLabel>
                              <FormDescription>
                                {t('marketOrderDescription')}
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
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">{t('notes')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('notesPlaceholder')}
                            className="min-h-[80px] text-base resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('notesDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                        {t('summary.title')}
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
                          {selectedType?.label} • {isActive ? t('active') : t('paused')}
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
                          {t('summary.every')} {form.watch('interval_value')} {selectedFrequency?.label?.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t('navigation.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateSIPMutation.isPending}
                    className="px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSIPMutation.isPending ? t('updating') : t('updateButton')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}