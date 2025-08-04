"use client";

import { auth, db, supabase, TABLES } from "@/lib/supabase/client";
import { Profile } from "@/types";
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
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await db.findOne<Profile>(TABLES.PROFILES, userId);
      setProfile(profileData);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      // If profile doesn't exist, it might be a new user
      if (error?.code === "PGRST116") {
        console.log("Profile not found, might be a new user");
      }
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

        // Redirect to verification page or dashboard
        router.push("/auth/verify-email");
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
      await auth.resetPassword(email);
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
      await auth.updatePassword(password);
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast.error(error.message || "Failed to update password");
      throw error;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) throw new Error("No user logged in");

      try {
        const updatedProfile = await db.update<Profile>(
          TABLES.PROFILES,
          user.id,
          updates
        );

        setProfile(updatedProfile);
        toast.success("Profile updated successfully");

        return updatedProfile;
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

// Hook for checking specific permissions
export function usePermissions() {
  const { user, profile } = useAuth();

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user || !profile) return false;

      // Add your permission logic here
      // For now, all authenticated users have all permissions
      return true;
    },
    [user, profile]
  );

  const isAdmin = useCallback(() => {
    if (!user || !profile) return false;
    // Add admin check logic here
    return false;
  }, [user, profile]);

  return {
    hasPermission,
    isAdmin,
  };
}
