'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RecurringTransactionService } from '@/lib/services/recurring-transactions';
import toast from 'react-hot-toast';

export default function EditRecurringTransactionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const recurringId = params.id as string;
  
  const [recurring, setRecurring] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load recurring transaction data
  useEffect(() => {
    const loadRecurring = async () => {
      if (!user?.id || !recurringId) return;
      
      try {
        setIsLoading(true);
        const recurringData = await RecurringTransactionService.getRecurringTransactionById(
          recurringId, 
          user.id
        );
        
        if (!recurringData) {
          toast.error('Recurring transaction not found');
          router.push('/dashboard/transactions/recurring');
          return;
        }
        
        setRecurring(recurringData);
      } catch (error) {
        console.error('Error loading recurring transaction:', error);
        toast.error('Failed to load recurring transaction');
        router.push('/dashboard/transactions/recurring');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecurring();
  }, [user?.id, recurringId, router]);

  // Auto-redirect after 3 seconds
  useEffect(() => {
    if (recurring && !isLoading) {
      const timer = setTimeout(() => {
        router.push('/dashboard/transactions/recurring');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [recurring, isLoading, router]);

  const handleRedirectNow = () => {
    router.push('/dashboard/transactions/recurring');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/transactions/recurring">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recurring
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Edit className="w-8 h-8 mr-3 text-blue-600" />
              Edit Recurring Transaction
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your recurring transaction settings
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-8 text-center">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Recurring Transaction Editor</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                For now, recurring transaction editing is managed through the main recurring transactions page. 
                You'll be redirected there shortly.
              </p>
            </div>

            {recurring && (
              <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
                <h3 className="font-medium mb-2">Current Transaction:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Description:</strong> {recurring.transaction_template?.description}</p>
                  <p><strong>Amount:</strong> {recurring.transaction_template?.amount} {recurring.transaction_template?.currency}</p>
                  <p><strong>Frequency:</strong> {recurring.frequency}</p>
                  <p><strong>Next:</strong> {recurring.next_execution}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRedirectNow} className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Go to Recurring Transactions
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              
              <Link href="/dashboard/transactions/recurring">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </Link>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Redirecting automatically in 3 seconds...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Future Enhancement Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-dashed border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-blue-900">Future Enhancement</h3>
                <p className="text-sm text-blue-700">
                  A dedicated recurring transaction editor is planned for future updates. 
                  For now, you can manage all recurring transactions from the main recurring transactions page, 
                  where you can pause, resume, or delete recurring schedules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}