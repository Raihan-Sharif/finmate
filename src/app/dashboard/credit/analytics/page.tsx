'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Progress } from '@/components/ui/progress'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  CreditCard,
  PiggyBank,
  ArrowLeft,
  Download,
  Filter,
  Eye,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity
} from 'lucide-react'
import { useLoans } from '@/hooks/useEMI'
import { useLending } from '@/hooks/useLending'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useTransactions } from '@/hooks/useTransactions'
import Link from 'next/link'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export default function CreditAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6months')
  const [activeTab, setActiveTab] = useState('overview')
  const { formatAmount } = useAppStore()
  const { loans, loading: loansLoading } = useLoans()
  const { lendings, loading: lendingsLoading } = useLending()
  const { transactions } = useTransactions()

  const [analyticsData, setAnalyticsData] = useState({
    totalLoans: 0,
    totalLendings: 0,
    totalEMIAmount: 0,
    totalOutstanding: 0,
    totalLentPending: 0,
    totalBorrowedPending: 0,
    overdueCount: 0,
    paymentEfficiency: 0,
    monthlyTrend: [] as any[],
    loanTypeDistribution: [] as any[],
    statusDistribution: [] as any[],
    paymentHistory: [] as any[],
    projectedPayments: [] as any[],
    creditScore: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  })

  useEffect(() => {
    if (loans && lendings && !loansLoading && !lendingsLoading) {
      calculateAnalytics()
    }
  }, [loans, lendings, loansLoading, lendingsLoading, timeRange])

  const calculateAnalytics = () => {
    // Bank Loans Analytics
    const activeLoans = loans?.filter(loan => loan.status === 'active') || []
    const totalEMIAmount = activeLoans.reduce((sum, loan) => sum + loan.emi_amount, 0)
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
    const overdueLoans = activeLoans.filter(loan => 
      loan.next_due_date && new Date(loan.next_due_date) < new Date()
    ).length

    // Personal Lending Analytics
    const activeLendings = lendings?.filter(lending => lending.status !== 'paid') || []
    const totalLentPending = lendings?.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.pending_amount, 0) || 0
    const totalBorrowedPending = lendings?.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.pending_amount, 0) || 0

    // Loan Type Distribution
    const loanTypes: Record<string, number> = {}
    loans?.forEach(loan => {
      loanTypes[loan.type] = (loanTypes[loan.type] || 0) + 1
    })
    const loanTypeDistribution = Object.entries(loanTypes).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      value: count,
      amount: loans?.filter(l => l.type === type).reduce((sum, l) => sum + l.outstanding_amount, 0) || 0
    }))

    // Status Distribution
    const statusCounts = { active: 0, closed: 0, defaulted: 0, pending: 0, partial: 0, paid: 0, overdue: 0 }
    loans?.forEach(loan => statusCounts[loan.status]++)
    lendings?.forEach(lending => statusCounts[lending.status]++)
    
    const statusDistribution = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count
      }))

    // Monthly Trend (Last 6-12 months)
    const monthlyTrend = generateMonthlyTrend()

    // Payment History
    const paymentHistory = generatePaymentHistory()

    // Projected Payments
    const projectedPayments = generateProjectedPayments()

    // Credit Score Calculation (simplified)
    const creditScore = calculateCreditScore()

    // Risk Level
    const riskLevel = overdueLoans > 2 ? 'high' : overdueLoans > 0 ? 'medium' : 'low'

    // Payment Efficiency
    const totalDuePayments = activeLoans.length + activeLendings.length
    const overduePayments = overdueLoans + (lendings?.filter(l => l.status === 'overdue').length || 0)
    const paymentEfficiency = totalDuePayments > 0 ? ((totalDuePayments - overduePayments) / totalDuePayments) * 100 : 100

    setAnalyticsData({
      totalLoans: loans?.length || 0,
      totalLendings: lendings?.length || 0,
      totalEMIAmount,
      totalOutstanding,
      totalLentPending,
      totalBorrowedPending,
      overdueCount: overdueLoans,
      paymentEfficiency,
      monthlyTrend,
      loanTypeDistribution,
      statusDistribution,
      paymentHistory,
      projectedPayments,
      creditScore,
      riskLevel
    })
  }

  const generateMonthlyTrend = () => {
    const months = []
    const now = new Date()
    const monthsCount = timeRange === '12months' ? 12 : 6

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      // Calculate EMI payments for this month
      const emiPayments = loans?.reduce((sum, loan) => {
        // Simplified calculation - in real app, use actual payment history
        return sum + (loan.status === 'active' ? loan.emi_amount : 0)
      }, 0) || 0

      // Calculate lending activities
      const lendingActivities = lendings?.filter(lending => {
        const lendingDate = new Date(lending.date)
        return lendingDate.getMonth() === date.getMonth() && lendingDate.getFullYear() === date.getFullYear()
      }).reduce((sum, lending) => sum + lending.amount, 0) || 0

      months.push({
        month: monthName,
        emiPayments,
        lendingActivities,
        totalActivity: emiPayments + lendingActivities
      })
    }
    return months
  }

  const generatePaymentHistory = () => {
    // This would come from actual payment records in a real implementation
    return loans?.slice(0, 10).map((loan, index) => ({
      id: loan.id,
      name: loan.lender,
      type: 'EMI Payment',
      amount: loan.emi_amount,
      date: loan.next_due_date || new Date().toISOString().split('T')[0],
      status: 'completed'
    })) || []
  }

  const generateProjectedPayments = () => {
    const projections = []
    const today = new Date()
    
    // Next 6 months projections
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const projectedEMI = loans?.filter(l => l.status === 'active').reduce((sum, loan) => sum + loan.emi_amount, 0) || 0
      const projectedLending = lendings?.filter(l => l.type === 'borrowed' && l.status !== 'paid').length * 1000 // Estimated
      
      projections.push({
        month: monthName,
        projectedEMI,
        projectedLending,
        total: projectedEMI + projectedLending
      })
    }
    return projections
  }

  const calculateCreditScore = () => {
    let score = 750 // Base score
    
    // Deduct for overdue payments
    score -= analyticsData.overdueCount * 50
    
    // Add for good payment history
    if (analyticsData.paymentEfficiency > 90) score += 50
    else if (analyticsData.paymentEfficiency > 80) score += 25
    
    // Adjust for credit utilization
    const totalCredit = analyticsData.totalOutstanding + analyticsData.totalBorrowedPending
    if (totalCredit < 50000) score += 25
    else if (totalCredit > 200000) score -= 25
    
    return Math.max(300, Math.min(850, score))
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600'
    if (score >= 650) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loansLoading || lendingsLoading) {
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
                Credit Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights into your loans, EMIs, and lending activities
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analyticsData.totalLoans}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                  <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lending Records</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analyticsData.totalLendings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatAmount(analyticsData.totalEMIAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatAmount(analyticsData.totalOutstanding)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${
                  analyticsData.riskLevel === 'low' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : analyticsData.riskLevel === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Activity className={`h-6 w-6 ${getRiskColor(analyticsData.riskLevel)}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Score</p>
                  <p className={`text-2xl font-bold ${getCreditScoreColor(analyticsData.creditScore)}`}>
                    {analyticsData.creditScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="projections">Projections</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Efficiency */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Payment Efficiency
                    </CardTitle>
                    <CardDescription>Your payment performance score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency Score</span>
                        <span>{analyticsData.paymentEfficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={analyticsData.paymentEfficiency} className="h-3" />
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-600">{analyticsData.totalLoans + analyticsData.totalLendings - analyticsData.overdueCount}</p>
                          <p className="text-xs text-muted-foreground">On Time</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{analyticsData.overdueCount}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Assessment
                    </CardTitle>
                    <CardDescription>Current credit risk level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Risk Level</span>
                        <Badge className={`${
                          analyticsData.riskLevel === 'low' 
                            ? 'bg-green-100 text-green-800' 
                            : analyticsData.riskLevel === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {analyticsData.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Credit Score</span>
                          <span className={getCreditScoreColor(analyticsData.creditScore)}>
                            {analyticsData.creditScore}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Exposure</span>
                          <span>{formatAmount(analyticsData.totalOutstanding + analyticsData.totalBorrowedPending)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Payment Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.paymentHistory.slice(0, 5).map((payment, index) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold">{payment.name}</p>
                            <p className="text-sm text-muted-foreground">{payment.type}</p>
                            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                              <span>💳</span>
                              <span>Source: {payment.account_name || 'Primary Account'}</span>
                              <span className="text-muted-foreground">• Auto-debit</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatAmount(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5" />
                    Monthly Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatAmount(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="emiPayments" stroke="#8884d8" name="EMI Payments" />
                      <Line type="monotone" dataKey="lendingActivities" stroke="#82ca9d" name="Lending Activities" />
                      <Line type="monotone" dataKey="totalActivity" stroke="#ffc658" name="Total Activity" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Loan Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.loanTypeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.loanTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.statusDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    6-Month Payment Projections
                  </CardTitle>
                  <CardDescription>Estimated future payment obligations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.projectedPayments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatAmount(Number(value))} />
                      <Legend />
                      <Area type="monotone" dataKey="projectedEMI" stackId="1" stroke="#8884d8" fill="#8884d8" name="EMI Payments" />
                      <Area type="monotone" dataKey="projectedLending" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Lending Repayments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next 30 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{formatAmount(analyticsData.totalEMIAmount)}</p>
                    <p className="text-sm text-muted-foreground">Estimated payments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next 90 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600">{formatAmount(analyticsData.totalEMIAmount * 3)}</p>
                    <p className="text-sm text-muted-foreground">Estimated payments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next 6 Months</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{formatAmount(analyticsData.totalEMIAmount * 6)}</p>
                    <p className="text-sm text-muted-foreground">Estimated payments</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}