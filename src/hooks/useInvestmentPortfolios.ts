import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  InvestmentPortfolio,
  CreateInvestmentPortfolioInput,
  UpdateInvestmentPortfolioInput,
  PortfolioPerformance
} from '@/types/investments';
import { InvestmentPortfolioService } from '@/lib/services/investment-portfolios';
import { useAuth } from '@/hooks/useAuth';

// Query keys for investment portfolios
export const investmentPortfolioKeys = {
  all: ['investmentPortfolios'] as const,
  lists: () => [...investmentPortfolioKeys.all, 'list'] as const,
  list: (userId: string) => [...investmentPortfolioKeys.lists(), userId] as const,
  details: () => [...investmentPortfolioKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) => [...investmentPortfolioKeys.details(), id, userId] as const,
  performance: () => [...investmentPortfolioKeys.all, 'performance'] as const,
  portfolioPerformance: (id: string, userId: string) => [...investmentPortfolioKeys.performance(), id, userId] as const,
  allPerformance: (userId: string) => [...investmentPortfolioKeys.performance(), 'all', userId] as const,
  summary: (userId: string) => [...investmentPortfolioKeys.all, 'summary', userId] as const,
};

// Hook to get all portfolios for a user
export function useInvestmentPortfolios() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentPortfolioKeys.list(user?.id || ''),
    queryFn: () => InvestmentPortfolioService.getPortfolios(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a specific portfolio by ID
export function useInvestmentPortfolio(portfolioId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentPortfolioKeys.detail(portfolioId, user?.id || ''),
    queryFn: () => InvestmentPortfolioService.getPortfolioById(portfolioId, user?.id || ''),
    enabled: !!user?.id && !!portfolioId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get portfolio performance
export function usePortfolioPerformance(portfolioId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentPortfolioKeys.portfolioPerformance(portfolioId, user?.id || ''),
    queryFn: () => InvestmentPortfolioService.getPortfolioPerformance(portfolioId, user?.id || ''),
    enabled: !!user?.id && !!portfolioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get all portfolios with performance data
export function useAllPortfoliosWithPerformance() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentPortfolioKeys.allPerformance(user?.id || ''),
    queryFn: () => InvestmentPortfolioService.getAllPortfoliosWithPerformance(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get portfolio summary
export function usePortfolioSummary() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentPortfolioKeys.summary(user?.id || ''),
    queryFn: () => InvestmentPortfolioService.getPortfolioSummary(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a new portfolio
export function useCreateInvestmentPortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (portfolio: CreateInvestmentPortfolioInput) => 
      InvestmentPortfolioService.createPortfolio(portfolio, user?.id || ''),
    onSuccess: (newPortfolio) => {
      // Invalidate and refetch portfolios list
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.lists() 
      });
      
      // Add new portfolio to cache
      queryClient.setQueryData(
        investmentPortfolioKeys.detail(newPortfolio.id, user?.id || ''),
        newPortfolio
      );

      toast.success('Investment portfolio created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create portfolio');
    },
  });
}

// Hook to update a portfolio
export function useUpdateInvestmentPortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInvestmentPortfolioInput }) => 
      InvestmentPortfolioService.updatePortfolio(id, updates, user?.id || ''),
    onSuccess: (updatedPortfolio, { id }) => {
      // Update portfolio in cache
      queryClient.setQueryData(
        investmentPortfolioKeys.detail(id, user?.id || ''),
        updatedPortfolio
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.performance() 
      });

      toast.success('Portfolio updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update portfolio');
    },
  });
}

// Hook to delete a portfolio
export function useDeleteInvestmentPortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentPortfolioService.deletePortfolio(id, user?.id || ''),
    onSuccess: (_, deletedId) => {
      // Remove portfolio from cache
      queryClient.removeQueries({ 
        queryKey: investmentPortfolioKeys.detail(deletedId, user?.id || '') 
      });
      
      // Invalidate portfolios list
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.lists() 
      });
      
      // Invalidate performance data
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.performance() 
      });

      toast.success('Portfolio deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete portfolio');
    },
  });
}

// Hook to archive a portfolio
export function useArchiveInvestmentPortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentPortfolioService.archivePortfolio(id, user?.id || ''),
    onSuccess: (_, portfolioId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.detail(portfolioId, user?.id || '') 
      });

      toast.success('Portfolio archived successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive portfolio');
    },
  });
}

// Hook to restore an archived portfolio
export function useRestoreInvestmentPortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentPortfolioService.restorePortfolio(id, user?.id || ''),
    onSuccess: (_, portfolioId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentPortfolioKeys.detail(portfolioId, user?.id || '') 
      });

      toast.success('Portfolio restored successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore portfolio');
    },
  });
}

// Custom hook for portfolio form management
export function usePortfolioForm(portfolio?: InvestmentPortfolio) {
  const createMutation = useCreateInvestmentPortfolio();
  const updateMutation = useUpdateInvestmentPortfolio();

  const handleSubmit = async (data: CreateInvestmentPortfolioInput | UpdateInvestmentPortfolioInput) => {
    if (portfolio?.id) {
      // Update existing portfolio
      return updateMutation.mutateAsync({
        id: portfolio.id,
        updates: data as UpdateInvestmentPortfolioInput
      });
    } else {
      // Create new portfolio
      return createMutation.mutateAsync(data as CreateInvestmentPortfolioInput);
    }
  };

  return {
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
  };
}

// Hook for portfolio analytics
export function usePortfolioAnalytics() {
  const portfolios = useInvestmentPortfolios();
  const summary = usePortfolioSummary();

  const analytics = {
    totalPortfolios: portfolios.data?.length || 0,
    totalInvested: summary.data?.total_invested || 0,
    currentValue: summary.data?.current_value || 0,
    totalGainLoss: summary.data?.total_gain_loss || 0,
    totalReturnPercentage: summary.data?.total_return_percentage || 0,
    bestPerformer: summary.data?.best_performing_portfolio,
    isLoading: portfolios.isLoading || summary.isLoading,
    error: portfolios.error || summary.error
  };

  return analytics;
}