import { supabase, TABLES } from '@/lib/supabase/client';
import { Transaction, TransactionInsert, Account } from '@/types';
import { TransactionService } from './transactions';

/**
 * Financial Integration Service
 * Handles automatic transaction creation and account balance updates for all financial operations
 * (loans, lending, investments, budgets, etc.)
 */
export class FinancialIntegrationService {
  
  /**
   * Create a transaction with automatic account balance update
   */
  static async createTransactionWithBalanceUpdate(
    transactionData: TransactionInsert,
    options?: {
      skipBalanceUpdate?: boolean;
      updateBudget?: boolean;
    }
  ): Promise<Transaction> {
    const { skipBalanceUpdate = false, updateBudget = true } = options || {};

    try {
      // 1. Create the transaction
      const transaction = await TransactionService.createTransaction(transactionData);

      // 2. Update account balance if needed
      if (!skipBalanceUpdate && transactionData.account_id) {
        await this.updateAccountBalance(
          transactionData.account_id,
          transactionData.amount,
          transactionData.type,
          transactionData.user_id
        );
      }

      // 3. Handle transfers
      if (transactionData.type === 'transfer' && transactionData.transfer_to_account_id) {
        // Deduct from source account
        await this.updateAccountBalance(
          transactionData.account_id!,
          transactionData.amount,
          'expense',
          transactionData.user_id
        );
        
        // Add to destination account
        await this.updateAccountBalance(
          transactionData.transfer_to_account_id,
          transactionData.amount,
          'income',
          transactionData.user_id
        );
      }

      // 4. Update budget if applicable
      if (updateBudget && transactionData.type === 'expense' && transactionData.category_id) {
        await this.updateBudgetSpending(
          transactionData.user_id,
          transactionData.category_id,
          transactionData.amount
        );
      }

      return transaction;
    } catch (error) {
      console.error('Error creating transaction with balance update:', error);
      throw error;
    }
  }

  /**
   * Update account balance based on transaction
   */
  private static async updateAccountBalance(
    accountId: string,
    amount: number,
    transactionType: 'income' | 'expense' | 'transfer',
    userId: string
  ): Promise<void> {
    try {
      // Get current account balance
      const { data: account, error: fetchError } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('balance')
        .eq('id', accountId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new balance
      let newBalance = account.balance;
      
      if (transactionType === 'income') {
        newBalance += amount;
      } else if (transactionType === 'expense') {
        newBalance -= amount;
      }

      // Update account balance
      const { error: updateError } = await supabase
        .from(TABLES.ACCOUNTS)
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }

  /**
   * Update budget spending when expense transaction is created
   */
  private static async updateBudgetSpending(
    userId: string,
    categoryId: string,
    amount: number
  ): Promise<void> {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Find active budget for this category and period
      const { data: budget, error: fetchError } = await supabase
        .from(TABLES.BUDGETS)
        .select('id, spent_amount, amount')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .or(`category_id.eq.${categoryId},category_id.is.null`)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (budget) {
        const newSpentAmount = (budget.spent_amount || 0) + amount;
        const remainingAmount = budget.amount - newSpentAmount;

        const { error: updateError } = await supabase
          .from(TABLES.BUDGETS)
          .update({
            spent_amount: newSpentAmount,
            remaining_amount: remainingAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', budget.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating budget spending:', error);
      // Don't throw error here as budget update is not critical for transaction creation
    }
  }

  /**
   * Create EMI payment transaction with account and budget updates
   */
  static async createEMIPaymentTransaction(
    userId: string,
    loanData: {
      id: string;
      loan_name: string;
      emi_amount: number;
      lender: string;
      account_id?: string;
    },
    paymentDate: string = new Date().toISOString().split('T')[0]!
  ): Promise<{ transaction: Transaction; success: boolean; message: string }> {
    try {
      // Create expense transaction for EMI payment
      const transactionData: TransactionInsert = {
        user_id: userId,
        type: 'expense',
        amount: loanData.emi_amount,
        description: `EMI Payment - ${loanData.loan_name}`,
        vendor: loanData.lender,
        date: paymentDate,
        account_id: loanData.account_id || null,
        category_id: await this.getOrCreateLoanCategory(userId),
        notes: `Auto-generated EMI payment for loan ${loanData.loan_name}`,
        tags: ['emi', 'loan', 'auto-generated']
      };

      const transaction = await this.createTransactionWithBalanceUpdate(transactionData);

      return {
        transaction,
        success: true,
        message: `EMI payment of ${loanData.emi_amount} recorded successfully`
      };
    } catch (error) {
      console.error('Error creating EMI payment transaction:', error);
      return {
        transaction: null as any,
        success: false,
        message: `Failed to create EMI payment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create lending transaction (money lent/borrowed/repaid)
   */
  static async createLendingTransaction(
    userId: string,
    lendingData: {
      id: string;
      person_name: string;
      amount: number;
      type: 'lent' | 'borrowed';
      account_id?: string;
    },
    transactionType: 'lent' | 'borrowed' | 'repayment_received' | 'repayment_made',
    amount: number,
    transactionDate: string = new Date().toISOString().split('T')[0]!
  ): Promise<{ transaction: Transaction; success: boolean; message: string }> {
    try {
      let description: string;
      let txnType: 'income' | 'expense';
      let vendor: string;

      switch (transactionType) {
        case 'lent':
          description = `Money Lent to ${lendingData.person_name}`;
          txnType = 'expense';
          vendor = lendingData.person_name;
          break;
        case 'borrowed':
          description = `Money Borrowed from ${lendingData.person_name}`;
          txnType = 'income';
          vendor = lendingData.person_name;
          break;
        case 'repayment_received':
          description = `Repayment Received from ${lendingData.person_name}`;
          txnType = 'income';
          vendor = lendingData.person_name;
          break;
        case 'repayment_made':
          description = `Repayment Made to ${lendingData.person_name}`;
          txnType = 'expense';
          vendor = lendingData.person_name;
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      const transactionData: TransactionInsert = {
        user_id: userId,
        type: txnType,
        amount: amount,
        description: description,
        vendor: vendor,
        date: transactionDate,
        account_id: lendingData.account_id || null,
        category_id: await this.getOrCreateLendingCategory(userId),
        notes: `Auto-generated lending transaction`,
        tags: ['lending', 'personal', 'auto-generated']
      };

      const transaction = await this.createTransactionWithBalanceUpdate(transactionData);

      return {
        transaction,
        success: true,
        message: `${description} of ${amount} recorded successfully`
      };
    } catch (error) {
      console.error('Error creating lending transaction:', error);
      return {
        transaction: null as any,
        success: false,
        message: `Failed to create lending transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create investment transaction
   */
  static async createInvestmentTransaction(
    userId: string,
    investmentData: {
      id: string;
      name: string;
      amount: number;
      account_id?: string;
    },
    transactionType: 'buy' | 'sell' | 'dividend' | 'sip',
    amount: number,
    transactionDate: string = new Date().toISOString().split('T')[0]!
  ): Promise<{ transaction: Transaction; success: boolean; message: string }> {
    try {
      let description: string;
      let txnType: 'income' | 'expense';

      switch (transactionType) {
        case 'buy':
        case 'sip':
          description = `Investment ${transactionType === 'sip' ? 'SIP' : 'Purchase'} - ${investmentData.name}`;
          txnType = 'expense';
          break;
        case 'sell':
          description = `Investment Sale - ${investmentData.name}`;
          txnType = 'income';
          break;
        case 'dividend':
          description = `Dividend Received - ${investmentData.name}`;
          txnType = 'income';
          break;
        default:
          throw new Error('Invalid investment transaction type');
      }

      const transactionData: TransactionInsert = {
        user_id: userId,
        type: txnType,
        amount: amount,
        description: description,
        vendor: 'Investment Platform',
        date: transactionDate,
        account_id: investmentData.account_id || null,
        category_id: await this.getOrCreateInvestmentCategory(userId),
        notes: `Auto-generated investment transaction`,
        tags: ['investment', transactionType, 'auto-generated']
      };

      const transaction = await this.createTransactionWithBalanceUpdate(transactionData, {
        updateBudget: false // Investments typically don't count against regular budgets
      });

      return {
        transaction,
        success: true,
        message: `${description} of ${amount} recorded successfully`
      };
    } catch (error) {
      console.error('Error creating investment transaction:', error);
      return {
        transaction: null as any,
        success: false,
        message: `Failed to create investment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get or create default categories for different transaction types
   */
  private static async getOrCreateLoanCategory(userId: string): Promise<string> {
    return this.getOrCreateCategory(userId, 'Loan & EMI', 'expense', '#DC2626', '🏦');
  }

  private static async getOrCreateLendingCategory(userId: string): Promise<string> {
    return this.getOrCreateCategory(userId, 'Personal Lending', 'both', '#059669', '👥');
  }

  private static async getOrCreateInvestmentCategory(userId: string): Promise<string> {
    return this.getOrCreateCategory(userId, 'Investments', 'both', '#7C3AED', '📈');
  }

  private static async getOrCreateCategory(
    userId: string,
    name: string,
    type: 'income' | 'expense' | 'both',
    color: string,
    icon: string
  ): Promise<string> {
    try {
      // Try to find existing category
      const { data: existing } = await supabase
        .from(TABLES.CATEGORIES)
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new category
      const { data: newCategory, error } = await supabase
        .from(TABLES.CATEGORIES)
        .insert({
          user_id: userId,
          name: name,
          type: type,
          color: color,
          icon: icon,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;
      return newCategory.id;
    } catch (error) {
      console.error(`Error getting/creating ${name} category:`, error);
      // Return empty string if category creation fails
      return '';
    }
  }

  /**
   * Get account balance summary with real-time calculation
   */
  static async getAccountBalanceSummary(userId: string) {
    try {
      const { data: accounts, error: accountError } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('id, name, type, balance, currency, include_in_total')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq('is_active', true);

      if (accountError) throw accountError;

      // Get recent transactions to calculate real balance
      const { data: transactions, error: txnError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('account_id, type, amount, transfer_to_account_id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (txnError) throw txnError;

      const accountBalances = new Map();
      
      // Initialize with stored balances
      accounts?.forEach(account => {
        accountBalances.set(account.id, {
          ...account,
          realtime_balance: account.balance
        });
      });

      // Calculate real-time balances from recent transactions
      transactions?.forEach(txn => {
        if (txn.account_id && accountBalances.has(txn.account_id)) {
          const account = accountBalances.get(txn.account_id);
          if (txn.type === 'income') {
            account.realtime_balance += txn.amount;
          } else if (txn.type === 'expense') {
            account.realtime_balance -= txn.amount;
          }
        }

        // Handle transfer destinations
        if (txn.transfer_to_account_id && accountBalances.has(txn.transfer_to_account_id)) {
          const account = accountBalances.get(txn.transfer_to_account_id);
          account.realtime_balance += txn.amount;
        }
      });

      return {
        accounts: Array.from(accountBalances.values()),
        totalBalance: Array.from(accountBalances.values())
          .filter(acc => acc.include_in_total)
          .reduce((sum, acc) => sum + acc.realtime_balance, 0)
      };
    } catch (error) {
      console.error('Error getting account balance summary:', error);
      throw error;
    }
  }

  /**
   * Sync all account balances based on transaction history (maintenance function)
   */
  static async syncAccountBalances(userId: string): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      // Get all user accounts
      const { data: accounts, error: accountError } = await supabase
        .from(TABLES.ACCOUNTS)
        .select('id, name')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq('is_active', true);

      if (accountError) throw accountError;

      for (const account of accounts || []) {
        try {
          // Calculate balance from all transactions
          const { data: transactions, error: txnError } = await supabase
            .from(TABLES.TRANSACTIONS)
            .select('type, amount, transfer_to_account_id')
            .eq('user_id', userId)
            .or(`account_id.eq.${account.id},transfer_to_account_id.eq.${account.id}`);

          if (txnError) throw txnError;

          let calculatedBalance = 0;

          transactions?.forEach(txn => {
            if (txn.transfer_to_account_id === account.id) {
              // Transfer INTO this account
              calculatedBalance += txn.amount;
            } else {
              // Regular transaction FROM this account
              if (txn.type === 'income') {
                calculatedBalance += txn.amount;
              } else if (txn.type === 'expense') {
                calculatedBalance -= txn.amount;
              }
            }
          });

          // Update account balance
          const { error: updateError } = await supabase
            .from(TABLES.ACCOUNTS)
            .update({ 
              balance: calculatedBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);

          if (updateError) throw updateError;
          updated++;
        } catch (error) {
          errors.push(`Failed to sync ${account.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { updated, errors };
    } catch (error) {
      errors.push(`Failed to sync account balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { updated, errors };
    }
  }
}

export default FinancialIntegrationService;