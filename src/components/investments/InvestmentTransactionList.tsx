'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { InvestmentTransaction, INVESTMENT_TYPES } from '@/types/investments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface InvestmentTransactionListProps {
  transactions: InvestmentTransaction[];
  onView?: (transaction: InvestmentTransaction) => void;
  onEdit?: (transaction: InvestmentTransaction) => void;
  onDelete?: (transaction: InvestmentTransaction) => void;
  isLoading?: boolean;
  className?: string;
}

interface FilterState {
  type: 'all' | 'buy' | 'sell' | 'dividend';
  period: 'all' | '7d' | '30d' | '90d' | '1y';
  investment: string;
}

const TransactionRow = ({ 
  transaction, 
  onView, 
  onEdit, 
  onDelete,
  index 
}: {
  transaction: InvestmentTransaction;
  onView?: (transaction: InvestmentTransaction) => void;
  onEdit?: (transaction: InvestmentTransaction) => void;
  onDelete?: (transaction: InvestmentTransaction) => void;
  index: number;
}) => {
  const isBuy = transaction.transaction_type === 'buy';
  const isDividend = transaction.transaction_type === 'dividend';
  const investmentType = INVESTMENT_TYPES[transaction.investment_type || 'sip'];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className="group"
    >
      <Card className="border-0 bg-gradient-to-r from-white via-white/95 to-white/90 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Transaction type indicator */}
        <div className={cn(
          "absolute left-0 top-0 w-1 h-full transition-all duration-300",
          isBuy ? "bg-gradient-to-b from-green-500 to-emerald-600" :
          isDividend ? "bg-gradient-to-b from-blue-500 to-indigo-600" :
          "bg-gradient-to-b from-red-500 to-rose-600"
        )} />

        <CardContent className="p-4 pl-6 relative">
          <div className="flex items-center justify-between">
            {/* Transaction Info */}
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all duration-300",
                  isBuy ? "bg-gradient-to-br from-green-500 to-emerald-600" :
                  isDividend ? "bg-gradient-to-br from-blue-500 to-indigo-600" :
                  "bg-gradient-to-br from-red-500 to-rose-600"
                )}
              >
                {isBuy ? (
                  <ArrowUpRight className="h-5 w-5 text-white" />
                ) : isDividend ? (
                  <DollarSign className="h-5 w-5 text-white" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-white" />
                )}
              </motion.div>

              {/* Details */}
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {transaction.investment_name}
                  </h3>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full transition-all duration-300",
                      isBuy ? "border-green-200 text-green-700 bg-green-50" :
                      isDividend ? "border-blue-200 text-blue-700 bg-blue-50" :
                      "border-red-200 text-red-700 bg-red-50"
                    )}
                  >
                    {transaction.transaction_type.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                  </div>
                  {transaction.units > 0 && (
                    <span>{transaction.units} units @ {formatCurrency(transaction.price_per_unit, transaction.currency)}</span>
                  )}
                  {transaction.portfolio_name && (
                    <Badge variant="outline" className="text-xs">
                      {transaction.portfolio_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Amount and Actions */}
            <div className="flex items-center space-x-4">
              {/* Amount */}
              <div className="text-right">
                <p className={cn(
                  "text-lg font-bold transition-colors duration-300",
                  isBuy ? "text-green-600" :
                  isDividend ? "text-blue-600" :
                  "text-red-600"
                )}>
                  {isBuy ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
                </p>
                {transaction.fees > 0 && (
                  <p className="text-xs text-gray-500">
                    Fees: {formatCurrency(transaction.fees, transaction.currency)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/70"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="backdrop-blur-md bg-white/95">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(transaction)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(transaction)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(transaction)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Additional Details */}
          {(transaction.notes || transaction.source === 'sip_template') && (
            <motion.div 
              className="mt-3 pt-3 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {transaction.source === 'sip_template' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    SIP Auto-Investment
                  </Badge>
                </div>
              )}
              {transaction.notes && (
                <p className="text-sm text-gray-600 italic">
                  {transaction.notes}
                </p>
              )}
            </motion.div>
          )}
        </CardContent>

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(45deg, ${
              isBuy ? '#10B98120' :
              isDividend ? '#3B82F620' :
              '#EF444420'
            }, transparent)`,
            filter: 'blur(1px)',
          }}
          animate={{
            scale: [1, 1.01, 1],
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
};

export function InvestmentTransactionList({
  transactions,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
  className
}: InvestmentTransactionListProps) {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    period: 'all',
    investment: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filters.type === 'all' || transaction.transaction_type === filters.type;
    const matchesSearch = searchTerm === '' || 
      transaction.investment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.portfolio_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Period filter
    const now = new Date();
    const transactionDate = new Date(transaction.transaction_date);
    let matchesPeriod = true;
    
    if (filters.period !== 'all') {
      const days = filters.period === '7d' ? 7 : 
                   filters.period === '30d' ? 30 : 
                   filters.period === '90d' ? 90 : 365;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      matchesPeriod = transactionDate >= cutoffDate;
    }
    
    return matchesType && matchesSearch && matchesPeriod;
  });

  // Calculate totals
  const totalAmount = filteredTransactions.reduce((sum, t) => {
    return sum + (t.transaction_type === 'buy' ? -t.amount : t.amount);
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with filters */}
      <Card className="border-0 bg-gradient-to-r from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              Investment Transactions
            </CardTitle>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-white/70">
                      <Filter className="h-4 w-4 mr-2" />
                      Type: {filters.type}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}>
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'buy' }))}>
                      Buy Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'sell' }))}>
                      Sell Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, type: 'dividend' }))}>
                      Dividend Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-white/70">
                      <Calendar className="h-4 w-4 mr-2" />
                      {filters.period === 'all' ? 'All Time' : filters.period}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, period: 'all' }))}>
                      All Time
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, period: '7d' }))}>
                      Last 7 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, period: '30d' }))}>
                      Last 30 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, period: '90d' }))}>
                      Last 90 Days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, period: '1y' }))}>
                      Last Year
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-lg font-bold text-gray-900">{filteredTransactions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Net Amount</p>
                <p className={cn(
                  "text-lg font-bold",
                  totalAmount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {totalAmount >= 0 ? '+' : ''}{formatCurrency(totalAmount, 'BDT')}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {searchTerm || filters.type !== 'all' || filters.period !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by making your first investment transaction'}
              </p>
            </motion.div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onView={onView || (() => {})}
                onEdit={onEdit || (() => {})}
                onDelete={onDelete || (() => {})}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}