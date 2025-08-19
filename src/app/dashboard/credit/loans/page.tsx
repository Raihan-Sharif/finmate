'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building,
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
  Car,
  GraduationCap,
  Briefcase,
  FileText,
  Home,
  Download,
  Upload
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
import LoanForm from '@/components/loans/LoanForm'
import LoanViewModal from '@/components/loans/LoanViewModal'
import DeleteLoanDialog from '@/components/loans/DeleteLoanDialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const loanTypeIcons = {
  personal: CreditCard,
  home: Home,
  car: Car,
  education: GraduationCap,
  business: Briefcase,
  purchase_emi: CreditCard,
  credit_card: CreditCard,
  other: FileText
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

export default function BankLoansPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<any>(null)
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [viewingLoan, setViewingLoan] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [deletingLoan, setDeletingLoan] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const router = useRouter()
  const { formatAmount, getCurrencySymbol } = useAppStore()
  const { loans, loading, addLoan, editLoan, removeLoan } = useLoans()
  const { processLoanPayment, isProcessing: isAutoProcessing } = useAutoTransactions()

  // Filter loans based on search and filters
  const filteredLoans = loans?.filter(loan => {
    const matchesSearch = loan.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || loan.type === filterType
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  }) || []

  // Calculate totals
  const totalOutstanding = filteredLoans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
  const totalMonthlyEMI = filteredLoans.reduce((sum, loan) => sum + loan.emi_amount, 0)
  const activeLoans = filteredLoans.filter(loan => loan.status === 'active').length
  const overdueLoans = filteredLoans.filter(loan => 
    loan.status === 'active' && loan.next_due_date && new Date(loan.next_due_date) < new Date()
  ).length

  const handleLoanSubmit = async (data: LoanFormData) => {
    try {
      if (editingLoan) {
        const updateData = {
          lender: data.lender,
          principal_amount: data.principal_amount,
          interest_rate: data.interest_rate,
          tenure_months: data.tenure_months,
          start_date: data.start_date,
          payment_day: data.payment_day || 1,
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          type: data.type,
          auto_debit: data.auto_debit || false,
          reminder_days: data.reminder_days || 3,
          notes: data.notes ? data.notes : null
        }
        const result = await editLoan(editingLoan.id, updateData)
        if (result.success) {
          toast.success('Loan updated successfully!')
          setIsLoanFormOpen(false)
          setEditingLoan(null)
        } else {
          toast.error(result.error || 'Failed to update loan')
        }
      } else {
        const { formatAmount, profile } = useAppStore.getState()
        const insertData = {
          ...data,
          user_id: profile?.user_id || '',
          outstanding_amount: data.principal_amount,
          emi_amount: calculateEMI(data.principal_amount, data.interest_rate, data.tenure_months),
          currency: profile?.currency || 'BDT',
          status: 'active' as const,
          next_due_date: calculateNextDueDate(data.start_date, data.payment_day),
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          auto_debit: data.auto_debit || false,
          reminder_days: data.reminder_days || 3,
          notes: data.notes ? data.notes : null
        }
        const result = await addLoan(insertData)
        if (result.success) {
          toast.success('Loan added successfully!')
          setIsLoanFormOpen(false)
          setEditingLoan(null)
        } else {
          toast.error(result.error || 'Failed to add loan')
        }
      }
    } catch (error) {
      console.error('Error submitting loan:', error)
      toast.error('An unexpected error occurred')
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

  const handleDeleteLoan = (loan: any) => {
    setDeletingLoan(loan)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteLoan = async () => {
    if (!deletingLoan) return
    
    setIsDeleting(true)
    try {
      const result = await removeLoan(deletingLoan.id)
      if (result.success) {
        toast.success('Loan deleted successfully!')
        setIsDeleteDialogOpen(false)
        setDeletingLoan(null)
      } else {
        toast.error(result.error || 'Failed to delete loan')
      }
    } catch (error) {
      console.error('Error deleting loan:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewLoan = (loan: any) => {
    setViewingLoan(loan)
    setIsViewModalOpen(true)
  }

  const handleEditFromView = () => {
    setEditingLoan(viewingLoan)
    setIsViewModalOpen(false)
    setIsLoanFormOpen(true)
  }

  const handleDeleteFromView = () => {
    setDeletingLoan(viewingLoan)
    setIsViewModalOpen(false)
    setIsDeleteDialogOpen(true)
  }

  const handleManualPayment = async (loan: any) => {
    try {
      const result = await processLoanPayment(loan.id, new Date().toISOString().split('T')[0] || '')
      if (result.success) {
        toast.success(`Payment processed successfully! Transaction created.`)
        // Refresh loans list
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing manual payment:', error)
      toast.error('Failed to process payment')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLoans.length > 0) {
      // For bulk delete, we'll use a simple confirm for now
      // TODO: Implement bulk delete dialog
      if (confirm(`Are you sure you want to delete ${selectedLoans.length} selected loans?`)) {
        try {
          await Promise.all(selectedLoans.map(id => removeLoan(id)))
          setSelectedLoans([])
        } catch (error) {
          console.error('Error deleting loans:', error)
        }
      }
    }
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
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Bank Loans & EMIs
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your formal loans from banks and financial institutions
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setIsLoanFormOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Loan
            </Button>
            {selectedLoans.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedLoans.length}
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
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatAmount(totalOutstanding)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {activeLoans}
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
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {overdueLoans}
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
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Loan Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LOAN_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Loans List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Bank Loans ({filteredLoans.length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLoans.length > 0 ? (
                <div className="space-y-4">
                  {filteredLoans.map((loan) => {
                    const IconComponent = loanTypeIcons[loan.type]
                    const isSelected = selectedLoans.includes(loan.id)
                    const isOverdue = loan.status === 'active' && loan.next_due_date && new Date(loan.next_due_date) < new Date()
                    
                    return (
                      <motion.div 
                        key={loan.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl transition-all hover:shadow-md dark:from-muted/10 dark:to-muted/5 ${
                          isOverdue 
                            ? 'border border-border border-l-4 border-l-orange-500' 
                            : loan.status === 'active'
                              ? 'border border-border border-l-4 border-l-green-500'
                              : loan.status === 'closed'
                                ? 'border border-border border-l-4 border-l-gray-500'
                                : loan.status === 'defaulted'
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
                                    setSelectedLoans([...selectedLoans, loan.id])
                                  } else {
                                    setSelectedLoans(selectedLoans.filter(id => id !== loan.id))
                                  }
                                }}
                                className="rounded border-border"
                              />
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                                <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-lg text-foreground">{loan.lender}</h4>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {LOAN_TYPES.find(t => t.value === loan.type)?.label}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{loan.tenure_months} months</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Percent className="h-3 w-3" />
                                  <span>{loan.interest_rate}% p.a.</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right space-y-1">
                              <p className="text-2xl font-bold text-primary">{formatAmount(loan.emi_amount)}</p>
                              <p className="text-sm text-muted-foreground">Monthly EMI</p>
                              <Badge className={statusColors[loan.status]}>
                                {loan.status}
                              </Badge>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleViewLoan(loan)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingLoan(loan)
                                    setIsLoanFormOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Loan
                                </DropdownMenuItem>
                                {loan.status === 'active' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleManualPayment(loan)}
                                    disabled={isAutoProcessing}
                                    className="text-green-600 dark:text-green-400"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    {isAutoProcessing ? 'Processing...' : 'Process Payment'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLoan(loan)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Loan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Outstanding: </span>
                              <span className="font-semibold">{formatAmount(loan.outstanding_amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Principal: </span>
                              <span className="font-semibold">{formatAmount(loan.principal_amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Next Due: </span>
                              <span className="font-semibold">
                                {loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                      ? 'No loans match your criteria' 
                      : 'No Bank Loans'}
                  </h3>
                  <p className="mb-4">
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start tracking your bank loans and EMI payments'}
                  </p>
                  {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                    <Button 
                      onClick={() => setIsLoanFormOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Loan
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loan Form Modal */}
        <LoanForm
          loan={editingLoan}
          isOpen={isLoanFormOpen}
          onClose={() => {
            setIsLoanFormOpen(false)
            setEditingLoan(null)
          }}
          onSubmit={handleLoanSubmit}
        />

        {/* Loan View Modal */}
        <LoanViewModal
          loan={viewingLoan}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewingLoan(null)
          }}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteLoanDialog
          loan={deletingLoan}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setDeletingLoan(null)
            setIsDeleting(false)
          }}
          onConfirm={confirmDeleteLoan}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}