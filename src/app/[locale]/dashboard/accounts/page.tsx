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
import QuickStatsClient from '@/components/accounts/QuickStatsClient'

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

      {/* Accounts List and Compact Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        {/* Main Accounts List - Takes 4/6 of the width */}
        <div className="xl:col-span-4">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">
                {t('myAccounts')}
              </CardTitle>
              <CardDescription>
                {t('manageAccountsDesc')}
              </CardDescription>
            </CardHeader>
            <AccountsList />
          </Card>
        </div>

        {/* Ultra-Compact Sidebar - Takes 2/6 of the width */}
        <div className="xl:col-span-2 space-y-3">
          {/* Subscription Limits - Ultra Compact */}
          <SubscriptionLimitsCard />

          {/* Quick Stats - Ultra Compact */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader className="pb-2 px-3 pt-3">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <TrendingUp className="h-3 w-3" />
                </div>
                <CardTitle className="text-sm text-emerald-900 dark:text-emerald-100">
                  {t('quickStats')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <QuickStatsClient />
            </CardContent>
          </Card>

          {/* Account Tips - Ultra Compact */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                {t('tips.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3 space-y-1.5">
              <div className="flex items-start space-x-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-blue-800 dark:text-blue-200 leading-tight">
                  {t('tips.tip1')}
                </p>
              </div>
              <div className="flex items-start space-x-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-blue-800 dark:text-blue-200 leading-tight">
                  {t('tips.tip2')}
                </p>
              </div>
              <div className="flex items-start space-x-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-blue-800 dark:text-blue-200 leading-tight">
                  {t('tips.tip3')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Family Members - Ultra Compact */}
          <FamilyMembersSection />
        </div>
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
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        {/* Main Accounts List Skeleton */}
        <div className="xl:col-span-4">
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

        {/* Ultra-Compact Sidebar Skeleton */}
        <div className="xl:col-span-2 space-y-3">
          <SubscriptionLimitsSkeleton />
          <QuickStatsSkeleton />
          <AccountTipsSkeleton />
          <FamilyMembersSkeleton />
        </div>
      </div>
    </div>
  )
}

// Ultra-Compact Skeleton Components
function SubscriptionLimitsSkeleton() {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-2 px-3 pt-3">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-2 w-8" />
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  )
}

function QuickStatsSkeleton() {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/50">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center space-x-1.5">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AccountTipsSkeleton() {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
      <CardHeader className="pb-2 px-3 pt-3">
        <Skeleton className="h-3 w-16" />
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 space-y-1.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-1.5">
            <Skeleton className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FamilyMembersSkeleton() {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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

