'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { getUserAccounts } from '@/lib/services/accounts'
import { Skeleton } from '@/components/ui/skeleton'

export default function QuickStatsClient() {
  const t = useTranslations('accounts')
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalBalance: 0,
    highestAccount: 0,
    lowestAccount: 0,
    averageBalance: 0,
    accountCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadAccountStats()
    }
  }, [user?.id])

  const loadAccountStats = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const accounts = await getUserAccounts(user.id)
      
      if (accounts.length === 0) {
        setStats({ totalBalance: 0, highestAccount: 0, lowestAccount: 0, averageBalance: 0, accountCount: 0 })
        return
      }

      const balances = accounts.map(acc => acc.balance)
      const totalBalance = balances.reduce((sum, bal) => sum + bal, 0)
      const highestAccount = Math.max(...balances)
      const lowestAccount = Math.min(...balances)
      const averageBalance = totalBalance / balances.length

      setStats({
        totalBalance,
        highestAccount,
        lowestAccount,
        averageBalance,
        accountCount: accounts.length
      })
    } catch (error) {
      console.error('Error loading account stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{t('stats.totalBalance')}</span>
        <span className="text-xs font-semibold text-green-600 dark:text-green-400">৳{stats.totalBalance.toLocaleString()}</span>
      </div>
      {stats.accountCount > 1 && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{t('stats.highest')}</span>
            <span className="text-xs font-semibold">৳{stats.highestAccount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{t('stats.lowest')}</span>
            <span className="text-xs font-semibold">৳{stats.lowestAccount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{t('stats.average')}</span>
            <span className="text-xs font-semibold">৳{stats.averageBalance.toLocaleString()}</span>
          </div>
        </>
      )}
      {stats.accountCount === 0 && (
        <div className="text-center py-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">No accounts yet</span>
        </div>
      )}
    </div>
  )
}