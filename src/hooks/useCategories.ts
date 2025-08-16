'use client';

import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/lib/services/categories';

export function useCategories(type?: 'income' | 'expense' | 'transfer') {
  const {
    data: categories,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['categories', type],
    queryFn: () => CategoryService.getCategories(type),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const {
    data: categoriesWithSubs,
    isLoading: loadingWithSubs
  } = useQuery({
    queryKey: ['categories-with-subs', type],
    queryFn: () => CategoryService.getCategoriesWithSubcategories(type === 'transfer' ? undefined : type),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: categoryOptions,
    isLoading: loadingOptions
  } = useQuery({
    queryKey: ['category-options', type],
    queryFn: () => CategoryService.getAllCategoryOptions(type === 'transfer' ? undefined : type),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: dropdownOptions,
    isLoading: loadingDropdown
  } = useQuery({
    queryKey: ['category-dropdown', type],
    queryFn: () => CategoryService.getCategoriesForDropdown(type === 'transfer' ? undefined : type),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Helper functions
  const getCategoryById = (id: string) => {
    return categories?.find(cat => cat.id === id);
  };

  const getSubcategoryById = (id: string) => {
    return categoriesWithSubs?.flatMap(cat => cat.subcategories || [])
      .find(sub => sub.id === id);
  };

  const searchCategories = (query: string) => {
    if (!query.trim()) return [];
    return CategoryService.searchCategories(query, type === 'transfer' ? undefined : type);
  };

  // Format categories for budget selection (compatible with existing budget code)
  const budgetCategories = categories?.map(category => ({
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    type: category.type
  })) || [];

  return {
    // Raw data
    categories: categories || [],
    categoriesWithSubs: categoriesWithSubs || [],
    categoryOptions: categoryOptions || [],
    dropdownOptions: dropdownOptions || [],
    budgetCategories, // Formatted for budget components

    // Loading states
    isLoading,
    loadingWithSubs,
    loadingOptions,
    loadingDropdown,

    // Error state
    error,

    // Helper functions
    getCategoryById,
    getSubcategoryById,
    searchCategories,
    refetch
  };
}

export default useCategories;