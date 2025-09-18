'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Crown,
  Users,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpDown,
  Building2,
  Wallet,
  Landmark,
  CreditCard,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SubscriptionPlan {
  id: string
  plan_name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number | null
  features: string[]
  max_accounts: number
  max_family_members: number
  allowed_account_types: string[]
  is_popular: boolean
  is_active: boolean
  sort_order: number
  subscriber_count?: number
  created_at: string
  updated_at: string
}

interface PlanForm {
  plan_name: string
  display_name: string
  description: string
  price_monthly: string
  price_yearly: string
  features: string[]
  max_accounts: string
  max_family_members: string
  allowed_account_types: string[]
  is_popular: boolean
  is_active: boolean
  sort_order: string
}

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
  { value: 'investment', label: 'Investment', icon: TrendingUp },
  { value: 'savings', label: 'Savings', icon: Landmark },
  { value: 'other', label: 'Other', icon: Package }
]

const COMMON_FEATURES = [
  'Unlimited Transactions',
  'Monthly Reports',
  'Budget Management',
  'Investment Tracking',
  'Multi-Currency Support',
  'Family Sharing',
  'Premium Support',
  'Data Export',
  'AI Insights',
  'Advanced Analytics',
  'Custom Categories',
  'Bank Sync',
  'Bill Reminders',
  'Goal Tracking',
  'Tax Reports',
  'API Access'
]

export function SubscriptionPlansManager() {
  const t = useTranslations('common')

  // Data states
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([])

  // UI states
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [planForm, setPlanForm] = useState<PlanForm>({
    plan_name: '',
    display_name: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    features: [],
    max_accounts: '3',
    max_family_members: '1',
    allowed_account_types: ['cash', 'bank'],
    is_popular: false,
    is_active: true,
    sort_order: '0'
  })

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    filterPlans()
  }, [plans, searchQuery, statusFilter])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscription/plans')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch plans')
      }

      setPlans(result.plans || [])
    } catch (error: any) {
      console.error('Error loading plans:', error)
      toast.error('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const filterPlans = () => {
    let filtered = [...plans]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(plan =>
        plan.plan_name.toLowerCase().includes(query) ||
        plan.display_name.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan =>
        statusFilter === 'active' ? plan.is_active : !plan.is_active
      )
    }

    setFilteredPlans(filtered)
  }

  const createPlan = async () => {
    try {
      setProcessingId('create')

      // Validate form
      if (!planForm.plan_name || !planForm.display_name || !planForm.price_monthly) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/admin/subscription/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: planForm.plan_name.trim().toLowerCase(),
          display_name: planForm.display_name.trim(),
          description: planForm.description,
          price_monthly: parseFloat(planForm.price_monthly),
          price_yearly: planForm.price_yearly ? parseFloat(planForm.price_yearly) : null,
          features: planForm.features,
          max_accounts: parseInt(planForm.max_accounts),
          max_family_members: parseInt(planForm.max_family_members),
          allowed_account_types: planForm.allowed_account_types,
          is_popular: planForm.is_popular,
          is_active: planForm.is_active,
          sort_order: parseInt(planForm.sort_order) || 0
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create plan')
      }

      toast.success('Subscription plan created successfully')
      setShowCreateModal(false)
      resetForm()
      await loadPlans()

    } catch (error: any) {
      console.error('Error creating plan:', error)
      toast.error(error.message || 'Failed to create plan')
    } finally {
      setProcessingId(null)
    }
  }

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      setProcessingId(planId)

      const response = await fetch('/api/admin/subscription/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: planId,
          is_active: !currentStatus
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update plan')
      }

      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await loadPlans()

    } catch (error: any) {
      console.error('Error updating plan:', error)
      toast.error(error.message || 'Failed to update plan')
    } finally {
      setProcessingId(null)
    }
  }

  const resetForm = () => {
    setPlanForm({
      plan_name: '',
      display_name: '',
      description: '',
      price_monthly: '',
      price_yearly: '',
      features: [],
      max_accounts: '3',
      max_family_members: '1',
      allowed_account_types: ['cash', 'bank'],
      is_popular: false,
      is_active: true,
      sort_order: '0'
    })
  }

  const addFeature = (feature: string) => {
    if (!planForm.features.includes(feature)) {
      setPlanForm({
        ...planForm,
        features: [...planForm.features, feature]
      })
    }
  }

  const removeFeature = (feature: string) => {
    setPlanForm({
      ...planForm,
      features: planForm.features.filter(f => f !== feature)
    })
  }

  const toggleAccountType = (accountType: string) => {
    const updatedTypes = planForm.allowed_account_types.includes(accountType)
      ? planForm.allowed_account_types.filter(type => type !== accountType)
      : [...planForm.allowed_account_types, accountType]

    setPlanForm({
      ...planForm,
      allowed_account_types: updatedTypes
    })
  }

  const getAccountTypeIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type)
    const Icon = accountType?.icon || Package
    return <Icon className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Subscription Plans
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your subscription plans and pricing
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Total Plans</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Active Plans</p>
                <p className="text-2xl font-bold">
                  {plans.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Popular Plans</p>
                <p className="text-2xl font-bold">
                  {plans.filter(p => p.is_popular).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Total Subscribers</p>
                <p className="text-2xl font-bold">
                  {plans.reduce((sum, p) => sum + (p.subscriber_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={cn(
              "h-full relative overflow-hidden",
              plan.is_popular && "ring-2 ring-yellow-400 dark:ring-yellow-600",
              !plan.is_active && "opacity-60"
            )}>
              {plan.is_popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 text-xs font-semibold">
                  <Star className="h-3 w-3 inline mr-1" />
                  Popular
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <Switch
                    checked={plan.is_active}
                    onCheckedChange={() => togglePlanStatus(plan.id, plan.is_active)}
                    disabled={processingId === plan.id}
                  />
                </div>

                <div>
                  <CardTitle className="text-xl font-bold">{plan.display_name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold">৳{plan.price_monthly.toLocaleString()}</span>
                    <span className="text-sm text-slate-500">/month</span>
                  </div>
                  {plan.price_yearly && (
                    <div className="flex items-baseline space-x-2 text-sm">
                      <span className="text-lg font-semibold text-emerald-600">৳{plan.price_yearly.toLocaleString()}</span>
                      <span className="text-slate-500">/year</span>
                      <Badge variant="outline" className="text-xs">
                        Save {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Features</h5>
                  <div className="space-y-1">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <div className="text-xs text-slate-500">+{plan.features.length - 4} more features</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Accounts</span>
                    <p className="font-medium">{plan.max_accounts}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Family Members</span>
                    <p className="font-medium">{plan.max_family_members}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-sm">Account Types</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plan.allowed_account_types.slice(0, 3).map(type => (
                      <div key={type} className="flex items-center space-x-1 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {getAccountTypeIcon(type)}
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </div>
                    ))}
                    {plan.allowed_account_types.length > 3 && (
                      <div className="text-xs text-slate-500 px-2 py-1">+{plan.allowed_account_types.length - 3}</div>
                    )}
                  </div>
                </div>

                {plan.subscriber_count !== undefined && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-slate-500">Subscribers</span>
                    <span className="font-medium flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {plan.subscriber_count}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">No plans found</h3>
            <p className="text-slate-500 mb-4">Create your first subscription plan to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Plan Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-emerald-600" />
              <span>Create Subscription Plan</span>
            </DialogTitle>
            <DialogDescription>
              Create a new subscription plan with features and pricing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name *</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g., basic"
                  value={planForm.plan_name}
                  onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value.toLowerCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name *</Label>
                <Input
                  id="display-name"
                  placeholder="e.g., Basic Plan"
                  value={planForm.display_name}
                  onChange={(e) => setPlanForm({ ...planForm, display_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this subscription plan..."
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-monthly">Monthly Price (৳) *</Label>
                <Input
                  id="price-monthly"
                  type="number"
                  placeholder="99"
                  value={planForm.price_monthly}
                  onChange={(e) => setPlanForm({ ...planForm, price_monthly: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-yearly">Yearly Price (৳)</Label>
                <Input
                  id="price-yearly"
                  type="number"
                  placeholder="999"
                  value={planForm.price_yearly}
                  onChange={(e) => setPlanForm({ ...planForm, price_yearly: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  placeholder="0"
                  value={planForm.sort_order}
                  onChange={(e) => setPlanForm({ ...planForm, sort_order: e.target.value })}
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-accounts">Max Accounts</Label>
                <Input
                  id="max-accounts"
                  type="number"
                  value={planForm.max_accounts}
                  onChange={(e) => setPlanForm({ ...planForm, max_accounts: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-family">Max Family Members</Label>
                <Input
                  id="max-family"
                  type="number"
                  value={planForm.max_family_members}
                  onChange={(e) => setPlanForm({ ...planForm, max_family_members: e.target.value })}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COMMON_FEATURES.map(feature => (
                  <Button
                    key={feature}
                    variant={planForm.features.includes(feature) ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      planForm.features.includes(feature)
                        ? removeFeature(feature)
                        : addFeature(feature)
                    }
                    className="justify-start h-auto py-2"
                  >
                    <CheckCircle className={cn(
                      "h-3 w-3 mr-2",
                      planForm.features.includes(feature) ? "opacity-100" : "opacity-30"
                    )} />
                    <span className="text-xs">{feature}</span>
                  </Button>
                ))}
              </div>
              <div className="text-xs text-slate-500">
                Selected: {planForm.features.length} features
              </div>
            </div>

            {/* Account Types */}
            <div className="space-y-3">
              <Label>Allowed Account Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ACCOUNT_TYPES.map(accountType => {
                  const Icon = accountType.icon
                  return (
                    <Button
                      key={accountType.value}
                      variant={planForm.allowed_account_types.includes(accountType.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAccountType(accountType.value)}
                      className="justify-start h-auto py-3"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-xs">{accountType.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-popular"
                  checked={planForm.is_popular}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_popular: checked })}
                />
                <Label htmlFor="is-popular">Popular Plan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={createPlan}
                disabled={processingId === 'create'}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {processingId === 'create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Create Plan
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                disabled={processingId === 'create'}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}