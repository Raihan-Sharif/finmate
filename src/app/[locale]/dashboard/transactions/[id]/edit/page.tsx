'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Receipt,
  Save,
  Tag,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionService } from '@/lib/services/transactions';
import { CategoryService } from '@/lib/services/categories';
import { AccountService } from '@/lib/services/accounts';
import { RecurringTransactionService } from '@/lib/services/recurring-transactions';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

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

export default function EditTransactionPage() {
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTransaction, setLoadingTransaction] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [recurringTransactionId, setRecurringTransactionId] = useState<string | null>(null);

  const currency = profile?.currency || 'USD';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<TransactionForm>();

  const watchedType = watch('type');
  const watchedCategory = watch('category');
  const watchedTags = watch('tags') || [];
  const watchedRecurring = watch('recurring');
  const watchedAmount = watch('amount');

  // Load transaction data with recurring data using improved method
  useEffect(() => {
    const loadTransaction = async () => {
      if (!user?.id || !transactionId) return;
      
      try {
        setLoadingTransaction(true);
        // Use the new method that handles recurring data properly
        const transactionWithRecurring = await TransactionService.getTransactionWithRecurringById(transactionId, user.id);
        
        if (!transactionWithRecurring) {
          toast.error(t('form.errors.transactionNotFound') || 'Transaction not found');
          router.push('/dashboard/transactions');
          return;
        }

        const transaction = transactionWithRecurring;
        const recurringData = transactionWithRecurring.recurring_transaction;

        // Determine recurring status and frequency
        let isRecurring = false;
        let recurringFrequency = '';

        if (recurringData) {
          isRecurring = true;
          recurringFrequency = recurringData.frequency;
          setRecurringTransactionId(recurringData.id);
        } else if (transaction.is_recurring) {
          // Fallback: transaction is marked as recurring but no template found
          isRecurring = true;
          recurringFrequency = transaction.recurring_pattern?.frequency || '';
        }

        // Reset form with transaction data
        reset({
          type: transaction.type === 'transfer' ? 'expense' : transaction.type, // Convert transfer to expense for form
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category_id || '',
          subcategory: (transaction as any).subcategory_id || '',
          account: transaction.account_id || '',
          date: transaction.date,
          notes: transaction.notes || '',
          tags: transaction.tags || [],
          recurring: isRecurring,
          recurringFrequency: recurringFrequency,
          location: transaction.location || '',
          vendor: transaction.vendor || '',
        });
      } catch (error) {
        console.error('Error loading transaction:', error);
        toast.error('Failed to load transaction'); // Keep English for system error
        router.push('/dashboard/transactions');
      } finally {
        setLoadingTransaction(false);
      }
    };

    loadTransaction();
  }, [user?.id, transactionId, reset, router]);

  // Load categories and accounts
  useEffect(() => {
    const loadData = async () => {
      if (!user || !watchedType) return;
      
      try {
        setLoadingData(true);
        
        const [categoriesData, accountsData] = await Promise.all([
          CategoryService.getCategories(watchedType),
          AccountService.getAccounts(user.id) // Use user-specific accounts
        ]);
        
        setCategories(categoriesData);
        setAccounts(accountsData);
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
        return;
      }

      try {
        const subcategoriesData = await CategoryService.getSubcategories(watchedCategory);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error('Error loading subcategories:', error);
        setSubcategories([]);
      }
    };

    loadSubcategories();
  }, [watchedCategory]);

  const onSubmit = async (data: TransactionForm) => {
    if (!user || !transactionId) {
      toast.error(t('form.errors.loginRequired'));
      return;
    }

    setIsLoading(true);
    try {
      let newRecurringTemplateId = recurringTransactionId;

      // Handle recurring transaction updates
      if (data.recurring && data.recurringFrequency) {
        if (recurringTransactionId) {
          // Update existing recurring transaction
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

          await RecurringTransactionService.updateRecurringTransaction(
            recurringTransactionId,
            {
              transaction_template: template,
              frequency: data.recurringFrequency as any,
            },
            user.id
          );
        } else {
          // Create new recurring transaction
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

          const nextExecution = RecurringTransactionService.calculateNextExecution(
            data.date,
            data.recurringFrequency
          );

          const newRecurring = await RecurringTransactionService.createRecurringTransaction({
            user_id: user.id,
            transaction_template: template,
            frequency: data.recurringFrequency as any,
            start_date: data.date,
            next_execution: nextExecution,
            is_active: true
          });

          newRecurringTemplateId = newRecurring.id;
        }
      } else if (recurringTransactionId && !data.recurring) {
        // Remove recurring transaction if recurring was turned off
        await RecurringTransactionService.deleteRecurringTransaction(recurringTransactionId, user.id);
        newRecurringTemplateId = null;
      }

      const transactionData = {
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
        recurring_template_id: newRecurringTemplateId,
        recurring_pattern: null, // Keep for backward compatibility
      };

      // Update the main transaction
      await TransactionService.updateTransaction(transactionId, transactionData, user.id);

      // Show appropriate success message
      if (data.recurring && data.recurringFrequency) {
        if (recurringTransactionId) {
          toast.success(t('form.success.recurringUpdated') || 'Transaction and recurring schedule updated successfully!');
        } else {
          toast.success(t('form.success.recurringCreated'));
        }
      } else if (recurringTransactionId && !data.recurring) {
        toast.success(t('form.success.recurringRemoved') || 'Transaction updated and recurring schedule removed!');
      } else {
        toast.success(t('form.success.transactionUpdated'));
      }
      
      router.push('/dashboard/transactions');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error(error.message || t('form.errors.updateFailed') || 'Failed to update transaction');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (loadingTransaction) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
              <Receipt className="w-8 h-8 mr-3 text-blue-600" />
              {t('form.editTransaction')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('form.updateTransaction', { type: watchedType === 'income' ? tCommon('income') : tCommon('expense') }) || `Update your ${watchedType} transaction details`}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Transaction Type & Amount */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    {t('form.transactionDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('form.transactionType')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={watchedType === 'expense' ? 'default' : 'outline'}
                          onClick={() => setValue('type', 'expense')}
                          className="h-12"
                        >
                          <Receipt className="w-4 h-4 mr-2" />
                          {t('form.expense')}
                        </Button>
                        <Button
                          type="button"
                          variant={watchedType === 'income' ? 'default' : 'outline'}
                          onClick={() => setValue('type', 'income')}
                          className="h-12"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t('form.income')}
                        </Button>
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
                      <Select 
                        value={watch('category') || ''} 
                        onValueChange={(value) => {
                          setValue('category', value);
                          setValue('subcategory', ''); // Reset subcategory when category changes
                        }} 
                        disabled={loadingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingData ? t('form.loadingCategories') : t('form.selectCategory', { type: watchedType === 'income' ? tCommon('income') : tCommon('expense') })} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {t('form.noCategoriesFound')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('form.subcategory')}</Label>
                      <Select 
                        value={watch('subcategory') || ''} 
                        onValueChange={(value) => setValue('subcategory', value)} 
                        disabled={!watchedCategory || subcategories.length === 0}
                      >
                        <SelectTrigger>
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
                                {subcategory.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {t('form.noSubcategoriesAvailable')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('form.account')}</Label>
                      <Select 
                        value={watch('account') || ''} 
                        onValueChange={(value) => setValue('account', value)} 
                        disabled={loadingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingData ? t('form.loadingAccounts') : t('form.selectAccount')} />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
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
          </div>

          {/* Additional Details */}
          <div className="space-y-6">
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
                  <div className="grid grid-cols-1 gap-4">
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

                  {/* Recurring */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={watchedRecurring}
                        onCheckedChange={(checked) => setValue('recurring', checked)}
                      />
                      <Label>{t('form.recurringLabel')}</Label>
                    </div>

                    {watchedRecurring && (
                      <div className="space-y-2">
                        <Label>{t('form.repeatFrequency')}</Label>
                        <Select 
                          value={watch('recurringFrequency') || ''} 
                          onValueChange={(value) => setValue('recurringFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.repeatFrequencyPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">{t('form.weekly')}</SelectItem>
                            <SelectItem value="biweekly">{t('form.biweekly')}</SelectItem>
                            <SelectItem value="monthly">{t('form.monthly')}</SelectItem>
                            <SelectItem value="quarterly">{t('form.quarterly')}</SelectItem>
                            <SelectItem value="yearly">{t('form.yearly')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
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
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between pt-6 border-t"
        >
          <Link href="/dashboard/transactions">
            <Button type="button" variant="outline">
              {tCommon('cancel')}
            </Button>
          </Link>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {t('form.updating') || 'Updating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('form.updateTransactionButton')}
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}