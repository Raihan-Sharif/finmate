'use client';

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
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionService } from '@/lib/services/transactions';
import { CategoryService } from '@/lib/services/categories';
import { AccountService } from '@/lib/services/accounts';
import { supabase } from '@/lib/supabase/client';
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

export default function NewTransactionPage() {
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
        
        // Load categories for the selected type
        const [categoriesData, accountsData] = await Promise.all([
          CategoryService.getCategories(watchedType),
          AccountService.getAccounts(user.id)
        ]);
        
        // If no data found, create default data
        if (categoriesData.length === 0 || accountsData.length === 0) {
          try {
            // Call the function to create default accounts and global categories
            await supabase.rpc('create_default_accounts', { user_id_param: user.id });
            await supabase.rpc('create_global_categories');
            
            // Small delay to ensure data is created
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Reload data after creating defaults
            const [newCategoriesData, newAccountsData] = await Promise.all([
              CategoryService.getCategories(watchedType),
              AccountService.getAccounts(user.id)
            ]);
            
            setCategories(newCategoriesData);
            setAccounts(newAccountsData);
            
            toast.success('Default categories and accounts created!');
          } catch (createError) {
            console.error('Error creating default data:', createError);
            toast.error('Failed to create default data');
            setCategories(categoriesData);
            setAccounts(accountsData);
          }
        } else {
          setCategories(categoriesData);
          setAccounts(accountsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load categories and accounts');
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
      toast.error('You must be logged in to create transactions');
      return;
    }

    setIsLoading(true);
    try {
      // Convert form data to database format
      const transactionData = {
        user_id: user.id,
        type: data.type,
        amount: parseFloat(data.amount.toString()),
        currency: profile?.currency || 'USD',
        description: data.description,
        notes: data.notes || null,
        category_id: data.category || null,
        subcategory_id: data.subcategory || null,
        account_id: data.account || null,
        date: data.date,
        tags: data.tags || [],
        location: data.location || null,
        vendor: data.vendor || null,
        is_recurring: data.recurring,
        recurring_pattern: data.recurring && data.recurringFrequency 
          ? { frequency: data.recurringFrequency }
          : null,
      };

      console.log('Saving transaction data:', transactionData);

      // Save to database
      const savedTransaction = await TransactionService.createTransaction(transactionData);
      
      toast.success('Transaction created successfully!');
      router.push('/dashboard/transactions');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(error.message || 'Failed to save transaction');
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
              Back to Transactions
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Plus className="w-8 h-8 mr-3 text-blue-600" />
              Add New Transaction
            </h1>
            <p className="text-muted-foreground mt-1">
              Record a new {watchedType} transaction
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Type & Amount */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transaction Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={watchedType === 'expense' ? 'default' : 'outline'}
                          onClick={() => setValue('type', 'expense')}
                          className="h-12"
                        >
                          <Receipt className="w-4 h-4 mr-2" />
                          Expense
                        </Button>
                        <Button
                          type="button"
                          variant={watchedType === 'income' ? 'default' : 'outline'}
                          onClick={() => setValue('type', 'income')}
                          className="h-12"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Income
                        </Button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-muted-foreground">
                          {currency === 'USD' ? '$' : currency}
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10 text-lg font-semibold h-12"
                          {...register('amount', {
                            required: 'Amount is required',
                            min: { value: 0.01, message: 'Amount must be greater than 0' }
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
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="What was this transaction for?"
                      {...register('description', { required: 'Description is required' })}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Category, Subcategory and Account */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select onValueChange={(value) => setValue('category', value)} disabled={loadingData}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingData ? 'Loading...' : `Select ${watchedType} category`} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.length > 0 ? (
                            availableCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No categories found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Subcategory</Label>
                      <Select 
                        onValueChange={(value) => setValue('subcategory', value)} 
                        disabled={!watchedCategory || subcategories.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchedCategory 
                              ? 'Select category first' 
                              : subcategories.length === 0 
                                ? 'No subcategories' 
                                : 'Select subcategory'
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
                              No subcategories available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account</Label>
                      <Select onValueChange={(value) => setValue('account', value)} disabled={loadingData}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingData ? 'Loading...' : 'Select account'} />
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
                              No accounts found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Transaction Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        className="pl-10"
                        {...register('date', { required: 'Date is required' })}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>
                    Optional information to help organize your transaction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vendor/Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor/Payee</Label>
                      <Input
                        id="vendor"
                        placeholder="Who did you pay or receive from?"
                        {...register('vendor')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Where did this transaction happen?"
                        {...register('location')}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Add tags to categorize this transaction"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="pl-10"
                        />
                      </div>
                      <Button type="button" onClick={addTag} size="sm">
                        Add
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
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about this transaction..."
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
                    Recurring Transaction
                  </CardTitle>
                  <CardDescription>
                    Set up this transaction to repeat automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={watchedRecurring}
                      onCheckedChange={(checked) => setValue('recurring', checked)}
                    />
                    <Label>This is a recurring transaction</Label>
                  </div>

                  {watchedRecurring && (
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select onValueChange={(value) => setValue('recurringFrequency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="How often does this repeat?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                    Receipt
                  </CardTitle>
                  <CardDescription>
                    Upload a photo or scan of your receipt
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
                                Click to change
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                              <p className="text-sm font-medium">
                                Upload Receipt
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG, PDF up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
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
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <Calculator className="w-4 h-4 mr-2" />
                    Split Transaction
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <Receipt className="w-4 h-4 mr-2" />
                    Duplicate Transaction
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                    <Tag className="w-4 h-4 mr-2" />
                    Save as Template
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
              Cancel
            </Button>
          </Link>
          
          <div className="flex space-x-3">
            <Button type="button" variant="outline">
              Save & Add Another
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Transaction
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}