import { supabase, TABLES } from '@/lib/supabase/client';
import { BudgetPeriod } from '@/types';

export interface BudgetTemplate {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  period: BudgetPeriod;
  category_ids?: string[];
  alert_percentage: number;
  alert_enabled?: boolean;
  is_active?: boolean;
  is_global?: boolean;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

export class BudgetTemplateService {
  // Get all templates (user's own + global)
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
    return data || [];
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
    return data || [];
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

    return data;
  }

  // Create new template
  static async createTemplate(template: Omit<BudgetTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<BudgetTemplate> {
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

  // Update template
  static async updateTemplate(
    id: string, 
    updates: Partial<BudgetTemplate>, 
    userId: string
  ): Promise<BudgetTemplate> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Delete template
  static async deleteTemplate(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BUDGET_TEMPLATES)
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
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
      description: original.description,
      amount: original.amount,
      currency: original.currency,
      period: original.period,
      category_ids: original.category_ids,
      alert_percentage: original.alert_percentage,
      alert_enabled: original.alert_enabled,
      is_global: false // User copies are never global
    };

    return this.createTemplate(duplicate);
  }
}

export default BudgetTemplateService;