'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users,
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
  HandHeart,
  Banknote,
  UserCheck,
  UserX,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useLending } from '@/hooks/useLending'
import { useAppStore } from '@/lib/stores/useAppStore'
import { formatCurrency } from '@/lib/utils'
import PersonalLendingForm from '@/components/personal-lending/PersonalLendingForm'
import PersonalLendingViewModal from '@/components/personal-lending/PersonalLendingViewModal'
import PaymentModal from '@/components/personal-lending/PaymentModal'
import DeleteLendingDialog from '@/components/personal-lending/DeleteLendingDialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const typeColors = {
  lent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  borrowed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
}

export default function PersonalLendingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [isLendingFormOpen, setIsLendingFormOpen] = useState(false)
  const [editingLending, setEditingLending] = useState<any>(null)
  const [selectedLendings, setSelectedLendings] = useState<string[]>([])
  const [viewingLending, setViewingLending] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [paymentLending, setPaymentLending] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [deletingLending, setDeletingLending] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const router = useRouter()
  const { formatAmount, getCurrencySymbol } = useAppStore()
  const { 
    lendings, 
    loading, 
    addLending, 
    editLending, 
    removeLending,
    addPayment,
    getLendingPayments
  } = useLending()
  const t = useTranslations('credit')
  const tCommon = useTranslations('common')

  // Separate lending types from raw data (not filtered by tab) for stats
  const allLentMoney = lendings?.filter(l => l.type === 'lent') || []
  const allBorrowedMoney = lendings?.filter(l => l.type === 'borrowed') || []

  // Calculate totals from all data (not tab-filtered)
  const totalLentPending = allLentMoney.reduce((sum, lending) => sum + lending.pending_amount, 0)
  const totalBorrowedPending = allBorrowedMoney.reduce((sum, lending) => sum + lending.pending_amount, 0)
  const activeLent = allLentMoney.filter(l => l.status !== 'paid').length
  const activeBorrowed = allBorrowedMoney.filter(l => l.status !== 'paid').length
  const overdueLent = allLentMoney.filter(l => l.status === 'overdue').length
  const overdueBorrowed = allBorrowedMoney.filter(l => l.status === 'overdue').length
  const pendingLent = allLentMoney.filter(l => l.status === 'pending').length
  const pendingBorrowed = allBorrowedMoney.filter(l => l.status === 'pending').length
  const partialLent = allLentMoney.filter(l => l.status === 'partial').length
  const partialBorrowed = allBorrowedMoney.filter(l => l.status === 'partial').length

  // Filter lendings based on search, filters, and active tab (for display only)
  const filteredLendings = lendings?.filter(lending => {
    const matchesSearch = lending.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lending.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || lending.status === filterStatus
    const matchesTab = activeTab === 'all' || lending.type === activeTab
    
    return matchesSearch && matchesStatus && matchesTab
  }) || []

  const handleLendingSubmit = async (data: any) => {
    try {
      const { formatAmount, profile } = useAppStore.getState()
      
      if (editingLending) {
        const updateData = {
          person_name: data.person_name,
          amount: data.amount,
          interest_rate: data.interest_rate || 0,
          date: data.date,
          due_date: data.due_date || null,
          type: data.type,
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          subcategory_id: data.subcategory_id || null,
          auto_debit: data.auto_debit || false,
          reminder_days: data.reminder_days || 7,
          contact_info: data.contact_info || null,
          notes: data.notes || null
        }
        const result = await editLending(editingLending.id, updateData)
        if (result.success) {
          toast.success(t('personalLending.form.success.updated'))
          setIsLendingFormOpen(false)
          setEditingLending(null)
        } else {
          toast.error(result.error || t('personalLending.form.errors.updateFailed'))
        }
      } else {
        const insertData = {
          ...data,
          user_id: profile?.user_id || '',
          pending_amount: data.amount,
          currency: profile?.currency || 'BDT',
          status: 'pending' as const,
          interest_rate: data.interest_rate || 0,
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          subcategory_id: data.subcategory_id || null,
          auto_debit: data.auto_debit || false,
          next_due_date: data.due_date || null,
          reminder_days: data.reminder_days || 7,
          contact_info: data.contact_info || null,
          notes: data.notes || null
        }
        const result = await addLending(insertData)
        if (result.success) {
          toast.success(t('personalLending.form.success.created'))
          setIsLendingFormOpen(false)
          setEditingLending(null)
        } else {
          toast.error(result.error || t('personalLending.form.errors.createFailed'))
        }
      }
    } catch (error) {
      console.error('Error submitting personal lending:', error)
      toast.error(t('personalLending.form.errors.networkError'))
    }
  }

  const handleDeleteLending = (lending: any) => {
    setDeletingLending(lending)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteLending = async () => {
    if (!deletingLending) return
    
    setIsDeleting(true)
    try {
      const result = await removeLending(deletingLending.id)
      if (result.success) {
        toast.success(t('personalLending.form.success.deleted'))
        setIsDeleteDialogOpen(false)
        setDeletingLending(null)
      } else {
        toast.error(result.error || t('personalLending.form.errors.deleteFailed'))
      }
    } catch (error) {
      console.error('Error deleting personal lending:', error)
      toast.error(t('personalLending.form.errors.networkError'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewLending = (lending: any) => {
    setViewingLending(lending)
    setIsViewModalOpen(true)
  }

  const handleEditFromView = () => {
    setEditingLending(viewingLending)
    setIsViewModalOpen(false)
    setIsLendingFormOpen(true)
  }

  const handleDeleteFromView = () => {
    setDeletingLending(viewingLending)
    setIsViewModalOpen(false)
    setIsDeleteDialogOpen(true)
  }

  const handlePayment = (lending: any) => {
    setPaymentLending(lending)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      const result = await addPayment(paymentLending.id, paymentData)
      if (result.success) {
        toast.success(t('personalLending.form.success.paymentProcessed'))
        setIsPaymentModalOpen(false)
        setPaymentLending(null)
        // Refresh the data
        window.location.reload()
      } else {
        toast.error(result.error || t('personalLending.form.errors.paymentFailed'))
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error(t('personalLending.form.errors.networkError'))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLendings.length > 0) {
      if (confirm(t('personalLending.confirmBulkDelete', {count: selectedLendings.length}))) {
        try {
          await Promise.all(selectedLendings.map(id => removeLending(id)))
          setSelectedLendings([])
        } catch (error) {
          console.error('Error deleting lending records:', error)
        }
      }
    }
  }

  const getProgressPercentage = (amount: number, pending: number): number => {
    return ((amount - pending) / amount) * 100
  }

  const isOverdue = (dueDate: string | null, status: string): boolean => {
    if (!dueDate || status === 'paid') return false
    return new Date(dueDate) < new Date()
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
                {t('personalLending.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('personalLending.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setIsLendingFormOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('personalLending.addLendingBorrowing')}
            </Button>
            {selectedLendings.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon('delete')} {selectedLendings.length}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('personalLending.moneyLentPending')}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAmount(totalLentPending)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                  <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('personalLending.moneyBorrowedPending')}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatAmount(totalBorrowedPending)}
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
                  <p className="text-sm text-muted-foreground">{t('personalLending.activeRecords')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {activeLent + activeBorrowed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tCommon('pending')}</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {pendingLent + pendingBorrowed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl">
                  <PiggyBank className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tCommon('partial')}</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {partialLent + partialBorrowed}
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
                    {overdueLent + overdueBorrowed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('personalLending.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allStatus')}</SelectItem>
                <SelectItem value="pending">{tCommon('pending')}</SelectItem>
                <SelectItem value="partial">{tCommon('partial')}</SelectItem>
                <SelectItem value="paid">{tCommon('paid')}</SelectItem>
                <SelectItem value="overdue">{tCommon('overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t('personalLending.allRecords')} ({(lendings || []).length})</TabsTrigger>
              <TabsTrigger value="lent">{t('personalLending.moneyLent')} ({allLentMoney.length})</TabsTrigger>
              <TabsTrigger value="borrowed">{t('personalLending.moneyBorrowed')} ({allBorrowedMoney.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Lending Records List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {activeTab === 'all' ? t('personalLending.allLendingRecords') :
                     activeTab === 'lent' ? t('personalLending.moneyLentToOthers') :
                     t('personalLending.moneyBorrowedFromOthers')} ({filteredLendings.length})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {tCommon('import')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {tCommon('export')}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLendings.length > 0 ? (
                <div className="space-y-4">
                  {filteredLendings.map((lending) => {
                    const isSelected = selectedLendings.includes(lending.id)
                    const overdue = isOverdue(lending.due_date, lending.status)
                    const progressPercentage = getProgressPercentage(lending.amount, lending.pending_amount)
                    const paidAmount = lending.amount - lending.pending_amount
                    
                    return (
                      <motion.div 
                        key={lending.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl transition-all hover:shadow-md dark:from-muted/10 dark:to-muted/5 ${
                          overdue
                            ? 'border border-border border-l-4 border-l-orange-500' 
                            : lending.status === 'pending'
                              ? 'border border-border border-l-4 border-l-purple-500'
                              : lending.status === 'partial'
                                ? 'border border-border border-l-4 border-l-cyan-500'
                                : lending.status === 'paid'
                                  ? 'border border-border border-l-4 border-l-green-500'
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
                                    setSelectedLendings([...selectedLendings, lending.id])
                                  } else {
                                    setSelectedLendings(selectedLendings.filter(id => id !== lending.id))
                                  }
                                }}
                                className="rounded border-border"
                              />
                              <div className={`p-3 rounded-2xl ${
                                lending.type === 'lent' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                                  : 'bg-orange-100 dark:bg-orange-900/30'
                              }`}>
                                {lending.type === 'lent' ? (
                                  <HandHeart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Banknote className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-lg text-foreground">{lending.person_name}</h4>
                                <Badge className={typeColors[lending.type]}>
                                  {lending.type === 'lent' ? t('personalLending.lent') : t('personalLending.borrowed')}
                                </Badge>
                                {overdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    {tCommon('overdue')}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(lending.date).toLocaleDateString()}</span>
                                </span>
                                {lending.due_date && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{tCommon('due')}: {new Date(lending.due_date).toLocaleDateString()}</span>
                                  </span>
                                )}
                                {lending.interest_rate > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Percent className="h-3 w-3" />
                                    <span>{lending.interest_rate}% {t('personalLending.interest')}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right space-y-1">
                              <p className="text-2xl font-bold text-primary">{formatAmount(lending.pending_amount)}</p>
                              <p className="text-sm text-muted-foreground">{tCommon('remaining')}</p>
                              <Badge className={statusColors[lending.status]}>
                                {lending.status}
                              </Badge>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{tCommon('actions')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleViewLending(lending)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {tCommon('viewDetails')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingLending(lending)
                                    setIsLendingFormOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {tCommon('editRecord')}
                                </DropdownMenuItem>
                                {lending.status !== 'paid' && (
                                  <DropdownMenuItem 
                                    onClick={() => handlePayment(lending)}
                                    className="text-green-600 dark:text-green-400"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    {t('personalLending.addPayment')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLending(lending)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {tCommon('deleteRecord')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">{t('personalLending.originalAmount')}: </span>
                              <span className="font-semibold">{formatAmount(lending.amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('personalLending.paidAmount')}: </span>
                              <span className="font-semibold text-green-600">{formatAmount(paidAmount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{tCommon('remaining')}: </span>
                              <span className="font-semibold text-orange-600">{formatAmount(lending.pending_amount)}</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                lending.status === 'paid' 
                                  ? 'bg-green-500' 
                                  : lending.status === 'partial'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-400'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {progressPercentage.toFixed(1)}% {tCommon('completed')}
                          </div>
                          
                          {lending.notes && (
                            <div className="mt-2">
                              <span className="text-muted-foreground">{tCommon('notes')}: </span>
                              <span className="text-sm">{lending.notes}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || filterStatus !== 'all' 
                      ? t('personalLending.noRecordsMatch') 
                      : t('personalLending.noRecords')}
                  </h3>
                  <p className="mb-4">
                    {searchTerm || filterStatus !== 'all'
                      ? t('personalLending.tryAdjustingFilters')
                      : t('personalLending.startTrackingMessage')}
                  </p>
                  {!searchTerm && filterStatus === 'all' && (
                    <Button 
                      onClick={() => setIsLendingFormOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('personalLending.addFirstRecord')}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Lending Form Modal */}
        <PersonalLendingForm
          lending={editingLending}
          isOpen={isLendingFormOpen}
          onClose={() => {
            setIsLendingFormOpen(false)
            setEditingLending(null)
          }}
          onSubmit={handleLendingSubmit}
        />

        {/* Personal Lending View Modal */}
        <PersonalLendingViewModal
          lending={viewingLending}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewingLending(null)
          }}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
          onAddPayment={() => {
            handlePayment(viewingLending)
            setIsViewModalOpen(false)
          }}
        />

        {/* Payment Modal */}
        <PaymentModal
          lending={paymentLending}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setPaymentLending(null)
          }}
          onSubmit={handlePaymentSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteLendingDialog
          lending={deletingLending}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setDeletingLending(null)
            setIsDeleting(false)
          }}
          onConfirm={confirmDeleteLending}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}