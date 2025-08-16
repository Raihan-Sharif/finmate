'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calculator,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Receipt,
  Search,
  Settings,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Upload,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  color: string;
  bgColor: string;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: Receipt,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    children: [
      {
        name: 'All Transactions',
        href: '/dashboard/transactions',
        icon: Receipt,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        name: 'Add Transaction',
        href: '/dashboard/transactions/new',
        icon: Plus,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      },
      {
        name: 'Recurring Transactions',
        href: '/dashboard/transactions/recurring',
        icon: Clock,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      },
      {
        name: 'Import/Export',
        href: '/dashboard/transactions/import-export',
        icon: Upload,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
      },
    ],
  },
  {
    name: 'Budget',
    href: '/dashboard/budget',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    children: [
      {
        name: 'Current Budget',
        href: '/dashboard/budget',
        icon: Target,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        name: 'Create Budget',
        href: '/dashboard/budget/new',
        icon: Plus,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      },
      {
        name: 'Recurring Budget',
        href: '/dashboard/budget/recurring',
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      },
    ],
  },
  {
    name: 'Investments',
    href: '/dashboard/investments',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    children: [
      {
        name: 'Portfolio Overview',
        href: '/dashboard/investments',
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        name: 'Add Investment',
        href: '/dashboard/investments/new',
        icon: Plus,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
      },
      {
        name: 'SIP Management',
        href: '/dashboard/investments/sips',
        icon: Clock,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        name: 'Analytics',
        href: '/dashboard/investments/analytics',
        icon: BarChart3,
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
      },
    ],
  },
  {
    name: 'EMI & Lending',
    href: '/dashboard/emi',
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    children: [
      {
        name: 'EMI Management',
        href: '/dashboard/emi',
        icon: CreditCard,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      },
      {
        name: 'EMI Calculator',
        href: '/emi',
        icon: Calculator,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
    ],
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    children: [
      {
        name: 'General',
        href: '/dashboard/settings',
        icon: Settings,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
      },
      {
        name: 'Accounts',
        href: '/dashboard/settings/accounts',
        icon: CreditCard,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      },
      {
        name: 'Categories',
        href: '/dashboard/settings/categories',
        icon: Receipt,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        name: 'Export Data',
        href: '/dashboard/settings/export',
        icon: Download,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
      },
    ],
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    children: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      },
      {
        name: 'User Management',
        href: '/admin/users',
        icon: Users,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
      },
      {
        name: 'System Settings',
        href: '/admin/settings',
        icon: Settings,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: Receipt,
        color: 'text-red-700',
        bgColor: 'bg-red-100',
      },
    ],
  },
];

const quickActions = [
  {
    name: 'Add Transaction',
    href: '/dashboard/transactions/new',
    icon: Plus,
    color: 'text-green-600',
  },
  {
    name: 'Create Budget',
    href: '/dashboard/budget/new',
    icon: Target,
    color: 'text-blue-600',
  },
  {
    name: 'View Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    color: 'text-purple-600',
  },
  {
    name: 'Help Center',
    href: '/help',
    icon: HelpCircle,
    color: 'text-gray-600',
  },
];

// Default export function
export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>(['Transactions']); // Default expand Transactions

  const pathname = usePathname();
  const { user, signOut, profile } = useAuth();
  const { isAdmin } = usePermissions();
  const { theme, setTheme } = useTheme();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case '\\':
            e.preventDefault();
            setSidebarOpen(prev => !prev);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  const hasActiveChild = (item: NavigationItem) => {
    if (!item.children) return false;
    return item.children.some(child => isActiveRoute(child.href));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getRoleDisplayName = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'paid_user': return 'Paid User';
      case 'user': return 'User';
      default: return 'User';
    }
  };

  const getRoleEmoji = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return '👑';
      case 'admin': return '🛡️';
      case 'paid_user': return '💎';
      case 'user': return '👤';
      default: return '👤';
    }
  };

  const getRoleRingColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'ring-yellow-500 shadow-yellow-500/20';
      case 'admin': return 'ring-red-500 shadow-red-500/20';
      case 'paid_user': return 'ring-purple-500 shadow-purple-500/20';
      case 'user': return 'ring-blue-500 shadow-blue-500/20';
      default: return 'ring-blue-500 shadow-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 bg-white dark:bg-gray-900 border-r border-border">
        {/* Sidebar content for desktop */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              FinMate
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const expanded = isExpanded(item.name);
            const childActive = hasActiveChild(item);
            
            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  // Parent item with children - clickable to expand/collapse
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02]',
                      isActive || childActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-r-2 border-primary shadow-lg'
                        : 'text-muted-foreground hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted hover:text-foreground hover:shadow-md'
                    )}
                  >
                    <div className="flex items-center">
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg mr-3 transform transition-all duration-200',
                          (isActive || childActive) ? `${item.bgColor} shadow-lg` : 'bg-transparent',
                          hasChildren && 'hover:scale-110'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'w-5 h-5 transition-all duration-200',
                            (isActive || childActive) ? item.color : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      {item.name}
                    </div>
                    <motion.div
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>
                ) : (
                  // Regular item without children
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02]',
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-r-2 border-primary shadow-lg'
                        : 'text-muted-foreground hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted hover:text-foreground hover:shadow-md'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg mr-3 transform transition-all duration-200 hover:scale-110',
                        isActive ? `${item.bgColor} shadow-lg` : 'bg-transparent'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-5 h-5 transition-all duration-200',
                          isActive ? item.color : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    {item.name}
                  </Link>
                )}
                
                {/* Sub-menu items */}
                {hasChildren && (
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 space-y-1"
                      >
                        {item.children!.map((child) => {
                          const childIsActive = isActiveRoute(child.href);
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] ml-2',
                                childIsActive
                                  ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-md border-l-2 border-primary'
                                  : 'text-muted-foreground/80 hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 hover:text-foreground hover:shadow-sm'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex items-center justify-center w-6 h-6 rounded-md mr-3 transform transition-all duration-200 hover:scale-110',
                                  childIsActive ? `${child.bgColor} shadow-md` : 'bg-transparent'
                                )}
                              >
                                <child.icon
                                  className={cn(
                                    'w-4 h-4 transition-all duration-200',
                                    childIsActive ? child.color : 'text-muted-foreground/70'
                                  )}
                                />
                              </div>
                              {child.name}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
          
          {/* Admin section */}
          {isAdmin() && (
            <>
              <div className="my-4 border-t border-border pt-4">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
              </div>
              {adminNavigation.map((item) => (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      isExpanded(item.name) 
                        ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded(item.name) ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded(item.name) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 space-y-1"
                      >
                        {item.children?.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] ml-2',
                              isActiveRoute(child.href) 
                                ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-md border-l-2 border-primary'
                                : 'text-muted-foreground/80 hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 hover:text-foreground hover:shadow-sm'
                            )}
                          >
                            <div
                              className={cn(
                                'flex items-center justify-center w-6 h-6 rounded-md mr-3 transform transition-all duration-200 hover:scale-110',
                                isActiveRoute(child.href) ? `${child.bgColor} shadow-md` : 'bg-transparent'
                              )}
                            >
                              <child.icon
                                className={cn(
                                  'w-4 h-4 transition-all duration-200',
                                  isActiveRoute(child.href) ? child.color : 'text-muted-foreground/70'
                                )}
                              />
                            </div>
                            {child.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex flex-col items-center p-2 text-xs rounded-lg hover:bg-accent transition-colors"
                >
                  <action.icon className={cn("w-4 h-4 mb-1", action.color)} />
                  <span className="text-muted-foreground">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl border-r border-border'
        )}
      >
        {/* Mobile Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              FinMate
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Navigation - same as desktop but with mobile close on click */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const expanded = isExpanded(item.name);
            const childActive = hasActiveChild(item);
            
            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02]',
                      isActive || childActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-r-2 border-primary shadow-lg'
                        : 'text-muted-foreground hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted hover:text-foreground hover:shadow-md'
                    )}
                  >
                    <div className="flex items-center">
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg mr-3 transform transition-all duration-200',
                          (isActive || childActive) ? `${item.bgColor} shadow-lg` : 'bg-transparent',
                          hasChildren && 'hover:scale-110'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'w-5 h-5 transition-all duration-200',
                            (isActive || childActive) ? item.color : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      {item.name}
                    </div>
                    <motion.div
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02]',
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-r-2 border-primary shadow-lg'
                        : 'text-muted-foreground hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted hover:text-foreground hover:shadow-md'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg mr-3 transform transition-all duration-200 hover:scale-110',
                        isActive ? `${item.bgColor} shadow-lg` : 'bg-transparent'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-5 h-5 transition-all duration-200',
                          isActive ? item.color : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    {item.name}
                  </Link>
                )}
                
                {hasChildren && (
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 space-y-1"
                      >
                        {item.children!.map((child) => {
                          const childIsActive = isActiveRoute(child.href);
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] ml-2',
                                childIsActive
                                  ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-md border-l-2 border-primary'
                                  : 'text-muted-foreground/80 hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 hover:text-foreground hover:shadow-sm'
                              )}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <div
                                className={cn(
                                  'flex items-center justify-center w-6 h-6 rounded-md mr-3 transform transition-all duration-200 hover:scale-110',
                                  childIsActive ? `${child.bgColor} shadow-md` : 'bg-transparent'
                                )}
                              >
                                <child.icon
                                  className={cn(
                                    'w-4 h-4 transition-all duration-200',
                                    childIsActive ? child.color : 'text-muted-foreground/70'
                                  )}
                                />
                              </div>
                              {child.name}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search transactions, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-64"
                />
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Quick actions */}
              <Link href="/dashboard/transactions/new">
                <Button size="sm" className="hidden sm:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </Link>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Theme toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* Enhanced User menu with role display */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-2 space-x-2">
                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <Avatar className={cn("h-8 w-8 ring-2 shadow-lg transition-all duration-300", getRoleRingColor(profile?.role?.name || ''))}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full ring-1 ring-offset-1 ring-current opacity-30"
                        />
                        <AvatarImage 
                          src={user?.user_metadata?.avatar_url} 
                          alt={profile?.full_name || user?.email || ''} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {profile?.full_name 
                            ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                            : user?.email?.[0]?.toUpperCase() || 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                      
                      <motion.div
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border-2 border-background flex items-center justify-center text-xs"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {getRoleEmoji(profile?.role?.name || '')}
                      </motion.div>
                    </motion.div>
                    
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium leading-none">
                        {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getRoleDisplayName(profile?.role?.name || '')}
                      </div>
                    </div>
                    
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                          alt={profile?.full_name || user?.user_metadata?.name || user?.email || ''}
                        />
                        <AvatarFallback>
                          {(profile?.full_name || user?.user_metadata?.name || user?.email || '')
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || user?.user_metadata?.name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

// Also export as named export for compatibility
export { MainLayout };

