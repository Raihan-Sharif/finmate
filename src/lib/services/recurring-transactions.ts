import { supabase, TABLES } from '@/lib/supabase/client';
import { TransactionService } from './transactions';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  transaction_template: any;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  interval_value: number;
  start_date: string;
  end_date?: string;
  last_executed?: string;
  next_execution: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionInsert {
  user_id: string;
  transaction_template: any;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  interval_value?: number;
  start_date: string;
  end_date?: string;
  next_execution: string;
  is_active?: boolean;
}

export interface RecurringTransactionUpdate {
  transaction_template?: any;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  interval_value?: number;
  start_date?: string;
  end_date?: string;
  next_execution?: string;
  is_active?: boolean;
}

export class RecurringTransactionService {
  // Get all recurring transactions for a user
  static async getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get active recurring transactions for execution
  static async getActiveRecurringTransactions(userId?: string): Promise<RecurringTransaction[]> {
    let query = supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', new Date().toISOString().split('T')[0]);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('next_execution');

    if (error) throw error;
    return data || [];
  }

  // Get recurring transaction by ID
  static async getRecurringTransactionById(id: string, userId: string): Promise<RecurringTransaction | null> {
    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Create new recurring transaction
  static async createRecurringTransaction(recurring: RecurringTransactionInsert): Promise<RecurringTransaction> {
    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .insert({
        ...recurring,
        interval_value: recurring.interval_value || 1,
        is_active: recurring.is_active !== false
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update recurring transaction
  static async updateRecurringTransaction(
    id: string, 
    updates: RecurringTransactionUpdate, 
    userId: string
  ): Promise<RecurringTransaction> {
    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Delete recurring transaction
  static async deleteRecurringTransaction(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Pause/Resume recurring transaction
  static async toggleRecurringTransaction(id: string, userId: string, isActive: boolean): Promise<RecurringTransaction> {
    return this.updateRecurringTransaction(id, { is_active: isActive }, userId);
  }

  // Calculate next execution date based on frequency
  static calculateNextExecution(currentDate: string, frequency: string, intervalValue: number = 1): string {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + (7 * intervalValue));
        break;
      case 'biweekly':
        date.setDate(date.getDate() + (14 * intervalValue));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + intervalValue);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (3 * intervalValue));
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + intervalValue);
        break;
      default:
        throw new Error(`Unknown frequency: ${frequency}`);
    }
    
    return date.toISOString().split('T')[0];
  }

  // Execute a recurring transaction (create actual transaction and update next execution)
  static async executeRecurringTransaction(recurringId: string, userId: string): Promise<void> {
    // Get the recurring transaction
    const recurring = await this.getRecurringTransactionById(recurringId, userId);
    if (!recurring || !recurring.is_active) {
      throw new Error('Recurring transaction not found or inactive');
    }

    // Create the actual transaction from template
    const transactionData = {
      ...recurring.transaction_template,
      user_id: userId,
      date: recurring.next_execution,
      is_recurring: true,
      recurring_pattern: {
        frequency: recurring.frequency,
        interval_value: recurring.interval_value,
        recurring_id: recurringId
      }
    };

    // Create the transaction
    await TransactionService.createTransaction(transactionData);

    // Calculate next execution date
    const nextExecution = this.calculateNextExecution(
      recurring.next_execution, 
      recurring.frequency, 
      recurring.interval_value
    );

    // Update the recurring transaction
    await this.updateRecurringTransaction(recurringId, {
      last_executed: recurring.next_execution,
      next_execution: nextExecution
    }, userId);
  }

  // Execute all due recurring transactions for a user
  static async executeAllDueRecurringTransactions(userId: string): Promise<number> {
    const dueRecurring = await this.getActiveRecurringTransactions(userId);
    let executedCount = 0;

    for (const recurring of dueRecurring) {
      try {
        await this.executeRecurringTransaction(recurring.id, userId);
        executedCount++;
      } catch (error) {
        console.error(`Failed to execute recurring transaction ${recurring.id}:`, error);
      }
    }

    return executedCount;
  }

  // Get upcoming recurring transactions (next 30 days)
  static async getUpcomingRecurringTransactions(userId: string, days: number = 30): Promise<RecurringTransaction[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_execution', endDate.toISOString().split('T')[0])
      .order('next_execution');

    if (error) throw error;
    return data || [];
  }

  // Create recurring transaction from regular transaction
  static async createFromTransaction(
    transactionId: string, 
    userId: string, 
    frequency: string, 
    startDate?: string
  ): Promise<RecurringTransaction> {
    // Get the original transaction
    const transaction = await TransactionService.getTransactionById(transactionId, userId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Create transaction template (remove ID and timestamps)
    const { id, created_at, updated_at, is_recurring, recurring_pattern, ...template } = transaction;

    // Calculate next execution date
    const nextExecution = this.calculateNextExecution(
      startDate || new Date().toISOString().split('T')[0], 
      frequency
    );

    // Create recurring transaction
    return this.createRecurringTransaction({
      user_id: userId,
      transaction_template: template,
      frequency: frequency as any,
      start_date: startDate || new Date().toISOString().split('T')[0],
      next_execution: nextExecution
    });
  }

  // Get statistics for recurring transactions
  static async getRecurringTransactionStats(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .select('frequency, is_active, transaction_template')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      active: 0,
      inactive: 0,
      byFrequency: {
        weekly: 0,
        biweekly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0
      },
      totalMonthlyAmount: 0
    };

    data?.forEach(recurring => {
      if (recurring.is_active) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      if (stats.byFrequency[recurring.frequency as keyof typeof stats.byFrequency] !== undefined) {
        stats.byFrequency[recurring.frequency as keyof typeof stats.byFrequency]++;
      }

      // Calculate monthly equivalent amount
      const amount = recurring.transaction_template?.amount || 0;
      let monthlyEquivalent = 0;

      switch (recurring.frequency) {
        case 'weekly':
          monthlyEquivalent = amount * 4.33; // Average weeks per month
          break;
        case 'biweekly':
          monthlyEquivalent = amount * 2.17; // Every 2 weeks
          break;
        case 'monthly':
          monthlyEquivalent = amount;
          break;
        case 'quarterly':
          monthlyEquivalent = amount / 3;
          break;
        case 'yearly':
          monthlyEquivalent = amount / 12;
          break;
      }

      if (recurring.transaction_template?.type === 'income') {
        stats.totalMonthlyAmount += monthlyEquivalent;
      } else if (recurring.transaction_template?.type === 'expense') {
        stats.totalMonthlyAmount -= monthlyEquivalent;
      }
    });

    return stats;
  }
}

export default RecurringTransactionService;