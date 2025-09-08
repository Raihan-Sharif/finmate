import { Suspense } from 'react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import AccountsOverview from '@/components/accounts/AccountsOverview'
import AccountsList from '@/components/accounts/AccountsList'
import CreateAccountButton from '@/components/accounts/CreateAccountButton'
import FamilyMembersSection from '@/components/accounts/FamilyMembersSection'
import SubscriptionLimitsCard from '@/components/accounts/SubscriptionLimitsCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, CreditCard, Users, TrendingUp } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('accounts')
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

export default async function AccountsPage() {
  const t = await getTranslations('accounts')
  const tCommon = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Page Header */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    {t('title')}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {t('subtitle')}
                  </p>
                </div>
              </div>
            </div>
            
            <CreateAccountButton showFullPage={true} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Use a single Suspense boundary for the entire content to prevent multiple loading flashes */}
        <Suspense fallback={<AccountsPageSkeleton />}>
          <AccountsPageContent t={t} />
        </Suspense>
      </div>
    </div>
  )
}

// Main content component that wraps all account page content
async function AccountsPageContent({ t }: { t: any }) {
  return (
    <div className="space-y-8">
      {/* Accounts Overview */}
      <div className="space-y-6">
        <AccountsOverview />
      </div>

      {/* Accounts List and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Accounts List */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">
                {t('yourAccounts')}
              </CardTitle>
              <CardDescription>
                {t('manageYourAccounts')}
              </CardDescription>
            </CardHeader>
            <AccountsList />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Family Members */}
          <FamilyMembersSection />

          {/* Subscription Limits */}
          <SubscriptionLimitsCard />

          {/* Quick Stats */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">
                    {t('quickStats.title')}
                  </CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">
                    {t('quickStats.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <QuickStatsContent />
            </CardContent>
          </Card>

          {/* Account Tips */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                {t('tips.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('tips.tip1')}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('tips.tip2')}
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('tips.tip3')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Quick Stats Content Component
async function QuickStatsContent() {
  const t = await getTranslations('accounts')
  
  // This would fetch real data in production
  const stats = {
    totalBalance: 45250.80,
    highestAccount: 28500.00,
    lowestAccount: 1250.00,
    averageBalance: 11312.70
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">{t('stats.totalBalance')}</span>
        <span className="font-semibold text-green-600 dark:text-green-400">৳{stats.totalBalance.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">{t('stats.highest')}</span>
        <span className="font-semibold">৳{stats.highestAccount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">{t('stats.lowest')}</span>
        <span className="font-semibold">৳{stats.lowestAccount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">{t('stats.average')}</span>
        <span className="font-semibold">৳{stats.averageBalance.toLocaleString()}</span>
      </div>
    </div>
  )
}

// Main page skeleton that matches the AccountsPageContent structure
function AccountsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Accounts Overview Skeleton */}
      <div className="space-y-6">
        <AccountsOverviewSkeleton />
      </div>

      {/* Accounts List and Sidebar Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Accounts List Skeleton */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardHeader>
            <AccountsListSkeleton />
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Family Members Skeleton */}
          <FamilyMembersSkeleton />

          {/* Subscription Limits Skeleton */}
          <SubscriptionLimitsSkeleton />

          {/* Quick Stats Skeleton */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <QuickStatsSkeleton />
            </CardContent>
          </Card>

          {/* Account Tips Skeleton */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Loading Skeletons
function AccountsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AccountsListSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

function FamilyMembersSkeleton() {
  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SubscriptionLimitsSkeleton() {
  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

function QuickStatsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}