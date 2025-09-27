'use client';

/**
 * 🎯 SUBSCRIPTION MANAGEMENT DASHBOARD
 * Modern, comprehensive admin interface for subscription management
 * Features: Analytics, Payment Processing, User Management, Search & Filters
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useSubscriptionPayments,
  useUpdatePaymentStatus,
  useSubscriptionAnalytics,
  useManageUserSubscription,
  useUserSubscriptions,
  useSubscriptionPlans,
  useSubscriptionSearch,
  useBulkPaymentActions,
} from '@/hooks/useSubscriptionAdmin';
import {
  formatCurrency,
  getStatusColor,
  getPaymentStatusOptions,
  calculateDiscountPercentage,
} from '@/lib/services/subscription-admin';
import { DataManagementTools } from '@/components/admin/DataManagementTools';
import { EmptyStateCard } from '@/components/admin/EmptyStateCard';

// =====================================================
// 🎯 ANALYTICS DASHBOARD COMPONENT
// =====================================================

const AnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useSubscriptionAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load analytics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.total_revenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'All-time revenue',
    },
    {
      title: 'Active Subscriptions',
      value: analytics.active_subscriptions.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Currently active',
    },
    {
      title: 'Pending Payments',
      value: analytics.pending_payments.toLocaleString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Awaiting approval',
    },
    {
      title: 'Monthly Growth',
      value: `${analytics.monthly_growth.growth_percentage > 0 ? '+' : ''}${analytics.monthly_growth.growth_percentage}%`,
      icon: TrendingUp,
      color: analytics.monthly_growth.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: analytics.monthly_growth.growth_percentage >= 0 ? 'bg-green-100' : 'bg-red-100',
      description: 'vs last month',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 -z-10" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Plan Statistics */}
      {analytics.plan_stats && analytics.plan_stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Plan Performance
            </CardTitle>
            <CardDescription>
              Revenue and subscriber metrics by plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.plan_stats.map((plan, index) => (
                <motion.div
                  key={plan.plan_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white"
                >
                  <div>
                    <h4 className="font-medium">{plan.plan_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.subscriber_count} subscribers
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(plan.total_revenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {formatCurrency(plan.avg_revenue_per_user)}/user
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// =====================================================
// 🎯 PAYMENT STATUS UPDATE MODAL
// =====================================================

interface PaymentStatusModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(payment?.status || 'pending');
  const [adminNotes, setAdminNotes] = useState(payment?.admin_notes || '');
  const [rejectionReason, setRejectionReason] = useState(payment?.rejection_reason || '');

  const updatePaymentStatus = useUpdatePaymentStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updatePaymentStatus.mutateAsync({
        paymentId: payment.id,
        status: selectedStatus,
        adminNotes: adminNotes.trim() || undefined,
        rejectionReason: selectedStatus === 'rejected' ? rejectionReason.trim() : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const statusOptions = getPaymentStatusOptions().filter(option => option.value !== 'all');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Update Payment Status
          </DialogTitle>
          <DialogDescription>
            Update the status for payment ID: {payment?.transaction_id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium">{payment?.user_full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{payment?.plan_display_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(payment?.final_amount, payment?.currency)}
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getStatusColor(option.value)}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this payment..."
              className="min-h-[80px]"
            />
          </div>

          {/* Rejection Reason (shown only for rejected status) */}
          {selectedStatus === 'rejected' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payment was rejected..."
                required
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updatePaymentStatus.isPending ||
                (selectedStatus === 'rejected' && !rejectionReason.trim())
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {updatePaymentStatus.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// 🎯 PAYMENTS TABLE COMPONENT
// =====================================================

const PaymentsTable: React.FC = () => {
  const { searchTerm, filters, updateFilter } = useSubscriptionSearch();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const {
    payments,
    total,
    isLoading,
    error,
    refetch,
    page,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    totalPages,
  } = useSubscriptionPayments({
    status: filters.status,
    search: searchTerm,
    limit: 20,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700">Failed to Load Payments</h3>
            <p className="text-red-600 mb-4">There was an error loading the payments data.</p>
            <Button onClick={() => refetch()} variant="outline" className="border-red-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleStatusUpdate = (payment: any) => {
    setSelectedPayment(payment);
    setIsStatusModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'verified':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Subscription Payments
              </CardTitle>
              <CardDescription>
                Manage and track subscription payment statuses
                {total > 0 && ` • ${total.toLocaleString()} total payments`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-gray-300"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {payments.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No Payments Found"
              description={
                searchTerm || filters.status !== 'all'
                  ? 'Try adjusting your search or filters to find payments.'
                  : 'No subscription payments have been submitted yet. Use the Data Tools tab to create sample payment requests for testing.'
              }
              {...(!(searchTerm || filters.status !== 'all') && {
                actionLabel: 'Create Sample Data',
                onAction: () => {
                  const dataTab = document.querySelector('[value="data"]') as HTMLElement;
                  dataTab?.click();
                }
              })}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment, index) => (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.user_full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.plan_display_name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {payment.billing_cycle}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(payment.final_amount, payment.currency)}
                            </div>
                            {payment.discount_amount > 0 && (
                              <div className="text-xs text-orange-600">
                                -{calculateDiscountPercentage(payment.base_amount, payment.discount_amount)}% discount
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(payment.status)}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                          {payment.days_since_submission && (
                            <div className="text-xs text-muted-foreground">
                              {payment.days_since_submission} days ago
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusUpdate(payment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousPage}
                      disabled={!hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!hasNextPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Update Modal */}
      <PaymentStatusModal
        payment={selectedPayment}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </>
  );
};

// =====================================================
// 🎯 SUBSCRIPTION MANAGEMENT MODAL
// =====================================================

interface SubscriptionManagementModalProps {
  subscription: any;
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  subscription,
  isOpen,
  onClose,
}) => {
  const [selectedAction, setSelectedAction] = useState<'activate' | 'suspend' | 'cancel' | 'extend'>('activate');
  const [extendMonths, setExtendMonths] = useState<number>(1);

  const manageSubscription = useManageUserSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        subscriptionId: subscription.id,
        action: selectedAction,
      };

      if (selectedAction === 'extend') {
        payload.extendMonths = extendMonths;
      }

      await manageSubscription.mutateAsync(payload);
      onClose();
    } catch (error) {
      console.error('Error managing subscription:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'activate':
        return 'text-green-600';
      case 'suspend':
        return 'text-yellow-600';
      case 'cancel':
        return 'text-red-600';
      case 'extend':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription>
            Update subscription for: {subscription?.user_data?.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{subscription?.plan_data?.display_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary" className={getStatusColor(subscription?.status)}>
                {subscription?.status?.charAt(0).toUpperCase() + subscription?.status?.slice(1)}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-medium">
                {subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {subscription?.days_remaining !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Remaining:</span>
                <span className={`font-medium ${subscription.days_remaining > 7 ? 'text-green-600' : 'text-orange-600'}`}>
                  {subscription.days_remaining}
                </span>
              </div>
            )}
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Select value={selectedAction} onValueChange={(value: any) => setSelectedAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${getActionColor('activate')}`} />
                    Activate
                  </div>
                </SelectItem>
                <SelectItem value="suspend">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${getActionColor('suspend')}`} />
                    Suspend
                  </div>
                </SelectItem>
                <SelectItem value="cancel">
                  <div className="flex items-center gap-2">
                    <XCircle className={`h-4 w-4 ${getActionColor('cancel')}`} />
                    Cancel
                  </div>
                </SelectItem>
                <SelectItem value="extend">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${getActionColor('extend')}`} />
                    Extend
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Extend Months (shown only for extend action) */}
          {selectedAction === 'extend' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Extend by Months</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={extendMonths}
                onChange={(e) => setExtendMonths(parseInt(e.target.value) || 1)}
                placeholder="Number of months"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={manageSubscription.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {manageSubscription.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Subscription`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// 🎯 USERS TABLE COMPONENT
// =====================================================

const UsersTable: React.FC = () => {
  const { searchTerm, filters, updateFilter } = useSubscriptionSearch();
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  const {
    subscriptions,
    total,
    isLoading,
    error,
    refetch,
    page,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    totalPages,
  } = useUserSubscriptions({
    status: filters.status,
    search: searchTerm,
    limit: 20,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700">Failed to Load Subscriptions</h3>
            <p className="text-red-600 mb-4">There was an error loading the subscriptions data.</p>
            <Button onClick={() => refetch()} variant="outline" className="border-red-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleManageSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsManagementModalOpen(true);
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubscriptionStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Subscriptions
              </CardTitle>
              <CardDescription>
                Manage user subscriptions and access controls
                {total > 0 && ` • ${total.toLocaleString()} total subscriptions`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-gray-300"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {subscriptions.length === 0 ? (
            <EmptyStateCard
              icon={Users}
              title="No Subscriptions Found"
              description={
                searchTerm || filters.status !== 'all'
                  ? 'Try adjusting your search or filters to find subscriptions.'
                  : 'No user subscriptions have been created yet. Use the Data Tools tab to create sample data for testing.'
              }
              {...(!(searchTerm || filters.status !== 'all') && {
                actionLabel: 'Go to Data Tools',
                onAction: () => {
                  const dataTab = document.querySelector('[value="data"]') as HTMLElement;
                  dataTab?.click();
                }
              })}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription, index) => (
                      <motion.tr
                        key={subscription.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.user_data?.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {subscription.user_data?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.plan_data?.display_name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {subscription.billing_cycle || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getSubscriptionStatusColor(subscription.status)} flex items-center gap-1 w-fit`}>
                            {getSubscriptionStatusIcon(subscription.status)}
                            {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {subscription.days_remaining !== undefined && (
                              <div className={`font-medium ${subscription.days_remaining > 7 ? 'text-green-600' : subscription.days_remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                {subscription.days_remaining > 0 ? `${subscription.days_remaining} days left` : 'Expired'}
                              </div>
                            )}
                            {subscription.is_expired && (
                              <div className="text-xs text-red-500">
                                Expired
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(subscription.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleManageSubscription(subscription)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Manage Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousPage}
                      disabled={!hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!hasNextPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        subscription={selectedSubscription}
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />
    </>
  );
};

// =====================================================
// 🎯 MAIN SUBSCRIPTION MANAGEMENT COMPONENT
// =====================================================

const SubscriptionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { searchTerm, setSearchTerm, filters, updateFilter, clearFilters, hasActiveFilters } = useSubscriptionSearch();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Subscription Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive subscription and payment management dashboard
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by transaction ID, user name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {getPaymentStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="shrink-0">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="data">Data Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentsTable />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersTable />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <DataManagementTools
            onDataCreated={() => {
              // Refresh all data when new data is created
              window.location.reload();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManagement;