'use client';

import { motion } from 'framer-motion';
import { Investment, INVESTMENT_TYPES } from '@/types/investments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DollarSign,
  PieChart,
  Bitcoin,
  FileText,
  Lock,
  Repeat,
  PiggyBank,
  Award,
  Calendar,
  Crown,
  Home,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useUserCurrency } from '@/lib/currency';
import { useTheme } from 'next-themes';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface InvestmentCardProps {
  investment: Investment;
  onView?: (investment: Investment) => void;
  onEdit?: (investment: Investment) => void;
  onDelete?: (investment: Investment) => void;
  onConfirmDelete?: (investment: Investment) => void;
  className?: string;
}

export function InvestmentCard({
  investment,
  onView,
  onEdit,
  onDelete,
  onConfirmDelete,
  className
}: InvestmentCardProps) {
  const userCurrency = useUserCurrency();
  const { theme } = useTheme();
  const displayCurrency = investment.currency || userCurrency;
  const isPositive = investment.gain_loss >= 0;
  const returnPercentage = investment.gain_loss_percentage || 0;
  const investmentType = INVESTMENT_TYPES[investment.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn("group", className)}
    >
      <Card className={cn(
        "relative h-full border-0 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden",
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/50'
          : 'bg-gradient-to-br from-white/90 to-white/50'
      )}>
        {/* Gradient overlay for depth */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          theme === 'dark' ? 'to-white/5' : 'to-black/5'
        )} />
        
        {/* Status indicator */}
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full transition-all duration-300",
          investment.status === 'active' ? 'bg-green-500' : 
          investment.status === 'sold' ? 'bg-blue-500' : 
          investment.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
        )} />

        <CardContent className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300",
                "bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110"
              )}>
                {investmentType?.icon ? (
                  (() => {
                    // Map icon strings to actual icon components
                    const iconMap: { [key: string]: any } = {
                      'trending-up': TrendingUp,
                      'pie-chart': PieChart,
                      'bitcoin': Bitcoin,
                      'scroll': FileText,
                      'lock': Lock,
                      'repeat': Repeat,
                      'piggy-bank': PiggyBank,
                      'certificate': Award,
                      'calendar': Calendar,
                      'crown': Crown,
                      'home': Home,
                      'briefcase': Briefcase,
                      'user-check': UserCheck,
                      'more-horizontal': MoreVertical
                    };
                    const IconComponent = iconMap[investmentType.icon] || TrendingUp;
                    return <IconComponent className="h-6 w-6 text-white" />;
                  })()
                ) : (
                  <span className="text-white text-lg font-bold">
                    {investment.symbol?.charAt(0) || investment.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className={cn(
                  "font-semibold text-lg group-hover:text-blue-600 transition-colors duration-300",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {investment.name}
                </h3>
                {investment.symbol && (
                  <p className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    {investment.symbol}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-80 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 relative z-10 hover:bg-gray-100/80 dark:hover:bg-gray-700/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Dropdown trigger clicked for investment:', investment.name);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={cn(
                  "backdrop-blur-md shadow-lg border z-50",
                  theme === 'dark' 
                    ? 'bg-gray-800/95 border-gray-700' 
                    : 'bg-white/95 border-gray-200'
                )}
                sideOffset={5}
              >
                {onView && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('View clicked for:', investment.name);
                      onView(investment);
                    }}
                    className="cursor-pointer"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Edit clicked for:', investment.name);
                      onEdit(investment);
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {(onDelete || onConfirmDelete) && (
                  <ConfirmationDialog
                    title="Delete Investment"
                    description={`Are you sure you want to delete "${investment.name}"? This action cannot be undone and will remove all associated data including transactions and performance history.`}
                    confirmText="Delete Investment"
                    cancelText="Keep Investment"
                    variant="destructive"
                    onConfirm={() => {
                      console.log('Confirmed delete for:', investment.name);
                      if (onConfirmDelete) {
                        onConfirmDelete(investment);
                      } else if (onDelete) {
                        onDelete(investment);
                      }
                    }}
                  >
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault(); // Prevent dropdown from closing immediately
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </ConfirmationDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Investment Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Current Value
              </p>
              <p className={cn(
                "text-lg font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {formatCurrency(investment.current_value, displayCurrency)}
              </p>
            </div>
            <div className="space-y-1">
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Total Invested
              </p>
              <p className={cn(
                "text-lg font-bold",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {formatCurrency(investment.total_invested, displayCurrency)}
              </p>
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-sm font-medium",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>Performance</span>
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className={cn(
                  "px-3 py-1 rounded-full font-semibold transition-all duration-300",
                  isPositive 
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/25" 
                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/25"
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
                "text-lg font-bold transition-colors duration-300",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{formatCurrency(investment.gain_loss, displayCurrency)}
              </span>
              <span className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {investment.total_units} units @ {formatCurrency(investment.current_price, displayCurrency)}
              </span>
            </div>
          </div>

          {/* Tags and Type */}
          <div className={cn(
            "flex items-center justify-between mt-4 pt-4 border-t",
            theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
          )}>
            <Badge variant="outline" className="text-xs font-medium">
              {investmentType?.label || investment.type}
            </Badge>
            
            {investment.dividend_earned > 0 && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium">
                  {formatCurrency(investment.dividend_earned, displayCurrency)}
                </span>
              </div>
            )}
          </div>

          {/* Hover overlay for 3D effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        </CardContent>

        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(45deg, ${isPositive ? '#10B981' : '#EF4444'}20, transparent)`,
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
}