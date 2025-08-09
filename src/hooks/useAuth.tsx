"use client";

import { auth, db, supabase, TABLES } from "@/lib/supabase/client";
import { Profile, ProfileWithRole } from "@/types";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileWithRole | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: Partial<ProfileWithRole>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session?.user?.id);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
        router.push("/auth/signin");
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch user profile with role and permissions
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      
      // Use the database function that bypasses RLS for role data
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_user_profile', { p_user_id: userId });
      
      console.log("Profile function result:", { data: profileData, error: profileError });
      
      if (profileError) {
        throw profileError;
      }
      
      if (!profileData || profileData.length === 0) {
        console.log("Profile not found, might be a new user");
        setProfile(null);
        return;
      }
      
      const profile = profileData[0];
      console.log("Profile data:", profile);
      console.log("Role name from profile:", profile.role_name);
      
      // Get user permissions
      const { data: permissions } = await supabase
        .rpc('get_user_permissions', { p_user_id: userId });
      
      // Construct the role object from the flattened data
      const role = profile.role_name ? {
        id: '', // Not returned by function but not needed for UI
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
        notifications_enabled: profile.notifications_enabled,
        ai_insights_enabled: profile.ai_insights_enabled,
        monthly_budget_limit: profile.monthly_budget_limit,
        email_verified: profile.email_verified,
        phone_number: profile.phone_number,
        phone_verified: profile.phone_verified,
        two_factor_enabled: profile.two_factor_enabled,
        last_login: profile.last_login,
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
      
      console.log("Final profile with role:", profileWithRole);
      setProfile(profileWithRole);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(
    async (email: string, password: string, metadata?: any) => {
      try {
        setLoading(true);
        const { data, error } = await auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        });

        if (error) throw error;

        toast.success(
          "Account created! Please check your email for verification."
        );

        // Redirect to verification page with email parameter
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } catch (error: any) {
        console.error("Sign up error:", error);
        toast.error(error.message || "Failed to create account");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const { data, error } = await auth.signInWithPassword({ email, password });

        if (error) throw error;

        toast.success("Welcome back!");
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Sign in error:", error);
        toast.error(error.message || "Failed to sign in");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Sign in with OAuth provider
  const signInWithOAuth = useCallback(async (provider: "google" | "github") => {
    try {
      setLoading(true);
      const { data, error } = await auth.signInWithOAuth({ provider });

      if (error) throw error;

      // OAuth redirect will be handled by the callback
    } catch (error: any) {
      console.error("OAuth sign in error:", error);
      toast.error(error.message || `Failed to sign in with ${provider}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await auth.signOut();

      setUser(null);
      setSession(null);
      setProfile(null);

      toast.success("Signed out successfully");
      router.push("/auth/signin");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to send reset email");
      throw error;
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast.error(error.message || "Failed to update password");
      throw error;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<ProfileWithRole>) => {
      if (!user) throw new Error("No user logged in");

      try {
        const { data, error } = await supabase
          .from(TABLES.PROFILES)
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        toast.success("Profile updated successfully");
      } catch (error: any) {
        console.error("Update profile error:", error);
        toast.error(error.message || "Failed to update profile");
        throw error;
      }
    },
    [user]
  );

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push("/auth/signin");
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for checking user role and permissions
export function usePermissions() {
  const { user, profile } = useAuth();

  const hasPermission = useCallback(
    (permissionName: string) => {
      if (!user || !profile) return false;
      
      // Check if user has the specific permission
      return profile.permissions?.some(
        permission => permission.name === permissionName
      ) || false;
    },
    [user, profile]
  );

  const hasRole = useCallback(
    (roleName: string) => {
      if (!user || !profile || !profile.role) return false;
      return profile.role.name === roleName;
    },
    [user, profile]
  );

  const isSuperAdmin = useCallback(() => {
    return hasRole('super_admin');
  }, [hasRole]);

  const isAdmin = useCallback(() => {
    return hasRole('admin') || isSuperAdmin();
  }, [hasRole, isSuperAdmin]);

  const isManager = useCallback(() => {
    return hasRole('manager') || isAdmin();
  }, [hasRole, isAdmin]);

  const isUser = useCallback(() => {
    return hasRole('user');
  }, [hasRole]);

  // Permission-based access control
  const canManageUsers = useCallback(() => {
    return hasPermission('users.manage') || hasPermission('users.create');
  }, [hasPermission]);

  const canManageSystem = useCallback(() => {
    return hasPermission('system.manage');
  }, [hasPermission]);

  const canViewAnalytics = useCallback(() => {
    return hasPermission('analytics.read');
  }, [hasPermission]);

  const canViewAdminLogs = useCallback(() => {
    return hasPermission('audit.read');
  }, [hasPermission]);

  const canManageRoles = useCallback(() => {
    return hasPermission('roles.manage');
  }, [hasPermission]);

  const canCreateTransactions = useCallback(() => {
    return hasPermission('transactions.create');
  }, [hasPermission]);

  const canUpdateTransactions = useCallback(() => {
    return hasPermission('transactions.update');
  }, [hasPermission]);

  const canDeleteTransactions = useCallback(() => {
    return hasPermission('transactions.delete');
  }, [hasPermission]);

  return {
    hasPermission,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isManager,
    isUser,
    canManageUsers,
    canManageSystem,
    canViewAnalytics,
    canViewAdminLogs,
    canManageRoles,
    canCreateTransactions,
    canUpdateTransactions,
    canDeleteTransactions,
  };
}
