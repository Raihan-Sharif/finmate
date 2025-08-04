'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  Calculator,
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

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard/overview',
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
  },
  {
    name: 'Investments',
    href: '/dashboard/investments',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Budget',
    href: '/dashboard/budget',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'Loans & EMI',
    href: '/dashboard/loans',
    icon: Calculator,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    name: 'Lending',
    href: '/dashboard/lending',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    name: 'Cards & Banks',
    href: '/dashboard/accounts',
    icon: CreditCard,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
];

const bottomNavigation = [
  {
    name: 'Import Data',
    href: '/dashboard/import',
    icon: Upload,
    color: 'text-gray-600',
  },
  {
    name: 'Export Data',
    href: '/dashboard/export',
    icon: Download,
    color: 'text-gray-600',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    color: 'text-gray-600',
  },
  {
    name: 'Help',
    href: '/dashboard/help',
    icon: HelpCircle,
    color: 'text-gray-600',
  },
];

// Default export function
export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pathname = usePathname();
  const { user, signOut, profile } = useAuth();
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
    if (href === '/dashboard/overview') {
      return pathname === '/dashboard' || pathname === '/dashboard/overview';
    }
    return pathname.startsWith(href);
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl lg:translate-x-0 lg:static lg:inset-0',
          'lg:flex lg:flex-col lg:w-64 border-r border-border'
        )}
      >
        {/* Sidebar header */}
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
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg mr-3',
                    isActive ? item.bgColor : 'bg-transparent'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? item.color : 'text-muted-foreground'
                    )}
                  />
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="px-4 py-4 border-t border-border">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
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
              <Button size="sm" className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>

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

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || user?.user_metadata?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
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

