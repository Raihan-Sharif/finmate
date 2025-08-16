import { supabase, TABLES } from '@/lib/supabase/client';
import { BudgetPeriod, UserRole } from '@/types';

export interface BudgetTemplate {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  period: BudgetPeriod;
  category_ids?: string[];
  categories?: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  alert_percentage: number;
  alert_enabled?: boolean;
  is_active?: boolean;
  is_global?: boolean;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

export class BudgetTemplateService {
  // Get all templates (user's own + global) with category details
  static async getTemplates(userId: string): Promise<BudgetTemplate[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .eq('is_active', true)
      .order('is_global', { ascending: false }) // User templates first
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each template, get the category details if category_ids exist
    const templatesWithCategories = await Promise.all(
      (data || []).map(async (template) => {
        if (template.category_ids && template.category_ids.length > 0) {
          // Get global categories (user_id IS NULL for global categories)
          // All categories are now global and available to everyone
          const { data: categories } = await supabase
            .from(TABLES.CATEGORIES)
            .select('id, name, icon, color')
            .in('id', template.category_ids)
            .is('user_id', null) // Global categories have NULL user_id
            .eq('is_active', true);

          return {
            ...template,
            categories: categories || []
          };
        }
        return {
          ...template,
          categories: []
        };
      })
    );

    return templatesWithCategories;
  }

  // Search templates by name or description
  static async searchTemplates(userId: string, query: string): Promise<BudgetTemplate[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('is_global', { ascending: false })
      .order('usage_count', { ascending: false });

    if (error) throw error;

    // Add category details to search results
    const templatesWithCategories = await Promise.all(
      (data || []).map(async (template) => {
        if (template.category_ids && template.category_ids.length > 0) {
          // Get global categories (all categories are global with NULL user_id)
          const { data: categories } = await supabase
            .from(TABLES.CATEGORIES)
            .select('id, name, icon, color')
            .in('id', template.category_ids)
            .is('user_id', null) // Global categories have NULL user_id
            .eq('is_active', true);

          return {
            ...template,
            categories: categories || []
          };
        }
        return {
          ...template,
          categories: []
        };
      })
    );

    return templatesWithCategories;
  }

  // Get template by ID
  static async getTemplateById(id: string, userId: string): Promise<BudgetTemplate | null> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Add category details if they exist
    if (data && data.category_ids && data.category_ids.length > 0) {
      // Get global categories (all categories are global with NULL user_id)
      const { data: categories } = await supabase
        .from(TABLES.CATEGORIES)
        .select('id, name, icon, color')
        .in('id', data.category_ids)
        .is('user_id', null) // Global categories have NULL user_id
        .eq('is_active', true);

      return {
        ...data,
        categories: categories || []
      };
    }

    return {
      ...data,
      categories: []
    };
  }

  // Check if user can create custom templates
  static async canCreateCustomTemplate(userId: string): Promise<boolean> {
    const { data: profileData, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId });

    if (error || !profileData || profileData.length === 0) return false;
    
    const profile = profileData[0];
    const roleName = profile.role_name;
    return roleName === 'paid_user' || roleName === 'admin' || roleName === 'super_admin';
  }

  // Check if user can create global templates
  static async canCreateGlobalTemplate(userId: string): Promise<boolean> {
    const { data: profileData, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId });

    if (error || !profileData || profileData.length === 0) return false;
    
    const profile = profileData[0];
    const roleName = profile.role_name;
    return roleName === 'admin' || roleName === 'super_admin';
  }

  // Create new template with role-based validation
  static async createTemplate(
    template: Omit<BudgetTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>,
    userRole?: UserRole
  ): Promise<BudgetTemplate> {
    // Validate permissions
    if (template.is_global) {
      const canCreateGlobal = await this.canCreateGlobalTemplate(template.user_id!);
      if (!canCreateGlobal) {
        throw new Error('You do not have permission to create global templates');
      }
    } else {
      const canCreateCustom = await this.canCreateCustomTemplate(template.user_id!);
      if (!canCreateCustom) {
        throw new Error('Only paid users can create custom templates. Please upgrade your account.');
      }
    }

    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .insert({
        ...template,
        usage_count: 0
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update template (supports both user and global templates for admins)
  static async updateTemplate(
    id: string, 
    updates: Partial<BudgetTemplate>, 
    userId: string
  ): Promise<BudgetTemplate> {
    // First check if it's a global template and user has permissions
    const { data: template } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('is_global, user_id')
      .eq('id', id)
      .single();

    let query = supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .update(updates)
      .eq('id', id);

    if (template?.is_global) {
      // For global templates, check admin permissions
      const canManageGlobal = await this.canCreateGlobalTemplate(userId);
      if (!canManageGlobal) {
        throw new Error('You do not have permission to edit global templates');
      }
    } else {
      // For user templates, check ownership
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select('*').single();

    if (error) throw error;
    return data;
  }

  // Delete template (supports both user and global templates for admins)
  static async deleteTemplate(id: string, userId: string): Promise<void> {
    // First check if it's a global template and user has permissions
    const { data: template } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('is_global, user_id')
      .eq('id', id)
      .single();

    let query = supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .update({ is_active: false })
      .eq('id', id);

    if (template?.is_global) {
      // For global templates, check admin permissions
      const canManageGlobal = await this.canCreateGlobalTemplate(userId);
      if (!canManageGlobal) {
        throw new Error('You do not have permission to delete global templates');
      }
    } else {
      // For user templates, check ownership
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) throw error;
  }

  // Get only global templates (for admin management)
  static async getGlobalTemplates(): Promise<BudgetTemplate[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Save budget as template (or update existing if name matches)
  static async saveAsTemplate(
    userId: string,
    template: Omit<BudgetTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count'>
  ): Promise<BudgetTemplate> {
    // Check if template with same name exists
    const { data: existing } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .eq('user_id', userId)
      .eq('name', template.name)
      .eq('is_active', true)
      .maybeSingle();

    if (existing) {
      // Update existing template
      return this.updateTemplate(existing.id, template, userId);
    } else {
      // Create new template
      return this.createTemplate({
        ...template,
        user_id: userId
      });
    }
  }

  // Increment usage count when template is used
  static async incrementUsage(id: string): Promise<void> {
    const { error } = await supabase
      .rpc('increment_template_usage', { template_id: id });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: template } = await supabase
        .from(TABLES.BUDGET_TEMPLATES)
        .select('usage_count')
        .eq('id', id)
        .single();

      if (template) {
        await supabase
          .from(TABLES.BUDGET_TEMPLATES)
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', id);
      }
    }
  }

  // Get popular templates
  static async getPopularTemplates(userId: string, limit: number = 5): Promise<BudgetTemplate[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get recent templates
  static async getRecentTemplates(userId: string, limit: number = 5): Promise<BudgetTemplate[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Duplicate template
  static async duplicateTemplate(id: string, userId: string, newName?: string): Promise<BudgetTemplate> {
    const original = await this.getTemplateById(id, userId);
    if (!original) throw new Error('Template not found');

    const duplicate: Omit<BudgetTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'> = {
      user_id: userId,
      name: newName || `${original.name} (Copy)`,
      description: original.description || '',
      amount: original.amount,
      currency: original.currency || 'BDT',
      period: original.period,
      category_ids: original.category_ids || [],
      alert_percentage: original.alert_percentage,
      alert_enabled: original.alert_enabled || false,
      is_global: false // User copies are never global
    };

    return this.createTemplate(duplicate);
  }
}

export default BudgetTemplateService;