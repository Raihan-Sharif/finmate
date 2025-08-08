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
  Zap
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

  const features = [
    {
      icon: Wallet,
      title: 'Smart Expense Tracking',
      description: 'Automatically categorize and track your expenses with AI-powered insights.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Target,
      title: 'Budget Management',
      description: 'Set budgets, track progress, and get alerts when you\'re overspending.',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: TrendingUp,
      title: 'Investment Tracking',
      description: 'Monitor your portfolio performance across stocks, crypto, and mutual funds.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: Calculator,
      title: 'EMI & Loan Manager',
      description: 'Track loans, calculate EMIs, and never miss a payment deadline.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      icon: Users,
      title: 'Lending Tracker',
      description: 'Keep track of money lent to friends and borrowed amounts.',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: BarChart3,
      title: 'Financial Reports',
      description: 'Generate detailed reports and export data in multiple formats.',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '$2M+', label: 'Money Tracked' },
    { value: '50K+', label: 'Transactions' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      avatar: '/avatars/sarah.jpg',
      content: 'FinMate has completely transformed how I manage my finances. The AI insights are incredibly helpful!',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Entrepreneur',
      avatar: '/avatars/michael.jpg',
      content: 'The investment tracking feature is amazing. I can see all my portfolios in one place.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'Marketing Manager',
      avatar: '/avatars/emily.jpg',
      content: 'Simple, beautiful, and powerful. Everything I need for personal finance management.',
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
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
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
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6"
            >
              Take Control of Your{' '}
              <span className="text-gradient-primary">Finances</span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
            >
              The ultimate personal finance companion for tracking expenses, managing investments, and achieving your financial goals.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Smartphone className="w-5 h-5 mr-2" />
                Download App
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to simplify your financial life and help you make better money decisions.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group relative p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Bank-Level Security
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your financial data is protected with enterprise-grade encryption and security measures.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">256-bit Encryption</h3>
                <p className="text-muted-foreground text-sm">All data encrypted with military-grade security</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">SOC 2 Compliant</h3>
                <p className="text-muted-foreground text-sm">Independently audited security controls</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No Data Sharing</h3>
                <p className="text-muted-foreground text-sm">Your data is never shared or sold to third parties</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32">
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
                className="bg-card rounded-2xl p-6 border border-border"
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

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who have transformed their financial lives with FinMate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600 dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-blue-600">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">FinMate</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                The ultimate personal finance companion for managing your money, tracking investments, and achieving your financial goals.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm">Privacy</Button>
                <Button variant="ghost" size="sm">Terms</Button>
                <Button variant="ghost" size="sm">Support</Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <div className="space-y-2">
                <Link href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground transition-colors">API</Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <div className="space-y-2">
                <Link href="#" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Careers</Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2025 FinMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}