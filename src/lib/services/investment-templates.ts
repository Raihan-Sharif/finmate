import { supabase, TABLES } from '@/lib/supabase/client';
import { 
  InvestmentTemplate, 
  CreateInvestmentTemplateInput,
  UpdateInvestmentTemplateInput,
  InvestmentFrequency
} from '@/types/investments';

export class InvestmentTemplateService {
  // Get all investment templates for a user (including global templates)
  static async getTemplates(userId: string): Promise<InvestmentTemplate[]> {
    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        ),
        recent_executions:investment_transactions(
          id,
          transaction_date,
          net_amount,
          type
        )
      `)
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .eq('is_active', true)
      .order('is_global', { ascending: false }) // User templates first
      .order('next_execution', { ascending: true })
      .limit(5, { foreignTable: 'investment_transactions' });

    if (error) throw error;
    return data || [];
  }

  // Get template by ID
  static async getTemplateById(id: string, userId: string): Promise<InvestmentTemplate | null> {
    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon,
          risk_level
        ),
        recent_executions:investment_transactions(
          id,
          transaction_date,
          net_amount,
          type,
          units,
          price_per_unit
        )
      `)
      .eq('id', id)
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .order('transaction_date', { ascending: false, foreignTable: 'investment_transactions' })
      .limit(10, { foreignTable: 'investment_transactions' })
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Create new investment template
  static async createTemplate(
    template: CreateInvestmentTemplateInput,
    userId: string
  ): Promise<InvestmentTemplate> {
    // Calculate next execution date
    const next_execution = this.calculateNextExecution(
      template.start_date,
      template.frequency,
      template.interval_value || 1
    );

    const { data, error } = await supabase
      .from('investment_templates')
      .insert({
        ...template,
        user_id: userId,
        currency: template.currency || 'BDT',
        interval_value: template.interval_value || 1,
        auto_execute: template.auto_execute !== false,
        market_order: template.market_order !== false,
        template_type: template.template_type || 'sip',
        next_execution,
        usage_count: 0
      })
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update investment template
  static async updateTemplate(
    id: string,
    updates: UpdateInvestmentTemplateInput,
    userId: string
  ): Promise<InvestmentTemplate> {
    // Recalculate next execution if frequency or interval changes
    let updateData = { ...updates };
    
    if (updates.frequency || updates.interval_value || updates.start_date) {
      const current = await this.getTemplateById(id, userId);
      if (!current) throw new Error('Template not found');

      const frequency = updates.frequency || current.frequency;
      const interval_value = updates.interval_value || current.interval_value;
      const start_date = updates.start_date || current.start_date;

      updateData.next_execution = this.calculateNextExecution(
        start_date,
        frequency,
        interval_value
      );
    }

    const { data, error } = await supabase
      .from('investment_templates')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Only allow updating own templates
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete template (soft delete)
  static async deleteTemplate(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('investment_templates')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Toggle template active status
  static async toggleTemplate(
    id: string, 
    userId: string, 
    isActive: boolean
  ): Promise<InvestmentTemplate> {
    return this.updateTemplate(id, { is_active: isActive }, userId);
  }

  // Get active templates ready for execution
  static async getTemplatesForExecution(userId?: string): Promise<InvestmentTemplate[]> {
    let query = supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `)
      .eq('is_active', true)
      .eq('auto_execute', true)
      .lte('next_execution', new Date().toISOString().split('T')[0]);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('next_execution', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Execute a specific investment template manually
  static async executeTemplate(id: string, userId: string): Promise<string> {
    const template = await this.getTemplateById(id, userId);
    if (!template || !template.is_active) {
      throw new Error('Template not found or inactive');
    }

    // Create investment transaction from template
    const { data: transaction, error: transactionError } = await supabase
      .from('investment_transactions')
      .insert({
        user_id: userId,
        investment_id: null, // Will be handled by the investment matching logic
        portfolio_id: template.portfolio_id,
        type: 'buy',
        units: 1, // Will be calculated based on amount and current price
        price_per_unit: template.amount_per_investment, // For SIP, this is the amount
        total_amount: template.amount_per_investment,
        net_amount: template.amount_per_investment,
        transaction_date: new Date().toISOString().split('T')[0],
        platform: template.platform,
        account_number: template.account_number,
        currency: template.currency,
        recurring_investment_id: template.id,
        is_recurring: true,
        notes: `Automated investment from template: ${template.name}`,
        metadata: {
          template_id: template.id,
          template_name: template.name,
          execution_type: 'manual'
        }
      })
      .select('id')
      .single();

    if (transactionError) throw transactionError;

    // Update template execution tracking
    const nextExecution = this.calculateNextExecution(
      new Date().toISOString().split('T')[0],
      template.frequency,
      template.interval_value
    );

    await this.updateTemplate(id, {
      last_executed: new Date().toISOString().split('T')[0],
      next_execution: nextExecution,
      total_executed: template.total_executed + 1,
      total_invested: template.total_invested + template.amount_per_investment
    }, userId);

    // Increment usage count
    await this.incrementUsage(id);

    return transaction.id;
  }

  // Calculate next execution date
  static calculateNextExecution(
    currentDate: string,
    frequency: InvestmentFrequency,
    intervalValue: number = 1
  ): string {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + intervalValue);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (7 * intervalValue));
        break;
      case 'biweekly':
        date.setDate(date.getDate() + (14 * intervalValue));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + intervalValue);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (3 * intervalValue));
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + intervalValue);
        break;
      default:
        throw new Error(`Unknown frequency: ${frequency}`);
    }
    
    return date.toISOString().split('T')[0];
  }

  // Get upcoming executions (next 30 days)
  static async getUpcomingExecutions(userId: string, days: number = 30): Promise<InvestmentTemplate[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_execution', endDate.toISOString().split('T')[0])
      .order('next_execution', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get templates by type
  static async getTemplatesByType(
    userId: string, 
    investmentType: string
  ): Promise<InvestmentTemplate[]> {
    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('investment_type', investmentType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get active SIP templates
  static async getSIPTemplates(userId: string): Promise<InvestmentTemplate[]> {
    return this.getTemplatesByType(userId, 'sip');
  }

  // Search templates
  static async searchTemplates(userId: string, query: string): Promise<InvestmentTemplate[]> {
    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,symbol.ilike.%${query}%`)
      .order('is_global', { ascending: false })
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get global templates (for admin management)
  static async getGlobalTemplates(): Promise<InvestmentTemplate[]> {
    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('is_global', true)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Increment usage count
  static async incrementUsage(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_investment_template_usage', {
      template_id: id
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: template } = await supabase
        .from('investment_templates')
        .select('usage_count')
        .eq('id', id)
        .single();

      if (template) {
        await supabase
          .from('investment_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', id);
      }
    }
  }

  // Get template statistics
  static async getTemplateStats(userId: string) {
    const templates = await this.getTemplates(userId);
    
    const stats = {
      total_templates: templates.length,
      active_templates: templates.filter(t => t.is_active).length,
      total_monthly_investment: 0,
      total_invested_via_templates: templates.reduce((sum, t) => sum + t.total_invested, 0),
      next_execution_date: templates
        .filter(t => t.is_active)
        .sort((a, b) => new Date(a.next_execution).getTime() - new Date(b.next_execution).getTime())[0]?.next_execution,
      by_frequency: templates.reduce((acc, t) => {
        acc[t.frequency] = (acc[t.frequency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_type: templates.reduce((acc, t) => {
        acc[t.investment_type] = (acc[t.investment_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Calculate monthly equivalent investment
    stats.total_monthly_investment = templates
      .filter(t => t.is_active)
      .reduce((sum, t) => {
        let monthlyEquivalent = 0;
        switch (t.frequency) {
          case 'daily':
            monthlyEquivalent = t.amount_per_investment * 30;
            break;
          case 'weekly':
            monthlyEquivalent = t.amount_per_investment * 4.33;
            break;
          case 'biweekly':
            monthlyEquivalent = t.amount_per_investment * 2.17;
            break;
          case 'monthly':
            monthlyEquivalent = t.amount_per_investment;
            break;
          case 'quarterly':
            monthlyEquivalent = t.amount_per_investment / 3;
            break;
          case 'yearly':
            monthlyEquivalent = t.amount_per_investment / 12;
            break;
        }
        return sum + monthlyEquivalent;
      }, 0);

    return stats;
  }

  // Duplicate template
  static async duplicateTemplate(
    id: string, 
    userId: string, 
    newName?: string
  ): Promise<InvestmentTemplate> {
    const original = await this.getTemplateById(id, userId);
    if (!original) throw new Error('Template not found');

    const duplicate: CreateInvestmentTemplateInput = {
      portfolio_id: original.portfolio_id,
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      investment_type: original.investment_type,
      symbol: original.symbol,
      amount_per_investment: original.amount_per_investment,
      currency: original.currency,
      platform: original.platform,
      account_number: original.account_number,
      frequency: original.frequency,
      interval_value: original.interval_value,
      start_date: new Date().toISOString().split('T')[0], // Start from today
      end_date: original.end_date,
      target_amount: original.target_amount,
      auto_execute: original.auto_execute,
      market_order: original.market_order,
      limit_price: original.limit_price,
      tags: original.tags,
      notes: original.notes,
      metadata: original.metadata,
      template_type: original.template_type
    };

    return this.createTemplate(duplicate, userId);
  }

  // Pause template (set inactive)
  static async pauseTemplate(id: string, userId: string): Promise<InvestmentTemplate> {
    return this.toggleTemplate(id, userId, false);
  }

  // Resume template (set active)
  static async resumeTemplate(id: string, userId: string): Promise<InvestmentTemplate> {
    return this.toggleTemplate(id, userId, true);
  }

  // Get overdue templates (past execution date but not executed)
  static async getOverdueTemplates(userId: string): Promise<InvestmentTemplate[]> {
    const { data, error } = await supabase
      .from('investment_templates')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('next_execution', new Date().toISOString().split('T')[0])
      .order('next_execution', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export default InvestmentTemplateService;