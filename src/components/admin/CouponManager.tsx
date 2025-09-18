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
import {
  Gift,
  Plus,
  Search,
  Filter,
  Edit2,
  Copy,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Coupon {
  id: string
  code: string
  description: string
  type: 'percentage' | 'fixed_amount'
  value: number
  max_uses: number | null
  max_uses_per_user: number | null
  minimum_amount: number | null
  max_discount_amount: number | null
  expires_at: string | null
  scope: 'all' | 'new_users' | 'existing_users'
  applicable_plans: string[] | null
  used_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CouponForm {
  code: string
  description: string
  type: 'percentage' | 'fixed_amount'
  value: string
  max_uses: string
  max_uses_per_user: string
  minimum_amount: string
  max_discount_amount: string
  expires_at: string
  scope: 'all' | 'new_users' | 'existing_users'
  applicable_plans: string[]
  is_active: boolean
}

export function CouponManager() {
  const t = useTranslations('common')

  // Data states
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([])

  // UI states
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [couponForm, setCouponForm] = useState<CouponForm>({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    max_uses: '',
    max_uses_per_user: '',
    minimum_amount: '',
    max_discount_amount: '',
    expires_at: '',
    scope: 'all',
    applicable_plans: [],
    is_active: true
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  useEffect(() => {
    filterCoupons()
  }, [coupons, searchQuery, statusFilter])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscription/coupons')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch coupons')
      }

      setCoupons(result.coupons || [])
    } catch (error: any) {
      console.error('Error loading coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const filterCoupons = () => {
    let filtered = [...coupons]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(coupon =>
        coupon.code.toLowerCase().includes(query) ||
        coupon.description.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(coupon => coupon.is_active && (!coupon.expires_at || new Date(coupon.expires_at) > new Date()))
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(coupon => !coupon.is_active)
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(coupon => coupon.expires_at && new Date(coupon.expires_at) <= new Date())
      }
    }

    setFilteredCoupons(filtered)
  }

  const createCoupon = async () => {
    try {
      setProcessingId('create')

      // Validate form
      if (!couponForm.code || !couponForm.type || !couponForm.value) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/admin/subscription/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponForm.code.trim(),
          description: couponForm.description,
          type: couponForm.type,
          value: parseFloat(couponForm.value),
          max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null,
          max_uses_per_user: couponForm.max_uses_per_user ? parseInt(couponForm.max_uses_per_user) : null,
          minimum_amount: couponForm.minimum_amount ? parseFloat(couponForm.minimum_amount) : null,
          max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : null,
          expires_at: couponForm.expires_at || null,
          scope: couponForm.scope,
          applicable_plans: couponForm.applicable_plans.length > 0 ? couponForm.applicable_plans : null,
          is_active: couponForm.is_active
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create coupon')
      }

      toast.success('Coupon created successfully')
      setShowCreateModal(false)
      resetForm()
      await loadCoupons()

    } catch (error: any) {
      console.error('Error creating coupon:', error)
      toast.error(error.message || 'Failed to create coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      setProcessingId(couponId)

      const response = await fetch('/api/admin/subscription/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: couponId,
          is_active: !currentStatus
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update coupon')
      }

      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await loadCoupons()

    } catch (error: any) {
      console.error('Error updating coupon:', error)
      toast.error(error.message || 'Failed to update coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const resetForm = () => {
    setCouponForm({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      max_uses: '',
      max_uses_per_user: '',
      minimum_amount: '',
      max_discount_amount: '',
      expires_at: '',
      scope: 'all',
      applicable_plans: [],
      is_active: true
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getCouponStatusColor = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    }
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  }

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return 'Inactive'
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) return 'Expired'
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return 'Used Up'
    return 'Active'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading coupons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Coupon Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage discount coupons for subscriptions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Total Coupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="text-2xl font-bold">
                  {coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Total Usage</p>
                <p className="text-2xl font-bold">
                  {coupons.reduce((sum, c) => sum + c.used_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Expired</p>
                <p className="text-2xl font-bold">
                  {coupons.filter(c => c.expires_at && new Date(c.expires_at) <= new Date()).length}
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
                placeholder="Search coupons..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
          <CardDescription>Manage your discount coupons</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
              <p className="text-slate-500 mb-4">Create your first coupon to get started</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold font-mono text-lg">{coupon.code}</h4>
                        <Badge className={cn("text-xs", getCouponStatusColor(coupon))}>
                          {getCouponStatus(coupon)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(coupon.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {coupon.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>
                          {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `৳${coupon.value} OFF`}
                        </span>
                        <span>Used: {coupon.used_count}/{coupon.max_uses || '∞'}</span>
                        {coupon.expires_at && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Expires: {format(new Date(coupon.expires_at), 'MMM dd, yyyy')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                      disabled={processingId === coupon.id}
                    />
                    {processingId === coupon.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <span>Create New Coupon</span>
            </DialogTitle>
            <DialogDescription>
              Create a new discount coupon for subscription plans
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Coupon Code *</Label>
                <Input
                  id="coupon-code"
                  placeholder="e.g., SAVE20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-type">Discount Type *</Label>
                <Select value={couponForm.type} onValueChange={(value: 'percentage' | 'fixed_amount') => setCouponForm({ ...couponForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {couponForm.type === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'} *
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  placeholder={couponForm.type === 'percentage' ? '20' : '100'}
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires-at">Expiry Date</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this coupon is for..."
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-uses">Maximum Total Uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={couponForm.max_uses}
                  onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-uses-per-user">Max Uses Per User</Label>
                <Input
                  id="max-uses-per-user"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={couponForm.max_uses_per_user}
                  onChange={(e) => setCouponForm({ ...couponForm, max_uses_per_user: e.target.value })}
                />
              </div>
            </div>

            {/* Restrictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum-amount">Minimum Order Amount (৳)</Label>
                <Input
                  id="minimum-amount"
                  type="number"
                  placeholder="Leave empty for no minimum"
                  value={couponForm.minimum_amount}
                  onChange={(e) => setCouponForm({ ...couponForm, minimum_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-discount">Maximum Discount (৳)</Label>
                <Input
                  id="max-discount"
                  type="number"
                  placeholder="Leave empty for no limit"
                  value={couponForm.max_discount_amount}
                  onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Target Audience</Label>
              <Select value={couponForm.scope} onValueChange={(value: 'all' | 'new_users' | 'existing_users') => setCouponForm({ ...couponForm, scope: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="new_users">New Users Only</SelectItem>
                  <SelectItem value="existing_users">Existing Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={couponForm.is_active}
                onCheckedChange={(checked) => setCouponForm({ ...couponForm, is_active: checked })}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={createCoupon}
                disabled={processingId === 'create'}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {processingId === 'create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Create Coupon
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