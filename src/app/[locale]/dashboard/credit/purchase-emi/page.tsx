'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Laptop,
  Car,
  Home,
  Download,
  Upload,
  Package,
  ShoppingCart
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLoans } from '@/hooks/useEMI'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useAutoTransactions } from '@/hooks/useAutoTransactions'
import { formatCurrency } from '@/lib/utils'
import { LOAN_TYPES, LoanFormData } from '@/types/emi'
import PurchaseEMIForm from '@/components/purchase-emi/PurchaseEMIForm'
import PurchaseEMIViewModal from '@/components/purchase-emi/PurchaseEMIViewModal'
import DeleteLoanDialog from '@/components/loans/DeleteLoanDialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

const purchaseTypeIcons = {
  electronics: Smartphone,
  appliances: Home,
  furniture: Home,
  vehicle: Car,
  jewelry: Package,
  fashion: ShoppingBag,
  other: ShoppingCart
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const PURCHASE_CATEGORIES = [
  { value: 'electronics', key: 'electronics' },
  { value: 'appliances', key: 'appliances' },
  { value: 'furniture', key: 'furniture' },
  { value: 'vehicle', key: 'vehicle' },
  { value: 'jewelry', key: 'jewelry' },
  { value: 'fashion', key: 'fashion' },
  { value: 'other', key: 'other' }
]

export default function PurchaseEMIPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isEMIFormOpen, setIsEMIFormOpen] = useState(false)
  const [editingEMI, setEditingEMI] = useState<any>(null)
  const [selectedEMIs, setSelectedEMIs] = useState<string[]>([])
  const [viewingEMI, setViewingEMI] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [deletingEMI, setDeletingEMI] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const router = useRouter()
  const { formatAmount, getCurrencySymbol } = useAppStore()
  const { loans, loading, addLoan, editLoan, removeLoan } = useLoans()
  const { processLoanPayment, isProcessing: isAutoProcessing } = useAutoTransactions()
  const t = useTranslations('credit')
  const tCommon = useTranslations('common')

  // Filter purchase EMIs (loans with type 'purchase_emi')
  const purchaseEMIs = loans?.filter(loan => loan.type === 'purchase_emi') || []
  
  const filteredEMIs = purchaseEMIs.filter(emi => {
    const matchesSearch = emi.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emi.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || emi.notes?.includes(filterCategory)
    const matchesStatus = filterStatus === 'all' || emi.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calculate totals
  const totalOutstanding = filteredEMIs.reduce((sum, emi) => sum + emi.outstanding_amount, 0)
  const totalMonthlyEMI = filteredEMIs.reduce((sum, emi) => sum + emi.emi_amount, 0)
  const activeEMIs = filteredEMIs.filter(emi => emi.status === 'active').length
  const overdueEMIs = filteredEMIs.filter(emi => 
    emi.status === 'active' && emi.next_due_date && new Date(emi.next_due_date) < new Date()
  ).length

  const handleEMISubmit = async (data: LoanFormData) => {
    try {
      const { formatAmount, profile } = useAppStore.getState()
      
      if (editingEMI) {
        const updateData = {
          lender: data.lender,
          principal_amount: data.principal_amount,
          interest_rate: data.interest_rate,
          tenure_months: data.tenure_months,
          start_date: data.start_date,
          payment_day: data.payment_day || 1,
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          subcategory_id: data.subcategory_id || null,
          type: 'purchase_emi' as const,
          auto_debit: data.auto_debit || false,
          reminder_days: data.reminder_days || 3,
          notes: data.notes ? data.notes : null
        }
        const result = await editLoan(editingEMI.id, updateData)
        if (result.success) {
          toast.success(t('purchaseEmi.form.success.updated'))
          setIsEMIFormOpen(false)
          setEditingEMI(null)
        } else {
          toast.error(result.error || t('purchaseEmi.form.errors.updateFailed'))
        }
      } else {
        const insertData = {
          ...data,
          user_id: profile?.user_id || '',
          outstanding_amount: data.principal_amount,
          emi_amount: calculateEMI(data.principal_amount, data.interest_rate, data.tenure_months),
          currency: profile?.currency || 'BDT',
          status: 'active' as const,
          type: 'purchase_emi' as const,
          next_due_date: calculateNextDueDate(data.start_date, data.payment_day),
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          subcategory_id: data.subcategory_id || null,
          auto_debit: data.auto_debit || false,
          reminder_days: data.reminder_days || 3,
          notes: data.notes ? data.notes : null
        }
        const result = await addLoan(insertData)
        if (result.success) {
          toast.success(t('purchaseEmi.form.success.created'))
          setIsEMIFormOpen(false)
          setEditingEMI(null)
        } else {
          toast.error(result.error || t('purchaseEmi.form.errors.createFailed'))
        }
      }
    } catch (error) {
      console.error('Error submitting Purchase EMI:', error)
      toast.error(t('common.messages.somethingWentWrong'))
    }
  }

  // Helper function to calculate EMI
  const calculateEMI = (principal: number, rate: number, tenure: number): number => {
    const monthlyRate = rate / 100 / 12
    const factor = Math.pow(1 + monthlyRate, tenure)
    return (principal * monthlyRate * factor) / (factor - 1)
  }

  // Helper function to calculate next due date
  const calculateNextDueDate = (startDate: string, paymentDay?: number): string | null => {
    if (!paymentDay) return null
    
    const start = new Date(startDate)
    const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, paymentDay)
    return nextMonth.toISOString().split('T')[0] || null
  }

  const handleDeleteEMI = (emi: any) => {
    setDeletingEMI(emi)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteEMI = async () => {
    if (!deletingEMI) return
    
    setIsDeleting(true)
    try {
      const result = await removeLoan(deletingEMI.id)
      if (result.success) {
        toast.success(t('purchaseEmi.form.success.deleted'))
        setIsDeleteDialogOpen(false)
        setDeletingEMI(null)
      } else {
        toast.error(result.error || t('purchaseEmi.form.errors.deleteFailed'))
      }
    } catch (error) {
      console.error('Error deleting Purchase EMI:', error)
      toast.error(t('common.messages.somethingWentWrong'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewEMI = (emi: any) => {
    setViewingEMI(emi)
    setIsViewModalOpen(true)
  }

  const handleEditFromView = () => {
    setEditingEMI(viewingEMI)
    setIsViewModalOpen(false)
    setIsEMIFormOpen(true)
  }

  const handleDeleteFromView = () => {
    setDeletingEMI(viewingEMI)
    setIsViewModalOpen(false)
    setIsDeleteDialogOpen(true)
  }

  const handleManualPayment = async (emi: any) => {
    try {
      const result = await processLoanPayment(emi.id, new Date().toISOString().split('T')[0] || '')
      if (result.success) {
        toast.success(t('purchaseEmi.form.success.paymentProcessed'))
        // Refresh EMIs list
        window.location.reload()
      } else {
        toast.error(result.error || t('common.messages.tryAgainLater'))
      }
    } catch (error) {
      console.error('Error processing manual EMI payment:', error)
      toast.error(t('common.messages.tryAgainLater'))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedEMIs.length > 0) {
      if (confirm(t('common.messages.confirmAction'))) {
        try {
          await Promise.all(selectedEMIs.map(id => removeLoan(id)))
          setSelectedEMIs([])
        } catch (error) {
          console.error('Error deleting Purchase EMIs:', error)
        }
      }
    }
  }

  const getItemName = (notes: string | null | undefined): string => {
    if (!notes) return 'Unknown Item'
    const match = notes.match(/Item: (.+?)(\n|$)/)
    return match ? match[1] || 'Unknown Item' : 'Unknown Item'
  }

  const getCategoryIcon = (notes: string | null | undefined): any => {
    if (!notes) return ShoppingCart
    
    for (const category of PURCHASE_CATEGORIES) {
      if (notes.toLowerCase().includes(category.value)) {
        return purchaseTypeIcons[category.value as keyof typeof purchaseTypeIcons] || ShoppingCart
      }
    }
    return ShoppingCart
  }

  const getCategoryLabel = (notes: string | null | undefined): string => {
    if (!notes) return t('purchaseEmi.categories.other')
    
    for (const category of PURCHASE_CATEGORIES) {
      if (notes.toLowerCase().includes(category.value)) {
        return t(`purchaseEmi.categories.${category.key}`)
      }
    }
    return t('purchaseEmi.categories.other')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        >
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/credit">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {tCommon('back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('purchaseEmi.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('purchaseEmi.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setIsEMIFormOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('purchaseEmi.addNewEmi')}
            </Button>
            {selectedEMIs.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon('delete')} {selectedEMIs.length}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('overview.totalOutstanding')}</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatAmount(totalOutstanding)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl">
                  <Calendar className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseEmi.monthlyEmis')}</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {formatAmount(totalMonthlyEMI)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseEmi.activeEmis')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {activeEMIs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tCommon('overdue')}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {overdueEMIs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('purchaseEmi.searchPurchases')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('common.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('purchaseEmi.filters.all')}</SelectItem>
              {PURCHASE_CATEGORIES.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {t(`purchaseEmi.categories.${category.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.allStatus')}</SelectItem>
              <SelectItem value="active">{t('common.status.active')}</SelectItem>
              <SelectItem value="closed">{t('common.status.closed')}</SelectItem>
              <SelectItem value="defaulted">{t('common.status.defaulted')}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* EMIs List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5" />
                  <span>{t('purchaseEmi.purchaseEmis')} ({filteredEMIs.length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('common.actions.import')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {t('common.actions.export')}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEMIs.length > 0 ? (
                <div className="space-y-4">
                  {filteredEMIs.map((emi) => {
                    const IconComponent = getCategoryIcon(emi.notes)
                    const isSelected = selectedEMIs.includes(emi.id)
                    const isOverdue = emi.status === 'active' && emi.next_due_date && new Date(emi.next_due_date) < new Date()
                    
                    return (
                      <motion.div 
                        key={emi.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl transition-all hover:shadow-md dark:from-muted/10 dark:to-muted/5 ${
                          isOverdue 
                            ? 'border border-border border-l-4 border-l-orange-500' 
                            : emi.status === 'active'
                              ? 'border border-border border-l-4 border-l-green-500'
                              : emi.status === 'closed'
                                ? 'border border-border border-l-4 border-l-gray-500'
                                : emi.status === 'defaulted'
                                  ? 'border border-border border-l-4 border-l-red-500'
                                  : isSelected 
                                    ? 'border border-primary bg-primary/5' 
                                    : 'border border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEMIs([...selectedEMIs, emi.id])
                                  } else {
                                    setSelectedEMIs(selectedEMIs.filter(id => id !== emi.id))
                                  }
                                }}
                                className="rounded border-border"
                              />
                              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                                <IconComponent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-lg text-foreground">{getItemName(emi.notes)}</h4>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('common.overdue')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {emi.lender} • {getCategoryLabel(emi.notes)}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{emi.tenure_months} months</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Percent className="h-3 w-3" />
                                  <span>{emi.interest_rate}% p.a.</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right space-y-1">
                              <p className="text-2xl font-bold text-primary">{formatAmount(emi.emi_amount)}</p>
                              <p className="text-sm text-muted-foreground">{t('common.monthlyEmi')}</p>
                              <Badge className={statusColors[emi.status]}>
                                {emi.status}
                              </Badge>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleViewEMI(emi)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('common.viewDetails')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingEMI(emi)
                                    setIsEMIFormOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('purchaseEmi.viewModal.editEmi')}
                                </DropdownMenuItem>
                                {emi.status === 'active' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleManualPayment(emi)}
                                    disabled={isAutoProcessing}
                                    className="text-green-600 dark:text-green-400"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    {isAutoProcessing ? t('purchaseEmi.processing') : t('bankLoans.makePayment')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEMI(emi)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('purchaseEmi.viewModal.deleteEmi')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('common.outstanding')}: </span>
                              <span className="font-semibold">{formatAmount(emi.outstanding_amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('common.principal')}: </span>
                              <span className="font-semibold">{formatAmount(emi.principal_amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('common.nextDueDate')}: </span>
                              <span className="font-semibold">
                                {emi.next_due_date ? new Date(emi.next_due_date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          {emi.notes && (
                            <div className="mt-2">
                              <span className="text-muted-foreground">{t('common.notes')}: </span>
                              <span className="text-sm">{emi.notes}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                      ? t('bankLoans.noLoansMatch') 
                      : t('purchaseEmi.noPurchaseEmis')}
                  </h3>
                  <p className="mb-4">
                    {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                      ? t('bankLoans.adjustFilters')
                      : t('purchaseEmi.startTrackingPurchases')}
                  </p>
                  {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
                    <Button 
                      onClick={() => setIsEMIFormOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('purchaseEmi.addFirstPurchaseEmi')}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Purchase EMI Form Modal */}
        <PurchaseEMIForm
          emi={editingEMI}
          isOpen={isEMIFormOpen}
          onClose={() => {
            setIsEMIFormOpen(false)
            setEditingEMI(null)
          }}
          onSubmit={handleEMISubmit}
        />

        {/* Purchase EMI View Modal */}
        <PurchaseEMIViewModal
          emi={viewingEMI}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewingEMI(null)
          }}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteLoanDialog
          loan={deletingEMI}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setDeletingEMI(null)
            setIsDeleting(false)
          }}
          onConfirm={confirmDeleteEMI}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}