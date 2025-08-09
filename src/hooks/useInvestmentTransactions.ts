import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  InvestmentTransaction,
  CreateInvestmentTransactionInput,
  InvestmentTransactionType
} from '@/types/investments';
import { InvestmentTransactionService } from '@/lib/services/investment-transactions';
import { useAuth } from '@/hooks/useAuth';

// Query keys for investment transactions
export const investmentTransactionKeys = {
  all: ['investmentTransactions'] as const,
  lists: () => [...investmentTransactionKeys.all, 'list'] as const,
  list: (userId: string, filters?: any) => 
    [...investmentTransactionKeys.lists(), userId, filters] as const,
  details: () => [...investmentTransactionKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) => [...investmentTransactionKeys.details(), id, userId] as const,
  investment: (investmentId: string, userId: string) => 
    [...investmentTransactionKeys.all, 'investment', investmentId, userId] as const,
  portfolio: (portfolioId: string, userId: string) => 
    [...investmentTransactionKeys.all, 'portfolio', portfolioId, userId] as const,
  recent: (userId: string, limit: number) => 
    [...investmentTransactionKeys.all, 'recent', userId, limit] as const,
  byType: (userId: string, type: InvestmentTransactionType) => 
    [...investmentTransactionKeys.all, 'byType', userId, type] as const,
  analytics: (userId: string) => [...investmentTransactionKeys.all, 'analytics', userId] as const,
  costBasis: (investmentId: string, userId: string) => 
    [...investmentTransactionKeys.all, 'costBasis', investmentId, userId] as const,
  paginated: (userId: string, page: number, limit: number, filters?: any) => 
    [...investmentTransactionKeys.all, 'paginated', userId, page, limit, filters] as const,
};

// Hook to get all investment transactions with optional filters
export function useInvestmentTransactions(filters?: {
  investment_id?: string;
  portfolio_id?: string;
  type?: InvestmentTransactionType | InvestmentTransactionType[];
  date_range?: { start: string; end: string };
  platform?: string;
}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.list(user?.id || '', filters),
    queryFn: () => InvestmentTransactionService.getTransactions(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get a specific transaction by ID
export function useInvestmentTransaction(transactionId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.detail(transactionId, user?.id || ''),
    queryFn: () => InvestmentTransactionService.getTransactionById(transactionId, user?.id || ''),
    enabled: !!user?.id && !!transactionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get transactions for a specific investment
export function useInvestmentTransactionsByInvestment(investmentId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.investment(investmentId, user?.id || ''),
    queryFn: () => InvestmentTransactionService.getInvestmentTransactions(investmentId, user?.id || ''),
    enabled: !!user?.id && !!investmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get transactions for a specific portfolio
export function useInvestmentTransactionsByPortfolio(portfolioId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.portfolio(portfolioId, user?.id || ''),
    queryFn: () => InvestmentTransactionService.getPortfolioTransactions(portfolioId, user?.id || ''),
    enabled: !!user?.id && !!portfolioId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get recent transactions
export function useRecentInvestmentTransactions(limit: number = 10) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.recent(user?.id || '', limit),
    queryFn: () => InvestmentTransactionService.getRecentTransactions(user?.id || '', limit),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get transactions by type
export function useInvestmentTransactionsByType(type: InvestmentTransactionType) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.byType(user?.id || '', type),
    queryFn: () => InvestmentTransactionService.getTransactionsByType(user?.id || '', type),
    enabled: !!user?.id && !!type,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get transaction analytics
export function useInvestmentTransactionAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.analytics(user?.id || ''),
    queryFn: () => InvestmentTransactionService.getTransactionAnalytics(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get investment cost basis
export function useInvestmentCostBasis(investmentId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.costBasis(investmentId, user?.id || ''),
    queryFn: () => InvestmentTransactionService.getInvestmentCostBasis(investmentId, user?.id || ''),
    enabled: !!user?.id && !!investmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get paginated transactions
export function useInvestmentTransactionsPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: {
    start_date?: string;
    end_date?: string;
    type?: InvestmentTransactionType;
    investment_id?: string;
  }
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTransactionKeys.paginated(user?.id || '', page, limit, filters),
    queryFn: () => InvestmentTransactionService.getTransactionsPaginated(
      user?.id || '', page, limit, filters
    ),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to create a new transaction
export function useCreateInvestmentTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: CreateInvestmentTransactionInput) => 
      InvestmentTransactionService.createTransaction(transaction, user?.id || ''),
    onSuccess: (newTransaction) => {
      // Invalidate and refetch transaction lists
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.lists() 
      });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.analytics(user?.id || '') 
      });
      
      // Add new transaction to cache
      queryClient.setQueryData(
        investmentTransactionKeys.detail(newTransaction.id, user?.id || ''),
        newTransaction
      );

      // Invalidate investment data (to update calculated fields)
      if (newTransaction.investment_id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'investments';
          }
        });
        
        // Invalidate cost basis
        queryClient.invalidateQueries({
          queryKey: investmentTransactionKeys.costBasis(newTransaction.investment_id, user?.id || '')
        });
      }

      // Invalidate portfolio data
      if (newTransaction.portfolio_id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'investmentPortfolios';
          }
        });
      }

      toast.success('Investment transaction created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create transaction');
    },
  });
}

// Hook to update a transaction
export function useUpdateInvestmentTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Partial<CreateInvestmentTransactionInput> 
    }) => InvestmentTransactionService.updateTransaction(id, updates, user?.id || ''),
    onSuccess: (updatedTransaction, { id }) => {
      // Update transaction in cache
      queryClient.setQueryData(
        investmentTransactionKeys.detail(id, user?.id || ''),
        updatedTransaction
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.analytics(user?.id || '') 
      });

      // Invalidate investment and portfolio data
      if (updatedTransaction.investment_id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'investments';
          }
        });
        
        queryClient.invalidateQueries({
          queryKey: investmentTransactionKeys.costBasis(updatedTransaction.investment_id, user?.id || '')
        });
      }

      if (updatedTransaction.portfolio_id) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'investmentPortfolios';
          }
        });
      }

      toast.success('Transaction updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update transaction');
    },
  });
}

// Hook to delete a transaction
export function useDeleteInvestmentTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentTransactionService.deleteTransaction(id, user?.id || ''),
    onSuccess: (_, deletedId) => {
      // Remove transaction from cache
      queryClient.removeQueries({ 
        queryKey: investmentTransactionKeys.detail(deletedId, user?.id || '') 
      });
      
      // Invalidate transaction lists
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.lists() 
      });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.analytics(user?.id || '') 
      });

      // Invalidate investment and portfolio data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'investments' || query.queryKey[0] === 'investmentPortfolios';
        }
      });

      toast.success('Transaction deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete transaction');
    },
  });
}

// Hook to bulk create transactions
export function useBulkCreateInvestmentTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactions: CreateInvestmentTransactionInput[]) => 
      InvestmentTransactionService.bulkCreateTransactions(transactions, user?.id || ''),
    onSuccess: (newTransactions) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTransactionKeys.all 
      });
      
      // Invalidate investment and portfolio data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'investments' || query.queryKey[0] === 'investmentPortfolios';
        }
      });

      toast.success(`${newTransactions.length} transactions created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create transactions');
    },
  });
}

// Custom hook for transaction form management
export function useInvestmentTransactionForm(transaction?: InvestmentTransaction) {
  const createMutation = useCreateInvestmentTransaction();
  const updateMutation = useUpdateInvestmentTransaction();

  const handleSubmit = async (data: CreateInvestmentTransactionInput) => {
    if (transaction?.id) {
      // Update existing transaction
      return updateMutation.mutateAsync({
        id: transaction.id,
        updates: data
      });
    } else {
      // Create new transaction
      return createMutation.mutateAsync(data);
    }
  };

  return {
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
  };
}

// Hook for buy transactions (for cost calculation)
export function useBuyTransactions(investmentId: string) {
  return useInvestmentTransactions({
    investment_id: investmentId,
    type: 'buy'
  });
}

// Hook for sell transactions
export function useSellTransactions(investmentId: string) {
  return useInvestmentTransactions({
    investment_id: investmentId,
    type: 'sell'
  });
}

// Hook for dividend transactions
export function useDividendTransactions(investmentId: string) {
  return useInvestmentTransactions({
    investment_id: investmentId,
    type: 'dividend'
  });
}

// Hook for transaction summary by type
export function useTransactionSummary() {
  const analytics = useInvestmentTransactionAnalytics();
  
  const summary = {
    totalTransactions: analytics.data?.total_transactions || 0,
    totalInvested: analytics.data?.total_invested || 0,
    totalSold: analytics.data?.total_sold || 0,
    totalDividends: analytics.data?.total_dividends || 0,
    totalCharges: analytics.data?.total_charges || 0,
    byType: analytics.data?.by_type || {},
    byMonth: analytics.data?.by_month || {},
    isLoading: analytics.isLoading,
    error: analytics.error
  };

  return summary;
}

// Hook for recent activity dashboard
export function useRecentTransactionActivity(limit: number = 5) {
  const recent = useRecentInvestmentTransactions(limit);
  const analytics = useInvestmentTransactionAnalytics();

  return {
    recentTransactions: recent.data || [],
    totalThisMonth: analytics.data?.by_month?.[new Date().toISOString().substring(0, 7)]?.transaction_count || 0,
    isLoading: recent.isLoading || analytics.isLoading,
    error: recent.error || analytics.error
  };
}