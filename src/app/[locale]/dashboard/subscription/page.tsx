import { Suspense } from 'react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Crown, CreditCard, Users, TrendingUp } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('subscription')
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

export default async function SubscriptionPage() {
  const t = await getTranslations('subscription')
  const tCommon = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Page Header */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                  <Crown className="h-6 w-6" />
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
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{t('activeSubscription')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 container mx-auto px-4 py-8">
        <Suspense fallback={<SubscriptionPageSkeleton />}>
          <SubscriptionManager />
        </Suspense>
      </div>
    </div>
  )
}

function SubscriptionPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Current Plan Skeleton */}
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plans Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-4">
              <Skeleton className="h-6 w-20 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto mt-2" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-10 w-24 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
              <div className="pt-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}