'use client';

import { useAuth, usePermissions } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, BarChart3, Shield, Activity, UserCheck, UserX, TrendingUp, Clock, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminService from '@/lib/services/admin';
import { Profile, ProfileWithRole } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CronJobMonitor from '@/components/admin/CronJobMonitor';
import { SubscriptionPaymentsAdmin } from '@/components/admin/SubscriptionPaymentsAdmin';

interface SystemStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentRegistrations: number;
  totalTransactions: number;
  activeUsers: number;
  inactiveUsers: number;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const { isAdmin, canManageUsers, canManageSystem, canViewAnalytics } = usePermissions();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin() && canViewAnalytics()) {
      loadDashboardData();
    }
  }, [isAdmin, canViewAnalytics]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        AdminService.getSystemStats(),
        AdminService.getAllUsers(1, 10) // Get first 10 users for preview
      ]);
      
      setStats(statsData);
      setUsers(usersData.users);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      await AdminService.promoteToAdmin(userId);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  const handleDemoteUser = async (userId: string) => {
    try {
      await AdminService.demoteFromAdmin(userId);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error demoting user:', error);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You don't have admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your FinMate application</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-1" />
          Administrator
        </Badge>
      </div>

      {/* System Stats */}
      {canViewAnalytics() && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentRegistrations} new in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.regularUsers} regular users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" disabled={!canManageUsers()}>
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="payments" disabled={!canManageSystem()}>
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="system" disabled={!canManageSystem()}>
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="cron" disabled={!canManageSystem()}>
            <Clock className="w-4 h-4 mr-2" />
            Cron Jobs
          </TabsTrigger>
          <TabsTrigger value="analytics" disabled={!canViewAnalytics()}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <SubscriptionPaymentsAdmin />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                        <p className="text-sm text-gray-500">{user.user_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role?.name === 'admin' || user.role?.name === 'super_admin' ? 'default' : 'secondary'}>
                        {user.role?.display_name || user.role?.name || 'user'}
                      </Badge>
                      {canManageUsers() && user.user_id !== profile?.user_id && (
                        <div className="flex space-x-1">
                          {user.role?.name !== 'admin' && user.role?.name !== 'super_admin' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromoteUser(user.user_id)}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Promote
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDemoteUser(user.user_id)}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Demote
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage application settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">System settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cron" className="space-y-4">
          <CronJobMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Analytics</CardTitle>
              <CardDescription>
                View application usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}