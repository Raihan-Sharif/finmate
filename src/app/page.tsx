'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Calculator,
  ChevronDown,
  DollarSign,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Shield,
  Smartphone,
  Star,
  Sun,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  CreditCard,
  PiggyBank,
  Receipt,
  Heart,
  TrendingDown,
  Clock,
  CheckCircle2,
  PlayCircle,
  Eye,
  LineChart,
  Award,
  Banknote,
  Building,
  HandHeart,
  Globe,
  Lock,
  Sparkles,
  Bot,
  Database,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, loading, signOut } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const coreFeatures = [
    {
      icon: Wallet,
      title: 'Smart Transaction Tracking',
      description: 'AI-powered expense categorization with real-time insights across all your accounts.',
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20',
      stats: '500K+ transactions tracked',
      demo: true
    },
    {
      icon: Target,
      title: 'Intelligent Budget Management',
      description: 'Set smart budgets, get predictive alerts, and achieve financial goals faster.',
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20',
      stats: 'Save 30% more on average',
      demo: true
    },
    {
      icon: TrendingUp,
      title: 'Investment Portfolio Manager',
      description: 'Track stocks, crypto, mutual funds, and SIPs with real-time performance analytics.',
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20',
      stats: 'Multi-asset tracking',
      demo: true
    },
    {
      icon: CreditCard,
      title: 'Auto EMI & Loan Manager',
      description: 'Automated EMI processing, loan tracking, and payment reminders with pg_cron.',
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
      stats: 'Never miss a payment',
      demo: true
    },
    {
      icon: HandHeart,
      title: 'Personal Lending Tracker',
      description: 'Track money lent to friends/family with payment reminders and interest calculations.',
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20',
      stats: 'Maintain relationships',
      demo: true
    },
    {
      icon: Calculator,
      title: 'Financial Calculators Suite',
      description: 'EMI, Tax, Zakat, and investment projection calculators for informed decisions.',
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20',
      stats: 'Professional-grade tools',
      demo: false
    }
  ];

  const advancedFeatures = [
    {
      icon: Bot,
      title: 'AI Financial Insights',
      description: 'Get personalized recommendations and spending pattern analysis',
      color: 'text-violet-600'
    },
    {
      icon: RefreshCw,
      title: 'Auto-Transaction System',
      description: 'Automated EMI processing with PostgreSQL pg_cron integration',
      color: 'text-blue-600'
    },
    {
      icon: FileSpreadsheet,
      title: 'Multi-Format Reports',
      description: 'Export data in CSV, PDF, and Excel formats',
      color: 'text-green-600'
    },
    {
      icon: Globe,
      title: 'Multi-Currency Support',
      description: 'Track finances in USD, EUR, GBP, INR, BDT, JPY, CAD, AUD',
      color: 'text-orange-600'
    },
    {
      icon: Smartphone,
      title: 'Progressive Web App',
      description: 'Native app experience with offline functionality',
      color: 'text-purple-600'
    },
    {
      icon: Database,
      title: 'Real-time Sync',
      description: 'Instant data synchronization across all your devices',
      color: 'text-cyan-600'
    }
  ];

  const stats = [
    { value: '25K+', label: 'Happy Users', icon: Users, color: 'text-blue-600' },
    { value: '$50M+', label: 'Assets Managed', icon: DollarSign, color: 'text-green-600' },
    { value: '500K+', label: 'Transactions', icon: BarChart3, color: 'text-purple-600' },
    { value: '4.9/5', label: 'User Rating', icon: Star, color: 'text-orange-600' },
  ];

  const useCases = [
    {
      icon: PiggyBank,
      title: 'Personal Finance Management',
      description: 'Track daily expenses, manage budgets, and build wealth systematically.',
      users: '15K+ users',
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10'
    },
    {
      icon: Building,
      title: 'Investment Portfolio Tracking',
      description: 'Monitor stocks, mutual funds, crypto, and SIPs with detailed analytics.',
      users: '8K+ investors',
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/10'
    },
    {
      icon: Heart,
      title: 'Family Financial Planning',
      description: 'Manage household budgets, track lending, and plan for family goals.',
      users: '12K+ families',
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/10'
    }
  ];

  const testimonials = [
    {
      name: 'Rashed Ahmed',
      role: 'Software Engineer',
      avatar: '/avatars/rashed.jpg',
      content: 'FinMate has completely transformed how I manage my finances in Bangladesh. The multi-currency support and EMI tracking are incredible!',
      rating: 5,
    },
    {
      name: 'Fatima Khan',
      role: 'Entrepreneur',
      avatar: '/avatars/fatima.jpg',
      content: 'The investment tracking and Zakat calculator features are exactly what I needed. Best financial app I\'ve used!',
      rating: 5,
    },
    {
      name: 'Mohammad Hassan',
      role: 'Marketing Manager',
      avatar: '/avatars/hassan.jpg',
      content: 'Simple, beautiful, and powerful. The automated EMI system saves me so much time and stress.',
      rating: 5,
    },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">FinMate</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#use-cases" className="text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
                Security
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Theme Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="relative overflow-hidden"
                  >
                    <motion.div
                      initial={false}
                      animate={{ 
                        scale: theme === 'dark' ? 0 : 1,
                        rotate: theme === 'dark' ? 180 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sun className="h-4 w-4" />
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{ 
                        scale: theme === 'dark' ? 1 : 0,
                        rotate: theme === 'dark' ? 0 : -180
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center"
                    >
                      <Moon className="h-4 w-4" />
                    </motion.div>
                  </Button>

                  {/* Dashboard Link */}
                  <Link href="/dashboard">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="sm" className="hidden sm:flex">
                        Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>

                  {/* User Profile Dropdown */}
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
                    
                    <DropdownMenuContent 
                      align="end" 
                      className="w-72 p-0 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 border-0 shadow-2xl"
                    >
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                        <div className="relative">
                          <div className="p-4 pb-2">
                            <div className="flex items-center space-x-3">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="relative"
                              >
                                <Avatar className={cn("h-12 w-12 ring-4 shadow-2xl", getRoleRingColor(profile?.role?.name || ''))}>
                                  <AvatarImage 
                                    src={user?.user_metadata?.avatar_url} 
                                    alt={profile?.full_name || user?.email || ''} 
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 text-white font-bold">
                                    {profile?.full_name 
                                      ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                                      : user?.email?.[0]?.toUpperCase() || 'U'
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                
                                <motion.div
                                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-lg"
                                  animate={{ 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 10, -10, 0]
                                  }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                >
                                  <span className="text-sm">
                                    {getRoleEmoji(profile?.role?.name || '')}
                                  </span>
                                </motion.div>
                              </motion.div>
                              
                              <div className="flex-1">
                                <motion.h3 
                                  className="font-bold text-base bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                                </motion.h3>
                                
                                <motion.p 
                                  className="text-xs text-gray-600 dark:text-gray-400 mb-2"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  {user?.email}
                                </motion.p>
                                
                                <motion.div
                                  className={cn(
                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-md",
                                    profile?.role?.name === 'super_admin' && "bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300",
                                    profile?.role?.name === 'admin' && "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 text-red-800 dark:text-red-200 border border-red-300",
                                    profile?.role?.name === 'paid_user' && "bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300",
                                    (!profile?.role?.name || profile?.role?.name === 'user') && "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300"
                                  )}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <motion.span
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="mr-1"
                                  >
                                    {getRoleEmoji(profile?.role?.name || '')}
                                  </motion.span>
                                  {getRoleDisplayName(profile?.role?.name || '')}
                                </motion.div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-200/50 dark:border-gray-700/50">
                            <DropdownMenuItem asChild className="cursor-pointer p-0 m-0">
                              <Link 
                                href="/dashboard" 
                                className="flex items-center w-full px-4 py-3 text-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
                              >
                                <ArrowRight className="mr-3 h-4 w-4 text-gray-500" />
                                <span>Go to Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild className="cursor-pointer p-0 m-0">
                              <Link 
                                href="/dashboard/settings" 
                                className="flex items-center w-full px-4 py-3 text-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
                              >
                                <Settings className="mr-3 h-4 w-4 text-gray-500" />
                                <span>Settings</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild className="cursor-pointer p-0 m-0">
                              <Link 
                                href="/help" 
                                className="flex items-center w-full px-4 py-3 text-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
                              >
                                <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                                <span>Help & Support</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                            
                            <DropdownMenuItem 
                              onClick={handleSignOut}
                              className="cursor-pointer flex items-center w-full px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-200"
                            >
                              <LogOut className="mr-3 h-4 w-4" />
                              <span>Sign out</span>
                            </DropdownMenuItem>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Theme Toggle for non-authenticated users */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="relative overflow-hidden"
                  >
                    <motion.div
                      initial={false}
                      animate={{ 
                        scale: theme === 'dark' ? 0 : 1,
                        rotate: theme === 'dark' ? 180 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sun className="h-4 w-4" />
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{ 
                        scale: theme === 'dark' ? 1 : 0,
                        rotate: theme === 'dark' ? 0 : -180
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center"
                    >
                      <Moon className="h-4 w-4" />
                    </motion.div>
                  </Button>

                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,_119,_198,_0.3),_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,_rgba(120,_119,_198,_0.1),_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,_182,_193,_0.3),_transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,_rgba(255,_182,_193,_0.1),_transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 text-sm font-semibold">
                🚀 #1 Personal Finance App in Bangladesh
              </Badge>
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Master Your Money,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Transform Your Life</span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              The only financial companion you'll ever need. Track expenses, manage investments, automate EMIs, and achieve your goals with AI-powered insights.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                  Start Free - No Credit Card
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 hover:bg-muted/50 text-lg px-8 py-4 group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Enhanced Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center p-4 rounded-2xl bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-all duration-300"
                  whileHover={{ y: -4 }}
                >
                  <div className={`inline-flex p-3 rounded-xl ${stat.color} bg-current/10 mb-3`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust indicators */}
            <motion.div variants={fadeInUp} className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Multi-Currency Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>PWA Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" />
                <span>Real-time Sync</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white border-0 mb-6">
              💎 Complete Financial Ecosystem
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Everything You Need in One App
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From daily expense tracking to advanced investment management, FinMate provides all the tools you need to take complete control of your financial life.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          >
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`group relative p-8 ${feature.bgColor} rounded-3xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-lg`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  {feature.demo && (
                    <Badge variant="secondary" className="text-xs font-medium bg-white/60 dark:bg-gray-800/60">
                      🎯 Interactive Demo
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {feature.stats}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${feature.color} group-hover:translate-x-1 transition-transform`} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Advanced Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl font-bold text-foreground mb-4">Powered by Advanced Technology</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Built with cutting-edge features to give you professional-grade financial management capabilities.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-6 bg-card/50 rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.color} bg-current/10 mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0 mb-6">
              👥 Trusted by Thousands
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Perfect for Every Financial Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're just starting out or managing complex investments, FinMate adapts to your needs.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`p-8 ${useCase.bgColor} rounded-3xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-500 hover:scale-105 group`}
              >
                <div className={`inline-flex p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-lg mb-6`}>
                  <useCase.icon className={`w-8 h-8 ${useCase.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {useCase.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {useCase.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-white/60 dark:bg-gray-800/60">
                    {useCase.users}
                  </Badge>
                  <ArrowRight className={`w-5 h-5 ${useCase.color} group-hover:translate-x-1 transition-transform`} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section id="security" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-8">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Enterprise-Grade Security You Can Trust
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your financial data is protected with the same security standards used by major banks and financial institutions worldwide.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">AES-256 Encryption</h3>
              <p className="text-muted-foreground text-sm">Military-grade encryption for all data transmission and storage</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">Row-Level Security</h3>
              <p className="text-muted-foreground text-sm">Advanced PostgreSQL RLS ensures complete data isolation</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">Privacy First</h3>
              <p className="text-muted-foreground text-sm">No data selling, no tracking, your information stays yours</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">Compliance Ready</h3>
              <p className="text-muted-foreground text-sm">Built with international financial regulations in mind</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our users have to say about FinMate
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="px-6 py-2 bg-white/20 text-white border-white/30 mb-8 backdrop-blur-sm">
              🎉 Join 25,000+ Happy Users Today
            </Badge>
            
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your Financial Freedom
              <br />
              <span className="text-blue-100">Starts Here</span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Stop letting money stress control your life. Take charge with FinMate's comprehensive financial management platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg px-8 py-4 font-semibold">
                  Start Free Forever
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-4 group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  See It In Action
                </Button>
              </Link>
            </div>
            
            {/* Value props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="font-medium">No Credit Card Required</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="font-medium">Setup in Under 2 Minutes</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="font-medium">Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-b from-background to-muted/30 border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground">FinMate</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                The comprehensive financial management platform trusted by thousands. Track expenses, manage investments, automate EMIs, and achieve your financial goals.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  8 Currencies Supported
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Bank-Grade Security
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Smartphone className="w-3 h-3 mr-1" />
                  PWA Ready
                </Badge>
              </div>
              <div className="flex space-x-4">
                <Link href="/privacy"><Button variant="ghost" size="sm" className="hover:text-primary">Privacy Policy</Button></Link>
                <Link href="/terms"><Button variant="ghost" size="sm" className="hover:text-primary">Terms of Service</Button></Link>
                <Link href="/support"><Button variant="ghost" size="sm" className="hover:text-primary">Support Center</Button></Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-foreground mb-6 text-lg">Features</h3>
              <div className="space-y-3">
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Wallet className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Expense Tracking
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Target className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Budget Management
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <TrendingUp className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Investment Tracking
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <CreditCard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  EMI Management
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Calculator className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Financial Calculators
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-foreground mb-6 text-lg">Resources</h3>
              <div className="space-y-3">
                <Link href="/blog" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Financial Blog
                </Link>
                <Link href="/help" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <HelpCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Help Center
                </Link>
                <Link href="/api" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Database className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Developer API
                </Link>
                <Link href="/about" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  About Us
                </Link>
                <Link href="/contact" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Contact
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-muted-foreground text-sm">
                <p>&copy; 2025 FinMate. All rights reserved. Made with ❤️ for your financial success.</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>Version 2.1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}