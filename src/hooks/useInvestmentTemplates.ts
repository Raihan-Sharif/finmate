import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  InvestmentTemplate,
  CreateInvestmentTemplateInput,
  UpdateInvestmentTemplateInput
} from '@/types/investments';
import { InvestmentTemplateService } from '@/lib/services/investment-templates';
import { useAuth } from '@/hooks/useAuth';

// Query keys for investment templates
export const investmentTemplateKeys = {
  all: ['investmentTemplates'] as const,
  lists: () => [...investmentTemplateKeys.all, 'list'] as const,
  list: (userId: string) => [...investmentTemplateKeys.lists(), userId] as const,
  details: () => [...investmentTemplateKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) => [...investmentTemplateKeys.details(), id, userId] as const,
  forExecution: (userId?: string) => 
    [...investmentTemplateKeys.all, 'forExecution', userId] as const,
  upcoming: (userId: string, days: number) => 
    [...investmentTemplateKeys.all, 'upcoming', userId, days] as const,
  byType: (userId: string, type: string) => 
    [...investmentTemplateKeys.all, 'byType', userId, type] as const,
  search: (userId: string, query: string) => 
    [...investmentTemplateKeys.all, 'search', userId, query] as const,
  stats: (userId: string) => [...investmentTemplateKeys.all, 'stats', userId] as const,
  sip: (userId: string) => [...investmentTemplateKeys.all, 'sip', userId] as const,
  global: () => [...investmentTemplateKeys.all, 'global'] as const,
  overdue: (userId: string) => [...investmentTemplateKeys.all, 'overdue', userId] as const,
};

// Hook to get all investment templates for a user
export function useInvestmentTemplates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.list(user?.id || ''),
    queryFn: () => InvestmentTemplateService.getTemplates(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get a specific template by ID
export function useInvestmentTemplate(templateId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.detail(templateId, user?.id || ''),
    queryFn: () => InvestmentTemplateService.getTemplateById(templateId, user?.id || ''),
    enabled: !!user?.id && !!templateId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get templates ready for execution
export function useTemplatesForExecution() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.forExecution(user?.id || ''),
    queryFn: () => InvestmentTemplateService.getTemplatesForExecution(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Hook to get upcoming executions
export function useUpcomingExecutions(days: number = 30) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.upcoming(user?.id || '', days),
    queryFn: () => InvestmentTemplateService.getUpcomingExecutions(user?.id || '', days),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get templates by type
export function useInvestmentTemplatesByType(investmentType: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.byType(user?.id || '', investmentType),
    queryFn: () => InvestmentTemplateService.getTemplatesByType(user?.id || '', investmentType),
    enabled: !!user?.id && !!investmentType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get SIP templates
export function useSIPTemplates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.sip(user?.id || ''),
    queryFn: () => InvestmentTemplateService.getSIPTemplates(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to search templates
export function useInvestmentTemplateSearch(query: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.search(user?.id || '', query),
    queryFn: () => InvestmentTemplateService.searchTemplates(user?.id || '', query),
    enabled: !!user?.id && query.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook to get template statistics
export function useInvestmentTemplateStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.stats(user?.id || ''),
    queryFn: () => InvestmentTemplateService.getTemplateStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get global templates
export function useGlobalInvestmentTemplates() {
  return useQuery({
    queryKey: investmentTemplateKeys.global(),
    queryFn: () => InvestmentTemplateService.getGlobalTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get overdue templates
export function useOverdueTemplates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentTemplateKeys.overdue(user?.id || ''),
    queryFn: () => InvestmentTemplateService.getOverdueTemplates(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Hook to create a new investment template
export function useCreateInvestmentTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: CreateInvestmentTemplateInput) => 
      InvestmentTemplateService.createTemplate(template, user?.id || ''),
    onSuccess: (newTemplate) => {
      // Invalidate and refetch templates list
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.lists() 
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.stats(user?.id || '') 
      });
      
      // Add new template to cache
      queryClient.setQueryData(
        investmentTemplateKeys.detail(newTemplate.id, user?.id || ''),
        newTemplate
      );

      // Invalidate upcoming executions
      queryClient.invalidateQueries({ 
        queryKey: [...investmentTemplateKeys.all, 'upcoming'] 
      });

      toast.success('Investment template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });
}

// Hook to update an investment template
export function useUpdateInvestmentTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInvestmentTemplateInput }) => 
      InvestmentTemplateService.updateTemplate(id, updates, user?.id || ''),
    onSuccess: (updatedTemplate, { id }) => {
      // Update template in cache
      queryClient.setQueryData(
        investmentTemplateKeys.detail(id, user?.id || ''),
        updatedTemplate
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.stats(user?.id || '') 
      });
      
      // Invalidate execution-related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.forExecution() 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...investmentTemplateKeys.all, 'upcoming'] 
      });

      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });
}

// Hook to delete a template
export function useDeleteInvestmentTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentTemplateService.deleteTemplate(id, user?.id || ''),
    onSuccess: (_, deletedId) => {
      // Remove template from cache
      queryClient.removeQueries({ 
        queryKey: investmentTemplateKeys.detail(deletedId, user?.id || '') 
      });
      
      // Invalidate templates lists
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.lists() 
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.stats(user?.id || '') 
      });

      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });
}

// Hook to execute a template manually
export function useExecuteInvestmentTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      InvestmentTemplateService.executeTemplate(id, user?.id || ''),
    onSuccess: (transactionId, templateId) => {
      // Invalidate template data to reflect updated execution stats
      queryClient.invalidateQueries({
        queryKey: investmentTemplateKeys.detail(templateId, user?.id || '')
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.stats(user?.id || '') 
      });
      
      // Invalidate execution-related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.forExecution() 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...investmentTemplateKeys.all, 'upcoming'] 
      });
      
      // Invalidate transaction data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'investmentTransactions';
        }
      });

      // Invalidate investment and portfolio data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'investments' || query.queryKey[0] === 'investmentPortfolios';
        }
      });

      toast.success('Investment executed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to execute investment');
    },
  });
}

// Hook to toggle template active status
export function useToggleInvestmentTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      InvestmentTemplateService.toggleTemplate(id, user?.id || '', isActive),
    onSuccess: (updatedTemplate, { id }) => {
      // Update template in cache
      queryClient.setQueryData(
        investmentTemplateKeys.detail(id, user?.id || ''),
        updatedTemplate
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.stats(user?.id || '') 
      });
      
      // Invalidate execution queries
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.forExecution() 
      });

      const action = updatedTemplate.is_active ? 'activated' : 'paused';
      toast.success(`Template ${action} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to toggle template');
    },
  });
}

// Hook to duplicate a template
export function useDuplicateInvestmentTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName?: string }) => 
      InvestmentTemplateService.duplicateTemplate(id, user?.id || '', newName),
    onSuccess: (newTemplate) => {
      // Invalidate templates list
      queryClient.invalidateQueries({ 
        queryKey: investmentTemplateKeys.lists() 
      });
      
      // Add new template to cache
      queryClient.setQueryData(
        investmentTemplateKeys.detail(newTemplate.id, user?.id || ''),
        newTemplate
      );

      toast.success('Template duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate template');
    },
  });
}

// Custom hook for template form management
export function useInvestmentTemplateForm(template?: InvestmentTemplate) {
  const createMutation = useCreateInvestmentTemplate();
  const updateMutation = useUpdateInvestmentTemplate();

  const handleSubmit = async (data: CreateInvestmentTemplateInput | UpdateInvestmentTemplateInput) => {
    if (template?.id) {
      // Update existing template
      return updateMutation.mutateAsync({
        id: template.id,
        updates: data as UpdateInvestmentTemplateInput
      });
    } else {
      // Create new template
      return createMutation.mutateAsync(data as CreateInvestmentTemplateInput);
    }
  };

  return {
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
  };
}

// Hook for SIP dashboard data
export function useSIPDashboard() {
  const sipTemplates = useSIPTemplates();
  const stats = useInvestmentTemplateStats();
  const upcoming = useUpcomingExecutions(7); // Next 7 days
  const overdue = useOverdueTemplates();

  const dashboardData = {
    activeSIPs: sipTemplates.data?.filter(t => t.is_active).length || 0,
    totalSIPs: sipTemplates.data?.length || 0,
    monthlyAmount: stats.data?.total_monthly_investment || 0,
    upcomingExecutions: upcoming.data?.length || 0,
    overdueExecutions: overdue.data?.length || 0,
    templates: sipTemplates.data || [],
    upcomingList: upcoming.data?.slice(0, 5) || [],
    overdueList: overdue.data || [],
    isLoading: sipTemplates.isLoading || stats.isLoading || upcoming.isLoading,
    error: sipTemplates.error || stats.error || upcoming.error
  };

  return dashboardData;
}

// Hook for template execution management
export function useTemplateExecution() {
  const executeTemplate = useExecuteInvestmentTemplate();
  const toggleTemplate = useToggleInvestmentTemplate();
  
  const executeMultiple = useMutation({
    mutationFn: async (templateIds: string[]) => {
      const results = await Promise.allSettled(
        templateIds.map(id => executeTemplate.mutateAsync(id))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { successful, failed, total: templateIds.length };
    },
    onSuccess: ({ successful, failed, total }) => {
      if (failed === 0) {
        toast.success(`All ${total} investments executed successfully`);
      } else if (successful > 0) {
        toast.success(`${successful} of ${total} investments executed successfully`);
        if (failed > 0) {
          toast.error(`${failed} investments failed to execute`);
        }
      } else {
        toast.error('All investments failed to execute');
      }
    },
  });

  const pauseMultiple = useMutation({
    mutationFn: async (templateIds: string[]) => {
      const results = await Promise.allSettled(
        templateIds.map(id => toggleTemplate.mutateAsync({ id, isActive: false }))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      return { successful, total: templateIds.length };
    },
    onSuccess: ({ successful, total }) => {
      toast.success(`${successful} of ${total} templates paused`);
    },
  });

  return {
    executeTemplate: executeTemplate.mutateAsync,
    executeMultiple: executeMultiple.mutateAsync,
    pauseTemplate: (id: string) => toggleTemplate.mutateAsync({ id, isActive: false }),
    resumeTemplate: (id: string) => toggleTemplate.mutateAsync({ id, isActive: true }),
    pauseMultiple: pauseMultiple.mutateAsync,
    isExecuting: executeTemplate.isPending || executeMultiple.isPending,
    isPausing: toggleTemplate.isPending || pauseMultiple.isPending,
  };
}