'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Pause,
  Play,
  Plus,
  Trash2,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RecurringTransactionService } from '@/lib/services/recurring-transactions';
import toast from 'react-hot-toast';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function RecurringTransactionsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currency = profile?.currency || 'BDT';

  // Load recurring transactions
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const [recurringData, statsData] = await Promise.all([
          RecurringTransactionService.getRecurringTransactions(user.id),
          RecurringTransactionService.getRecurringTransactionStats(user.id)
        ]);
        
        setRecurringTransactions(recurringData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading recurring transactions:', error);
        toast.error('Failed to load recurring transactions');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!user) return;
    
    try {
      await RecurringTransactionService.toggleRecurringTransaction(id, user.id, isActive);
      
      // Update local state
      setRecurringTransactions(prev => 
        prev.map(rt => rt.id === id ? { ...rt, is_active: isActive } : rt)
      );
      
      toast.success(isActive ? 'Recurring transaction activated' : 'Recurring transaction paused');
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
      toast.error('Failed to update recurring transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this recurring transaction?')) return;
    
    try {
      await RecurringTransactionService.deleteRecurringTransaction(id, user.id);
      
      // Update local state
      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
      
      toast.success('Recurring transaction deleted');
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast.error('Failed to delete recurring transaction');
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      weekly: 'bg-green-100 text-green-800',
      biweekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800',
      quarterly: 'bg-orange-100 text-orange-800',
      yearly: 'bg-red-100 text-red-800'
    };
    
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getFrequencyText = (frequency: string) => {
    const texts = {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    };
    
    return texts[frequency as keyof typeof texts] || frequency;
  };

  const formatNextExecution = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `In ${diffDays} days`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Transactions
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Clock className="w-8 h-8 mr-3 text-blue-600" />
              Recurring Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your automatic recurring transactions
            </p>
          </div>
        </div>
        
        <Link href="/dashboard/transactions/new?recurring=true">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring
          </Button>
        </Link>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Play className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paused</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
                </div>
                <Pause className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Impact</p>
                  <p className={`text-2xl font-bold ${stats.totalMonthlyAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalMonthlyAmount, currency)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recurring Transactions List */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {recurringTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recurring Transactions</h3>
              <p className="text-muted-foreground mb-4">
                Set up automatic transactions to save time on repeated income and expenses.
              </p>
              <Link href="/dashboard/transactions/new?recurring=true">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Recurring Transaction
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          recurringTransactions.map((recurring, index) => (
            <motion.div
              key={recurring.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${!recurring.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        recurring.transaction_template?.type === 'income' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <DollarSign className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {recurring.transaction_template?.description || 'Untitled Transaction'}
                          </h3>
                          <Badge 
                            variant={recurring.transaction_template?.type === 'income' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {recurring.transaction_template?.type}
                          </Badge>
                          <Badge 
                            className={`text-xs ${getFrequencyBadge(recurring.frequency)}`}
                          >
                            {getFrequencyText(recurring.frequency)}
                          </Badge>
                          {!recurring.is_active && (
                            <Badge variant="outline" className="text-xs">
                              Paused
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          Amount: {formatCurrency(recurring.transaction_template?.amount || 0, currency)}
                          {recurring.next_execution && (
                            <span className="ml-3">
                              Next: {formatNextExecution(recurring.next_execution)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={recurring.is_active}
                        onCheckedChange={(checked) => handleToggleActive(recurring.id, checked)}
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Find the latest transaction from this recurring pattern
                          // For now, we'll redirect to the recurring edit page that shows info
                          router.push(`/dashboard/transactions/recurring/${recurring.id}/edit`);
                        }}
                        title="Edit recurring transaction settings"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(recurring.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}