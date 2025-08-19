'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calculator,
  CreditCard,
  Building,
  Users,
  ShoppingCart,
  Plus,
  Search,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Target,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Banknote,
  PiggyBank,
  FileText,
  Car,
  GraduationCap,
  Briefcase
} from 'lucide-react'
import { useEMIDashboard } from '@/hooks/useEMI'
import { useAppStore } from '@/lib/stores/useAppStore'
import { formatCurrency } from '@/lib/utils'
import { LOAN_TYPES, LENDING_TYPES, LoanFormData, LendingFormData } from '@/types/emi'
import LoanForm from '@/components/loans/LoanForm'
import LendingForm from '@/components/loans/LendingForm'
import PurchaseEMIForm from '@/components/purchase-emi/PurchaseEMIForm'
import Link from 'next/link'

const loanTypeIcons = {
  personal: CreditCard,
  home: Building,
  car: Car,
  education: GraduationCap,
  business: Briefcase,
  purchase_emi: ShoppingCart,
  credit_card: CreditCard,
  other: FileText
}

const lendingTypeIcons = {
  lent: ArrowUpDown,
  borrowed: ArrowUpDown
}

export default function CreditOverviewPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false)
  const [isLendingFormOpen, setIsLendingFormOpen] = useState(false)
  const [isPurchaseEMIFormOpen, setIsPurchaseEMIFormOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [editingLending, setEditingLending] = useState(null)
  const [editingPurchaseEMI, setEditingPurchaseEMI] = useState(null)
  
  const { formatAmount, getCurrencySymbol, profile } = useAppStore()
  
  const { 
    emiOverview, 
    lendingOverview, 
    loans, 
    lendings, 
    totalOutstanding,
    totalMonthlyCommitments,
    upcomingPayments,
    overdueLendings,
    loading 
  } = useEMIDashboard()

  // Handle form submissions
  const handleLoanSubmit = async (data: LoanFormData) => {
    try {
      console.log('Loan form submitted:', data)
      // TODO: Implement loan creation/update logic
      setIsLoanFormOpen(false)
      setEditingLoan(null)
    } catch (error) {
      console.error('Error submitting loan:', error)
    }
  }

  const handleLendingSubmit = async (data: LendingFormData) => {
    try {
      console.log('Lending form submitted:', data)
      // TODO: Implement lending creation/update logic
      setIsLendingFormOpen(false)
      setEditingLending(null)
    } catch (error) {
      console.error('Error submitting lending:', error)
    }
  }

  const handlePurchaseEMISubmit = async (data: any) => {
    try {
      console.log('Purchase EMI form submitted:', data)
      // TODO: Implement purchase EMI creation/update logic
      setIsPurchaseEMIFormOpen(false)
      setEditingPurchaseEMI(null)
    } catch (error) {
      console.error('Error submitting purchase EMI:', error)
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
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Credit & Lending Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your loans, EMIs, and personal lending efficiently
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/credit/loans">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500">
                <Building className="h-4 w-4 mr-2" />
                Manage Loans
              </Button>
            </Link>
            <Link href="/dashboard/credit/purchase-emi">
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase EMI
              </Button>
            </Link>
            <Link href="/dashboard/credit/personal-lending">
              <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950">
                <Users className="h-4 w-4 mr-2" />
                Personal Lending
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats */}
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
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-sm text-muted-foreground">Monthly EMIs</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatAmount(totalMonthlyCommitments)}
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
                  <p className="text-sm text-muted-foreground">Overdue Payments</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {emiOverview?.overdue_payments || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {emiOverview?.total_active_loans || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bank Loans */}
          <Card className="lg:col-span-2 bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg dark:from-blue-500 dark:to-purple-500">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Bank Loans & EMIs
                </div>
                <Link href="/dashboard/credit/loans">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    View All
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription className="text-blue-100">
                Your active bank loans and EMI commitments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loans && loans.length > 0 ? (
                <div className="space-y-4">
                  {loans.slice(0, 3).map((loan) => {
                    const IconComponent = loanTypeIcons[loan.type]
                    const isOverdue = loan.status === 'active' && loan.next_due_date && new Date(loan.next_due_date) < new Date()
                    
                    return (
                      <motion.div 
                        key={loan.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl transition-all hover:shadow-md dark:from-muted/20 dark:to-muted/10 ${
                          isOverdue 
                            ? 'border border-border border-l-4 border-l-orange-500' 
                            : loan.status === 'active'
                              ? 'border border-border border-l-4 border-l-green-500'
                              : loan.status === 'closed'
                                ? 'border border-border border-l-4 border-l-gray-500'
                                : loan.status === 'defaulted'
                                  ? 'border border-border border-l-4 border-l-red-500'
                                  : 'border border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                              <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-foreground">{loan.lender}</h4>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{LOAN_TYPES.find(t => t.value === loan.type)?.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {loan.tenure_months} months • {loan.interest_rate}% interest
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatAmount(loan.emi_amount)}</p>
                            <p className="text-sm text-muted-foreground">Monthly EMI</p>
                            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                              {loan.status}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  {loans.length > 3 && (
                    <div className="text-center pt-4">
                      <Link href="/dashboard/credit/loans">
                        <Button variant="outline">
                          View All {loans.length} Loans
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No Bank Loans</h3>
                  <p className="mb-4">Start tracking your bank loans and EMI payments</p>
                  <Link href="/dashboard/credit/loans">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Loan
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Lending & Quick Actions */}
          <div className="space-y-6">
            {/* Personal Lending */}
            <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg dark:from-green-500 dark:to-emerald-500">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Personal Lending
                  </div>
                  <Link href="/dashboard/credit/personal-lending">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="text-green-100">
                  Money lent to or borrowed from friends & family
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {lendings && lendings.length > 0 ? (
                  <div className="space-y-4">
                    {lendings.slice(0, 4).map((lending) => (
                      <motion.div 
                        key={lending.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg transition-all hover:shadow-md dark:from-muted/20 dark:to-muted/10 ${
                          lending.status === 'overdue'
                            ? 'border border-border border-l-4 border-l-orange-500'
                            : lending.status === 'paid'
                              ? 'border border-border border-l-4 border-l-green-500'
                              : lending.status === 'partial'
                                ? 'border border-border border-l-4 border-l-cyan-500'
                                : lending.status === 'pending'
                                  ? 'border border-border border-l-4 border-l-purple-500'
                                  : 'border border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              lending.type === 'lent' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                            }`}>
                              <ArrowUpDown className={`h-4 w-4 ${
                                lending.type === 'lent' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{lending.person_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {lending.type === 'lent' ? 'Lent to' : 'Borrowed from'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatAmount(lending.amount)}</p>
                            <Badge 
                              variant={lending.status === 'paid' ? 'default' : 
                                     lending.status === 'overdue' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {lending.status}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <h4 className="text-sm font-semibold mb-2">No Personal Lending</h4>
                    <p className="text-xs mb-3">Track personal loans with friends & family</p>
                    <Link href="/dashboard/credit/personal-lending">
                      <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Lending
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/calculators/loan-emi" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Loan Calculator
                  </Button>
                </Link>
                <Link href="/dashboard/credit/purchase-emi" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase EMI
                  </Button>
                </Link>
                <Link href="/dashboard/credit/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Modals */}
        <LoanForm
          loan={editingLoan}
          isOpen={isLoanFormOpen}
          onClose={() => {
            setIsLoanFormOpen(false)
            setEditingLoan(null)
          }}
          onSubmit={handleLoanSubmit}
        />

        <LendingForm
          lending={editingLending}
          isOpen={isLendingFormOpen}
          onClose={() => {
            setIsLendingFormOpen(false)
            setEditingLending(null)
          }}
          onSubmit={handleLendingSubmit}
        />

        <PurchaseEMIForm
          emi={editingPurchaseEMI}
          isOpen={isPurchaseEMIFormOpen}
          onClose={() => {
            setIsPurchaseEMIFormOpen(false)
            setEditingPurchaseEMI(null)
          }}
          onSubmit={handlePurchaseEMISubmit}
        />
      </div>
    </div>
  )
}