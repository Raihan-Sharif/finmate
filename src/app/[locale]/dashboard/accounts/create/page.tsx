import { Suspense } from 'react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import CreateAccountForm from '@/components/accounts/CreateAccountForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'bn' }
  ]
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('accounts')
  
  return {
    title: t('createAccount') + ' - FinMate',
    description: t('createAccountDescription'),
  }
}

export default async function CreateAccountPage() {
  const t = await getTranslations('accounts')
  const tCommon = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Page Header */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/accounts">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {tCommon('back')}
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {t('createAccount')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('createAccountDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="text-center">
                <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                  {t('createFirstAccount')}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                  {t('createAccountDescription')}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <Suspense fallback={<CreateAccountFormSkeleton />}>
                <CreateAccountForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CreateAccountFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < 2 && <Skeleton className="w-8 h-0.5 ml-2" />}
          </div>
        ))}
      </div>
      
      {/* Form Fields */}
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}