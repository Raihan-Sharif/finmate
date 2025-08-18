'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { AccountService } from '@/lib/services/accounts'

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await AccountService.getAccounts(user.id)
      setAccounts(data || [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const refreshAccounts = useCallback(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    loading,
    error,
    refreshAccounts,
  }
}