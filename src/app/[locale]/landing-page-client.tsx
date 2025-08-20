'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
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
import { useTranslations } from 'next-intl';

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

export default function LandingPageClient() {
  const { theme, setTheme } = useTheme();
  const { user, profile, loading, signOut } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('navigation');


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
      title: t('features.smartTransactionTracking.title'),
      description: t('features.smartTransactionTracking.description'),
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20',
      stats: t('features.smartTransactionTracking.stats'),
      demo: true
    },
    {
      icon: Target,
      title: t('features.intelligentBudgetManagement.title'),
      description: t('features.intelligentBudgetManagement.description'),
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20',
      stats: t('features.intelligentBudgetManagement.stats'),
      demo: true
    },
    {
      icon: TrendingUp,
      title: t('features.investmentPortfolioManager.title'),
      description: t('features.investmentPortfolioManager.description'),
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20',
      stats: t('features.investmentPortfolioManager.stats'),
      demo: true
    },
    {
      icon: CreditCard,
      title: t('features.autoEmiLoanManager.title'),
      description: t('features.autoEmiLoanManager.description'),
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
      stats: t('features.autoEmiLoanManager.stats'),
      demo: true
    },
    {
      icon: HandHeart,
      title: t('features.personalLendingTracker.title'),
      description: t('features.personalLendingTracker.description'),
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20',
      stats: t('features.personalLendingTracker.stats'),
      demo: true
    },
    {
      icon: Calculator,
      title: t('features.financialCalculatorsSuite.title'),
      description: t('features.financialCalculatorsSuite.description'),
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20',
      stats: t('features.financialCalculatorsSuite.stats'),
      demo: false
    }
  ];

  const advancedFeatures = [
    {
      icon: Bot,
      title: t('features.aiFinancialInsights.title'),
      description: t('features.aiFinancialInsights.description'),
      color: 'text-violet-600'
    },
    {
      icon: RefreshCw,
      title: t('features.autoTransactionSystem.title'),
      description: t('features.autoTransactionSystem.description'),
      color: 'text-blue-600'
    },
    {
      icon: FileSpreadsheet,
      title: t('features.multiFormatReports.title'),
      description: t('features.multiFormatReports.description'),
      color: 'text-green-600'
    },
    {
      icon: Globe,
      title: t('features.multiCurrencySupport.title'),
      description: t('features.multiCurrencySupport.description'),
      color: 'text-orange-600'
    },
    {
      icon: Smartphone,
      title: t('features.progressiveWebApp.title'),
      description: t('features.progressiveWebApp.description'),
      color: 'text-purple-600'
    },
    {
      icon: Database,
      title: t('features.realtimeSync.title'),
      description: t('features.realtimeSync.description'),
      color: 'text-cyan-600'
    }
  ];

  const stats = [
    { value: '25K+', label: t('stats.happyUsers'), icon: Users, color: 'text-blue-600' },
    { value: '$50M+', label: t('stats.assetsManaged'), icon: DollarSign, color: 'text-green-600' },
    { value: '500K+', label: t('stats.transactions'), icon: BarChart3, color: 'text-purple-600' },
    { value: '4.9/5', label: t('stats.userRating'), icon: Star, color: 'text-orange-600' },
  ];

  const useCases = [
    {
      icon: PiggyBank,
      title: t('useCases.personalFinanceManagement.title'),
      description: t('useCases.personalFinanceManagement.description'),
      users: t('useCases.personalFinanceManagement.users'),
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10'
    },
    {
      icon: Building,
      title: t('useCases.investmentPortfolioTracking.title'),
      description: t('useCases.investmentPortfolioTracking.description'),
      users: t('useCases.investmentPortfolioTracking.users'),
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/10'
    },
    {
      icon: Heart,
      title: t('useCases.familyFinancialPlanning.title'),
      description: t('useCases.familyFinancialPlanning.description'),
      users: t('useCases.familyFinancialPlanning.users'),
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/10'
    }
  ];

  const testimonials = [
    {
      name: t('testimonials.rashed.name'),
      role: t('testimonials.rashed.role'),
      avatar: '/avatars/rashed.jpg',
      content: t('testimonials.rashed.content'),
      rating: 5,
    },
    {
      name: t('testimonials.fatima.name'),
      role: t('testimonials.fatima.role'),
      avatar: '/avatars/fatima.jpg',
      content: t('testimonials.fatima.content'),
      rating: 5,
    },
    {
      name: t('testimonials.hassan.name'),
      role: t('testimonials.hassan.role'),
      avatar: '/avatars/hassan.jpg',
      content: t('testimonials.hassan.content'),
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
                {t('footer.features')}
              </Link>
              <Link href="#use-cases" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('useCases.title') || 'Use Cases'}
              </Link>
              <Link href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.security')}
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher variant="minimal" size="sm" />
              
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
                        {tNav('dashboard')}
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
                                <span>{tAuth('goToDashboard')}</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild className="cursor-pointer p-0 m-0">
                              <Link 
                                href="/dashboard/settings" 
                                className="flex items-center w-full px-4 py-3 text-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
                              >
                                <Settings className="mr-3 h-4 w-4 text-gray-500" />
                                <span>{tNav('settings')}</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild className="cursor-pointer p-0 m-0">
                              <Link 
                                href="/help" 
                                className="flex items-center w-full px-4 py-3 text-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
                              >
                                <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                                <span>{tAuth('helpSupport')}</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                            
                            <DropdownMenuItem 
                              onClick={handleSignOut}
                              className="cursor-pointer flex items-center w-full px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-200"
                            >
                              <LogOut className="mr-3 h-4 w-4" />
                              <span>{tAuth('signOut')}</span>
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
                      {tAuth('signIn')}
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">
                      {tAuth('getStarted')}
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
                {t('hero.badge')}
              </Badge>
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              {t('hero.title')}{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t('hero.titleHighlight')}</span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                  {t('hero.startFree')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 hover:bg-muted/50 text-lg px-8 py-4 group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  {t('hero.watchDemo')}
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
                <span>{t('trustIndicators.bankLevelSecurity')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{t('trustIndicators.multiCurrencySupport')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>{t('trustIndicators.pwaEnabled')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" />
                <span>{t('trustIndicators.realtimeSync')}</span>
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
              {t('features.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('features.subtitle')}
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
            <h3 className="text-2xl font-bold text-foreground mb-4">{t('features.poweredByTechnology')}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('features.technologySubtitle')}</p>
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
              {t('useCases.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {t('useCases.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('useCases.subtitle')}
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
              {t('security.title')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {t('security.subtitle')}
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
              <h3 className="font-bold text-foreground mb-3">{t('security.aes256Encryption.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('security.aes256Encryption.description')}</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">{t('security.rowLevelSecurity.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('security.rowLevelSecurity.description')}</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">{t('security.privacyFirst.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('security.privacyFirst.description')}</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-foreground mb-3">{t('security.complianceReady.title')}</h3>
              <p className="text-muted-foreground text-sm">{t('security.complianceReady.description')}</p>
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
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('testimonials.subtitle')}
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
              {t('cta.badge')}
            </Badge>
            
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('cta.title')}
              <br />
              <span className="text-blue-100">{t('cta.titleHighlight')}</span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg px-8 py-4 font-semibold">
                  {t('cta.startFreeForever')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-4 group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  {t('cta.seeItInAction')}
                </Button>
              </Link>
            </div>
            
            {/* Value props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="font-medium">{t('cta.noCreditCard')}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="font-medium">{t('cta.setupMinutes')}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="font-medium">{t('cta.cancelAnytime')}</span>
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
                {t('footer.tagline')}
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {t('footer.currencies')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('footer.security')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Smartphone className="w-3 h-3 mr-1" />
                  {t('footer.pwaReady')}
                </Badge>
              </div>
              <div className="flex space-x-4">
                <Link href="/privacy"><Button variant="ghost" size="sm" className="hover:text-primary">{t('footer.privacyPolicy')}</Button></Link>
                <Link href="/terms"><Button variant="ghost" size="sm" className="hover:text-primary">{t('footer.termsOfService')}</Button></Link>
                <Link href="/support"><Button variant="ghost" size="sm" className="hover:text-primary">{t('footer.supportCenter')}</Button></Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-foreground mb-6 text-lg">{t('footer.features')}</h3>
              <div className="space-y-3">
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Wallet className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.expenseTracking')}
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Target className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.budgetManagement')}
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <TrendingUp className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.investmentTracking')}
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <CreditCard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.emiManagement')}
                </Link>
                <Link href="#features" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Calculator className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.financialCalculators')}
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-foreground mb-6 text-lg">{t('footer.resources')}</h3>
              <div className="space-y-3">
                <Link href="/blog" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  {t('footer.financialBlog')}
                </Link>
                <Link href="/help" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <HelpCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.helpCenter')}
                </Link>
                <Link href="/api" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Database className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.developerAPI')}
                </Link>
                <Link href="/about" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('footer.aboutUs')}
                </Link>
                <Link href="/contact" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  {t('footer.contact')}
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-muted-foreground text-sm">
                <p>{t('footer.copyright')}</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t('footer.allSystemsOperational')}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>{t('footer.version')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}