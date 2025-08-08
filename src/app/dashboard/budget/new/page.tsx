'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Target, AlertTriangle, Plus, Tag, Info } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { BudgetInsert, BudgetPeriod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function NewBudgetPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { createBudget, isCreating } = useBudgets();
  const { budgetCategories, isLoading: categoriesLoading } = useCategories('expense');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    period: 'monthly' as BudgetPeriod,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    alert_threshold: 80,
    alert_enabled: true,
    category_ids: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!profile?.user_id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const budgetData: BudgetInsert = {
        user_id: profile.user_id!,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: formData.start_date || '',
        end_date: formData.end_date || '',
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : null,
        alert_percentage: formData.alert_threshold,
        alert_enabled: formData.alert_enabled,
      };

      createBudget(budgetData, {
        onSuccess: () => {
          router.push('/dashboard/budget');
        }
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Failed to create budget');
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
      end_date: getEndDateForPeriod(prev.start_date || '', period)
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

  const currency = profile?.currency || 'BDT';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <Link href="/dashboard/budget">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budgets
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Budget</h1>
          <p className="text-muted-foreground mt-1">
            Set spending limits to achieve your financial goals
          </p>
        </div>
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
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Button type="submit" className="w-full" disabled={isCreating}>
                        {isCreating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Budget
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