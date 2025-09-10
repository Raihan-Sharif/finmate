import { Suspense } from 'react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import SubscriptionMain from '@/components/subscription/SubscriptionMain'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Crown, CreditCard, Users, TrendingUp, Sparkles, Zap, Shield } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('subscription')
  
  return {
    title: `${t('pageTitle')} - FinMate`,
    description: t('pageDescription'),
  }
}

export default async function SubscriptionPage() {
  const t = await getTranslations('subscription')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/10 dark:from-slate-950 dark:via-indigo-950/10 dark:to-purple-950/5 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Page Header */}
      <div className="relative z-10 border-b border-slate-200/30 dark:border-slate-800/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-30 animate-pulse" />
                <div className="relative p-4 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl">
                  <Crown className="h-10 w-10" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                {t('heroTitle', { default: 'Subscription Plans' })}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {t('heroSubtitle', { 
                  default: 'Choose the perfect plan to unlock premium features and take your financial management to the next level.' 
                })}
              </p>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Premium Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <Suspense fallback={<SubscriptionPageSkeleton />}>
          <SubscriptionMain />
        </Suspense>
      </div>
      
      {/* Footer Trust Section */}
      <div className="relative z-10 border-t border-slate-200/30 dark:border-slate-800/30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span>Cancel Anytime</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 max-w-md mx-auto">
              Your payment information is secure and encrypted. All transactions are processed through secure payment gateways.
            </p>
          </div>
        </div>
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