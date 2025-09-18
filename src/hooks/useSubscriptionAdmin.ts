/**
 * 🎯 SUBSCRIPTION ADMIN HOOKS
 * React hooks for comprehensive subscription management
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getSubscriptionPayments,
  updatePaymentStatus,
  getSubscriptionAnalytics,
  manageUserSubscription,
  getSubscriptionPlans,
  getPaymentMethods,
  type SubscriptionPayment,
  type SubscriptionAnalytics,
  type PaymentsResponse,
} from '@/lib/services/subscription-admin';
import { useAuth } from '@/hooks/useAuth';

// =====================================================
// 🎯 SUBSCRIPTION PAYMENTS HOOK
// =====================================================

export interface UseSubscriptionPaymentsOptions {
  status?: string;
  search?: string;
  limit?: number;
  enabled?: boolean;
}

export function useSubscriptionPayments(options: UseSubscriptionPaymentsOptions = {}) {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const { status = 'all', search, limit = 20, enabled = true } = options;

  const queryKey = ['subscription-payments', user?.id, status, search, page, limit];

  const {
    data,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const options: any = {
        status,
        limit,
        offset: page * limit,
      };
      if (search) {
        options.search = search;
      }
      return await getSubscriptionPayments(user.id, options);
    },
    enabled: enabled && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const nextPage = useCallback(() => {
    if (data?.hasMore) {
      setPage(prev => prev + 1);
    }
  }, [data?.hasMore]);

  const previousPage = useCallback(() => {
    setPage(prev => Math.max(0, prev - 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  return {
    payments: data?.payments || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error,
    refetch,
    page,
    nextPage,
    previousPage,
    resetPage,
    // Helper computed values
    totalPages: Math.ceil((data?.total || 0) / limit),
    hasNextPage: data?.hasMore || false,
    hasPreviousPage: page > 0,
  };
}

// =====================================================
// 🎯 PAYMENT STATUS UPDATE HOOK
// =====================================================

export function useUpdatePaymentStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      status,
      adminNotes,
      rejectionReason,
    }: {
      paymentId: string;
      status: string;
      adminNotes?: string;
      rejectionReason?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const options: any = {};
      if (adminNotes) {
        options.adminNotes = adminNotes;
      }
      if (rejectionReason) {
        options.rejectionReason = rejectionReason;
      }
      return await updatePaymentStatus(user.id, paymentId, status, options);
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-analytics'] });

        toast.success(result.message || 'Payment status updated successfully');
      } else {
        toast.error(result.message || 'Failed to update payment status');
      }
    },
    onError: (error: any) => {
      console.error('Error updating payment status:', error);
      toast.error(error.message || 'Failed to update payment status');
    },
  });
}

// =====================================================
// 🎯 SUBSCRIPTION ANALYTICS HOOK
// =====================================================

export function useSubscriptionAnalytics(enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return await getSubscriptionAnalytics(user.id);
    },
    enabled: enabled && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// =====================================================
// 🎯 USER SUBSCRIPTION MANAGEMENT HOOK
// =====================================================

export function useManageUserSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      action,
      planId,
      extendMonths,
    }: {
      userId: string;
      action: 'activate' | 'suspend' | 'cancel' | 'extend';
      planId?: string;
      extendMonths?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const options: any = {};
      if (planId) {
        options.planId = planId;
      }
      if (extendMonths) {
        options.extendMonths = extendMonths;
      }
      return await manageUserSubscription(user.id, userId, action, options);
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-analytics'] });

        toast.success(result.message || 'Subscription updated successfully');
      } else {
        toast.error(result.message || 'Failed to update subscription');
      }
    },
    onError: (error: any) => {
      console.error('Error managing subscription:', error);
      toast.error(error.message || 'Failed to update subscription');
    },
  });
}

// =====================================================
// 🎯 SUBSCRIPTION PLANS HOOK
// =====================================================

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// =====================================================
// 🎯 PAYMENT METHODS HOOK
// =====================================================

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethods,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// =====================================================
// 🎯 BULK ACTIONS HOOK
// =====================================================

export function useBulkPaymentActions() {
  const updatePaymentStatus = useUpdatePaymentStatus();
  const [isProcessing, setIsProcessing] = useState(false);

  const processBulkAction = useCallback(async (
    paymentIds: string[],
    action: string,
    options?: { adminNotes?: string; rejectionReason?: string }
  ) => {
    if (paymentIds.length === 0) {
      toast.error('No payments selected');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process payments sequentially to avoid overwhelming the server
      for (const paymentId of paymentIds) {
        try {
          await updatePaymentStatus.mutateAsync({
            paymentId,
            status: action,
            ...options,
          });
          successCount++;
        } catch (error) {
          console.error(`Error processing payment ${paymentId}:`, error);
          errorCount++;
        }
      }

      // Show summary toast
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully processed ${successCount} payments`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Processed ${successCount} payments, ${errorCount} failed`);
      } else {
        toast.error(`Failed to process ${errorCount} payments`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [updatePaymentStatus]);

  return {
    processBulkAction,
    isProcessing,
  };
}

// =====================================================
// 🎯 SUBSCRIPTION SEARCH HOOK
// =====================================================

export function useSubscriptionSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    planId: 'all',
    amountRange: 'all',
  });

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      dateRange: 'all',
      planId: 'all',
      amountRange: 'all',
    });
  }, []);

  const hasActiveFilters = searchTerm || Object.values(filters).some(value => value !== 'all');

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}