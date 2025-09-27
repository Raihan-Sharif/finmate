'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Users,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface DataManagementToolsProps {
  onDataCreated?: () => void;
}

export function DataManagementTools({ onDataCreated }: DataManagementToolsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentCount, setPaymentCount] = useState(10);
  const [subscriptionCount, setSubscriptionCount] = useState(5);

  const handleAction = async (action: string, data?: any) => {
    try {
      setLoading(action);

      const response = await fetch('/api/admin/subscription/seed-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Operation failed');
      }

      toast.success(result.message);

      // Call callback to refresh data
      if (onDataCreated) {
        onDataCreated();
      }

      return result;
    } catch (error: any) {
      console.error(`Error with action ${action}:`, error);
      toast.error(error.message || 'Operation failed');
      throw error;
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Data Management Tools</CardTitle>
              <CardDescription>
                Create sample data and manage subscription system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Seed Data Section */}
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Initialize System Data
          </CardTitle>
          <CardDescription>
            Set up basic subscription plans and payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Run this first to create subscription plans and payment methods.
              This is required before creating sample payments.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => handleAction('run_seed_data')}
            disabled={loading === 'run_seed_data'}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
          >
            {loading === 'run_seed_data' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating System Data...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create System Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sample Payments Section */}
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Sample Payment Data
          </CardTitle>
          <CardDescription>
            Generate sample subscription payment requests for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-count">Number of Payments</Label>
              <Input
                id="payment-count"
                type="number"
                min="1"
                max="50"
                value={paymentCount}
                onChange={(e) => setPaymentCount(parseInt(e.target.value) || 10)}
                placeholder="10"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => handleAction('create_sample_payments', { count: paymentCount })}
                disabled={loading === 'create_sample_payments'}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                {loading === 'create_sample_payments' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payments
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will create sample payment requests with various statuses
              (pending, submitted, verified, approved, rejected).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sample Subscriptions Section */}
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sample Subscription Data
          </CardTitle>
          <CardDescription>
            Generate active user subscriptions from approved payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subscription-count">Number of Subscriptions</Label>
              <Input
                id="subscription-count"
                type="number"
                min="1"
                max="20"
                value={subscriptionCount}
                onChange={(e) => setSubscriptionCount(parseInt(e.target.value) || 5)}
                placeholder="5"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => handleAction('create_sample_subscriptions', { count: subscriptionCount })}
                disabled={loading === 'create_sample_subscriptions'}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                {loading === 'create_sample_subscriptions' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Create Subscriptions
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This creates active subscriptions for users with approved payments.
              Only users without existing subscriptions will get new ones.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cleanup Section */}
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Cleanup Test Data
          </CardTitle>
          <CardDescription>
            Remove all sample subscription and payment data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              <strong>Warning:</strong> This will permanently delete all subscription payments
              and user subscriptions. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => handleAction('cleanup_test_data')}
            disabled={loading === 'cleanup_test_data'}
            variant="destructive"
            className="w-full"
          >
            {loading === 'cleanup_test_data' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cleaning Up...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup All Test Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">1</Badge>
              <span>Create system data (plans & payment methods)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">2</Badge>
              <span>Generate sample payment requests</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">3</Badge>
              <span>Create active subscriptions from approved payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">4</Badge>
              <span>Test the payment and subscription management workflows</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}