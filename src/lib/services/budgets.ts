import { supabase, TABLES } from '@/lib/supabase/client';
import { Budget, BudgetInsert, BudgetUpdate } from '@/types';

export class BudgetService {
  // Get all budgets for a user
  static async getBudgets(userId: string): Promise<Budget[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get budget by ID
  static async getBudgetById(id: string, userId: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from(TABLES.BUDGETS)
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

  // Create new budget
  static async createBudget(budget: BudgetInsert): Promise<Budget> {
    const { data, error } = await supabase
      .from(TABLES.BUDGETS)
      .insert(budget)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update budget
  static async updateBudget(id: string, updates: BudgetUpdate, userId: string): Promise<Budget> {
    const { data, error } = await supabase
      .from(TABLES.BUDGETS)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Delete (deactivate) budget
  static async deleteBudget(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BUDGETS)
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get current budgets with spending data
  static async getCurrentBudgets(userId: string) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const { data: budgets, error } = await supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('start_date', currentDate)
      .gte('end_date', currentDate);

    if (error) throw error;

    // Calculate actual spending for each budget
    const budgetsWithSpending = await Promise.all(
      (budgets || []).map(async (budget) => {
        const spending = await this.calculateBudgetSpending(budget.id, userId);
        return {
          ...budget,
          actual_spent: spending.totalSpent,
          remaining: budget.amount - spending.totalSpent,
          percentage_used: budget.amount > 0 ? (spending.totalSpent / budget.amount) * 100 : 0,
          is_over_budget: spending.totalSpent > budget.amount,
          days_remaining: Math.max(0, Math.ceil((new Date(budget.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        };
      })
    );

    return budgetsWithSpending;
  }

  // Calculate budget spending
  static async calculateBudgetSpending(budgetId: string, userId: string) {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) throw new Error('Budget not found');

    let query = supabase
      .from(TABLES.TRANSACTIONS)
      .select('amount, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', budget.start_date)
      .lte('date', budget.end_date);

    // Filter by categories if specified
    if (budget.category_ids && budget.category_ids.length > 0) {
      query = query.in('category_id', budget.category_ids);
    }

    const { data, error } = await query;

    if (error) throw error;

    const totalSpent = data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    return {
      totalSpent,
      transactionCount: data?.length || 0,
      averagePerDay: budget.start_date && budget.end_date 
        ? totalSpent / Math.max(1, Math.ceil((new Date(budget.end_date).getTime() - new Date(budget.start_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0
    };
  }

  // Get budget performance data
  static async getBudgetPerformance(userId: string, period?: { startDate: string; endDate: string }) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId);

    if (period) {
      query = query
        .gte('start_date', period.startDate)
        .lte('end_date', period.endDate);
    } else {
      // Default to current month
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      query = query
        .gte('start_date', firstDay)
        .lte('end_date', lastDay);
    }

    const { data: budgets, error } = await query;

    if (error) throw error;

    const performance = {
      totalBudgets: budgets?.length || 0,
      totalBudgetAmount: 0,
      totalSpent: 0,
      budgetsOverLimit: 0,
      budgetsOnTrack: 0,
      averageUsagePercentage: 0
    };

    if (budgets && budgets.length > 0) {
      const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
          const spending = await this.calculateBudgetSpending(budget.id, userId);
          return {
            ...budget,
            actualSpent: spending.totalSpent,
            usagePercentage: budget.amount > 0 ? (spending.totalSpent / budget.amount) * 100 : 0
          };
        })
      );

      performance.totalBudgetAmount = budgetsWithSpending.reduce((sum, b) => sum + b.amount, 0);
      performance.totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.actualSpent, 0);
      performance.budgetsOverLimit = budgetsWithSpending.filter(b => b.actualSpent > b.amount).length;
      performance.budgetsOnTrack = budgetsWithSpending.filter(b => b.actualSpent <= b.amount).length;
      performance.averageUsagePercentage = budgetsWithSpending.reduce((sum, b) => sum + b.usagePercentage, 0) / budgetsWithSpending.length;
    }

    return performance;
  }

  // Get budget alerts
  static async getBudgetAlerts(userId: string) {
    const currentBudgets = await this.getCurrentBudgets(userId);
    
    const alerts = currentBudgets
      .filter(budget => {
        if (!budget.alert_enabled) return false;
        return budget.percentage_used >= budget.alert_percentage;
      })
      .map(budget => ({
        id: budget.id,
        name: budget.name,
        type: budget.percentage_used >= 100 ? 'exceeded' : 'warning',
        message: budget.percentage_used >= 100 
          ? `Budget exceeded by ${(budget.percentage_used - 100).toFixed(1)}%`
          : `Budget ${budget.percentage_used.toFixed(1)}% used`,
        amount: budget.amount,
        spent: budget.actual_spent,
        remaining: budget.remaining,
        percentage: budget.percentage_used,
        daysRemaining: budget.days_remaining
      }));

    return alerts;
  }

  // Create budget from template
  static async createBudgetFromTemplate(templateId: string, userId: string, overrides?: Partial<BudgetInsert>): Promise<Budget> {
    const template = await this.getBudgetById(templateId, userId);
    if (!template) throw new Error('Template budget not found');

    const newBudget: BudgetInsert = {
      user_id: userId,
      name: `${template.name} (Copy)`,
      description: template.description,
      amount: template.amount,
      period: template.period,
      category_ids: template.category_ids,
      alert_percentage: template.alert_percentage,
      alert_enabled: template.alert_enabled,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      ...overrides
    };

    return this.createBudget(newBudget);
  }

  // Get budget history
  static async getBudgetHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calculate final spending for completed budgets
    const budgetsWithFinalSpending = await Promise.all(
      (data || []).map(async (budget) => {
        const spending = await this.calculateBudgetSpending(budget.id, userId);
        return {
          ...budget,
          final_spent: spending.totalSpent,
          success_rate: budget.amount > 0 ? Math.min(100, (budget.amount - spending.totalSpent) / budget.amount * 100) : 0
        };
      })
    );

    return budgetsWithFinalSpending;
  }

  // Duplicate budget
  static async duplicateBudget(budgetId: string, userId: string): Promise<Budget> {
    const originalBudget = await this.getBudgetById(budgetId, userId);
    if (!originalBudget) throw new Error('Budget not found');

    const newBudget: BudgetInsert = {
      user_id: userId,
      name: `${originalBudget.name} (Copy)`,
      description: originalBudget.description,
      amount: originalBudget.amount,
      period: originalBudget.period,
      category_ids: originalBudget.category_ids,
      alert_percentage: originalBudget.alert_percentage,
      alert_enabled: originalBudget.alert_enabled,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    };

    return this.createBudget(newBudget);
  }
}

export default BudgetService;