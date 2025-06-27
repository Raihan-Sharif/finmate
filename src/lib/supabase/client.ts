// src/lib/supabase/client.ts
import type { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client
export const supabase = createClientComponentClient<Database>();

// Browser client for SSR
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Admin client (server-side only)
export const createAdminClient = () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin client should only be used on the server side");
  }

  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Storage helpers
export const storage = {
  // Upload file to Supabase Storage
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  // Get public URL for a file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete a file
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
  },

  // List files in a directory
  async listFiles(bucket: string, folder: string = "") {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    return data;
  },
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to table changes
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        callback
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // Subscribe to user-specific changes
  subscribeToUserData(
    userId: string,
    tables: string[],
    callback: (payload: any) => void
  ) {
    const channels = tables.map((table) => {
      return supabase
        .channel(`${table}-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `user_id=eq.${userId}`,
          },
          callback
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  },
};

// Auth helpers
export const auth = {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign in with OAuth provider
  async signInWithOAuth(provider: "google" | "github") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  },

  // Update password
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  async getCurrentSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};

// Database helpers with type safety
export const db = {
  // Generic CRUD operations
  async create<T = any>(table: string, data: Partial<T>) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async findById<T = any>(table: string, id: string) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as T;
  },

  async findMany<T = any>(
    table: string,
    options?: {
      select?: string;
      filter?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ) {
    let query = supabase.from(table).select(options?.select || "*");

    // Apply filters
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as T[];
  },

  async update<T = any>(table: string, id: string, data: Partial<T>) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async delete(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) throw error;
  },

  // Bulk operations
  async bulkInsert<T = any>(table: string, data: Partial<T>[]) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return result;
  },

  async bulkUpdate<T = any>(
    table: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ) {
    const promises = updates.map(({ id, data }) =>
      this.update(table, id, data)
    );
    return Promise.all(promises);
  },

  // Search functionality
  async search<T = any>(
    table: string,
    searchTerm: string,
    searchColumns: string[],
    options?: {
      limit?: number;
      orderBy?: { column: string; ascending?: boolean };
    }
  ) {
    let query = supabase.from(table).select("*");

    // Create search condition
    const searchConditions = searchColumns
      .map((column) => `${column}.ilike.%${searchTerm}%`)
      .join(",");

    query = query.or(searchConditions);

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as T[];
  },

  // Aggregation functions
  async count(table: string, filter?: Record<string, any>) {
    let query = supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  },

  async sum(table: string, column: string, filter?: Record<string, any>) {
    let query = supabase.from(table).select(column);

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, row) => sum + (row[column] || 0), 0) || 0;
  },
};

// Error handling utility
export const handleSupabaseError = (error: any) => {
  console.error("Supabase error:", error);

  if (error?.code === "PGRST116") {
    return "No data found";
  }

  if (error?.code === "23505") {
    return "This record already exists";
  }

  if (error?.code === "23503") {
    return "Cannot delete this record as it is referenced by other data";
  }

  if (error?.code === "PGRST301") {
    return "You do not have permission to perform this action";
  }

  return error?.message || "An unexpected error occurred";
};

// Type-safe table names
export const TABLES = {
  PROFILES: "profiles",
  CATEGORIES: "categories",
  TRANSACTIONS: "transactions",
  INVESTMENTS: "investments",
  INVESTMENT_TRANSACTIONS: "investment_transactions",
  LENDINGS: "lendings",
  LOANS: "loans",
  EMI_PAYMENTS: "emi_payments",
  BUDGETS: "budgets",
  SAVED_REPORTS: "saved_reports",
  NOTIFICATIONS: "notifications",
  BANK_ACCOUNTS: "bank_accounts",
  IMPORT_HISTORY: "import_history",
} as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  RECEIPTS: "receipts",
  AVATARS: "avatars",
  EXPORTS: "exports",
  IMPORTS: "imports",
} as const;
