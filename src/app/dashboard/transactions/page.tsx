'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Filter,
  Plus,
  Receipt,
  Search,
  Tag,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Sample transaction data - in real app, this would come from API
const sampleTransactions = [
  {
    id: 1,
    type: 'expense' as const,
    amount: 85.50,
    description: 'Grocery Shopping - Whole Foods',
    category: 'Food & Dining',
    account: 'Checking Account',
    date: '2024-01-15',
    tags: ['groceries', 'food'],
    receipt_url: '/receipts/receipt-1.jpg',
    notes: 'Weekly grocery shopping',
  },
  {
    id: 2,
    type: 'income' as const,
    amount: 4200.00,
    description: 'Monthly Salary',
    category: 'Salary',
    account: 'Checking Account',
    date: '2024-01-15',
    tags: ['salary', 'work'],
  },
  {
    id: 3,
    type: 'expense' as const,
    amount: 12.50,
    description: 'Coffee - Starbucks',
    category: 'Food & Dining',
    account: 'Credit Card',
    date: '2024-01-14',
    tags: ['coffee', 'drinks'],
  },
  {
    id: 4,
    type: 'expense' as const,
    amount: 45.00,
    description: 'Gas Station - Shell',
    category: 'Transportation',
    account: 'Credit Card',
    date: '2024-01-14',
    tags: ['gas', 'car'],
  },
  {
    id: 5,
    type: 'expense' as const,
    amount: 125.99,
    description: 'Online Shopping - Amazon',
    category: 'Shopping',
    account: 'Credit Card',
    date: '2024-01-13',
    tags: ['online', 'electronics'],
  },
  {
    id: 6,
    type: 'income' as const,
    amount: 500.00,
    description: 'Freelance Project Payment',
    category: 'Freelance',
    account: 'Checking Account',
    date: '2024-01-12',
    tags: ['freelance', 'project'],
  },
  {
    id: 7,
    type: 'expense' as const,
    amount: 75.00,
    description: 'Electric Bill',
    category: 'Bills & Utilities',
    account: 'Checking Account',
    date: '2024-01-10',
    tags: ['bills', 'utilities'],
  },
  {
    id: 8,
    type: 'expense' as const,
    amount: 28.50,
    description: 'Movie Tickets',
    category: 'Entertainment',
    account: 'Credit Card',
    date: '2024-01-09',
    tags: ['movies', 'entertainment'],
  },
];

const categories = [
  'All Categories',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Salary',
  'Freelance',
  'Investment Returns',
];

const accounts = [
  'All Accounts',
  'Checking Account',
  'Savings Account',
  'Credit Card',
  'Cash',
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function TransactionsPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedAccount, setSelectedAccount] = useState('All Accounts');
  const [selectedType, setSelectedType] = useState('All Types');
  const [sortBy, setSortBy] = useState('date-desc');

  const currency = profile?.currency || 'USD';

  // Filter transactions based on search and filters
  const filteredTransactions = sampleTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All Categories' || transaction.category === selectedCategory;
    const matchesAccount = selectedAccount === 'All Accounts' || transaction.account === selectedAccount;
    const matchesType = selectedType === 'All Types' || transaction.type === selectedType.toLowerCase();

    return matchesSearch && matchesCategory && matchesAccount && matchesType;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'description':
        return a.description.localeCompare(b.description);
      default:
        return 0;
    }
  });

  // Calculate summary statistics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Receipt className="w-8 h-8 mr-3 text-blue-600" />
            Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your financial transactions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/transactions/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalIncome, currency)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalExpenses, currency)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Amount</p>
                  <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netAmount, currency)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  netAmount >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {netAmount >= 0 ? (
                    <ArrowUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Sort Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="amount-desc">Amount (Highest First)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Lowest First)</SelectItem>
                  <SelectItem value="description">Description (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedCategory !== 'All Categories' || selectedAccount !== 'All Accounts' || selectedType !== 'All Types') && (
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Search: "{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:bg-muted rounded">
                      ×
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'All Categories' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Category: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('All Categories')} className="ml-1 hover:bg-muted rounded">
                      ×
                    </button>
                  </Badge>
                )}
                {selectedAccount !== 'All Accounts' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Account: {selectedAccount}</span>
                    <button onClick={() => setSelectedAccount('All Accounts')} className="ml-1 hover:bg-muted rounded">
                      ×
                    </button>
                  </Badge>
                )}
                {selectedType !== 'All Types' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Type: {selectedType}</span>
                    <button onClick={() => setSelectedType('All Types')} className="ml-1 hover:bg-muted rounded">
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} of {sampleTransactions.length} transactions
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {sortedTransactions.length} results
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <ArrowDown className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        {transaction.receipt_url && (
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {transaction.account}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(new Date(transaction.date), { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      {transaction.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {transaction.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount, currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(new Date(transaction.date))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {sortedTransactions.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filteredTransactions.length === 0 && sampleTransactions.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Start by adding your first transaction'
                    }
                  </p>
                  <Link href="/dashboard/transactions/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}