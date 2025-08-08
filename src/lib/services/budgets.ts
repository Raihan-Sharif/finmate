import { supabase, TABLES } from '@/lib/supabase/client';
import { Budget, BudgetInsert, BudgetUpdate, BudgetPeriod } from '@/types';

export interface BudgetWithSpending extends Budget {
  actual_spent: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
  days_remaining: number;
}

export interface BudgetAlert {
  id: string;
  name: string;
  type: 'warning' | 'exceeded' | 'approaching';
  message: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  daysRemaining: number;
  priority: 'low' | 'medium' | 'high';
}

export interface BudgetPerformance {
  totalBudgets: number;
  totalBudgetAmount: number;
  totalSpent: number;
  budgetsOverLimit: number;
  budgetsOnTrack: number;
  budgetsAtRisk: number;
  averageUsagePercentage: number;
  savingsRate: number;
}

export interface BudgetTemplate {
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  category_ids?: string[];
  alert_percentage: number;
}

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
  static async getBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
    const currentBudgets = await this.getCurrentBudgets(userId);
    
    const alerts: BudgetAlert[] = currentBudgets
      .filter(budget => {
        return budget.percentage_used >= (budget.alert_percentage || 80);
      })
      .map(budget => {
        let type: 'warning' | 'exceeded' | 'approaching' = 'warning';
        let priority: 'low' | 'medium' | 'high' = 'medium';
        let message = '';

        if (budget.percentage_used >= 100) {
          type = 'exceeded';
          priority = 'high';
          message = `Budget exceeded by ${(budget.percentage_used - 100).toFixed(1)}%`;
        } else if (budget.percentage_used >= 90) {
          type = 'warning';
          priority = 'high';
          message = `Only ${budget.remaining.toFixed(2)} left in budget`;
        } else if (budget.percentage_used >= (budget.alert_percentage || 80)) {
          type = 'approaching';
          priority = budget.percentage_used >= 85 ? 'medium' : 'low';
          message = `${budget.percentage_used.toFixed(1)}% of budget used`;
        }

        return {
          id: budget.id,
          name: budget.name,
          type,
          message,
          amount: budget.amount,
          spent: budget.actual_spent,
          remaining: budget.remaining,
          percentage: budget.percentage_used,
          daysRemaining: budget.days_remaining,
          priority
        };
      })
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

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

  // Create recurring budget (monthly)
  static async createRecurringBudget(userId: string, template: BudgetTemplate, months: number = 12): Promise<Budget[]> {
    const budgets: Budget[] = [];
    const startDate = new Date();

    for (let i = 0; i < months; i++) {
      const budgetStartDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const budgetEndDate = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0);

      const budgetData: BudgetInsert = {
        user_id: userId,
        name: `${template.name} - ${budgetStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        description: template.description,
        amount: template.amount,
        period: template.period,
        start_date: budgetStartDate.toISOString().split('T')[0],
        end_date: budgetEndDate.toISOString().split('T')[0],
        category_ids: template.category_ids,
        alert_percentage: template.alert_percentage,
      };

      const budget = await this.createBudget(budgetData);
      budgets.push(budget);
    }

    return budgets;
  }

  // Get budget insights and analytics
  static async getBudgetInsights(userId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (period === 'year' ? 12 : period === 'quarter' ? 3 : 1));

    const { data: budgets, error } = await supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', startDate.toISOString().split('T')[0])
      .lt('end_date', endDate.toISOString().split('T')[0])
      .eq('is_active', true);

    if (error) throw error;

    if (!budgets?.length) {
      return {
        totalBudgeted: 0,
        totalSpent: 0,
        savedAmount: 0,
        savingsRate: 0,
        averageUsage: 0,
        categoryBreakdown: [],
        trends: []
      };
    }

    // Calculate insights
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await this.calculateBudgetSpending(budget.id, userId);
        return {
          ...budget,
          actualSpent: spending.totalSpent,
          remaining: budget.amount - spending.totalSpent,
          usagePercentage: budget.amount > 0 ? (spending.totalSpent / budget.amount) * 100 : 0
        };
      })
    );

    const totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.actualSpent, 0);
    const savedAmount = totalBudgeted - totalSpent;
    const savingsRate = totalBudgeted > 0 ? (savedAmount / totalBudgeted) * 100 : 0;
    const averageUsage = budgetsWithSpending.length > 0 
      ? budgetsWithSpending.reduce((sum, b) => sum + b.usagePercentage, 0) / budgetsWithSpending.length 
      : 0;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; spent: number; count: number }>();
    
    budgetsWithSpending.forEach(budget => {
      if (budget.category_ids?.length) {
        budget.category_ids.forEach(categoryId => {
          const existing = categoryMap.get(categoryId) || { amount: 0, spent: 0, count: 0 };
          categoryMap.set(categoryId, {
            amount: existing.amount + budget.amount / (budget.category_ids?.length || 1),
            spent: existing.spent + budget.actualSpent / (budget.category_ids?.length || 1),
            count: existing.count + 1
          });
        });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      budgeted: data.amount,
      spent: data.spent,
      remaining: data.amount - data.spent,
      usagePercentage: data.amount > 0 ? (data.spent / data.amount) * 100 : 0,
      budgetCount: data.count
    }));

    return {
      totalBudgeted,
      totalSpent,
      savedAmount,
      savingsRate,
      averageUsage,
      categoryBreakdown,
      budgetCount: budgetsWithSpending.length,
      overBudgetCount: budgetsWithSpending.filter(b => b.actualSpent > b.amount).length,
      onTrackCount: budgetsWithSpending.filter(b => b.usagePercentage <= 80).length
    };
  }

  // Get budget trends
  static async getBudgetTrends(userId: string, months: number = 6) {
    const trends = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

      const { data: budgets, error } = await supabase
        .from(TABLES.BUDGETS)
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', monthStart.toISOString().split('T')[0])
        .lte('end_date', monthEnd.toISOString().split('T')[0]);

      if (error) throw error;

      let totalBudgeted = 0;
      let totalSpent = 0;

      if (budgets?.length) {
        const budgetsWithSpending = await Promise.all(
          budgets.map(async (budget) => {
            const spending = await this.calculateBudgetSpending(budget.id, userId);
            return {
              amount: budget.amount,
              spent: spending.totalSpent
            };
          })
        );

        totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.amount, 0);
        totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
      }

      trends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        budgeted: totalBudgeted,
        spent: totalSpent,
        saved: totalBudgeted - totalSpent,
        savingsRate: totalBudgeted > 0 ? ((totalBudgeted - totalSpent) / totalBudgeted) * 100 : 0
      });
    }

    return trends;
  }

  // Auto-create monthly budget from previous month
  static async createMonthlyBudgetFromPrevious(userId: string, targetMonth?: string): Promise<Budget[]> {
    const now = new Date();
    const targetDate = targetMonth ? new Date(targetMonth) : now;
    const previousMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);

    // Get previous month's budgets
    const { data: previousBudgets, error } = await supabase
      .from(TABLES.BUDGETS)
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', previousMonth.toISOString().split('T')[0])
      .lte('end_date', previousMonthEnd.toISOString().split('T')[0])
      .eq('is_active', true);

    if (error) throw error;

    if (!previousBudgets?.length) {
      throw new Error('No budgets found for previous month');
    }

    const newBudgets: Budget[] = [];
    const currentMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const currentMonthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    for (const previousBudget of previousBudgets) {
      const newBudget: BudgetInsert = {
        user_id: userId,
        name: previousBudget.name,
        description: previousBudget.description,
        amount: previousBudget.amount,
        period: previousBudget.period,
        start_date: currentMonthStart.toISOString().split('T')[0],
        end_date: currentMonthEnd.toISOString().split('T')[0],
        category_ids: previousBudget.category_ids,
        alert_percentage: previousBudget.alert_percentage,
      };

      const budget = await this.createBudget(newBudget);
      newBudgets.push(budget);
    }

    return newBudgets;
  }

  // Hard delete budget (admin only)
  static async hardDeleteBudget(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BUDGETS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export default BudgetService;