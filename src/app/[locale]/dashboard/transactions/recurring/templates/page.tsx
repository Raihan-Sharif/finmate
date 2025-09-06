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
import { CategoryService } from '@/lib/services/categories';
import { AccountService } from '@/lib/services/accounts';
import { RecurringTransactionService } from '@/lib/services/recurring-transactions';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Edit,
  Plus,
  Save,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface TemplateForm {
  name: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory?: string;
  account: string;
  notes?: string;
  tags: string[];
  vendor?: string;
  location?: string;
  frequency: string;
  is_active: boolean;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function RecurringTemplatesPage() {
  const t = useTranslations('transactions.recurring');
  const tForm = useTranslations('transactions.form');
  const tCommon = useTranslations('common');
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  
  const currency = profile?.currency || 'BDT';
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<TemplateForm>({
    defaultValues: {
      type: 'expense',
      tags: [],
      is_active: true,
      amount: 0,
      frequency: 'monthly'
    }
  });

  const watchedType = watch('type');
  const watchedCategory = watch('category');
  const watchedTags = watch('tags') || [];

  // Load templates and data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const [templatesData, categoriesData, accountsData] = await Promise.all([
          RecurringTransactionService.getRecurringTransactions(user.id),
          CategoryService.getCategories(),
          AccountService.getAccounts(user.id)
        ]);
        
        setTemplates(templatesData);
        setCategories(categoriesData);
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(t('messages.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, t]);

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

  const onSubmit = async (data: TemplateForm) => {
    if (!user) {
      toast.error(tForm('errors.loginRequired'));
      return;
    }

    if (!data.frequency) {
      toast.error('Please select a frequency');
      return;
    }

    try {
      const template = {
        type: data.type,
        amount: parseFloat(data.amount.toString()),
        currency: currency,
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
        new Date().toISOString().split('T')[0] as string,
        data.frequency || 'monthly'
      );

      if (editingTemplate) {
        // Update existing template
        await RecurringTransactionService.updateRecurringTransaction(
          editingTemplate.id,
          {
            transaction_template: template,
            frequency: (data.frequency || 'monthly') as any,
            is_active: data.is_active
          },
          user.id
        );
        toast.success(t('templates.updated'));
      } else {
        // Create new template
        await RecurringTransactionService.createRecurringTransaction({
          user_id: user.id,
          transaction_template: template,
          frequency: (data.frequency || 'monthly') as any,
          start_date: new Date().toISOString().split('T')[0] as string,
          next_execution: nextExecution,
          is_active: data.is_active
        });
        toast.success(t('templates.created'));
      }

      // Refresh templates
      const templatesData = await RecurringTransactionService.getRecurringTransactions(user.id);
      setTemplates(templatesData);
      
      // Reset form
      setShowCreateForm(false);
      setEditingTemplate(null);
      reset({
        type: 'expense',
        tags: [],
        is_active: true,
        amount: 0,
        frequency: 'monthly'
      });
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || t('templates.saveFailed'));
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setShowCreateForm(true);
    
    const templateData = template.transaction_template;
    reset({
      name: template.name || '',
      description: templateData?.description || '',
      type: templateData?.type || 'expense',
      amount: templateData?.amount || 0,
      category: templateData?.category_id || '',
      subcategory: templateData?.subcategory_id || '',
      account: templateData?.account_id || '',
      notes: templateData?.notes || '',
      tags: templateData?.tags || [],
      vendor: templateData?.vendor || '',
      location: templateData?.location || '',
      frequency: template.frequency || 'monthly',
      is_active: template.is_active
    });
  };

  const handleDelete = async (templateId: string) => {
    if (!user || !confirm(t('templates.deleteConfirm'))) return;
    
    try {
      await RecurringTransactionService.deleteRecurringTransaction(templateId, user.id);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success(t('messages.deleted'));
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(t('messages.deleteFailed'));
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/transactions/recurring">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToRecurring')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Clock className="w-8 h-8 mr-3 text-blue-600" />
              {t('templates.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('templates.subtitle')}
            </p>
          </div>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('templates.create')}
        </Button>
      </motion.div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTemplate ? t('templates.edit') : t('templates.create')}
              </CardTitle>
              <CardDescription>
                {t('templates.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">{tForm('description')}</Label>
                    <Input
                      id="description"
                      placeholder={tForm('descriptionPlaceholder')}
                      {...register('description', { required: tForm('errors.descriptionRequired') })}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{tForm('transactionType')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={watchedType === 'expense' ? 'default' : 'outline'}
                        onClick={() => setValue('type', 'expense')}
                        className="h-10"
                      >
                        {tForm('expense')}
                      </Button>
                      <Button
                        type="button"
                        variant={watchedType === 'income' ? 'default' : 'outline'}
                        onClick={() => setValue('type', 'income')}
                        className="h-10"
                      >
                        {tForm('income')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">{tForm('amount')}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground">
                        {currency === 'USD' ? '$' : currency}
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder={tForm('amountPlaceholder')}
                        className="pl-10"
                        {...register('amount', {
                          required: tForm('errors.amountRequired'),
                          min: { value: 0.01, message: tForm('errors.amountMustBeGreater') }
                        })}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{tForm('repeatFrequency')}</Label>
                    <Select onValueChange={(value) => setValue('frequency', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder={tForm('repeatFrequencyPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{tForm('weekly')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="biweekly">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{tForm('biweekly')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="monthly">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{tForm('monthly')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="quarterly">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{tForm('quarterly')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="yearly">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{tForm('yearly')}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{tForm('category')}</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={tForm('selectCategory', { type: watchedType === 'income' ? tCommon('income') : tCommon('expense') })} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat.type === watchedType).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tForm('subcategory')}</Label>
                    <Select 
                      onValueChange={(value) => setValue('subcategory', value)}
                      disabled={!watchedCategory || subcategories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !watchedCategory 
                            ? tForm('selectCategoryFirst')
                            : subcategories.length === 0 
                              ? tForm('noSubcategories')
                              : tForm('selectSubcategory')
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: subcategory.color }}
                              />
                              <span>{subcategory.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tForm('account')}</Label>
                    <Select onValueChange={(value) => setValue('account', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={tForm('selectAccount')} />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: account.color }}
                              />
                              <span>{account.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">{tForm('vendor')}</Label>
                    <Input
                      id="vendor"
                      placeholder={tForm('vendorPlaceholder')}
                      {...register('vendor')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">{tForm('location')}</Label>
                    <Input
                      id="location"
                      placeholder={tForm('locationPlaceholder')}
                      {...register('location')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tForm('tags')}</Label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={tForm('tagsPlaceholder')}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10"
                      />
                    </div>
                    <Button type="button" onClick={addTag} size="sm">
                      {tForm('addTag')}
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

                <div className="space-y-2">
                  <Label htmlFor="notes">{tForm('notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={tForm('notesPlaceholder')}
                    rows={3}
                    {...register('notes')}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                  <Label>{t('status.active')}</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      reset({
                        type: 'expense',
                        tags: [],
                        is_active: true,
                        amount: 0,
                        frequency: 'monthly'
                      });
                    }}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    {editingTemplate ? tCommon('update') : tCommon('create')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Templates List */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('templates.empty.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('templates.empty.description')}
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('templates.create')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${!template.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        template.transaction_template?.type === 'income' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <DollarSign className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {template.transaction_template?.description || t('labels.untitledTransaction')}
                          </h3>
                          <Badge 
                            variant={template.transaction_template?.type === 'income' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {template.transaction_template?.type === 'income' ? tCommon('income') : tCommon('expense')}
                          </Badge>
                          <Badge 
                            className="text-xs bg-blue-100 text-blue-800"
                          >
                            {t(`frequency.${template.frequency}`)}
                          </Badge>
                          {!template.is_active && (
                            <Badge variant="outline" className="text-xs">
                              {t('status.paused')}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('labels.amount')}: {formatCurrency(template.transaction_template?.amount || 0, currency)}
                          {template.next_execution && (
                            <span className="ml-3">
                              {t('labels.next')}: {new Date(template.next_execution).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title={t('actions.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                        title={t('actions.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}