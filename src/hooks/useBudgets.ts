'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { BudgetService, BudgetWithSpending, BudgetAlert, BudgetPerformance, BudgetTemplate } from '@/lib/services/budgets';
import { Budget, BudgetInsert, BudgetUpdate } from '@/types';
import toast from 'react-hot-toast';

export function useBudgets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: budgets,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: () => BudgetService.getBudgets(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Current budgets with spending data
  const {
    data: currentBudgets,
    isLoading: currentBudgetsLoading
  } = useQuery({
    queryKey: ['current-budgets', user?.id],
    queryFn: () => BudgetService.getCurrentBudgets(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Budget alerts
  const {
    data: budgetAlerts,
    isLoading: alertsLoading
  } = useQuery({
    queryKey: ['budget-alerts', user?.id],
    queryFn: () => BudgetService.getBudgetAlerts(user!.id),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Budget performance
  const {
    data: budgetPerformance,
    isLoading: performanceLoading
  } = useQuery({
    queryKey: ['budget-performance', user?.id],
    queryFn: () => BudgetService.getBudgetPerformance(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: (budgetData: BudgetInsert) => BudgetService.createBudget(budgetData),
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-performance', user?.id] });
      toast.success('Budget created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create budget');
      console.error('Create budget error:', error);
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: BudgetUpdate }) =>
      BudgetService.updateBudget(id, updates, user!.id),
    onSuccess: (updatedBudget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-performance', user?.id] });
      toast.success('Budget updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update budget');
      console.error('Update budget error:', error);
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId: string) => BudgetService.deleteBudget(budgetId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-performance', user?.id] });
      toast.success('Budget deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete budget');
      console.error('Delete budget error:', error);
    },
  });

  // Duplicate budget mutation
  const duplicateBudgetMutation = useMutation({
    mutationFn: (budgetId: string) => BudgetService.duplicateBudget(budgetId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-budgets', user?.id] });
      toast.success('Budget duplicated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate budget');
      console.error('Duplicate budget error:', error);
    },
  });

  // Create recurring budget mutation
  const createRecurringBudgetMutation = useMutation({
    mutationFn: ({ template, months }: { template: BudgetTemplate; months?: number }) =>
      BudgetService.createRecurringBudget(user!.id, template, months),
    onSuccess: (budgets) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-budgets', user?.id] });
      toast.success(`Created ${budgets.length} recurring budgets successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create recurring budgets');
      console.error('Create recurring budgets error:', error);
    },
  });

  // Create monthly budget from previous month
  const createFromPreviousMonthMutation = useMutation({
    mutationFn: (targetMonth?: string) =>
      BudgetService.createMonthlyBudgetFromPrevious(user!.id, targetMonth),
    onSuccess: (budgets) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-budgets', user?.id] });
      toast.success(`Created ${budgets.length} budgets from previous month!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create budgets from previous month');
      console.error('Create from previous month error:', error);
    },
  });

  // Helper functions
  const getBudgetById = useCallback(
    async (budgetId: string): Promise<Budget | null> => {
      if (!user?.id) return null;
      try {
        return await BudgetService.getBudgetById(budgetId, user.id);
      } catch (error) {
        console.error('Get budget by ID error:', error);
        return null;
      }
    },
    [user?.id]
  );

  const getBudgetInsights = useCallback(
    async (period: 'month' | 'quarter' | 'year' = 'month') => {
      if (!user?.id) return null;
      try {
        return await BudgetService.getBudgetInsights(user.id, period);
      } catch (error) {
        console.error('Get budget insights error:', error);
        toast.error('Failed to load budget insights');
        return null;
      }
    },
    [user?.id]
  );

  const getBudgetTrends = useCallback(
    async (months: number = 6) => {
      if (!user?.id) return [];
      try {
        return await BudgetService.getBudgetTrends(user.id, months);
      } catch (error) {
        console.error('Get budget trends error:', error);
        toast.error('Failed to load budget trends');
        return [];
      }
    },
    [user?.id]
  );

  // Computed values
  const totalBudgetAmount = currentBudgets?.reduce((sum, budget) => sum + budget.amount, 0) || 0;
  const totalSpentAmount = currentBudgets?.reduce((sum, budget) => sum + budget.actual_spent, 0) || 0;
  const totalRemainingAmount = totalBudgetAmount - totalSpentAmount;
  const overallProgress = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0;

  const budgetsByStatus = {
    onTrack: currentBudgets?.filter(budget => budget.percentage_used <= 80) || [],
    atRisk: currentBudgets?.filter(budget => budget.percentage_used > 80 && budget.percentage_used <= 100) || [],
    overBudget: currentBudgets?.filter(budget => budget.percentage_used > 100) || [],
  };

  const highPriorityAlerts = budgetAlerts?.filter(alert => alert.priority === 'high') || [];

  return {
    // Data
    budgets: budgets || [],
    currentBudgets: currentBudgets || [],
    budgetAlerts: budgetAlerts || [],
    budgetPerformance,
    highPriorityAlerts,

    // Loading states
    isLoading,
    currentBudgetsLoading,
    alertsLoading,
    performanceLoading,

    // Error states
    error,

    // Mutations
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    duplicateBudget: duplicateBudgetMutation.mutate,
    createRecurringBudget: createRecurringBudgetMutation.mutate,
    createFromPreviousMonth: createFromPreviousMonthMutation.mutate,

    // Mutation states
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
    isDuplicating: duplicateBudgetMutation.isPending,
    isCreatingRecurring: createRecurringBudgetMutation.isPending,
    isCreatingFromPrevious: createFromPreviousMonthMutation.isPending,

    // Helper functions
    getBudgetById,
    getBudgetInsights,
    getBudgetTrends,
    refetch,

    // Computed values
    totalBudgetAmount,
    totalSpentAmount,
    totalRemainingAmount,
    overallProgress,
    budgetsByStatus,

    // Statistics
    stats: {
      totalBudgets: budgets?.length || 0,
      activeBudgets: currentBudgets?.length || 0,
      totalBudgetAmount,
      totalSpentAmount,
      totalRemainingAmount,
      overallProgress,
      onTrackCount: budgetsByStatus.onTrack.length,
      atRiskCount: budgetsByStatus.atRisk.length,
      overBudgetCount: budgetsByStatus.overBudget.length,
      alertsCount: budgetAlerts?.length || 0,
      highPriorityAlertsCount: highPriorityAlerts.length,
    }
  };
}

export default useBudgets;