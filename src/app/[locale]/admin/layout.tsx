"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('admin');
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
      return;
    }

    if (user) {
      checkAdminPermissions();
    }
  }, [user, loading, router]);

  const checkAdminPermissions = async () => {
    try {
      setPermissionLoading(true);
      const supabase = createClient();

      const { data: profile, error } = await supabase
        .rpc('get_user_profile', { p_user_id: user?.id });

      console.log('Admin layout permission check:', { profile, error });

      if (error) {
        console.error('Error checking admin permissions:', error);
        setHasAdminAccess(false);
        return;
      }

      const userRole = profile?.[0]?.role_name;
      const isAdmin = userRole && ['admin', 'super_admin'].includes(userRole);
      
      console.log('User role check:', { userRole, isAdmin });
      
      setHasAdminAccess(isAdmin);
      
      if (!isAdmin) {
        // Redirect non-admin users back to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setHasAdminAccess(false);
    } finally {
      setPermissionLoading(false);
    }
  };

  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">
            {loading ? 'Loading...' : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (hasAdminAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-red-500">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Access Denied
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                You don't have permission to access the admin panel. Please contact an administrator if you believe this is an error.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}