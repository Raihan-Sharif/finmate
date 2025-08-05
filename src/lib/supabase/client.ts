import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const supabase = createClient()

// Auth instance
export const auth = supabase.auth

// Table constants
export const TABLES = {
  PROFILES: 'profiles',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  INVESTMENTS: 'investments',
  LOANS: 'loans',
  LENDING: 'lending',
  ACCOUNTS: 'accounts',
  NOTIFICATIONS: 'notifications',
  EMI_PAYMENTS: 'emi_payments',
} as const

// Database helper functions
export const db = {
  async findMany<T>(
    table: string,
    options?: {
      filter?: Record<string, any>
      orderBy?: { column: string; ascending: boolean }
      limit?: number
    }
  ): Promise<T[]> {
    let query = supabase.from(table).select('*')
    
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending 
      })
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async findOne<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create<T>(table: string, data: any): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async update<T>(table: string, id: string, data: any): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Real-time subscriptions
export const realtime = {
  subscribe(table: string, userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }
}