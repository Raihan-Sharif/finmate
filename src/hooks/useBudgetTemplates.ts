import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import BudgetTemplateService, { BudgetTemplate } from '@/lib/services/budgetTemplates';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export const useBudgetTemplates = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user can manage global templates (admin)
  const canManageGlobal = profile?.role === 'admin' || profile?.permissions?.includes('templates:manage_global');

  const {
    data: templates = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['budget-templates', profile?.user_id],
    queryFn: () => profile?.user_id ? BudgetTemplateService.getTemplates(profile.user_id) : [],
    enabled: !!profile?.user_id
  });

  // Search templates
  const {
    data: searchResults = [],
    isLoading: isSearching
  } = useQuery({
    queryKey: ['budget-templates-search', profile?.user_id, searchQuery],
    queryFn: () => profile?.user_id ? BudgetTemplateService.searchTemplates(profile.user_id, searchQuery) : [],
    enabled: !!profile?.user_id && searchQuery.length > 0
  });

  // Get popular templates
  const {
    data: popularTemplates = []
  } = useQuery({
    queryKey: ['budget-templates-popular', profile?.user_id],
    queryFn: () => profile?.user_id ? BudgetTemplateService.getPopularTemplates(profile.user_id) : [],
    enabled: !!profile?.user_id
  });

  // Get recent templates
  const {
    data: recentTemplates = []
  } = useQuery({
    queryKey: ['budget-templates-recent', profile?.user_id],
    queryFn: () => profile?.user_id ? BudgetTemplateService.getRecentTemplates(profile.user_id) : [],
    enabled: !!profile?.user_id
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<BudgetTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count'>) =>
      BudgetTemplateService.createTemplate({
        ...template,
        user_id: profile?.user_id!
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      toast.success('Template created successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BudgetTemplate> }) =>
      BudgetTemplateService.updateTemplate(id, updates, profile?.user_id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      toast.success('Template updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => BudgetTemplateService.deleteTemplate(id, profile?.user_id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      toast.success('Template deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  });

  // Save as template mutation (handles duplicates)
  const saveAsTemplateMutation = useMutation({
    mutationFn: (template: Omit<BudgetTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count'>) =>
      BudgetTemplateService.saveAsTemplate(profile?.user_id!, template),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      toast.success(`Template "${variables.name}" saved successfully!`);
    },
    onError: (error: any) => {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName?: string }) =>
      BudgetTemplateService.duplicateTemplate(id, profile?.user_id!, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      toast.success('Template duplicated successfully!');
    },
    onError: (error: any) => {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  });

  // Increment usage count (silent)
  const incrementUsage = (id: string) => {
    BudgetTemplateService.incrementUsage(id).catch(console.error);
  };

  // Get template by ID
  const getTemplate = async (id: string): Promise<BudgetTemplate | null> => {
    if (!profile?.user_id) return null;
    try {
      return await BudgetTemplateService.getTemplateById(id, profile.user_id);
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  };

  // Filter templates
  const filteredTemplates = searchQuery.length > 0 ? searchResults : templates;

  // Separate user and global templates
  const userTemplates = filteredTemplates.filter(t => !t.is_global);
  const globalTemplates = filteredTemplates.filter(t => t.is_global);

  return {
    // Data
    templates: filteredTemplates,
    userTemplates,
    globalTemplates,
    popularTemplates,
    recentTemplates,
    
    // State
    isLoading: isLoading || isSearching,
    error,
    searchQuery,
    setSearchQuery,
    canManageGlobal,

    // Actions
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    saveAsTemplate: saveAsTemplateMutation.mutate,
    duplicateTemplate: duplicateTemplateMutation.mutate,
    getTemplate,
    incrementUsage,

    // Status
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isSaving: saveAsTemplateMutation.isPending,
    isDuplicating: duplicateTemplateMutation.isPending,
  };
};