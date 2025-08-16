import { supabase, TABLES } from '@/lib/supabase/client';
import { TransactionService } from './transactions';
import { AccountService } from './accounts';
import { BudgetService } from './budgets';
import { CategoryService } from './categories';

export class DashboardService {
  // Get comprehensive dashboard data
  static async getDashboardData(userId: string, period?: {
    startDate: string;
    endDate: string;
  }) {
    try {
      const [
        transactionStats,
        accountSummary,
        currentBudgets,
        recentTransactions,
        monthlyData,
        categoryExpenses,
        budgetAlerts
      ] = await Promise.all([
        TransactionService.getTransactionStats(userId, period),
        AccountService.getAccountSummary(userId),
        BudgetService.getCurrentBudgets(userId),
        TransactionService.getRecentTransactions(userId, 10),
        TransactionService.getMonthlyData(userId, new Date().getFullYear()),
        TransactionService.getCategoryExpenses(userId, period),
        BudgetService.getBudgetAlerts(userId)
      ]);

      // Calculate additional metrics
      const totalBudgetAmount = currentBudgets.reduce((sum, budget) => sum + budget.amount, 0);
      const totalBudgetSpent = currentBudgets.reduce((sum, budget) => sum + budget.actual_spent, 0);
      const budgetUsagePercentage = totalBudgetAmount > 0 ? (totalBudgetSpent / totalBudgetAmount) * 100 : 0;

      const overBudgetCount = currentBudgets.filter(budget => budget.is_over_budget).length;
      const onTrackBudgetCount = currentBudgets.length - overBudgetCount;

      // Get account balances by type
      const accountsByType = await AccountService.getAccountTypesSummary(userId);

      // Calculate savings rate (if we have income and expenses)
      const savingsRate = transactionStats.totalIncome > 0 
        ? ((transactionStats.totalIncome - transactionStats.totalExpenses) / transactionStats.totalIncome) * 100
        : 0;

      return {
        // Financial Overview
        totalBalance: accountSummary.totalBalance,
        totalIncome: transactionStats.totalIncome,
        totalExpenses: transactionStats.totalExpenses,
        netBalance: transactionStats.netBalance,
        savingsRate,

        // Budget Overview
        totalBudgetAmount,
        totalBudgetSpent,
        budgetUsagePercentage,
        budgetRemainingAmount: totalBudgetAmount - totalBudgetSpent,
        overBudgetCount,
        onTrackBudgetCount,

        // Account Summary
        accountCount: accountSummary.accountCount,
        accountsByType,

        // Transaction Overview
        transactionCount: transactionStats.transactionCount,
        averageTransactionAmount: transactionStats.transactionCount > 0 
          ? (transactionStats.totalIncome + transactionStats.totalExpenses) / transactionStats.transactionCount 
          : 0,

        // Detailed Data
        currentBudgets,
        recentTransactions,
        monthlyData,
        categoryExpenses: categoryExpenses.slice(0, 8), // Top 8 categories
        budgetAlerts,
        
        // Additional Insights
        insights: await this.generateInsights(userId, {
          transactionStats,
          currentBudgets,
          categoryExpenses,
          savingsRate
        })
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Generate financial insights
  static async generateInsights(userId: string, data: {
    transactionStats: any;
    currentBudgets: any[];
    categoryExpenses: any[];
    savingsRate: number;
  }) {
    const insights = [];

    // Savings rate insight
    if (data.savingsRate > 20) {
      insights.push({
        type: 'positive',
        title: 'Great Savings Rate!',
        message: `You're saving ${data.savingsRate.toFixed(1)}% of your income. Keep it up!`,
        icon: 'trending-up'
      });
    } else if (data.savingsRate < 10 && data.savingsRate > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${data.savingsRate.toFixed(1)}%. Consider reducing expenses or increasing income.`,
        icon: 'alert-triangle'
      });
    } else if (data.savingsRate <= 0) {
      insights.push({
        type: 'negative',
        title: 'Negative Savings',
        message: 'You\'re spending more than you earn. Review your expenses and budget.',
        icon: 'alert-circle'
      });
    }

    // Budget performance insight
    const overBudgetCount = data.currentBudgets.filter(b => b.is_over_budget).length;
    if (overBudgetCount > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Overruns',
        message: `${overBudgetCount} budget${overBudgetCount > 1 ? 's are' : ' is'} over limit. Review your spending.`,
        icon: 'alert-triangle'
      });
    }

    // Top spending category insight
    if (data.categoryExpenses.length > 0) {
      const topCategory = data.categoryExpenses[0];
      if (topCategory.percentage > 40) {
        insights.push({
          type: 'info',
          title: 'High Category Spending',
          message: `${topCategory.category_name} accounts for ${topCategory.percentage.toFixed(1)}% of your expenses.`,
          icon: 'pie-chart'
        });
      }
    }

    // Transaction frequency insight
    const daysInPeriod = 30; // Default to last 30 days
    const avgTransactionsPerDay = data.transactionStats.transactionCount / daysInPeriod;
    if (avgTransactionsPerDay > 5) {
      insights.push({
        type: 'info',
        title: 'High Transaction Frequency',
        message: `You're making ${avgTransactionsPerDay.toFixed(1)} transactions per day on average.`,
        icon: 'activity'
      });
    }

    return insights.slice(0, 4); // Return top 4 insights
  }

  // Get financial health score
  static async getFinancialHealthScore(userId: string) {
    try {
      const dashboardData = await this.getDashboardData(userId);
      
      let score = 0;
      const factors = [];

      // Savings rate (25 points)
      if (dashboardData.savingsRate >= 20) {
        score += 25;
        factors.push({ name: 'Excellent Savings Rate', points: 25, maxPoints: 25 });
      } else if (dashboardData.savingsRate >= 10) {
        score += 15;
        factors.push({ name: 'Good Savings Rate', points: 15, maxPoints: 25 });
      } else if (dashboardData.savingsRate >= 5) {
        score += 10;
        factors.push({ name: 'Fair Savings Rate', points: 10, maxPoints: 25 });
      } else {
        factors.push({ name: 'Low Savings Rate', points: 0, maxPoints: 25 });
      }

      // Budget adherence (25 points)
      if (dashboardData.currentBudgets.length > 0) {
        const onTrackPercentage = (dashboardData.onTrackBudgetCount / dashboardData.currentBudgets.length) * 100;
        if (onTrackPercentage >= 90) {
          score += 25;
          factors.push({ name: 'Excellent Budget Control', points: 25, maxPoints: 25 });
        } else if (onTrackPercentage >= 70) {
          score += 20;
          factors.push({ name: 'Good Budget Control', points: 20, maxPoints: 25 });
        } else if (onTrackPercentage >= 50) {
          score += 15;
          factors.push({ name: 'Fair Budget Control', points: 15, maxPoints: 25 });
        } else {
          score += 5;
          factors.push({ name: 'Poor Budget Control', points: 5, maxPoints: 25 });
        }
      } else {
        factors.push({ name: 'No Budgets Set', points: 0, maxPoints: 25 });
      }

      // Spending diversification (20 points)
      if (dashboardData.categoryExpenses.length > 0) {
        const topCategoryPercentage = dashboardData.categoryExpenses[0].percentage;
        if (topCategoryPercentage <= 30) {
          score += 20;
          factors.push({ name: 'Well Diversified Spending', points: 20, maxPoints: 20 });
        } else if (topCategoryPercentage <= 50) {
          score += 15;
          factors.push({ name: 'Moderately Diversified Spending', points: 15, maxPoints: 20 });
        } else {
          score += 5;
          factors.push({ name: 'Concentrated Spending', points: 5, maxPoints: 20 });
        }
      } else {
        factors.push({ name: 'No Spending Data', points: 0, maxPoints: 20 });
      }

      // Account management (15 points)
      if (dashboardData.accountCount >= 3) {
        score += 15;
        factors.push({ name: 'Good Account Diversification', points: 15, maxPoints: 15 });
      } else if (dashboardData.accountCount >= 2) {
        score += 10;
        factors.push({ name: 'Basic Account Setup', points: 10, maxPoints: 15 });
      } else {
        score += 5;
        factors.push({ name: 'Limited Account Setup', points: 5, maxPoints: 15 });
      }

      // Transaction tracking (15 points)
      if (dashboardData.transactionCount >= 50) {
        score += 15;
        factors.push({ name: 'Excellent Transaction Tracking', points: 15, maxPoints: 15 });
      } else if (dashboardData.transactionCount >= 20) {
        score += 10;
        factors.push({ name: 'Good Transaction Tracking', points: 10, maxPoints: 15 });
      } else if (dashboardData.transactionCount >= 10) {
        score += 5;
        factors.push({ name: 'Basic Transaction Tracking', points: 5, maxPoints: 15 });
      } else {
        factors.push({ name: 'Limited Transaction Data', points: 0, maxPoints: 15 });
      }

      // Determine grade
      let grade = 'F';
      let gradeColor = '#EF4444';
      if (score >= 90) {
        grade = 'A+';
        gradeColor = '#10B981';
      } else if (score >= 80) {
        grade = 'A';
        gradeColor = '#10B981';
      } else if (score >= 70) {
        grade = 'B';
        gradeColor = '#F59E0B';
      } else if (score >= 60) {
        grade = 'C';
        gradeColor = '#F59E0B';
      } else if (score >= 50) {
        grade = 'D';
        gradeColor = '#EF4444';
      }

      return {
        score,
        maxScore: 100,
        grade,
        gradeColor,
        factors,
        recommendations: this.getHealthRecommendations(score, factors)
      };
    } catch (error) {
      console.error('Error calculating financial health score:', error);
      throw error;
    }
  }

  // Get health recommendations
  static getHealthRecommendations(score: number, factors: any[]) {
    const recommendations: Array<{title: string; description: string; action: string}> = [];

    // Find areas for improvement
    const lowPerformingFactors = factors.filter(f => (f.points / f.maxPoints) < 0.7);

    lowPerformingFactors.forEach(factor => {
      switch (factor.name) {
        case 'Low Savings Rate':
        case 'Fair Savings Rate':
          recommendations.push({
            title: 'Improve Your Savings Rate',
            description: 'Try to save at least 20% of your income. Consider automating your savings.',
            action: 'Set up automatic transfers to a savings account'
          });
          break;

        case 'Poor Budget Control':
        case 'No Budgets Set':
          recommendations.push({
            title: 'Create and Follow Budgets',
            description: 'Set up budgets for your major spending categories and track your progress.',
            action: 'Create your first budget in the Budgets section'
          });
          break;

        case 'Concentrated Spending':
          recommendations.push({
            title: 'Diversify Your Spending',
            description: 'Your spending is concentrated in one category. Consider reviewing if this is optimal.',
            action: 'Review your spending patterns in the Analytics section'
          });
          break;

        case 'Limited Account Setup':
          recommendations.push({
            title: 'Set Up Multiple Accounts',
            description: 'Consider separating your finances with checking, savings, and investment accounts.',
            action: 'Add more accounts in the Accounts section'
          });
          break;

        case 'Limited Transaction Data':
          recommendations.push({
            title: 'Track More Transactions',
            description: 'The more transactions you track, the better insights you\'ll get about your finances.',
            action: 'Add recent transactions in the Transactions section'
          });
          break;
      }
    });

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  // Get spending trends
  static async getSpendingTrends(userId: string, periods = 6) {
    const trends = [];
    const currentDate = new Date();

    for (let i = 0; i < periods; i++) {
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 0);
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      const stats = await TransactionService.getTransactionStats(userId, {
        startDate: startDate.toISOString().split('T')[0]!,
        endDate: endDate.toISOString().split('T')[0]!
      });

      trends.unshift({
        period: endDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        income: stats.totalIncome,
        expenses: stats.totalExpenses,
        net: stats.netBalance,
        transactionCount: stats.transactionCount
      });
    }

    return trends;
  }

  // Get upcoming financial events/reminders
  static async getUpcomingEvents(userId: string) {
    const events: Array<{type: string; title: string; date: string; priority: string; description: string}> = [];
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());

    // Budget end dates
    const currentBudgets = await BudgetService.getCurrentBudgets(userId);
    currentBudgets.forEach(budget => {
      const endDate = new Date(budget.end_date);
      if (endDate <= nextMonth) {
        events.push({
          type: 'budget_ending',
          title: `Budget "${budget.name}" ending soon`,
          date: budget.end_date,
          priority: 'medium',
          description: `Budget ends in ${budget.days_remaining} days`
        });
      }
    });

    // Recurring transactions (if implemented)
    // This would require additional logic for recurring transactions

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export default DashboardService;