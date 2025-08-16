import { supabase, TABLES } from '@/lib/supabase/client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export class CategoryService {
  // Get all categories (global only now)
  static async getCategories(type?: 'income' | 'expense' | 'transfer'): Promise<Category[]> {
    let query = supabase
      .from(TABLES.CATEGORIES)
      .select('*')
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

  // Get all subcategories for a specific category
  static async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from(TABLES.SUBCATEGORIES)
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get categories with their subcategories
  static async getCategoriesWithSubcategories(type?: 'income' | 'expense'): Promise<CategoryWithSubcategories[]> {
    const categories = await this.getCategories(type);
    
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await this.getSubcategories(category.id);
        return {
          ...category,
          subcategories
        };
      })
    );
    
    return categoriesWithSubs;
  }

  // Get category by ID
  static async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Get subcategory by ID
  static async getSubcategoryById(id: string): Promise<Subcategory | null> {
    const { data, error } = await supabase
      .from(TABLES.SUBCATEGORIES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Get categories for dropdown (formatted for UI)
  static async getCategoriesForDropdown(type?: 'income' | 'expense') {
    const categoriesWithSubs = await this.getCategoriesWithSubcategories(type);
    
    const options: Array<{ value: string; label: string; parent?: string; level: number }> = [];
    
    categoriesWithSubs.forEach(category => {
      // Add main category
      options.push({
        value: category.id,
        label: category.name,
        level: 0
      });
      
      // Add subcategories with indentation
      category.subcategories?.forEach(subcategory => {
        options.push({
          value: subcategory.id,
          label: subcategory.name,
          parent: category.name,
          level: 1
        });
      });
    });
    
    return options;
  }

  // Get all categories and subcategories in flat format for filtering
  static async getAllCategoryOptions(type?: 'income' | 'expense') {
    const [categories, subcategories] = await Promise.all([
      this.getCategories(type),
      supabase
        .from(TABLES.SUBCATEGORIES)
        .select(`
          *,
          category:categories(type)
        `)
        .eq('is_active', true)
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.filter(sub => !type || sub.category?.type === type) || [];
        })
    ]);

    const options: Array<{ value: string; label: string; type: 'category' | 'subcategory'; level: number }> = [];

    // Add categories
    categories.forEach(category => {
      options.push({
        value: category.id,
        label: category.name,
        type: 'category',
        level: 0
      });
    });

    // Add subcategories
    subcategories.forEach(subcategory => {
      options.push({
        value: subcategory.id,
        label: subcategory.name,
        type: 'subcategory',
        level: 1
      });
    });

    return options;
  }

  // Search categories and subcategories
  static async searchCategories(query: string, type?: 'income' | 'expense'): Promise<(Category | Subcategory)[]> {
    const searchPattern = `%${query}%`;
    
    // Search categories
    let categoryQuery = supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`);

    if (type) {
      categoryQuery = categoryQuery.eq('type', type);
    }

    // Search subcategories
    let subcategoryQuery = supabase
      .from(TABLES.SUBCATEGORIES)
      .select(`
        *,
        category:categories(type)
      `)
      .eq('is_active', true)
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`);

    const [categoriesResult, subcategoriesResult] = await Promise.all([
      categoryQuery,
      subcategoryQuery
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (subcategoriesResult.error) throw subcategoriesResult.error;

    const categories = categoriesResult.data || [];
    let subcategories = subcategoriesResult.data || [];

    // Filter subcategories by type if specified
    if (type) {
      subcategories = subcategories.filter(sub => sub.category?.type === type);
    }

    return [...categories, ...subcategories].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get category suggestions based on transaction description
  static async getCategorySuggestions(description: string): Promise<(Category | Subcategory)[]> {
    const searchPattern = `%${description}%`;

    // Get categories and subcategories that have been used with similar descriptions
    const { data: transactions, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        category_id,
        subcategory_id,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .not('category_id', 'is', null)
      .ilike('description', searchPattern)
      .limit(10);

    if (error) throw error;

    // Extract unique categories and subcategories
    const uniqueItems = new Map();
    
    transactions?.forEach(transaction => {
      if (transaction.category && !uniqueItems.has(transaction.category_id)) {
        uniqueItems.set(transaction.category_id, {
          ...transaction.category,
          type: 'category'
        });
      }
      if (transaction.subcategory && !uniqueItems.has(transaction.subcategory_id)) {
        uniqueItems.set(transaction.subcategory_id, {
          ...transaction.subcategory,
          type: 'subcategory'
        });
      }
    });

    return Array.from(uniqueItems.values());
  }

  // Get most used categories and subcategories
  static async getMostUsedCategories(userId: string, limit = 10, period?: {
    startDate: string;
    endDate: string;
  }) {
    let query = supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        category_id,
        subcategory_id,
        amount,
        category:categories(name, color, icon),
        subcategory:subcategories(name, color, icon)
      `)
      .eq('user_id', userId);

    if (period) {
      query = query
        .gte('date', period.startDate)
        .lte('date', period.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count usage for both categories and subcategories
    const usage = new Map();

    data?.forEach(transaction => {
      // Count category usage
      if (transaction.category_id && transaction.category) {
        const key = `category_${transaction.category_id}`;
        if (usage.has(key)) {
          usage.get(key).count++;
          usage.get(key).totalAmount += transaction.amount;
        } else {
          const category = Array.isArray(transaction.category) ? transaction.category[0] : transaction.category;
          usage.set(key, {
            id: transaction.category_id,
            name: category?.name || 'Unknown',
            color: category?.color || '#6B7280',
            icon: category?.icon || 'folder',
            type: 'category',
            count: 1,
            totalAmount: transaction.amount
          });
        }
      }

      // Count subcategory usage
      if (transaction.subcategory_id && transaction.subcategory) {
        const key = `subcategory_${transaction.subcategory_id}`;
        if (usage.has(key)) {
          usage.get(key).count++;
          usage.get(key).totalAmount += transaction.amount;
        } else {
          const subcategory = Array.isArray(transaction.subcategory) ? transaction.subcategory[0] : transaction.subcategory;
          usage.set(key, {
            id: transaction.subcategory_id,
            name: subcategory?.name || 'Unknown',
            color: subcategory?.color || '#6B7280',
            icon: subcategory?.icon || 'folder',
            type: 'subcategory',
            count: 1,
            totalAmount: transaction.amount
          });
        }
      }
    });

    return Array.from(usage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Get categories with transaction stats
  static async getCategoriesWithStats(userId: string, period?: {
    startDate: string;
    endDate: string;
  }) {
    const categories = await this.getCategories();
    
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
            ? transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null
            : null
        };
      })
    );

    return categoriesWithStats.sort((a, b) => b.transaction_count - a.transaction_count);
  }
}

export default CategoryService;