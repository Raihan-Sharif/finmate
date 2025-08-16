import { supabase, TABLES } from '@/lib/supabase/client';

export class RecurringExecutorService {
  /**
   * Execute all pending recurring transactions
   * This should be called by a cron job or background taskrecurring-executor.ts
   */
  static async executePendingRecurringTransactions(): Promise<{
    executed: number;
    errors: Array<{ recurringId: string; error: string }>;
  }> {
    const results = {
      executed: 0,
      errors: [] as Array<{ recurringId: string; error: string }>
    };

    try {
      // Call the database function to execute pending recurring transactions
      const { data, error } = await supabase.rpc('execute_pending_recurring_transactions');
      
      if (error) {
        console.error('Error executing recurring transactions:', error);
        throw error;
      }
      
      results.executed = data || 0;
      console.log(`Executed ${results.executed} recurring transactions`);
      
      return results;
    } catch (error: any) {
      console.error('Failed to execute recurring transactions:', error);
      results.errors.push({
        recurringId: 'general',
        error: error.message || 'Unknown error'
      });
      return results;
    }
  }

  /**
   * Execute a specific recurring transaction manually
   */
  static async executeRecurringTransactionById(
    recurringId: string, 
    userId: string
  ): Promise<string | null> {
    try {
      // Get the recurring transaction
      const { data: recurring, error: recurringError } = await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .select('*')
        .eq('id', recurringId)
        .eq('user_id', userId)
        .single();

      if (recurringError || !recurring) {
        throw new Error('Recurring transaction not found');
      }

      if (!recurring.is_active) {
        throw new Error('Recurring transaction is not active');
      }

      // Create new transaction from template
      const template = recurring.transaction_template;
      const { data: newTransaction, error: transactionError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .insert({
          user_id: userId,
          type: template.type,
          amount: template.amount,
          currency: template.currency || 'BDT',
          description: template.description,
          notes: template.notes,
          category_id: template.category_id,
          subcategory_id: template.subcategory_id,
          account_id: template.account_id,
          date: new Date().toISOString().split('T')[0],
          tags: template.tags || [],
          location: template.location,
          vendor: template.vendor,
          is_recurring: true,
          recurring_template_id: recurringId,
        })
        .select('id')
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Update recurring transaction's next execution and last executed
      const nextExecution = this.calculateNextExecution(
        new Date().toISOString().split('T')[0]!,
        recurring.frequency || 'monthly',
        recurring.interval_value || 1
      );

      await supabase
        .from(TABLES.RECURRING_TRANSACTIONS)
        .update({
          last_executed: new Date().toISOString().split('T')[0],
          next_execution: nextExecution,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recurringId)
        .eq('user_id', userId);

      return newTransaction.id;
    } catch (error: any) {
      console.error('Error executing recurring transaction:', error);
      throw error;
    }
  }

  /**
   * Calculate next execution date
   */
  private static calculateNextExecution(
    currentDate: string,
    frequency: string,
    intervalValue: number = 1
  ): string {
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
        // Default to monthly
        date.setMonth(date.getMonth() + intervalValue);
    }
    
    return date.toISOString().split('T')[0]!;
  }

  /**
   * Get upcoming recurring transactions (next 30 days)
   */
  static async getUpcomingRecurringTransactions(userId: string) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const { data, error } = await supabase
      .from(TABLES.RECURRING_TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('next_execution', today.toISOString().split('T')[0])
      .lte('next_execution', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('next_execution', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}