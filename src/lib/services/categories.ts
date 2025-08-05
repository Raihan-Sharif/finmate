import { supabase, TABLES } from '@/lib/supabase/client';
import { Category, CategoryInsert, CategoryUpdate } from '@/types';

export class CategoryService {
  // Get all categories for a user
  static async getCategories(userId: string, type?: 'income' | 'expense' | 'transfer'): Promise<Category[]> {
    let query = supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get category by ID
  static async getCategoryById(id: string, userId: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
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

  // Create new category
  static async createCategory(category: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .insert(category)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update category
  static async updateCategory(id: string, updates: CategoryUpdate, userId: string): Promise<Category> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Delete (deactivate) category
  static async deleteCategory(id: string, userId: string): Promise<void> {
    // Check if category has transactions
    const { data: transactions, error: transactionError } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (transactionError) throw transactionError;

    if (transactions && transactions.length > 0) {
      // Soft delete - deactivate instead of hard delete
      const { error } = await supabase
        .from(TABLES.CATEGORIES)
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Hard delete if no transactions
      const { error } = await supabase
        .from(TABLES.CATEGORIES)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    }
  }

  // Get categories with transaction counts
  static async getCategoriesWithStats(userId: string, period?: {
    startDate: string;
    endDate: string;
  }) {
    const categories = await this.getCategories(userId);
    
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        let query = supabase
          .from(TABLES.TRANSACTIONS)
          .select('amount, date')
          .eq('category_id', category.id)
          .eq('user_id', userId);

        if (period) {
          query = query
            .gte('date', period.startDate)
            .lte('date', period.endDate);
        }

        const { data: transactions, error } = await query;

        if (error) throw error;

        const totalAmount = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const transactionCount = transactions?.length || 0;
        const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

        return {
          ...category,
          transaction_count: transactionCount,
          total_amount: totalAmount,
          average_amount: averageAmount,
          last_used: transactions && transactions.length > 0 
            ? transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : null
        };
      })
    );

    return categoriesWithStats.sort((a, b) => b.transaction_count - a.transaction_count);
  }

  // Get category hierarchy (for nested categories)
  static async getCategoryHierarchy(userId: string): Promise<Category[]> {
    const categories = await this.getCategories(userId);
    
    // Build hierarchy
    const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, children: [] as Category[] }]));
    const rootCategories: Category[] = [];

    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!;
        parent.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  // Update category order
  static async updateCategoryOrder(categoryIds: string[], userId: string): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    for (const update of updates) {
      await supabase
        .from(TABLES.CATEGORIES)
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('user_id', userId);
    }
  }

  // Get most used categories
  static async getMostUsedCategories(userId: string, limit = 10, period?: {
    startDate: string;
    endDate: string;
  }) {
    let query = supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        category_id,
        amount,
        category:categories(name, color, icon)
      `)
      .eq('user_id', userId)
      .not('category_id', 'is', null);

    if (period) {
      query = query
        .gte('date', period.startDate)
        .lte('date', period.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category and count usage
    const categoryUsage = new Map();

    data?.forEach(transaction => {
      const categoryId = transaction.category_id;
      const category = transaction.category;
      
      if (categoryUsage.has(categoryId)) {
        categoryUsage.get(categoryId).count++;
        categoryUsage.get(categoryId).totalAmount += transaction.amount;
      } else {
        categoryUsage.set(categoryId, {
          category_id: categoryId,
          name: category?.name || 'Unknown',
          color: category?.color || '#6B7280',
          icon: category?.icon || 'folder',
          count: 1,
          totalAmount: transaction.amount
        });
      }
    });

    return Array.from(categoryUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Search categories
  static async searchCategories(userId: string, query: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get category suggestions based on transaction description
  static async getCategorySuggestions(userId: string, description: string): Promise<Category[]> {
    // Get categories that have been used with similar descriptions
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        category_id,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .not('category_id', 'is', null)
      .ilike('description', `%${description}%`)
      .limit(5);

    if (error) throw error;

    // Remove duplicates and return unique categories
    const uniqueCategories = new Map();
    data?.forEach(transaction => {
      if (transaction.category && !uniqueCategories.has(transaction.category_id)) {
        uniqueCategories.set(transaction.category_id, transaction.category);
      }
    });

    return Array.from(uniqueCategories.values());
  }

  // Create default categories for new user (called by trigger)
  static async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories: CategoryInsert[] = [
      // Income categories
      { user_id: userId, name: 'Salary', icon: 'briefcase', color: '#10B981', type: 'income', is_default: true },
      { user_id: userId, name: 'Freelance', icon: 'laptop', color: '#3B82F6', type: 'income', is_default: true },
      { user_id: userId, name: 'Investment Returns', icon: 'trending-up', color: '#8B5CF6', type: 'income', is_default: true },
      { user_id: userId, name: 'Other Income', icon: 'plus-circle', color: '#6B7280', type: 'income', is_default: true },
      
      // Expense categories
      { user_id: userId, name: 'Food & Dining', icon: 'utensils', color: '#EF4444', type: 'expense', is_default: true },
      { user_id: userId, name: 'Transportation', icon: 'car', color: '#3B82F6', type: 'expense', is_default: true },
      { user_id: userId, name: 'Shopping', icon: 'shopping-bag', color: '#F59E0B', type: 'expense', is_default: true },
      { user_id: userId, name: 'Bills & Utilities', icon: 'zap', color: '#10B981', type: 'expense', is_default: true },
      { user_id: userId, name: 'Healthcare', icon: 'heart', color: '#EC4899', type: 'expense', is_default: true },
      { user_id: userId, name: 'Entertainment', icon: 'film', color: '#8B5CF6', type: 'expense', is_default: true },
      { user_id: userId, name: 'Education', icon: 'book-open', color: '#06B6D4', type: 'expense', is_default: true },
      { user_id: userId, name: 'Other Expenses', icon: 'minus-circle', color: '#6B7280', type: 'expense', is_default: true }
    ];

    for (const category of defaultCategories) {
      try {
        await this.createCategory(category);
      } catch (error) {
        console.error('Error creating default category:', category.name, error);
      }
    }
  }

  // Archive unused categories
  static async archiveUnusedCategories(userId: string, daysUnused = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysUnused);
    
    const categories = await this.getCategories(userId);
    
    for (const category of categories) {
      if (category.is_default) continue; // Don't archive default categories
      
      const { data: recentTransactions } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('id')
        .eq('category_id', category.id)
        .gte('date', cutoffDate.toISOString().split('T')[0])
        .limit(1);

      if (!recentTransactions || recentTransactions.length === 0) {
        await this.updateCategory(category.id, { is_active: false }, userId);
      }
    }
  }
}

export default CategoryService;