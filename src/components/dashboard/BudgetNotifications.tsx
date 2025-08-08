'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  X,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBudgets } from '@/hooks/useBudgets';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { BudgetAlert } from '@/lib/services/budgets';

interface BudgetNotificationsProps {
  className?: string;
  showAll?: boolean;
  limit?: number;
}

const priorityIcons = {
  high: AlertTriangle,
  medium: TrendingUp,
  low: Target,
};

const priorityColors = {
  high: {
    icon: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
  },
  medium: {
    icon: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
  },
  low: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
  }
};

export function BudgetNotifications({ 
  className = '', 
  showAll = false, 
  limit = 3 
}: BudgetNotificationsProps) {
  const { profile } = useAuth();
  const { budgetAlerts, alertsLoading } = useBudgets();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const currency = profile?.currency || 'BDT';

  const visibleAlerts = budgetAlerts
    ?.filter(alert => !dismissedAlerts.includes(alert.id))
    .slice(0, showAll ? undefined : limit) || [];

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getAlertTypeInfo = (alert: BudgetAlert) => {
    switch (alert.type) {
      case 'exceeded':
        return {
          title: 'Budget Exceeded',
          description: 'You have exceeded your budget limit',
          actionText: 'Review Spending'
        };
      case 'warning':
        return {
          title: 'Budget Warning',
          description: 'You are approaching your budget limit',
          actionText: 'Monitor Closely'
        };
      case 'approaching':
        return {
          title: 'Budget Alert',
          description: 'Keep an eye on your spending',
          actionText: 'Track Progress'
        };
      default:
        return {
          title: 'Budget Alert',
          description: 'Budget notification',
          actionText: 'View Details'
        };
    }
  };

  if (alertsLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!visibleAlerts.length) {
    return (
      <Card className={`${className} border-green-200 bg-green-50/50 dark:bg-green-900/10`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                All budgets are on track!
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">
                No budget alerts at this time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => {
          const colors = priorityColors[alert.priority];
          const PriorityIcon = priorityIcons[alert.priority];
          const alertTypeInfo = getAlertTypeInfo(alert);

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
            >
              <Card className={`${colors.border} ${colors.bg} overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${colors.badge}`}>
                        <PriorityIcon className={`w-4 h-4 ${colors.icon}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm text-foreground">
                              {alert.name}
                            </h4>
                            <Badge className={colors.badge}>
                              {alertTypeInfo.title}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {alert.message}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatCurrency(alert.spent, currency)} / {formatCurrency(alert.amount, currency)}
                            </span>
                            <span className={`font-semibold ${
                              alert.percentage >= 100 ? 'text-red-600' : 
                              alert.percentage >= 80 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {formatPercentage(alert.percentage / 100)}
                            </span>
                          </div>
                          
                          <Progress 
                            value={Math.min(alert.percentage, 100)} 
                            className="h-1.5"
                          />
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>
                              {alert.remaining >= 0 
                                ? `${formatCurrency(alert.remaining, currency)} remaining`
                                : `${formatCurrency(Math.abs(alert.remaining), currency)} over`
                              }
                            </span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{alert.daysRemaining} days left</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-7"
                            >
                              {alertTypeInfo.actionText}
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-white/50 dark:hover:bg-black/20"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {!showAll && budgetAlerts && budgetAlerts.length > limit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            +{budgetAlerts.length - limit} more budget alerts
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default BudgetNotifications;