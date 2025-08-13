'use client';

import { motion } from 'framer-motion';
import { InvestmentTemplate, INVESTMENT_TYPES } from '@/types/investments';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Repeat,
  Zap,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  Building2,
  Hash,
  Target,
  Settings
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface SIPTemplateCardProps {
  template: InvestmentTemplate;
  onView?: (template: InvestmentTemplate) => void;
  onEdit?: (template: InvestmentTemplate) => void;
  onDelete?: (template: InvestmentTemplate) => void;
  onToggleStatus?: (template: InvestmentTemplate) => void;
  className?: string;
}

export function SIPTemplateCard({
  template,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  className
}: SIPTemplateCardProps) {
  const { theme } = useTheme();
  const investmentType = INVESTMENT_TYPES[template.investment_type];
  const isActive = template.is_active;
  
  // Calculate next execution date
  const nextExecution = template.next_execution_date 
    ? new Date(template.next_execution_date)
    : null;
  
  const daysUntilNext = nextExecution 
    ? Math.ceil((nextExecution.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate total invested so far - handle NaN values
  const amount = template.amount_per_investment || template.amount || 0;
  const executedCount = template.executed_count || 0;
  const totalInvested = isNaN(amount) || isNaN(executedCount) ? 0 : executedCount * amount;
  
  // Get frequency display
  const frequencyDisplay = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly', 
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly'
  }[template.frequency] || template.frequency;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn("group", className)}
    >
      <Card className={cn(
        "relative h-full border-0 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden",
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-900/85 border-gray-800'
          : 'bg-gradient-to-br from-white via-white/95 to-white/85'
      )}>
        {/* Status indicator bar */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-1 transition-all duration-300",
          isActive 
            ? "bg-gradient-to-r from-green-500 to-emerald-500" 
            : "bg-gradient-to-r from-gray-400 to-gray-500"
        )} />
        
        {/* Animated background pattern */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${isActive ? '#10B98120' : '#6B728010'}, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                    : "bg-gradient-to-br from-gray-500 to-gray-600"
                )}
              >
                {isActive ? (
                  <Zap className="h-7 w-7 text-white drop-shadow-sm" />
                ) : (
                  <Pause className="h-7 w-7 text-white drop-shadow-sm" />
                )}
                
                {/* Pulse animation for active SIPs */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-400/40 to-emerald-400/40 rounded-2xl"
                    animate={{
                      opacity: [0, 0.6, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>
              
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={cn(
                    "font-bold text-xl group-hover:text-blue-600 transition-colors duration-300",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {template.name}
                  </h3>
                  <Badge 
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                        : "border-gray-300 text-gray-600"
                    )}
                  >
                    {isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 text-sm",
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                )}>
                  <span className="font-medium">{investmentType?.label}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Repeat className="h-3 w-3" />
                    <span>{frequencyDisplay}</span>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-all duration-300",
                    theme === 'dark' 
                      ? 'hover:bg-gray-800/70' 
                      : 'hover:bg-white/70'
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={cn(
                  "backdrop-blur-md border shadow-lg",
                  theme === 'dark' 
                    ? 'bg-gray-900/95 border-gray-700 text-white' 
                    : 'bg-white/95 border-gray-200'
                )}
              >
                {onView && (
                  <DropdownMenuItem 
                    onClick={() => onView(template)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      theme === 'dark' 
                        ? 'hover:bg-gray-800 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    )}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onToggleStatus && (
                  <DropdownMenuItem 
                    onClick={() => onToggleStatus(template)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      theme === 'dark' 
                        ? 'hover:bg-gray-800 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    )}
                  >
                    {isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause SIP
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume SIP
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={() => onEdit(template)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      theme === 'dark' 
                        ? 'hover:bg-gray-800 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    )}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(template)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      theme === 'dark'
                        ? 'hover:bg-orange-900/30 text-orange-400 hover:text-orange-300'
                        : 'hover:bg-orange-50 text-orange-600 hover:text-orange-700'
                    )}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    {isActive ? 'Pause SIP' : 'Remove SIP'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Investment Amount & Progress */}
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
                Investment Amount
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {formatCurrency(amount, template.currency)}
              </p>
              <p className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Per {template.frequency}
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
              <p className="text-2xl font-bold text-blue-600">
                {totalInvested > 0 ? formatCurrency(totalInvested, template.currency) : formatCurrency(0, template.currency)}
              </p>
              <p className={cn(
                "text-xs",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {template.executed_count || 0} executions
              </p>
            </motion.div>
          </div>

          {/* Next Execution Info */}
          {isActive && nextExecution && (
            <motion.div 
              className={cn(
                "p-4 rounded-xl border",
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/50'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100/50'
              )}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                  )}>Next Execution</span>
                </div>
                {daysUntilNext !== null && (
                  <Badge 
                    variant="outline" 
                    className="border-blue-200 text-blue-700 bg-white/50"
                  >
                    {daysUntilNext === 0 ? 'Today' : 
                     daysUntilNext === 1 ? 'Tomorrow' : 
                     `${daysUntilNext} days`}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-lg font-bold",
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                )}>
                  {nextExecution.toLocaleDateString()}
                </span>
                <div className={cn(
                  "flex items-center space-x-1 text-sm",
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                )}>
                  <ArrowUpRight className="h-4 w-4" />
                  <span>{formatCurrency(amount, template.currency)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Advanced Options Display */}
          {(template.interval_value && template.interval_value > 1) && (
            <div className={cn(
              "p-3 rounded-lg border mb-4",
              theme === 'dark'
                ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/50'
                : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100/50'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Repeat className="h-4 w-4 text-purple-500" />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                  )}>Custom Interval</span>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  theme === 'dark' ? 'text-purple-200' : 'text-purple-900'
                )}>
                  Every {template.interval_value} {frequencyDisplay.toLowerCase()}
                </span>
              </div>
            </div>
          )}

          {/* Limit Price Info */}
          {!template.market_order && template.limit_price && (
            <div className={cn(
              "p-3 rounded-lg border mb-4",
              theme === 'dark'
                ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50'
                : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-100/50'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className={cn(
                    "h-4 w-4",
                    theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
                  )}>Limit Price</span>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  theme === 'dark' ? 'text-yellow-200' : 'text-yellow-900'
                )}>
                  {formatCurrency(template.limit_price, template.currency)}
                </span>
              </div>
            </div>
          )}

          {/* Execution Limits */}
          {(template.max_executions || template.end_date || template.target_amount) && (
            <motion.div 
              className="space-y-3"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <h4 className={cn(
                "text-sm font-medium flex items-center space-x-2",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                <AlertCircle className="h-4 w-4" />
                <span>SIP Limits & Targets</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                {template.target_amount && (
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50/50'
                  )}>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      )}>Target Amount</span>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      theme === 'dark' ? 'text-green-400' : 'text-green-700'
                    )}>
                      {formatCurrency(template.target_amount, template.currency)}
                    </span>
                  </div>
                )}
                
                {template.max_executions && (
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-50/50'
                  )}>
                    <span className={cn(
                      "text-sm",
                      theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                    )}>Max Executions</span>
                    <span className={cn(
                      "font-semibold",
                      theme === 'dark' ? 'text-orange-400' : 'text-orange-700'
                    )}>
                      {template.executed_count || 0} / {template.max_executions}
                    </span>
                  </div>
                )}
                
                {template.end_date && (
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50/50'
                  )}>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-red-300' : 'text-red-600'
                      )}>End Date</span>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      theme === 'dark' ? 'text-red-400' : 'text-red-700'
                    )}>
                      {new Date(template.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Additional Information */}
          <div className={cn(
            "pt-4 border-t space-y-3",
            theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
          )}>
            {/* Platform & Account Info */}
            {(template.platform || template.account_number) && (
              <div className="grid grid-cols-1 gap-3">
                {template.platform && (
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50/50'
                  )}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className={cn(
                        "text-sm font-medium",
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>Platform</span>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>{template.platform}</span>
                  </div>
                )}
                {template.account_number && (
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50/50'
                  )}>
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-green-500" />
                      <span className={cn(
                        "text-sm font-medium",
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>Account</span>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>{template.account_number}</span>
                  </div>
                )}
              </div>
            )}

            {/* Symbol Info */}
            {template.symbol && (
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-50/50'
              )}>
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-purple-500" />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>Symbol/Code</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {template.symbol}
                </Badge>
              </div>
            )}

            {/* Settings Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
              )}>
                <div className="flex items-center space-x-1">
                  <Settings className={cn(
                    "h-3 w-3",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  )}>Auto Execute</span>
                </div>
                <Badge variant={template.auto_execute ? "default" : "outline"} className="text-xs px-2 py-0">
                  {template.auto_execute ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
              )}>
                <div className="flex items-center space-x-1">
                  <Target className={cn(
                    "h-3 w-3",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  )}>Market Order</span>
                </div>
                <Badge variant={template.market_order ? "default" : "outline"} className="text-xs px-2 py-0">
                  {template.market_order ? "YES" : "NO"}
                </Badge>
              </div>
            </div>

            {/* Investment Target */}
            {template.investment_name && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50'
              )}>
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>Target Investment</p>
                  <p className={cn(
                    "text-base font-bold",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>{template.investment_name}</p>
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  {template.portfolio_name}
                </Badge>
              </div>
            )}

            {/* Notes Display */}
            {template.notes && (
              <div className={cn(
                "p-3 rounded-lg",
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
              )}>
                <p className={cn(
                  "text-xs font-medium mb-1",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>Notes</p>
                <p className={cn(
                  "text-sm leading-relaxed",
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {template.notes.length > 80 
                    ? `${template.notes.substring(0, 80)}...` 
                    : template.notes
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/3 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/5 to-transparent rounded-full blur-xl" />

        {/* Active glow effect */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)',
              filter: 'blur(3px)',
            }}
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </Card>
    </motion.div>
  );
}