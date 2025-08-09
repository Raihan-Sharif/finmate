'use client';

import { motion } from 'framer-motion';
import { InvestmentPortfolio, RISK_LEVELS } from '@/types/investments';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Target,
  PieChart,
  Calendar,
  Briefcase
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useUserCurrency } from '@/lib/currency';
import { useTheme } from 'next-themes';

interface PortfolioCardProps {
  portfolio: InvestmentPortfolio;
  onView?: (portfolio: InvestmentPortfolio) => void;
  onEdit?: (portfolio: InvestmentPortfolio) => void;
  onDelete?: (portfolio: InvestmentPortfolio) => void;
  className?: string;
}

export function PortfolioCard({
  portfolio,
  onView,
  onEdit,
  onDelete,
  className
}: PortfolioCardProps) {
  const userCurrency = useUserCurrency();
  const { theme } = useTheme();
  const displayCurrency = portfolio.currency || userCurrency;
  const isPositive = (portfolio.total_gain_loss || 0) >= 0;
  const returnPercentage = portfolio.total_return_percentage || 0;
  const riskLevel = RISK_LEVELS[portfolio.risk_level];
  
  // Calculate progress towards target
  const progressToTarget = portfolio.target_amount && portfolio.current_value
    ? Math.min((portfolio.current_value / portfolio.target_amount) * 100, 100)
    : 0;

  // Days until target (if target_date is set)
  const daysUntilTarget = portfolio.target_date 
    ? Math.ceil((new Date(portfolio.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -6 }}
      className={cn("group", className)}
    >
      <Card className={cn(
        "relative h-full border-0 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden",
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-900/90'
          : 'bg-gradient-to-br from-white via-white/95 to-white/90'
      )}>
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${portfolio.color}15, ${portfolio.color}05, transparent)`,
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
        
        {/* Header with portfolio info */}
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden",
                  `bg-gradient-to-br from-${portfolio.color} to-${portfolio.color}`
                )}
                style={{ 
                  background: `linear-gradient(135deg, ${portfolio.color}f0, ${portfolio.color}80)` 
                }}
              >
                <Briefcase className="h-6 w-6 text-white drop-shadow-sm" />
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: [-100, 100],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
              
              <div>
                <h3 className={cn(
                  "font-bold text-xl group-hover:text-blue-600 transition-colors duration-300",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {portfolio.name}
                </h3>
                {portfolio.description && (
                  <p className={cn(
                    "text-sm mt-1 max-w-xs truncate",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  )}>
                    {portfolio.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-all duration-300",
                    theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-white/50'
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(
                "backdrop-blur-md border",
                theme === 'dark'
                  ? 'bg-gray-800/95 border-gray-700/50'
                  : 'bg-white/95 border-white/20'
              )}>
                {onView && (
                  <DropdownMenuItem onClick={() => onView(portfolio)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Portfolio
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(portfolio)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(portfolio)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Portfolio Values */}
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Current Value
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {formatCurrency(portfolio.current_value || 0, displayCurrency)}
              </p>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Total Invested
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {formatCurrency(portfolio.total_invested || 0, displayCurrency)}
              </p>
            </motion.div>
          </div>

          {/* Performance */}
          <motion.div 
            className="space-y-4"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-sm font-medium",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>Portfolio Performance</span>
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className={cn(
                  "px-3 py-1.5 rounded-full font-semibold transition-all duration-300 shadow-lg",
                  isPositive 
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30 hover:scale-105" 
                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-red-500/30 hover:scale-105"
                )}
              >
                <div className="flex items-center space-x-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{returnPercentage.toFixed(2)}%</span>
                </div>
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xl font-bold transition-colors duration-300",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{formatCurrency(portfolio.total_gain_loss || 0, displayCurrency)}
              </span>
              <div className={cn(
                "flex items-center space-x-2 text-sm",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                <PieChart className="h-4 w-4" />
                <span>{portfolio.investment_count || 0} investments</span>
              </div>
            </div>
          </motion.div>

          {/* Target Progress (if target is set) */}
          {portfolio.target_amount && (
            <motion.div 
              className={cn(
                "space-y-3 p-4 rounded-xl border",
                theme === 'dark'
                  ? 'bg-gray-700/30 border-gray-600/30'
                  : 'bg-gray-50/50 border-gray-100/50'
              )}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>Target Progress</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {progressToTarget.toFixed(1)}%
                </span>
              </div>
              
              <Progress 
                value={progressToTarget} 
                className={cn(
                  "h-2",
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                )}
                style={{ 
                  '--progress-background': `linear-gradient(to right, ${portfolio.color}, ${portfolio.color}80)` 
                } as any}
              />
              
              <div className={cn(
                "flex items-center justify-between text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                <span>Target: {formatCurrency(portfolio.target_amount, displayCurrency)}</span>
                {daysUntilTarget && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{daysUntilTarget > 0 ? `${daysUntilTarget} days left` : 'Target reached!'}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Risk Level and Footer */}
          <div className={cn(
            "flex items-center justify-between pt-4 border-t",
            theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
          )}>
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1 rounded-full font-medium border-2 transition-all duration-300 hover:scale-105",
                `border-${riskLevel.color.slice(1)} text-${riskLevel.color.slice(1)}`
              )}
              style={{ 
                borderColor: riskLevel.color,
                color: riskLevel.color 
              }}
            >
              {riskLevel.label}
            </Badge>
            
            <span className={cn(
              "text-xs",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {displayCurrency} • Created {new Date(portfolio.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-xl" />

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `0 0 30px ${portfolio.color}30`,
            filter: 'blur(2px)',
          }}
          animate={{
            scale: [1, 1.02, 1],
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
}