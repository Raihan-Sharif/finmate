import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Investment,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  InvestmentFilters,
  InvestmentSortOptions
} from '@/types/investments';
import { InvestmentService } from '@/lib/services/investments';
import { useAuth } from '@/hooks/useAuth';

// Query keys for investments
export const investmentKeys = {
  all: ['investments'] as const,
  lists: () => [...investmentKeys.all, 'list'] as const,
  list: (userId: string, filters?: InvestmentFilters, sort?: InvestmentSortOptions) => 
    [...investmentKeys.lists(), userId, filters, sort] as const,
  details: () => [...investmentKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) => [...investmentKeys.details(), id, userId] as const,
  analytics: (userId: string) => [...investmentKeys.all, 'analytics', userId] as const,
  performance: (id: string, userId: string, days: number) => 
    [...investmentKeys.all, 'performance', id, userId, days] as const,
  byType: (userId: string, type: string) => 
    [...investmentKeys.all, 'byType', userId, type] as const,
  active: (userId: string) => [...investmentKeys.all, 'active', userId] as const,
  search: (userId: string, query: string) => 
    [...investmentKeys.all, 'search', userId, query] as const,
  topPerformers: (userId: string, limit: number) => 
    [...investmentKeys.all, 'topPerformers', userId, limit] as const,
  recent: (userId: string, limit: number) => 
    [...investmentKeys.all, 'recent', userId, limit] as const,
  stats: (userId: string) => [...investmentKeys.all, 'stats', userId] as const,
};

// Hook to get all investments with filtering and sorting
export function useInvestments(
  filters?: InvestmentFilters,
  sort?: InvestmentSortOptions
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.list(user?.id || '', filters, sort),
    queryFn: () => InvestmentService.getInvestments(user?.id || '', filters, sort),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get a specific investment by ID
export function useInvestment(investmentId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.detail(investmentId, user?.id || ''),
    queryFn: () => InvestmentService.getInvestmentById(investmentId, user?.id || ''),
    enabled: !!user?.id && !!investmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get investment analytics
export function useInvestmentAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.analytics(user?.id || ''),
    queryFn: () => InvestmentService.getInvestmentAnalytics(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get investment performance over time
export function useInvestmentPerformance(investmentId: string, days: number = 90) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.performance(investmentId, user?.id || '', days),
    queryFn: () => InvestmentService.getInvestmentPerformance(investmentId, user?.id || '', days),
    enabled: !!user?.id && !!investmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get investments by type
export function useInvestmentsByType(type: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.byType(user?.id || '', type),
    queryFn: () => InvestmentService.getInvestmentsByType(user?.id || '', type),
    enabled: !!user?.id && !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get active investments
export function useActiveInvestments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.active(user?.id || ''),
    queryFn: () => InvestmentService.getActiveInvestments(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to search investments
export function useInvestmentSearch(query: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.search(user?.id || '', query),
    queryFn: () => InvestmentService.searchInvestments(user?.id || '', query),
    enabled: !!user?.id && query.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get top performing investments
export function useTopPerformers(limit: number = 5) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.topPerformers(user?.id || '', limit),
    queryFn: () => InvestmentService.getTopPerformers(user?.id || '', limit),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get recent investments
export function useRecentInvestments(limit: number = 10) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.recent(user?.id || '', limit),
    queryFn: () => InvestmentService.getRecentInvestments(user?.id || '', limit),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get investment statistics
export function useInvestmentStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentKeys.stats(user?.id || ''),
    queryFn: () => InvestmentService.getInvestmentStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a new investment
export function useCreateInvestment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (investment: CreateInvestmentInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('🔥 HOOK: About to call InvestmentService.createInvestment');
      console.log('🔥 HOOK: User ID:', user.id);
      console.log('🔥 HOOK: Investment data:', investment);
      
      const result = await InvestmentService.createInvestment(investment, user.id);
      console.log('🔥 HOOK: Service returned:', result);
      return result;
    },
    onSuccess: (newInvestment) => {
      console.log('🔥 HOOK: Create investment SUCCESS:', newInvestment);
      
      // Invalidate and refetch investments lists
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.lists() 
      });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.analytics(user?.id || '') 
      });
      
      // Add new investment to cache
      queryClient.setQueryData(
        investmentKeys.detail(newInvestment.id, user?.id || ''),
        newInvestment
      );

      // Invalidate portfolio data if investment belongs to a portfolio
      if (newInvestment.portfolio_id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'investmentPortfolios';
          }
        });
      }

      toast.success(`Investment "${newInvestment.name}" created successfully!`);
    },
    onError: (error: any) => {
      console.error('🔥 HOOK: Create investment ERROR:', error);
      toast.error(error.message || 'Failed to create investment');
    },
  });
}

// Hook to update an investment
export function useUpdateInvestment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInvestmentInput }) => 
      InvestmentService.updateInvestment(id, updates, user?.id || ''),
    onSuccess: (updatedInvestment, { id }) => {
      // Update investment in cache
      queryClient.setQueryData(
        investmentKeys.detail(id, user?.id || ''),
        updatedInvestment
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.analytics(user?.id || '') 
      });

      // Invalidate portfolio data if investment belongs to a portfolio
      if (updatedInvestment.portfolio_id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'investmentPortfolios';
          }
        });
      }

      toast.success('Investment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update investment');
    },
  });
}

// Hook to update investment price
export function useUpdateInvestmentPrice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) => 
      InvestmentService.updatePrice(id, price, user?.id || ''),
    onSuccess: (updatedInvestment, { id }) => {
      // Update investment in cache
      queryClient.setQueryData(
        investmentKeys.detail(id, user?.id || ''),
        updatedInvestment
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.analytics(user?.id || '') 
      });
      
      // Invalidate performance data
      queryClient.invalidateQueries({ 
        queryKey: [...investmentKeys.all, 'performance', id] 
      });

      toast.success('Investment price updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update price');
    },
  });
}

// Hook to delete an investment
export function useDeleteInvestment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentService.deleteInvestment(id, user?.id || ''),
    onSuccess: (_, deletedId) => {
      // Remove investment from cache
      queryClient.removeQueries({ 
        queryKey: investmentKeys.detail(deletedId, user?.id || '') 
      });
      
      // Invalidate investments lists
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.lists() 
      });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.analytics(user?.id || '') 
      });

      // Invalidate portfolio data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'investmentPortfolios';
        }
      });

      toast.success('Investment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete investment');
    },
  });
}

// Hook to bulk update prices
export function useBulkUpdatePrices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ id: string; price: number }>) => 
      InvestmentService.bulkUpdatePrices(updates, user?.id || ''),
    onSuccess: () => {
      // Invalidate all investment-related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentKeys.all 
      });
      
      // Invalidate portfolio data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'investmentPortfolios';
        }
      });

      toast.success('Prices updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update prices');
    },
  });
}

// Custom hook for investment form management
export function useInvestmentForm(investment?: Investment) {
  const createMutation = useCreateInvestment();
  const updateMutation = useUpdateInvestment();

  const handleSubmit = async (data: CreateInvestmentInput | UpdateInvestmentInput) => {
    if (investment?.id) {
      // Update existing investment
      return updateMutation.mutateAsync({
        id: investment.id,
        updates: data as UpdateInvestmentInput
      });
    } else {
      // Create new investment
      return createMutation.mutateAsync(data as CreateInvestmentInput);
    }
  };

  return {
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
  };
}

// Hook for investment filtering and sorting
export function useInvestmentFilters() {
  const [filters, setFilters] = useState<InvestmentFilters>({});
  const [sort, setSort] = useState<InvestmentSortOptions>({
    field: 'created_at',
    direction: 'desc'
  });

  const investments = useInvestments(filters, sort);

  const updateFilters = (newFilters: Partial<InvestmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const updateSort = (field: InvestmentSortOptions['field'], direction?: InvestmentSortOptions['direction']) => {
    setSort({
      field,
      direction: direction || (sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc')
    });
  };

  return {
    filters,
    sort,
    investments,
    updateFilters,
    clearFilters,
    updateSort,
    hasActiveFilters: Object.keys(filters).length > 0
  };
}

// Hook for investment dashboard data
export function useInvestmentDashboard() {
  const analytics = useInvestmentAnalytics();
  const topPerformers = useTopPerformers(3);
  const recent = useRecentInvestments(5);
  const stats = useInvestmentStats();

  return {
    analytics: analytics.data,
    topPerformers: topPerformers.data,
    recentInvestments: recent.data,
    stats: stats.data,
    isLoading: analytics.isLoading || topPerformers.isLoading || recent.isLoading || stats.isLoading,
    error: analytics.error || topPerformers.error || recent.error || stats.error
  };
}

