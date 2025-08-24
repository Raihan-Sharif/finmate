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
  Target,
  Sparkles,
  Save,
  Briefcase,
  Edit
} from 'lucide-react';
import { RISK_LEVELS, UpdateInvestmentPortfolioInput } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useInvestmentPortfolio, useUpdateInvestmentPortfolio } from '@/hooks/useInvestmentPortfolios';
import toast from 'react-hot-toast';

const createEditPortfolioSchema = (t: any) => z.object({
  name: z.string().min(1, t('errors.nameRequired')),
  description: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  target_amount: z.number().optional(),
  target_date: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Icon is required'),
});

type EditPortfolioFormData = z.infer<ReturnType<typeof createEditPortfolioSchema>>;


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

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.id as string;
  const { theme } = useTheme();
  const t = useTranslations('investments.forms.portfolio');
  const tCommon = useTranslations('common');
  
  const { data: portfolio, isLoading: portfolioLoading } = useInvestmentPortfolio(portfolioId);
  const updatePortfolioMutation = useUpdateInvestmentPortfolio();

  const form = useForm<EditPortfolioFormData>({
    resolver: zodResolver(createEditPortfolioSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      risk_level: 'medium',
      color: '#3B82F6',
      icon: 'briefcase',
      target_amount: undefined,
      target_date: ''
    }
  });

  // Load portfolio data into form when available
  useEffect(() => {
    if (portfolio) {
      form.reset({
        name: portfolio.name || '',
        description: portfolio.description || '',
        risk_level: portfolio.risk_level || 'medium',
        color: portfolio.color || '#3B82F6',
        icon: portfolio.icon || 'briefcase',
        target_amount: portfolio.target_amount || undefined,
        target_date: portfolio.target_date 
          ? new Date(portfolio.target_date).toISOString().split('T')[0]
          : ''
      });
    }
  }, [portfolio, form]);

  const selectedRisk = RISK_LEVELS[form.watch('risk_level')] || RISK_LEVELS['medium'];
  const selectedColor = form.watch('color') || '#3B82F6';
  const selectedIcon = form.watch('icon') || 'briefcase';

  const handleSubmit = async (data: EditPortfolioFormData) => {
    try {
      console.log('🔥 PORTFOLIO EDIT: Form submission data:', data);
      
      const requestData: UpdateInvestmentPortfolioInput = {
        name: data.name,
        risk_level: data.risk_level,
        color: data.color,
        icon: data.icon,
      };

      // Add optional fields only if they have meaningful values
      if (data.description && data.description.trim() !== '') {
        requestData.description = data.description;
      }
      if (data.target_amount && data.target_amount > 0) {
        requestData.target_amount = Number(data.target_amount);
      }
      if (data.target_date && data.target_date.trim() !== '') {
        requestData.target_date = data.target_date;
      }

      console.log('🔥 PORTFOLIO EDIT: Sending update request:', requestData);
      
      await updatePortfolioMutation.mutateAsync({ 
        id: portfolioId, 
        updates: requestData 
      });
      
      toast.success(t('success.updated'));
      router.push('/dashboard/investments');
    } catch (error) {
      console.error('🔥 PORTFOLIO EDIT: Update failed:', error);
      toast.error(t('errors.updateFailed'));
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/investments');
  };

  if (portfolioLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('errors.portfolioNotFound') || 'Portfolio Not Found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('errors.portfolioNotFoundDescription') || "The portfolio you're looking for doesn't exist or has been deleted."}
            </p>
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToPortfolios')}
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
            <span>{tCommon('back')}</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('editTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('editSubtitle') || 'Update your investment portfolio settings'}
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
            <div className="flex items-center space-x-3 mb-4">
              <Edit className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">{t('title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('editDescription') || `Update your "${portfolio.name}" portfolio settings`}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Portfolio Name */}
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

                  {/* Currency (Read-only) */}
                  <div>
                    <label className="text-base font-semibold text-gray-700 dark:text-gray-300">{t('currency')}</label>
                    <div className={cn(
                      "h-12 px-3 flex items-center rounded-md border bg-gray-50 mt-2",
                      theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                    )}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{CURRENCIES.find(c => c.code === portfolio?.currency)?.symbol || '৳'}</span>
                        <span>{portfolio?.currency || 'BDT'} - {CURRENCIES.find(c => c.code === portfolio?.currency)?.name || 'Bangladeshi Taka'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('currencyReadOnlyDescription') || 'Currency cannot be changed for existing portfolios'}
                    </p>
                  </div>

                  {/* Risk Level */}
                  <FormField
                    control={form.control}
                    name="risk_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">{t('riskLevel')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder={t('selectRiskLevel')} />
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
                                    <p className="text-sm text-gray-500">
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

                  {/* Target Date */}
                  <FormField
                    control={form.control}
                    name="target_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">{t('targetDate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('targetDateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">{t('description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('descriptionPlaceholder')}
                          className="min-h-[100px] text-base resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t('descriptionDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color and Icon Selection */}
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold">{t('steps.appearance')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Color Selection */}
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">{t('portfolioColor')}</FormLabel>
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
                                    "h-12 w-full rounded-xl flex items-center justify-center text-white font-semibold text-xs transition-all duration-300 relative",
                                    color.bg,
                                    field.value === color.value ? 'ring-4 ring-offset-2 ring-blue-500 shadow-lg' : 'hover:shadow-md',
                                    theme === 'dark' ? 'ring-offset-gray-800' : 'ring-offset-white'
                                  )}
                                >
                                  {color.name}
                                  {field.value === color.value && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </FormControl>
                          <FormDescription>
                            {t('portfolioColorDescription')}
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
                          <FormLabel className="text-base font-semibold">{t('portfolioIcon')}</FormLabel>
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
                                    "h-12 w-full rounded-xl flex flex-col items-center justify-center font-semibold text-xs transition-all duration-300 relative",
                                    field.value === iconItem.value 
                                      ? 'ring-4 ring-offset-2 ring-blue-500 shadow-lg' 
                                      : 'hover:shadow-md',
                                    theme === 'dark' 
                                      ? 'bg-gray-700 hover:bg-gray-600 text-white ring-offset-gray-800' 
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 ring-offset-white'
                                  )}
                                >
                                  <span className="text-lg mb-1">{iconItem.icon}</span>
                                  <span className="text-xs">{iconItem.name}</span>
                                  {field.value === iconItem.value && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </FormControl>
                          <FormDescription>
                            {t('portfolioIconDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Portfolio Preview */}
                {form.watch('name') && selectedRisk && (
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
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('portfolioPreview')}
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
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {form.watch('name')}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm">
                          <Badge variant="outline" style={{ borderColor: selectedRisk.color, color: selectedRisk.color }}>
                            {selectedRisk.label}
                          </Badge>
                          <span className="text-gray-600 dark:text-gray-400">
                            {portfolio?.currency || 'BDT'}
                          </span>
                          {form.watch('target_amount') && (
                            <span className="text-gray-600 dark:text-gray-400">
                              • Target: {form.watch('target_amount')} {portfolio?.currency || 'BDT'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {tCommon('cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updatePortfolioMutation.isPending}
                    className="px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatePortfolioMutation.isPending ? t('updating') : t('updateButton')}
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