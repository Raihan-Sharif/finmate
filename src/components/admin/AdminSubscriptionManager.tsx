'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard,
  Gift,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Eye,
  RefreshCw,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubscriptionPaymentsAdmin } from './SubscriptionPaymentsAdmin'
import { CouponAdmin } from './CouponAdmin'

interface SubscriptionOverview {
  total_users: number
  active_subscriptions: number
  pending_payments: number
  total_revenue: number
  monthly_revenue: number
  coupon_usage: number
  active_coupons: number
  total_plans: number
}

export function AdminSubscriptionManager() {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('payments')
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/admin/subscription/overview')
      const result = await response.json()

      if (result.success) {
        setOverview(result.overview)
      } else {
        console.error('Failed to fetch overview:', result.message)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOverview()
    // Trigger refresh in child components
    setTimeout(() => setRefreshing(false), 1000)
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const tabs = [
    {
      id: 'payments',
      label: t('subscriptions.payments.title'),
      shortLabel: 'Payments',
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      description: t('subscriptions.payments.description')
    },
    {
      id: 'coupons',
      label: t('subscriptions.coupons.title'),
      shortLabel: 'Coupons',
      icon: Gift,
      color: 'from-purple-500 to-pink-600',
      description: t('subscriptions.coupons.description')
    },
    {
      id: 'analytics',
      label: t('subscriptions.analytics.title'),
      shortLabel: 'Analytics',
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-600',
      description: t('subscriptions.analytics.description')
    },
    {
      id: 'settings',
      label: t('subscriptions.settings.title'),
      shortLabel: 'Settings',
      icon: Settings,
      color: 'from-slate-500 to-gray-600',
      description: t('subscriptions.settings.description')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 -m-6">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-30 animate-pulse" />
            <div className="relative p-4 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl">
              <CreditCard className="h-10 w-10" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            {t('subscriptions.title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('subscriptions.description')}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {loading ? '...' : overview?.pending_payments || 0}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Pending Payments</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {loading ? '...' : overview?.active_coupons || 0}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Active Coupons</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {loading ? '...' : overview?.active_subscriptions || 0}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Active Subscriptions</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {loading ? '...' : `৳${overview?.monthly_revenue?.toLocaleString() || '0'}`}
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400">Revenue (Month)</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Admin Panel
                </CardTitle>
                <CardDescription className="text-base">
                  Manage all subscription-related operations
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                  Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 rounded-none border-b h-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "flex flex-col items-center space-y-1 p-2 text-xs font-medium transition-all duration-200 h-auto min-h-[60px]",
                        "data-[state=active]:bg-white data-[state=active]:shadow-sm",
                        "data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100",
                        "hover:bg-white/50 dark:hover:bg-slate-700/50",
                        "sm:flex-row sm:space-y-0 sm:space-x-2 sm:text-sm sm:min-h-[50px]",
                        "lg:p-3"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                        isActive ? `bg-gradient-to-br ${tab.color} text-white shadow-lg` : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                      )}>
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left min-w-0 flex-1 overflow-hidden">
                        <div className="font-semibold truncate text-xs sm:text-sm">
                          <span className="sm:hidden">{tab.shortLabel}</span>
                          <span className="hidden sm:inline lg:hidden">{tab.shortLabel}</span>
                          <span className="hidden lg:inline">{tab.label}</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden lg:block truncate max-w-[100px] xl:max-w-[120px]">
                          {tab.description}
                        </div>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TabsContent value="payments" className="mt-0 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Payment Management
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Review and manage subscription payments from users
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View All
                          </Button>
                        </div>
                      </div>
                      <SubscriptionPaymentsAdmin key={refreshing ? 'refresh' : 'normal'} />
                    </TabsContent>

                    <TabsContent value="coupons" className="mt-0">
                      <CouponAdmin key={refreshing ? 'refresh' : 'normal'} />
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-0 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Analytics & Reports
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            View subscription metrics, revenue analytics, and generate reports
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Date Range
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Revenue Trends</CardTitle>
                            <CardDescription>Monthly revenue analysis</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-8 w-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">User Growth</CardTitle>
                            <CardDescription>Subscription user metrics</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg flex items-center justify-center">
                              <Users className="h-8 w-8 text-emerald-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Payment Success Rate</CardTitle>
                            <CardDescription>Payment processing metrics</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
                              <BarChart3 className="h-8 w-8 text-purple-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            System Settings
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Configure subscription system settings and preferences
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Import Settings
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Payment Methods</CardTitle>
                            <CardDescription>Configure available payment options</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-sm">bKash</span>
                                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-sm">Nagad</span>
                                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-sm">Rocket</span>
                                <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Subscription Plans</CardTitle>
                            <CardDescription>Manage available subscription tiers</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-sm">Free Plan</span>
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">Default</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-sm">Pro Plan</span>
                                <Badge variant="outline" className="bg-purple-100 text-purple-800">Popular</Badge>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-sm">Max Plan</span>
                                <Badge variant="outline" className="bg-gold-100 text-gold-800">Premium</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
        </div>
      </div>
    </div>
  )
}