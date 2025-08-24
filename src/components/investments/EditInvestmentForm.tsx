'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
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
  CheckCircle,
  Sparkles,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { INVESTMENT_TYPES, RISK_LEVELS, Investment, UpdateInvestmentInput } from '@/types/investments';
import { CURRENCIES } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const createEditInvestmentSchema = (t: any) => z.object({
  name: z.string().min(1, t('errors.nameRequired')),
  symbol: z.string().optional(),
  type: z.enum(['stock', 'mutual_fund', 'crypto', 'bond', 'fd', 'sip', 'dps', 'shanchay_potro', 'recurring_fd', 'gold', 'real_estate', 'pf', 'pension', 'other']),
  current_price: z.number().min(0.01, t('errors.currentPricePositive')),
  platform: z.string().optional(),
  account_number: z.string().optional(),
  folio_number: z.string().optional(),
  maturity_date: z.string().optional(),
  interest_rate: z.number().optional(),
  exchange: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional()
});

type EditInvestmentFormData = z.infer<ReturnType<typeof createEditInvestmentSchema>>;

interface EditInvestmentFormProps {
  investment: Investment;
  onSubmit: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function EditInvestmentForm({
  investment,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: EditInvestmentFormProps) {
  const { theme } = useTheme();
  const t = useTranslations('investments.investment.form');
  const tCommon = useTranslations('common');
  const [selectedTags, setSelectedTags] = useState<string[]>(investment.tags || []);

  const form = useForm<EditInvestmentFormData>({
    resolver: zodResolver(createEditInvestmentSchema(t)),
    defaultValues: {
      name: investment.name,
      symbol: investment.symbol || '',
      type: investment.type,
      current_price: investment.current_price,
      platform: investment.platform || '',
      account_number: investment.account_number || '',
      folio_number: investment.folio_number || '',
      maturity_date: investment.maturity_date || '',
      interest_rate: investment.interest_rate || undefined,
      exchange: investment.exchange || '',
      notes: investment.notes || '',
      tags: investment.tags ? investment.tags.join(', ') : ''
    }
  });

  const selectedType = INVESTMENT_TYPES[form.watch('type')];
  
  // Icon mapping for investment types
  const getInvestmentTypeIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'trending-up': TrendingUp,
      'pie-chart': TrendingUp, 
      'bitcoin': TrendingUp,
      'scroll': TrendingUp,
      'lock': TrendingUp,
      'repeat': TrendingUp,
      'piggy-bank': TrendingUp,
      'certificate': TrendingUp,
      'calendar': TrendingUp,
      'crown': TrendingUp,
      'home': TrendingUp,
      'briefcase': Briefcase,
      'user-check': TrendingUp,
      'more-horizontal': TrendingUp
    };
    return iconMap[iconName] || TrendingUp;
  };

  const handleSubmit = async (data: EditInvestmentFormData) => {
    console.log('🔥 EDIT: handleSubmit called with:', data);
    
    try {
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const updateData: UpdateInvestmentInput = {
        name: data.name,
        current_price: data.current_price,
        type: data.type
      };

      // Add optional fields only if they have values
      if (data.symbol) updateData.symbol = data.symbol;
      if (tags.length > 0) updateData.tags = tags;
      if (data.platform) updateData.platform = data.platform;
      if (data.account_number) updateData.account_number = data.account_number;
      if (data.folio_number) updateData.folio_number = data.folio_number;
      if (data.maturity_date) updateData.maturity_date = data.maturity_date;
      if (data.interest_rate) updateData.interest_rate = data.interest_rate;
      if (data.exchange) updateData.exchange = data.exchange;
      if (data.notes) updateData.notes = data.notes;

      console.log('🔥 EDIT: Update data being sent:', updateData);
      await onSubmit(investment.id, updateData);
    } catch (error) {
      console.error('EditInvestmentForm handleSubmit error:', error);
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

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
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
              "text-2xl font-bold mb-2 flex items-center justify-center space-x-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Edit3 className="h-6 w-6" />
              <span>{t('editTitle')}</span>
            </CardTitle>
            <p className={cn(
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>
              {t('editTitle')} - {investment.name}
            </p>
          </motion.div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Basic Information Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className={cn(
                  "text-lg font-semibold border-b pb-2",
                  theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'
                )}>
                  {t('steps.basicInfo')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Investment Name */}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Symbol */}
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">{t('symbol')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('symbolPlaceholder')}
                            className="h-12 text-base"
                            {...field} 
                          />
                        </FormControl>
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
                        <FormLabel className="text-base font-semibold">{t('investmentType')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder={t('selectType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(INVESTMENT_TYPES).map(([key, type]) => (
                              <SelectItem key={key} value={key} className="text-base py-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{type.label}</p>
                                    <p className="text-sm text-gray-500">{type.description}</p>
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
                              placeholder={t('currentPricePlaceholder')}
                              className="h-12 text-base pl-11"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>

              {/* Platform & Account Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <h3 className={cn(
                  "text-lg font-semibold border-b pb-2",
                  theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'
                )}>
                  Platform & Account Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform/Broker</FormLabel>
                        <FormControl>
                          <Input placeholder={t('platformPlaceholder')} {...field} />
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
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder={t('accountNumberPlaceholder')} {...field} />
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
                        <FormLabel>Folio Number</FormLabel>
                        <FormControl>
                          <Input placeholder={t('folioNumberPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>

              {/* Additional Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h3 className={cn(
                  "text-lg font-semibold border-b pb-2",
                  theme === 'dark' ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'
                )}>
                  Additional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maturity_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maturity Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate % (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={t('interestRatePlaceholder')}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
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
                      <FormLabel>Exchange (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder={t('exchangePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('notesPlaceholder')}
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
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
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input 
                            placeholder={t('tagsPlaceholder')}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Summary Card */}
              {form.watch('name') && (
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
                    )}>{t('title')}</h3>
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
                        Current: {form.watch('current_price')} {investment.currency}
                      </p>
                      <p className={cn(
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      )}>Total Units: {investment.total_units}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="px-6"
                >
                  <X className="h-4 w-4 mr-2" />
                  {tCommon('cancel')}
                </Button>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? t('updating') : t('updateButton')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}