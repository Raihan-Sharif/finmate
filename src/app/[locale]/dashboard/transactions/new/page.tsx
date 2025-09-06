'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { AccountService } from '@/lib/services/accounts';
import { CategoryService } from '@/lib/services/categories';
import { RecurringTransactionService } from '@/lib/services/recurring-transactions';
import { TransactionService } from '@/lib/services/transactions';
import { supabase } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calculator,
  Calendar,
  Camera,
  DollarSign,
  Plus,
  Receipt,
  Save,
  Tag,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

// Categories and accounts are now loaded from database

interface TransactionForm {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  account: string;
  date: string;
  notes?: string;
  tags: string[];
  recurring: boolean;
  recurringFrequency?: string;
  location?: string;
  vendor?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const cardHover = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02, 
    y: -5,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    } 
  }
};

const buttonScale = {
  initial: { scale: 1 },
  whileHover: { scale: 1.05, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } }
};

export default function NewTransactionPage() {
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const defaultType = (searchParams.get('type') as 'income' | 'expense') || 'expense';
  const currency = profile?.currency || 'USD';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TransactionForm>({
    defaultValues: {
      type: defaultType,
      date: new Date().toISOString().split('T')[0] || '',
      tags: [] as string[],
      recurring: false,
      amount: 0,
      description: '',
      category: '',
      subcategory: '',
      account: ''
    }
  });

  const watchedType = watch('type');
  const watchedCategory = watch('category');
  const watchedTags = watch('tags') || [];
  const watchedRecurring = watch('recurring');
  const watchedAmount = watch('amount');

  // Load categories and accounts
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        
        // Load categories for the selected type and global accounts
        const [categoriesData, accountsData] = await Promise.all([
          CategoryService.getCategories(watchedType),
          AccountService.getAccounts(user.id)
        ]);
        
        // If no data found, create default data
        if (categoriesData.length === 0 || accountsData.length === 0) {
          try {
            // Call the function to create global categories and accounts
            await supabase.rpc('create_global_categories');
            await supabase.rpc('create_global_accounts');
            
            // Small delay to ensure data is created
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Reload data after creating defaults
            const [newCategoriesData, newAccountsData] = await Promise.all([
              CategoryService.getCategories(watchedType),
              AccountService.getAccounts(user.id)
            ]);
            
            setCategories(newCategoriesData);
            setAccounts(newAccountsData);
            
            toast.success(t('form.success.defaultDataCreated'));
          } catch (createError) {
            console.error('Error creating default data:', createError);
            toast.error('Failed to create default data'); // Keep English for system error
            setCategories(categoriesData);
            setAccounts(accountsData);
          }
        } else {
          setCategories(categoriesData);
          setAccounts(accountsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load categories and accounts'); // Keep English for system error
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, watchedType]);

  // Load subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!watchedCategory) {
        setSubcategories([]);
        setValue('subcategory', '');
        return;
      }

      try {
        const subcategoriesData = await CategoryService.getSubcategories(watchedCategory);
        setSubcategories(subcategoriesData);
        setValue('subcategory', ''); // Reset subcategory when category changes
      } catch (error) {
        console.error('Error loading subcategories:', error);
        setSubcategories([]);
      }
    };

    loadSubcategories();
  }, [watchedCategory, setValue]);

  const availableCategories = categories;

  const onSubmit = async (data: TransactionForm) => {
    if (!user) {
      toast.error(t('form.errors.loginRequired'));
      return;
    }

    setIsLoading(true);
    try {
      let recurringTemplateId = null;

      // If it's a recurring transaction, create the recurring template first
      if (data.recurring && data.recurringFrequency) {
        // Create transaction template (without user-specific data)
        const template = {
          type: data.type,
          amount: parseFloat(data.amount.toString()),
          currency: profile?.currency || 'BDT',
          description: data.description,
          notes: data.notes || null,
          category_id: data.category || null,
          subcategory_id: data.subcategory || null,
          account_id: data.account || null,
          tags: data.tags || [],
          location: data.location || null,
          vendor: data.vendor || null,
        };
        
        // Calculate next execution date
        const nextExecution = RecurringTransactionService.calculateNextExecution(
          data.date, 
          data.recurringFrequency
        );

        const recurringTransaction = await RecurringTransactionService.createRecurringTransaction({
          user_id: user.id,
          transaction_template: template,
          frequency: data.recurringFrequency as any,
          start_date: data.date,
          next_execution: nextExecution,
          is_active: true
        });

        recurringTemplateId = recurringTransaction.id;
      }

      // Convert form data to database format
      const transactionData = {
        user_id: user.id,
        type: data.type,
        amount: parseFloat(data.amount.toString()),
        currency: profile?.currency || 'BDT',
        description: data.description,
        notes: data.notes || null,
        category_id: data.category || null,
        subcategory_id: data.subcategory || null,
        account_id: data.account || null,
        date: data.date,
        tags: data.tags || [],
        location: data.location || null,
        vendor: data.vendor || null,
        is_recurring: data.recurring || false,
        recurring_template_id: recurringTemplateId, // Link to recurring template
        recurring_pattern: null, // Keep for backward compatibility
      };

      console.log('Saving transaction data:', transactionData);

      // Save the main transaction to database
      const savedTransaction = await TransactionService.createTransaction(transactionData);

      if (data.recurring && data.recurringFrequency) {
        toast.success(t('form.success.recurringCreated'));
      } else {
        toast.success(t('form.success.transactionCreated'));
      }
      
      router.push('/dashboard/transactions');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(error.message || t('form.errors.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceipt(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('form.backToTransactions')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Plus className="w-8 h-8 mr-3 text-blue-600" />
              {t('form.newTransaction')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('form.recordTransaction', { type: watchedType === 'income' ? tCommon('income') : tCommon('expense') })}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Type & Amount */}
            <motion.div 
              variants={fadeInUp} 
              initial="initial" 
              animate="animate"
              whileHover="hover"
            >
              <motion.div
                variants={cardHover}
                className="relative"
              >
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center">
                      <motion.div 
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="mr-2"
                      >
                        <DollarSign className="w-5 h-5" />
                      </motion.div>
                      {t('form.transactionDetails')}
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('form.transactionType')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.div variants={buttonScale} whileHover="whileHover" whileTap="whileTap">
                          <Button
                            type="button"
                            variant={watchedType === 'expense' ? 'default' : 'outline'}
                            onClick={() => setValue('type', 'expense')}
                            className={cn(
                              "h-12 w-full transition-all duration-300 transform",
                              watchedType === 'expense' 
                                ? "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25 border-0" 
                                : "hover:shadow-md hover:border-red-200"
                            )}
                          >
                            <motion.div
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                              transition={{ duration: 0.5 }}
                              className="mr-2"
                            >
                              <Receipt className="w-4 h-4" />
                            </motion.div>
                            {t('form.expense')}
                          </Button>
                        </motion.div>
                        
                        <motion.div variants={buttonScale} whileHover="whileHover" whileTap="whileTap">
                          <Button
                            type="button"
                            variant={watchedType === 'income' ? 'default' : 'outline'}
                            onClick={() => setValue('type', 'income')}
                            className={cn(
                              "h-12 w-full transition-all duration-300 transform",
                              watchedType === 'income' 
                                ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25 border-0" 
                                : "hover:shadow-md hover:border-green-200"
                            )}
                          >
                            <motion.div
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                              transition={{ duration: 0.5 }}
                              className="mr-2"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.div>
                            {t('form.income')}
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t('form.amount')}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-muted-foreground">
                          {currency === 'USD' ? '$' : currency}
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder={t('form.amountPlaceholder')}
                          className="pl-10 text-lg font-semibold h-12"
                          {...register('amount', {
                            required: t('form.errors.amountRequired'),
                            min: { value: 0.01, message: t('form.errors.amountMustBeGreater') }
                          })}
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-red-600">{errors.amount.message}</p>
                      )}
                      {watchedAmount && (
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(watchedAmount, currency)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('form.description')}</Label>
                    <Input
                      id="description"
                      placeholder={t('form.descriptionPlaceholder')}
                      {...register('description', { required: t('form.errors.descriptionRequired') })}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Category, Subcategory and Account */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('form.category')}</Label>
                      <Select onValueChange={(value) => setValue('category', value)} disabled={loadingData}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={loadingData ? t('form.loadingCategories') : t('form.selectCategory', { type: watchedType === 'income' ? tCommon('income') : tCommon('expense') })} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.length > 0 ? (
                            availableCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full border-2 border-gray-200" 
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{category.name}</span>
                                    <Badge 
                                      variant={watchedType === 'income' ? 'default' : 'destructive'} 
                                      className="text-xs capitalize"
                                    >
                                      {category.type || watchedType}
                                    </Badge>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                                <span>{t('form.noCategoriesFound')}</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('form.subcategory')}</Label>
                      <Select 
                        onValueChange={(value) => setValue('subcategory', value)} 
                        disabled={!watchedCategory || subcategories.length === 0}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={
                            !watchedCategory 
                              ? t('form.selectCategoryFirst') 
                              : subcategories.length === 0 
                                ? t('form.noSubcategories') 
                                : t('form.selectSubcategory')
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.length > 0 ? (
                            subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-gray-300" 
                                    style={{ backgroundColor: subcategory.color || '#6B7280' }}
                                  />
                                  <span className="font-medium">{subcategory.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                                <span>{t('form.noSubcategoriesAvailable')}</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('form.account')}</Label>
                      <Select onValueChange={(value) => setValue('account', value)} disabled={loadingData}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={loadingData ? t('form.loadingAccounts') : t('form.selectAccount')} />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: account.color }}
                                    />
                                    <span className="font-medium">{account.name}</span>
                                    {account.type && (
                                      <Badge variant="secondary" className="text-xs">
                                        {account.type.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  {account.balance !== undefined && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {formatCurrency(account.balance, account.currency)}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {t('form.noAccountsFound')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('form.transactionDate')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        className="pl-10"
                        {...register('date', { required: t('form.errors.dateRequired') })}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Additional Details */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t('form.additionalDetails')}</CardTitle>
                  <CardDescription>
                    {t('form.additionalDetailsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vendor/Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">{t('form.vendor')}</Label>
                      <Input
                        id="vendor"
                        placeholder={t('form.vendorPlaceholder')}
                        {...register('vendor')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">{t('form.location')}</Label>
                      <Input
                        id="location"
                        placeholder={t('form.locationPlaceholder')}
                        {...register('location')}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>{t('form.tags')}</Label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('form.tagsPlaceholder')}
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="pl-10"
                        />
                      </div>
                      <Button type="button" onClick={addTag} size="sm">
                        {t('form.addTag')}
                      </Button>
                    </div>
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watchedTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:bg-muted rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('form.notes')}</Label>
                    <Textarea
                      id="notes"
                      placeholder={t('form.notesPlaceholder')}
                      rows={3}
                      {...register('notes')}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recurring Transaction */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    {t('form.recurringTransaction')}
                  </CardTitle>
                  <CardDescription>
                    {t('form.recurringDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={watchedRecurring}
                        onCheckedChange={(checked) => setValue('recurring', checked)}
                      />
                      <div>
                        <Label className="text-base font-medium">{t('form.recurringLabel')}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('form.recurringHelp')}
                        </p>
                      </div>
                    </div>
                    {watchedRecurring && (
                      <Badge variant="secondary" className="ml-4">
                        {t('form.active')}
                      </Badge>
                    )}
                  </div>

                  {watchedRecurring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('form.repeatFrequency')}</Label>
                        <Select onValueChange={(value) => setValue('recurringFrequency', value)}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={t('form.repeatFrequencyPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{t('form.weekly')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="biweekly">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{t('form.biweekly')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{t('form.monthly')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="quarterly">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{t('form.quarterly')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="yearly">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{t('form.yearly')}</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {watchedRecurring && (
                        <div className="mt-3 p-3 rounded-md bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300" dangerouslySetInnerHTML={{ __html: t('form.recurringTip') }} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Receipt Upload */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="w-5 h-5 mr-2" />
                    {t('form.receipt')}
                  </CardTitle>
                  <CardDescription>
                    {t('form.receiptDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        <div className="space-y-2">
                          {receipt ? (
                            <>
                              <Receipt className="w-8 h-8 text-green-600 mx-auto" />
                              <p className="text-sm font-medium text-green-600">
                                {receipt.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('form.clickToChange')}
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                              <p className="text-sm font-medium">
                                {t('form.uploadReceipt')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('form.fileTypes')}
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        {t('form.takePhoto')}
                      </Button>
                      {receipt && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setReceipt(null)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t('form.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <Calculator className="w-4 h-4 mr-2" />
                    {t('form.splitTransaction')}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <Receipt className="w-4 h-4 mr-2" />
                    {t('form.duplicateTransaction')}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <Tag className="w-4 h-4 mr-2" />
                    {t('form.saveAsTemplate')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between pt-6 border-t"
        >
          <Link href="/dashboard/transactions">
            <Button type="button" variant="outline">
              {tCommon('cancel')}
            </Button>
          </Link>
          
          <div className="flex space-x-3">
            <Button type="button" variant="outline">
              {t('form.saveAndAddAnother')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {t('form.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('form.saveTransaction')}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}