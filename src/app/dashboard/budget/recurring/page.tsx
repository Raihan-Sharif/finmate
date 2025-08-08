'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Plus,
  RefreshCw,
  Copy,
  Info,
  Zap,
  Clock,
  Search,
  Save,
  Edit,
  Trash2,
  Star,
  History
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { BudgetPeriod } from '@/types';
import { BudgetTemplate } from '@/lib/services/budgetTemplates';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};


export default function RecurringBudgetPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { budgetCategories, isLoading: categoriesLoading } = useCategories('expense');
  const { 
    createRecurringBudget, 
    createFromPreviousMonth,
    isCreatingRecurring, 
    isCreatingFromPrevious 
  } = useBudgets();
  
  const {
    templates,
    userTemplates,
    globalTemplates,
    popularTemplates,
    recentTemplates,
    isLoading: templatesLoading,
    searchQuery,
    setSearchQuery,
    saveAsTemplate,
    deleteTemplate,
    duplicateTemplate,
    incrementUsage,
    canManageGlobal,
    isSaving,
    isDeleting,
    isDuplicating
  } = useBudgetTemplates();

  const [customTemplate, setCustomTemplate] = useState<BudgetTemplate>({
    name: '',
    description: '',
    amount: 0,
    period: 'monthly',
    alert_percentage: 80,
    alert_enabled: true,
    is_global: false,
    category_ids: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null);
  const [recurringMonths, setRecurringMonths] = useState(12);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);

  const currency = profile?.currency || 'BDT';

  const validateCustomTemplate = () => {
    const newErrors: Record<string, string> = {};

    if (!customTemplate.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!customTemplate.amount || customTemplate.amount <= 0) {
      newErrors.amount = 'Budget amount must be greater than 0';
    }

    if (customTemplate.alert_percentage < 1 || customTemplate.alert_percentage > 100) {
      newErrors.alert_percentage = 'Alert threshold must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRecurring = (template: BudgetTemplate) => {
    // Increment usage count for the template
    if (template.id) {
      incrementUsage(template.id);
    }
    
    createRecurringBudget({ template, months: recurringMonths }, {
      onSuccess: () => {
        toast.success(`Created ${recurringMonths} recurring budgets successfully!`);
        router.push('/dashboard/budget');
      }
    });
  };

  const handleCreateFromPrevious = () => {
    createFromPreviousMonth(undefined, {
      onSuccess: (budgets) => {
        toast.success(`Created ${budgets.length} budgets from previous month!`);
        router.push('/dashboard/budget');
      }
    });
  };

  const handleCreateCustomRecurring = () => {
    if (!validateCustomTemplate()) {
      toast.error('Please fix the form errors');
      return;
    }

    handleCreateRecurring(customTemplate);
  };
  
  const handleSaveCustomTemplate = () => {
    if (!validateCustomTemplate()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    saveAsTemplate({
      name: customTemplate.name,
      description: customTemplate.description,
      amount: customTemplate.amount,
      period: customTemplate.period,
      category_ids: customTemplate.category_ids,
      alert_percentage: customTemplate.alert_percentage,
      alert_enabled: customTemplate.alert_enabled,
      is_global: canManageGlobal ? customTemplate.is_global : false,
      currency: profile?.currency || 'BDT'
    });
  };
  
  const handleEditTemplate = (template: BudgetTemplate) => {
    setEditingTemplate(template);
    setCustomTemplate({
      name: template.name,
      description: template.description || '',
      amount: template.amount,
      period: template.period,
      category_ids: template.category_ids || [],
      alert_percentage: template.alert_percentage,
      alert_enabled: template.alert_enabled ?? true,
      is_global: template.is_global ?? false
    });
  };
  
  const handleDeleteTemplate = (template: BudgetTemplate) => {
    if (template.id && !template.is_global) {
      deleteTemplate(template.id);
    }
  };
  
  const handleDuplicateTemplate = (template: BudgetTemplate) => {
    if (template.id) {
      duplicateTemplate({ id: template.id, newName: `${template.name} (Copy)` });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setCustomTemplate(prev => ({
      ...prev,
      category_ids: prev.category_ids?.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...(prev.category_ids || []), categoryId]
    }));
  };
  
  const displayedTemplates = searchQuery ? templates : [...userTemplates, ...globalTemplates];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
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
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Zap className="w-8 h-8 mr-3 text-purple-600" />
            Recurring Budgets
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate your budget creation with templates and recurring setups
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-green-600" />
                Quick Actions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Fast ways to create budgets based on existing patterns
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Copy from Previous Month</h3>
                    <p className="text-sm text-muted-foreground">
                      Create budgets identical to last month's setup
                    </p>
                  </div>
                  <Copy className="w-5 h-5 text-blue-600" />
                </div>
                <Button 
                  onClick={handleCreateFromPrevious}
                  disabled={isCreatingFromPrevious}
                  className="w-full"
                >
                  {isCreatingFromPrevious ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Previous Month
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will create budgets for the current month based on your previous month's budget settings, 
                  maintaining the same amounts and categories.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Budget Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-600" />
                Budget Templates
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Choose from your saved templates or global templates
                </p>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Templates */}
                  {userTemplates.length > 0 && !searchQuery && (
                    <div>
                      <div className="flex items-center mb-3">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        <h4 className="font-medium text-sm">Your Templates</h4>
                      </div>
                      <div className="space-y-2">
                        {userTemplates.map((template) => (
                          <div
                            key={template.id}
                            className={`p-3 border rounded-lg transition-colors cursor-pointer group ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(template.amount, currency)}
                                </Badge>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTemplate(template);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateTemplate(template);
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTemplate(template);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {template.description}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <span className="capitalize">{template.period}</span>
                              <span>Alert at {template.alert_percentage}%</span>
                              {template.usage_count && template.usage_count > 0 && (
                                <span>Used {template.usage_count}x</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Global Templates */}
                  {displayedTemplates.filter(t => t.is_global).length > 0 && (
                    <div>
                      {!searchQuery && userTemplates.length > 0 && <Separator className="my-4" />}
                      <div className="flex items-center mb-3">
                        <Zap className="w-4 h-4 mr-1 text-purple-500" />
                        <h4 className="font-medium text-sm">Global Templates</h4>
                      </div>
                      <div className="space-y-2">
                        {displayedTemplates.filter(t => t.is_global).map((template) => (
                          <div
                            key={template.id}
                            className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(template.amount, currency)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {template.description}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <span className="capitalize">{template.period}</span>
                              <span>Alert at {template.alert_percentage}%</span>
                              <span className="text-purple-600">Global</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayedTemplates.length === 0 && searchQuery && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        No templates found matching "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="months">Create for how many months?</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="months"
                      type="number"
                      min="1"
                      max="24"
                      value={recurringMonths}
                      onChange={(e) => setRecurringMonths(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">months</span>
                  </div>
                </div>

                <Button
                  onClick={() => selectedTemplate && handleCreateRecurring(selectedTemplate)}
                  disabled={!selectedTemplate || isCreatingRecurring}
                  className="w-full"
                >
                  {isCreatingRecurring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Recurring Budget
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Custom Template Creator */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                Custom Template
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create a custom recurring budget template
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    type="text"
                    placeholder="e.g., Monthly Essentials"
                    value={customTemplate.name}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    placeholder="Brief description of this budget template..."
                    value={customTemplate.description}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-amount">Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="template-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={customTemplate.amount || ''}
                        onChange={(e) => setCustomTemplate(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="template-period">Period</Label>
                    <Select 
                      value={customTemplate.period} 
                      onValueChange={(value) => setCustomTemplate(prev => ({ ...prev, period: value as BudgetPeriod }))}
                    >
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Budget Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when approaching budget limit
                      </p>
                    </div>
                    <Switch
                      checked={customTemplate.alert_enabled ?? true}
                      onCheckedChange={(checked) => setCustomTemplate(prev => ({ ...prev, alert_enabled: checked }))}
                    />
                  </div>

                  {customTemplate.alert_enabled && (
                    <div>
                      <Label htmlFor="template-threshold">
                        Alert Threshold ({customTemplate.alert_percentage}%)
                      </Label>
                      <Input
                        id="template-threshold"
                        type="range"
                        min="1"
                        max="100"
                        value={customTemplate.alert_percentage}
                        onChange={(e) => setCustomTemplate(prev => ({ ...prev, alert_percentage: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                      {errors.alert_percentage && <p className="text-sm text-red-500 mt-1">{errors.alert_percentage}</p>}
                    </div>
                  )}
                </div>

                {/* Global Template Toggle (Admin Only) */}
                {canManageGlobal && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-600" />
                        Make Global Template
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        This template will be available to all users
                      </p>
                    </div>
                    <Switch
                      checked={customTemplate.is_global ?? false}
                      onCheckedChange={(checked) => setCustomTemplate(prev => ({ ...prev, is_global: checked }))}
                    />
                  </div>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <Label>Categories (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select categories for this budget template
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {budgetCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center space-x-2 p-2 rounded border transition-colors cursor-pointer ${
                        customTemplate.category_ids?.includes(category.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <Checkbox
                        checked={customTemplate.category_ids?.includes(category.id) || false}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs font-medium">{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Recurring Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <Label htmlFor="custom-months">Recurring Duration</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    id="custom-months"
                    type="number"
                    min="1"
                    max="24"
                    value={recurringMonths}
                    onChange={(e) => setRecurringMonths(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">months</span>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This will create {recurringMonths} budgets starting from next month, 
                    each with the amount of {formatCurrency(customTemplate.amount, currency)}.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleCreateCustomRecurring}
                  disabled={isCreatingRecurring}
                  className="w-full"
                >
                  {isCreatingRecurring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Recurring Budget
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleSaveCustomTemplate}
                  disabled={isSaving || !customTemplate.name.trim()}
                  variant="outline"
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingTemplate ? 'Update Template' : 'Save as Template'}
                    </>
                  )}
                </Button>
                
                {editingTemplate && (
                  <Button
                    onClick={() => {
                      setEditingTemplate(null);
                      setCustomTemplate({
                        name: '',
                        description: '',
                        amount: 0,
                        period: 'monthly',
                        alert_percentage: 80,
                        alert_enabled: true,
                        is_global: false,
                        category_ids: []
                      });
                    }}
                    variant="ghost"
                    className="w-full"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}