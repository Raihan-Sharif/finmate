'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Copy,
  Percent,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Coupon {
  id: string
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  max_uses?: number
  max_uses_per_user?: number
  used_count: number
  minimum_amount?: number
  max_discount_amount?: number
  expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function CouponAdmin() {
  const t = useTranslations('admin.coupons')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    max_uses: '',
    max_uses_per_user: '',
    minimum_amount: '',
    max_discount_amount: '',
    expires_at: '',
    is_active: true
  })

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (error: any) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to fetch coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      max_uses: '',
      max_uses_per_user: '',
      minimum_amount: '',
      max_discount_amount: '',
      expires_at: '',
      is_active: true
    })
  }

  const handleCreate = async () => {
    try {
      setProcessingId('create')
      
      const insertData: any = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: formData.value,
        is_active: formData.is_active
      }

      if (formData.max_uses) insertData.max_uses = parseInt(formData.max_uses)
      if (formData.max_uses_per_user) insertData.max_uses_per_user = parseInt(formData.max_uses_per_user)
      if (formData.minimum_amount) insertData.minimum_amount = parseFloat(formData.minimum_amount)
      if (formData.max_discount_amount) insertData.max_discount_amount = parseFloat(formData.max_discount_amount)
      if (formData.expires_at) insertData.expires_at = new Date(formData.expires_at).toISOString()

      const { error } = await supabase
        .from('coupons')
        .insert([insertData])

      if (error) throw error

      toast.success('Coupon created successfully!')
      setShowCreateModal(false)
      resetForm()
      fetchCoupons()
    } catch (error: any) {
      console.error('Error creating coupon:', error)
      toast.error(error.message || 'Failed to create coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const handleEdit = async () => {
    if (!selectedCoupon) return
    
    try {
      setProcessingId(selectedCoupon.id)
      
      const updateData: any = {
        description: formData.description,
        type: formData.type,
        value: formData.value,
        is_active: formData.is_active
      }

      if (formData.max_uses) updateData.max_uses = parseInt(formData.max_uses)
      if (formData.max_uses_per_user) updateData.max_uses_per_user = parseInt(formData.max_uses_per_user)
      if (formData.minimum_amount) updateData.minimum_amount = parseFloat(formData.minimum_amount)
      if (formData.max_discount_amount) updateData.max_discount_amount = parseFloat(formData.max_discount_amount)
      if (formData.expires_at) updateData.expires_at = new Date(formData.expires_at).toISOString()

      const { error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', selectedCoupon.id)

      if (error) throw error

      toast.success('Coupon updated successfully!')
      setShowEditModal(false)
      setSelectedCoupon(null)
      resetForm()
      fetchCoupons()
    } catch (error: any) {
      console.error('Error updating coupon:', error)
      toast.error(error.message || 'Failed to update coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return
    
    try {
      setProcessingId(coupon.id)
      
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id)

      if (error) throw error

      toast.success('Coupon deleted successfully!')
      fetchCoupons()
    } catch (error: any) {
      console.error('Error deleting coupon:', error)
      toast.error('Failed to delete coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const toggleStatus = async (coupon: Coupon) => {
    try {
      setProcessingId(coupon.id)
      
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)

      if (error) throw error

      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}!`)
      fetchCoupons()
    } catch (error: any) {
      console.error('Error toggling coupon status:', error)
      toast.error('Failed to update coupon status')
    } finally {
      setProcessingId(null)
    }
  }

  const openEditModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      max_uses: coupon.max_uses?.toString() || '',
      max_uses_per_user: coupon.max_uses_per_user?.toString() || '',
      minimum_amount: coupon.minimum_amount?.toString() || '',
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      expires_at: coupon.expires_at ? format(new Date(coupon.expires_at), 'yyyy-MM-dd') : '',
      is_active: coupon.is_active
    })
    setShowEditModal(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Coupon code copied!')
    } catch (error) {
      toast.error('Failed to copy coupon code')
    }
  }

  const getStatusColor = (coupon: Coupon) => {
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

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.max_uses) return 0
    return Math.min((coupon.used_count / coupon.max_uses) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Coupon Management</h2>
          <p className="text-gray-600">Create and manage discount coupons for subscriptions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired/Full</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.filter(c => 
                (c.expires_at && new Date(c.expires_at) <= new Date()) || 
                (c.max_uses && c.used_count >= c.max_uses)
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {coupons.map((coupon) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn(
                "transition-all duration-200 hover:shadow-md",
                !coupon.is_active && "opacity-60"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(coupon.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <CardDescription>{coupon.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(coupon)}>
                        {!coupon.is_active 
                          ? 'Inactive' 
                          : coupon.expires_at && new Date(coupon.expires_at) <= new Date()
                          ? 'Expired'
                          : coupon.max_uses && coupon.used_count >= coupon.max_uses
                          ? 'Limit Reached'
                          : 'Active'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-gray-500">Discount</Label>
                      <div className="flex items-center">
                        {coupon.type === 'percentage' ? (
                          <Percent className="h-3 w-3 mr-1" />
                        ) : (
                          <DollarSign className="h-3 w-3 mr-1" />
                        )}
                        <span className="font-semibold">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">Usage</Label>
                      <div className="font-semibold">
                        {coupon.used_count}{coupon.max_uses && ` / ${coupon.max_uses}`}
                      </div>
                      {coupon.max_uses && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${getUsagePercentage(coupon)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">Min Amount</Label>
                      <div className="font-semibold">
                        {coupon.minimum_amount ? `৳${coupon.minimum_amount}` : 'None'}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">Max Discount</Label>
                      <div className="font-semibold">
                        {coupon.max_discount_amount ? `৳${coupon.max_discount_amount}` : 'Unlimited'}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">Expires</Label>
                      <div className="font-semibold text-xs">
                        {coupon.expires_at ? format(new Date(coupon.expires_at), 'MMM dd, yyyy') : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStatus(coupon)}
                      disabled={processingId === coupon.id}
                    >
                      {processingId === coupon.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : coupon.is_active ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {coupon.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(coupon)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(coupon)}
                      disabled={processingId === coupon.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {processingId === coupon.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {coupons.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No coupons found</h3>
                <p className="text-gray-600">Create your first coupon to get started.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedCoupon(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showCreateModal ? 'Create New Coupon' : 'Edit Coupon'}
            </DialogTitle>
            <DialogDescription>
              {showCreateModal 
                ? 'Create a new discount coupon for subscriptions.' 
                : 'Update the coupon details.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="SAVE20"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                disabled={showEditModal} // Don't allow editing code
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">
                {formData.type === 'percentage' ? 'Percentage Value *' : 'Fixed Amount (৳) *'}
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                max={formData.type === 'percentage' ? '100' : undefined}
                placeholder={formData.type === 'percentage' ? '20' : '50'}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_uses">Maximum Uses</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                placeholder="100"
                value={formData.max_uses}
                onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_uses_per_user">Max Uses Per User</Label>
              <Input
                id="max_uses_per_user"
                type="number"
                min="1"
                placeholder="1"
                value={formData.max_uses_per_user}
                onChange={(e) => setFormData(prev => ({ ...prev, max_uses_per_user: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimum_amount">Minimum Amount (৳)</Label>
              <Input
                id="minimum_amount"
                type="number"
                min="0"
                placeholder="100"
                value={formData.minimum_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_amount: e.target.value }))}
              />
            </div>
            
            {formData.type === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="max_discount_amount">Max Discount Amount (৳)</Label>
                <Input
                  id="max_discount_amount"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Get 20% off on any subscription plan"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (users can use this coupon)</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={showCreateModal ? handleCreate : handleEdit}
              disabled={processingId === 'create' || processingId === selectedCoupon?.id}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {processingId === 'create' || processingId === selectedCoupon?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {showCreateModal ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  {showCreateModal ? 'Create Coupon' : 'Update Coupon'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}