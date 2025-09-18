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
  CreditCard,
  Plus,
  Search,
  Edit2,
  Smartphone,
  Building2,
  Wallet,
  Users,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  method_name: string
  display_name: string
  description: string
  icon_url: string | null
  instructions: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface PaymentMethodForm {
  method_name: string
  display_name: string
  description: string
  icon_url: string
  instructions: string
  is_active: boolean
  sort_order: string
}

export function PaymentMethodManager() {
  const t = useTranslations('common')

  // Data states
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([])

  // UI states
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [methodForm, setMethodForm] = useState<PaymentMethodForm>({
    method_name: '',
    display_name: '',
    description: '',
    icon_url: '',
    instructions: '',
    is_active: true,
    sort_order: '0'
  })

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  useEffect(() => {
    filterMethods()
  }, [paymentMethods, searchQuery, statusFilter])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscription/payment-methods')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch payment methods')
      }

      setPaymentMethods(result.payment_methods || [])
    } catch (error: any) {
      console.error('Error loading payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const filterMethods = () => {
    let filtered = [...paymentMethods]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(method =>
        method.method_name.toLowerCase().includes(query) ||
        method.display_name.toLowerCase().includes(query) ||
        method.description.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(method =>
        statusFilter === 'active' ? method.is_active : !method.is_active
      )
    }

    setFilteredMethods(filtered)
  }

  const createPaymentMethod = async () => {
    try {
      setProcessingId('create')

      // Validate form
      if (!methodForm.method_name || !methodForm.display_name) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/admin/subscription/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method_name: methodForm.method_name.trim().toLowerCase(),
          display_name: methodForm.display_name.trim(),
          description: methodForm.description,
          icon_url: methodForm.icon_url || null,
          instructions: methodForm.instructions || null,
          is_active: methodForm.is_active,
          sort_order: parseInt(methodForm.sort_order) || 0
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create payment method')
      }

      toast.success('Payment method created successfully')
      setShowCreateModal(false)
      resetForm()
      await loadPaymentMethods()

    } catch (error: any) {
      console.error('Error creating payment method:', error)
      toast.error(error.message || 'Failed to create payment method')
    } finally {
      setProcessingId(null)
    }
  }

  const toggleMethodStatus = async (methodId: string, currentStatus: boolean) => {
    try {
      setProcessingId(methodId)

      const response = await fetch('/api/admin/subscription/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: methodId,
          is_active: !currentStatus
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update payment method')
      }

      toast.success(`Payment method ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await loadPaymentMethods()

    } catch (error: any) {
      console.error('Error updating payment method:', error)
      toast.error(error.message || 'Failed to update payment method')
    } finally {
      setProcessingId(null)
    }
  }

  const resetForm = () => {
    setMethodForm({
      method_name: '',
      display_name: '',
      description: '',
      icon_url: '',
      instructions: '',
      is_active: true,
      sort_order: '0'
    })
  }

  const getMethodIcon = (methodName: string) => {
    switch (methodName.toLowerCase()) {
      case 'bkash':
        return <Smartphone className="h-5 w-5 text-pink-600" />
      case 'nagad':
        return <Smartphone className="h-5 w-5 text-orange-600" />
      case 'rocket':
        return <Smartphone className="h-5 w-5 text-purple-600" />
      case 'upay':
        return <Smartphone className="h-5 w-5 text-green-600" />
      case 'bank':
        return <Building2 className="h-5 w-5 text-blue-600" />
      case 'card':
        return <CreditCard className="h-5 w-5 text-indigo-600" />
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />
    }
  }

  const commonPaymentMethods = [
    { name: 'bkash', display: 'bKash', icon: 'smartphone' },
    { name: 'nagad', display: 'Nagad', icon: 'smartphone' },
    { name: 'rocket', display: 'Rocket', icon: 'smartphone' },
    { name: 'upay', display: 'Upay', icon: 'smartphone' },
    { name: 'bank', display: 'Bank Transfer', icon: 'building2' },
    { name: 'card', display: 'Credit/Debit Card', icon: 'credit-card' },
    { name: 'paypal', display: 'PayPal', icon: 'wallet' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading payment methods...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Payment Methods
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage available payment methods for subscriptions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Total Methods</p>
                <p className="text-2xl font-bold">{paymentMethods.length}</p>
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
                  {paymentMethods.filter(m => m.is_active).length}
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
                <p className="text-sm font-medium text-slate-500">Inactive</p>
                <p className="text-2xl font-bold">
                  {paymentMethods.filter(m => !m.is_active).length}
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
                placeholder="Search payment methods..."
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
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods ({filteredMethods.length})</CardTitle>
          <CardDescription>Manage available payment options</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold mb-2">No payment methods found</h3>
              <p className="text-slate-500 mb-4">Add your first payment method to get started</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMethods.map((method, index) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      {getMethodIcon(method.method_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-lg">{method.display_name}</h4>
                        <Badge variant={method.is_active ? "default" : "secondary"}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {method.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <ArrowUpDown className="h-3 w-3" />
                          <span>Order: {method.sort_order}</span>
                        </span>
                        <span className="font-mono">{method.method_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={() => toggleMethodStatus(method.id, method.is_active)}
                      disabled={processingId === method.id}
                    />
                    {processingId === method.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Method Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Add Payment Method</span>
            </DialogTitle>
            <DialogDescription>
              Add a new payment method for subscription payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Add Common Methods */}
            <div className="space-y-2">
              <Label>Quick Add</Label>
              <div className="grid grid-cols-2 gap-2">
                {commonPaymentMethods.map((common) => (
                  <Button
                    key={common.name}
                    variant="outline"
                    size="sm"
                    onClick={() => setMethodForm({
                      ...methodForm,
                      method_name: common.name,
                      display_name: common.display
                    })}
                    className="justify-start"
                  >
                    {getMethodIcon(common.name)}
                    <span className="ml-2">{common.display}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method-name">Method Name *</Label>
                <Input
                  id="method-name"
                  placeholder="e.g., bkash"
                  value={methodForm.method_name}
                  onChange={(e) => setMethodForm({ ...methodForm, method_name: e.target.value.toLowerCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name *</Label>
                <Input
                  id="display-name"
                  placeholder="e.g., bKash"
                  value={methodForm.display_name}
                  onChange={(e) => setMethodForm({ ...methodForm, display_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this payment method..."
                value={methodForm.description}
                onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon-url">Icon URL</Label>
                <Input
                  id="icon-url"
                  placeholder="https://example.com/icon.png"
                  value={methodForm.icon_url}
                  onChange={(e) => setMethodForm({ ...methodForm, icon_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  placeholder="0"
                  value={methodForm.sort_order}
                  onChange={(e) => setMethodForm({ ...methodForm, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Payment Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Instructions for users on how to make payments..."
                value={methodForm.instructions}
                onChange={(e) => setMethodForm({ ...methodForm, instructions: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={methodForm.is_active}
                onCheckedChange={(checked) => setMethodForm({ ...methodForm, is_active: checked })}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={createPaymentMethod}
                disabled={processingId === 'create'}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {processingId === 'create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Method
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