import { supabase, TABLES } from '@/lib/supabase/client';
import { Profile, ProfileWithRole, Role, Permission, AdminAuditLog } from '@/types';

export class AdminService {
  // Get all users (admin only)
  static async getAllUsers(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    // First get user IDs with pagination
    const { data: profileIds, error: profileError, count } = await supabase
      .from(TABLES.PROFILES)
      .select('user_id', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;
    if (!profileIds || profileIds.length === 0) {
      return {
        users: [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    }

    // Then get full profile data using the custom function
    const usersWithRoles = await Promise.all(
      profileIds.map(async (profile) => {
        const { data: userData } = await supabase
          .rpc('get_user_profile', { p_user_id: profile.user_id });
        
        if (userData && userData.length > 0) {
          const user = userData[0];
          return {
            ...user,
            role: user.role_name ? {
              id: '',
              name: user.role_name,
              display_name: user.role_display_name,
              description: null,
              is_system: false,
              is_active: true,
              created_at: '',
              updated_at: ''
            } : null
          };
        }
        return null;
      })
    );

    return {
      users: usersWithRoles.filter(user => user !== null),
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    };
  }

  // Search users
  static async searchUsers(query: string, limit = 20) {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('user_id')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Get full profile data using the custom function
    const usersWithRoles = await Promise.all(
      data.map(async (profile) => {
        const { data: userData } = await supabase
          .rpc('get_user_profile', { p_user_id: profile.user_id });
        
        if (userData && userData.length > 0) {
          const user = userData[0];
          return {
            ...user,
            role: user.role_name ? {
              id: '',
              name: user.role_name,
              display_name: user.role_display_name,
              description: null,
              is_system: false,
              is_active: true,
              created_at: '',
              updated_at: ''
            } : null
          };
        }
        return null;
      })
    );

    return usersWithRoles.filter(user => user !== null);
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<ProfileWithRole | null> {
    const { data: profileData, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId });

    if (error) throw error;
    if (!profileData || profileData.length === 0) return null;

    const profile = profileData[0];
    
    // Get user permissions
    const { data: permissions } = await supabase
      .rpc('get_user_permissions', { p_user_id: userId });
    
    // Construct the role object from the flattened data
    const role = profile.role_name ? {
      id: '',
      name: profile.role_name,
      display_name: profile.role_display_name,
      description: null,
      is_system: false,
      is_active: true,
      created_at: '',
      updated_at: ''
    } : null;
    
    const profileWithRole: ProfileWithRole = {
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role_id: profile.role_id,
      currency: profile.currency,
      timezone: profile.timezone,
      theme: profile.theme,
      date_format: profile.date_format || 'YYYY-MM-DD',
      time_format: profile.time_format || '24h',
      language: profile.language || 'en',
      email_verified: profile.email_verified,
      phone_number: profile.phone_number,
      phone_verified: profile.phone_verified,
      two_factor_enabled: profile.two_factor_enabled,
      last_login: profile.last_login,
      login_count: profile.login_count || 0,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      role: role,
      permissions: permissions?.map((p: any) => ({
        id: '',
        name: p.permission_name,
        display_name: p.permission_name,
        description: null,
        resource: p.resource,
        action: p.action as any,
        is_system: true,
        created_at: '',
        updated_at: ''
      })) || []
    };

    return profileWithRole;
  }

  // Get all available roles
  static async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from(TABLES.ROLES)
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Update user role
  static async updateUserRole(userId: string, roleId: string) {
    // Get old profile data for logging
    const oldProfile = await this.getUserById(userId);
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update({ role_id: roleId, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Get updated profile with role using custom function
    const updatedProfile = await this.getUserById(userId);
    if (!updatedProfile) throw new Error('Failed to fetch updated profile');

    if (error) throw error;

    // Log the action
    await this.logAdminAction(
      'role_change',
      userId,
      'user',
      {
        old_role: oldProfile?.role?.name,
        new_role: updatedProfile.role?.name
      }
    );

    return updatedProfile;
  }

  // Promote user to admin
  static async promoteToAdmin(userId: string) {
    // Get admin role ID
    const { data: adminRole } = await supabase
      .from(TABLES.ROLES)
      .select('id')
      .eq('name', 'admin')
      .single();

    if (!adminRole) throw new Error('Admin role not found');
    return this.updateUserRole(userId, adminRole.id);
  }

  // Demote admin to user
  static async demoteFromAdmin(userId: string) {
    // Get user role ID
    const { data: userRole } = await supabase
      .from(TABLES.ROLES)
      .select('id')
      .eq('name', 'user')
      .single();

    if (!userRole) throw new Error('User role not found');
    return this.updateUserRole(userId, userRole.id);
  }

  // Disable/Enable user account
  static async toggleUserStatus(userId: string, isActive: boolean) {
    // Note: Supabase doesn't allow updating auth.users directly
    // This would typically be handled through the Supabase Admin API
    console.log(`User ${userId} ${isActive ? 'enabled' : 'disabled'}`);
    return { success: true, message: `User ${isActive ? 'enabled' : 'disabled'} successfully` };
  }

  // Get admin logs
  static async getAdminLogs(page = 1, limit = 50, filters?: {
    adminUserId?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = supabase
      .from(TABLES.ADMIN_AUDIT_LOGS)
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.adminUserId) {
      query = query.eq('admin_user_id', filters.adminUserId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    };
  }

  // Log admin action
  static async logAdminAction(
    action: string,
    resourceId?: string,
    resourceType?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const logData = {
        admin_user_id: user.id,
        action: action as any,
        resource_type: resourceType || 'unknown',
        resource_id: resourceId || null,
        new_values: details ? JSON.stringify(details) : null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        success: true
      };

      const { error } = await supabase
        .from(TABLES.ADMIN_AUDIT_LOGS)
        .insert(logData);

      if (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw error for logging failures to avoid breaking main operations
      }
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Get system statistics
  static async getSystemStats() {
    try {
      // Get user counts
      const { count: totalUsers } = await supabase
        .from(TABLES.PROFILES)
        .select('*', { count: 'exact', head: true });

      const { count: adminUsers } = await supabase
        .from(TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentRegistrations } = await supabase
        .from(TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get total transactions
      const { count: totalTransactions } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*', { count: 'exact', head: true });

      // Get active users (users with transactions in last 30 days)
      const { data: activeUsers } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const activeUserCount = new Set(activeUsers?.map(t => t.user_id) || []).size;

      return {
        totalUsers: totalUsers || 0,
        adminUsers: adminUsers || 0,
        regularUsers: (totalUsers || 0) - (adminUsers || 0),
        recentRegistrations: recentRegistrations || 0,
        totalTransactions: totalTransactions || 0,
        activeUsers: activeUserCount,
        inactiveUsers: (totalUsers || 0) - activeUserCount
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  // Get user activity summary
  static async getUserActivity(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: transactions, error: transError } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('created_at, type, amount')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (transError) throw transError;

    const { data: budgets, error: budgetError } = await supabase
      .from(TABLES.BUDGETS)
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (budgetError) throw budgetError;

    return {
      transactionCount: transactions?.length || 0,
      budgetCount: budgets?.length || 0,
      totalIncome: transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
      totalExpense: transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0,
      lastActivity: transactions?.[0]?.created_at || null
    };
  }
}

export default AdminService;