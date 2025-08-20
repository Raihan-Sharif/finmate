'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Target, AlertTriangle, Save, Tag, Info, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { BudgetUpdate, BudgetPeriod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface EditBudgetPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBudgetPage({ params }: EditBudgetPageProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateBudget, deleteBudget, getBudgetById, isUpdating, isDeleting } = useBudgets();
  const { budgetCategories, isLoading: categoriesLoading } = useCategories('expense');
  
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [budgetId, setBudgetId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    period: 'monthly' as BudgetPeriod,
    start_date: '',
    end_date: '',
    alert_threshold: 80,
    alert_enabled: true,
    category_ids: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get budget ID from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setBudgetId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Load budget data
  useEffect(() => {
    const loadBudget = async () => {
      if (!profile?.user_id || !budgetId) return;
      
      try {
        const budgetData = await getBudgetById(budgetId);
        if (!budgetData) {
          toast.error('Budget not found');
          router.push('/dashboard/budget');
          return;
        }

        setBudget(budgetData);
        setFormData({
          name: budgetData.name,
          description: budgetData.description || '',
          amount: budgetData.amount.toString(),
          period: budgetData.period as BudgetPeriod,
          start_date: budgetData.start_date,
          end_date: budgetData.end_date,
          alert_threshold: budgetData.alert_percentage || 80,
          alert_enabled: budgetData.alert_enabled !== undefined ? budgetData.alert_enabled : true,
          category_ids: budgetData.category_ids || []
        });
      } catch (error) {
        console.error('Error loading budget:', error);
        toast.error('Failed to load budget');
        router.push('/dashboard/budget');
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [budgetId, profile?.user_id, getBudgetById, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Budget amount must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.alert_threshold < 1 || formData.alert_threshold > 100) {
      newErrors.alert_threshold = 'Alert threshold must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (!budgetId) {
      toast.error('Budget ID not found');
      return;
    }

    try {
      const updates: BudgetUpdate = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : null,
        alert_percentage: formData.alert_threshold,
        alert_enabled: formData.alert_enabled,
      };

      updateBudget({ id: budgetId, updates }, {
        onSuccess: () => {
          router.push('/dashboard/budget');
        }
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const handleDelete = async () => {
    if (!budgetId) return;

    try {
      deleteBudget(budgetId, {
        onSuccess: () => {
          router.push('/dashboard/budget');
        }
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const handlePeriodChange = (period: BudgetPeriod) => {
    setFormData(prev => ({
      ...prev,
      period,
      end_date: getEndDateForPeriod(prev.start_date, period)
    }));
  };

  const getEndDateForPeriod = (startDate: string, period: BudgetPeriod): string => {
    const start = new Date(startDate);
    let end: Date;

    switch (period) {
      case 'weekly':
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'monthly':
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        break;
      case 'yearly':
        end = new Date(start.getFullYear(), 11, 31);
        break;
      default:
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    }

    return end?.toISOString().split('T')[0] || '';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Budget not found or you don't have permission to edit it.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/budget">
          <Button variant="outline">Back to Budgets</Button>
        </Link>
      </div>
    );
  }

  const currency = profile?.currency || 'BDT';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/budget">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budgets
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Budget</h1>
            <p className="text-muted-foreground mt-1">
              Update your budget settings and spending limits
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Budget
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this budget? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-orange-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Budget Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., Monthly Food Budget"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this budget..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Budget Amount *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                      <Label htmlFor="period">Budget Period *</Label>
                      <Select value={formData.period} onValueChange={handlePeriodChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            start_date: e.target.value,
                            end_date: getEndDateForPeriod(e.target.value, prev.period)
                          }))}
                          className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
                    </div>

                    <div>
                      <Label htmlFor="end_date">End Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                          className={`pl-10 ${errors.end_date ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Category Selection */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-blue-600" />
                    Categories
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select categories to track in this budget. Leave empty to track all expenses.
                  </p>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2 p-3 rounded-lg border-2 animate-pulse">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                          <div className="h-4 bg-gray-200 rounded flex-1"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {budgetCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                          formData.category_ids.includes(category.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          formData.category_ids.includes(category.id) 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.category_ids.includes(category.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!categoriesLoading && formData.category_ids.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Selected Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.category_ids.map((categoryId) => {
                          const category = budgetCategories.find(c => c.id === categoryId);
                          return category ? (
                            <Badge key={categoryId} variant="secondary">
                              <div
                                className="w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Alert Settings */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                    Alert Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alert_enabled" className="text-base">Enable Budget Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when you approach your budget limit
                      </p>
                    </div>
                    <Switch
                      id="alert_enabled"
                      checked={formData.alert_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, alert_enabled: checked }))}
                    />
                  </div>

                  {formData.alert_enabled && (
                    <>
                      <div>
                        <Label htmlFor="alert_threshold">
                          Alert Threshold ({formData.alert_threshold}%)
                        </Label>
                        <Input
                          id="alert_threshold"
                          type="range"
                          min="1"
                          max="100"
                          value={formData.alert_threshold}
                          onChange={(e) => setFormData(prev => ({ ...prev, alert_threshold: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>1%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                        {errors.alert_threshold && <p className="text-sm text-red-500 mt-1">{errors.alert_threshold}</p>}
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          You'll receive notifications when spending reaches {formData.alert_threshold}% of your budget.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(parseFloat(formData.amount) || 0, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Period:</span>
                      <Badge variant="secondary">{formData.period}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Duration:</span>
                      <span className="text-sm">
                        {formData.start_date && formData.end_date && 
                          `${Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                        }
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Categories:</span>
                      <span className="text-sm">
                        {formData.category_ids.length === 0 ? 'All' : formData.category_ids.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Alert at:</span>
                      <span className="text-sm">
                        {formatCurrency((parseFloat(formData.amount) || 0) * (formData.alert_threshold / 100), currency)}
                      </span>
                    </div>

                    {budget && (
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Current Spent:</span>
                          <span className="text-sm">
                            {formatCurrency(budget.spent || 0, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Remaining:</span>
                          <span className={`text-sm ${(budget.amount - (budget.spent || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(budget.amount - (budget.spent || 0), currency)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Button type="submit" className="w-full" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Update Budget
                          </>
                        )}
                      </Button>

                      <Button type="button" variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/budget">Cancel</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}