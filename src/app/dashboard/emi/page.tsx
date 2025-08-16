'use client'

import { useState } from 'react'
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
  Car,
  GraduationCap,
  Briefcase,
  FileText,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Target,
  Users,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  ShoppingCart
} from 'lucide-react'
import { useEMIDashboard, useLoans, useLendings } from '@/hooks/useEMI'
import { formatCurrency } from '@/lib/utils'
import { LOAN_TYPES, LENDING_TYPES, LoanFormData, LendingFormData } from '@/types/emi'
import EMICalculator from '@/components/emi-calculator'
import LoanForm from '@/components/loans/LoanForm'
import LendingForm from '@/components/loans/LendingForm'
import PurchaseEMIForm from '@/components/loans/PurchaseEMIForm'

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

export default function EMIPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false)
  const [isLendingFormOpen, setIsLendingFormOpen] = useState(false)
  const [isPurchaseEMIFormOpen, setIsPurchaseEMIFormOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [editingLending, setEditingLending] = useState(null)
  const [editingPurchaseEMI, setEditingPurchaseEMI] = useState(null)
  
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EMI & Lending Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your loans, EMIs, and personal lending efficiently
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setIsLoanFormOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Building className="h-4 w-4 mr-2" />
              Add Bank Loan
            </Button>
            <Button 
              onClick={() => setIsPurchaseEMIFormOpen(true)}
              variant="outline" 
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add Purchase EMI
            </Button>
            <Button 
              onClick={() => setIsLendingFormOpen(true)}
              variant="outline" 
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Add Personal Lending
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-2xl">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly EMIs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalMonthlyCommitments)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue Payments</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {emiOverview?.overdue_payments || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Loans</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {emiOverview?.total_active_loans || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loans">Bank Loans</TabsTrigger>
            <TabsTrigger value="purchase">Purchase EMI</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Loans */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Recent Loans
                  </CardTitle>
                  <CardDescription>Your latest loan activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {loans && loans.length > 0 ? (
                    <div className="space-y-4">
                      {loans.slice(0, 5).map((loan) => {
                        const IconComponent = loanTypeIcons[loan.type]
                        return (
                          <div key={loan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold">{loan.lender}</p>
                                <p className="text-sm text-gray-600">{LOAN_TYPES.find(t => t.value === loan.type)?.label}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(loan.emi_amount)}</p>
                              <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                                {loan.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No loans found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Lending */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Recent Lending
                  </CardTitle>
                  <CardDescription>Your personal lending activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {lendings && lendings.length > 0 ? (
                    <div className="space-y-4">
                      {lendings.slice(0, 5).map((lending) => (
                        <div key={lending.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              lending.type === 'lent' ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              <ArrowUpDown className={`h-4 w-4 ${
                                lending.type === 'lent' ? 'text-green-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold">{lending.person_name}</p>
                              <p className="text-sm text-gray-600">
                                {LENDING_TYPES.find(t => t.value === lending.type)?.label}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(lending.amount)}</p>
                            <Badge 
                              variant={lending.status === 'paid' ? 'default' : 
                                     lending.status === 'overdue' ? 'destructive' : 'secondary'}
                            >
                              {lending.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ArrowUpDown className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No lending activities found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* All Loans & EMIs Tab */}
          <TabsContent value="loans" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formal Loans (Bank/Institution) */}
              <div className="lg:col-span-2">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <Building className="h-5 w-5 mr-2" />
                      Formal Loans & EMIs
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Bank loans, credit cards, and institutional financing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loans && loans.length > 0 ? (
                      <div className="space-y-4">
                        {loans.map((loan) => {
                          const IconComponent = loanTypeIcons[loan.type]
                          return (
                            <motion.div 
                              key={loan.id} 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="p-3 bg-blue-100 rounded-2xl">
                                    <IconComponent className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800">{loan.lender}</h4>
                                    <p className="text-sm text-gray-600">{LOAN_TYPES.find(t => t.value === loan.type)?.label}</p>
                                    <p className="text-xs text-gray-500">
                                      {loan.tenure_months} months • {loan.interest_rate}% interest
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(loan.emi_amount)}</p>
                                  <p className="text-sm text-gray-600">Monthly EMI</p>
                                  <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                                    {loan.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Outstanding: <strong>{formatCurrency(loan.outstanding_amount)}</strong></span>
                                  <span className="text-gray-600">Next Due: <strong>{loan.next_due_date || 'N/A'}</strong></span>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                        <Button 
                          onClick={() => setIsLoanFormOpen(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Loan
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">No Formal Loans</h3>
                        <p className="mb-4">Start tracking your bank loans and EMI payments</p>
                        <Button 
                          onClick={() => setIsLoanFormOpen(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Loan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Personal Lending */}
              <div className="lg:col-span-1">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <Users className="h-5 w-5 mr-2" />
                      Personal Lending
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
                            className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  lending.type === 'lent' ? 'bg-green-100' : 'bg-orange-100'
                                }`}>
                                  <ArrowUpDown className={`h-4 w-4 ${
                                    lending.type === 'lent' ? 'text-green-600' : 'text-orange-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{lending.person_name}</p>
                                  <p className="text-xs text-gray-600">
                                    {lending.type === 'lent' ? 'Lent to' : 'Borrowed from'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">{formatCurrency(lending.amount)}</p>
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
                        <Button 
                          onClick={() => setIsLendingFormOpen(true)}
                          variant="outline" 
                          className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Lending
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <h4 className="text-sm font-semibold mb-2">No Personal Lending</h4>
                        <p className="text-xs mb-3">Track personal loans with friends & family</p>
                        <Button 
                          onClick={() => setIsLendingFormOpen(true)}
                          variant="outline" 
                          size="sm" 
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Lending
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Purchase EMI Tab */}
          <TabsContent value="purchase" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Purchase EMI Management
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Track EMI purchases like electronics, furniture, and other items
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Purchase EMIs</h3>
                  <p className="mb-4">Start tracking your purchase EMIs for better financial management</p>
                  <Button 
                    onClick={() => setIsPurchaseEMIFormOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Purchase EMI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <EMICalculator />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>EMI Analytics</CardTitle>
                <CardDescription>Insights and analytics for your EMI and lending data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p>Detailed analytics and insights will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
          purchaseEMI={editingPurchaseEMI}
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