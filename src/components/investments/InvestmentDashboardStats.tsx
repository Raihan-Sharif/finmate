'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  Zap,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useUserCurrency } from '@/lib/currency';
import { useTheme } from 'next-themes';
import type { InvestmentDashboardStats } from '@/types/investments';

interface InvestmentDashboardStatsProps {
  stats: InvestmentDashboardStats;
  currency?: string;
  isLoading?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  changePercentage, 
  icon: Icon, 
  color, 
  delay = 0,
  isPositive = true,
  description,
  theme
}: {
  title: string;
  value: string;
  change?: string;
  changePercentage?: number;
  icon: any;
  color: string;
  delay?: number;
  isPositive?: boolean;
  description?: string;
  theme?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ y: -4 }}
  >
    <Card className={cn(
      "relative border-0 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group",
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/50' 
        : 'bg-gradient-to-br from-white/90 to-white/50'
    )}>
      {/* Gradient background */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${color}, ${color}CC)` 
              }}
            >
              <Icon className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h3 className={cn(
                "text-sm font-medium uppercase tracking-wide",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {title}
              </h3>
              {description && (
                <p className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {changePercentage !== undefined && (
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={cn(
                "rounded-full font-semibold transition-all duration-300 hover:scale-105",
                isPositive 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                  : "bg-gradient-to-r from-red-500 to-rose-600"
              )}
            >
              <div className="flex items-center space-x-1">
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(changePercentage).toFixed(1)}%</span>
              </div>
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <motion.p 
            className={cn(
              "text-3xl font-bold",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.p>
          
          {change && (
            <p className={cn(
              "text-sm font-medium flex items-center space-x-1",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{change}</span>
            </p>
          )}
        </div>
      </CardContent>

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(45deg, ${color}20, transparent)`,
          filter: 'blur(1px)',
        }}
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </Card>
  </motion.div>
);

export function InvestmentDashboardStats({ 
  stats, 
  currency, 
  isLoading 
}: InvestmentDashboardStatsProps) {
  const userCurrency = useUserCurrency();
  const { theme } = useTheme();
  const displayCurrency = currency || userCurrency;
  const totalReturnIsPositive = stats.total_return_percentage >= 0;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-32 animate-pulse rounded-lg",
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            )} 
          />
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Portfolio",
      value: formatCurrency(stats.total_current_value, displayCurrency),
      change: `${totalReturnIsPositive ? '+' : ''}${formatCurrency(stats.total_gain_loss, displayCurrency)}`,
      changePercentage: stats.total_return_percentage,
      icon: DollarSign,
      color: "#3B82F6",
      isPositive: totalReturnIsPositive,
      description: `${stats.total_investments} investments`
    },
    {
      title: "Total Invested",
      value: formatCurrency(stats.total_invested, displayCurrency),
      icon: Briefcase,
      color: "#8B5CF6",
      description: `${stats.total_portfolios} portfolios`
    },
    {
      title: "Active SIPs",
      value: stats.active_sips.toString(),
      change: formatCurrency(stats.monthly_sip_amount, displayCurrency),
      icon: Zap,
      color: "#10B981",
      description: "Monthly SIP amount"
    },
    {
      title: "Dividend Income",
      value: formatCurrency(stats.dividend_income, displayCurrency),
      icon: Activity,
      color: "#F59E0B",
      description: "Total earned"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            delay={index * 0.1}
            theme={theme || 'light'}
          />
        ))}
      </div>

      {/* Performance Highlights */}
      {(stats.top_performing_investment || stats.worst_performing_investment) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Top Performer */}
          {stats.top_performing_investment && (
            <Card className={cn(
              "border-0 shadow-lg hover:shadow-xl transition-all duration-300",
              theme === 'dark'
                ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/30'
                : 'bg-gradient-to-br from-green-50 to-emerald-50'
            )}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-sm font-medium uppercase tracking-wide",
                      theme === 'dark' ? 'text-green-300' : 'text-green-700'
                    )}>
                      Top Performer
                    </h3>
                    <p className={cn(
                      "text-lg font-bold",
                      theme === 'dark' ? 'text-green-100' : 'text-green-900'
                    )}>
                      {stats.top_performing_investment.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-2xl font-bold",
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  )}>
                    +{stats.top_performing_investment.gain_loss_percentage.toFixed(2)}%
                  </span>
                  <span className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-green-300' : 'text-green-700'
                  )}>
                    {formatCurrency(stats.top_performing_investment.current_value, displayCurrency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worst Performer */}
          {stats.worst_performing_investment && (
            <Card className={cn(
              "border-0 shadow-lg hover:shadow-xl transition-all duration-300",
              theme === 'dark'
                ? 'bg-gradient-to-br from-red-900/50 to-rose-900/30'
                : 'bg-gradient-to-br from-red-50 to-rose-50'
            )}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-sm font-medium uppercase tracking-wide",
                      theme === 'dark' ? 'text-red-300' : 'text-red-700'
                    )}>
                      Needs Attention
                    </h3>
                    <p className={cn(
                      "text-lg font-bold",
                      theme === 'dark' ? 'text-red-100' : 'text-red-900'
                    )}>
                      {stats.worst_performing_investment.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-2xl font-bold",
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  )}>
                    {stats.worst_performing_investment.gain_loss_percentage.toFixed(2)}%
                  </span>
                  <span className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-red-300' : 'text-red-700'
                  )}>
                    {formatCurrency(stats.worst_performing_investment.current_value, displayCurrency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}