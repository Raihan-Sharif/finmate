"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  PiggyBank,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Smart Analytics",
    description: "AI-powered insights for better financial decisions",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Bank-Level Security",
    description: "Your data is encrypted and completely secure",
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Works Everywhere",
    description: "Access from any device, online or offline",
  },
  {
    icon: <PiggyBank className="w-8 h-8" />,
    title: "Goal Tracking",
    description: "Set and achieve your financial goals",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Detailed Reports",
    description: "Comprehensive financial reports and analytics",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Lending Management",
    description: "Track money lent and borrowed",
  },
];

const stats = [
  { label: "Active Users", value: "10,000+" },
  { label: "Transactions Tracked", value: "1M+" },
  { label: "Money Managed", value: "$50M+" },
  { label: "Countries", value: "25+" },
];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  FinMate
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your Ultimate Finance Companion
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                asChild
              >
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Take Control of Your
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Financial Future
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Track expenses, manage budgets, grow investments, and achieve your
              financial goals with our comprehensive personal finance platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              asChild
            >
              <Link href="/auth/signup">Start Free Today</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          >
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Everything You Need to Manage Your Finances
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to help you take control of your
            financial life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Why Choose FinMate?
              </h2>
              <div className="space-y-4">
                {[
                  "100% Free to use with no hidden fees",
                  "Bank-level security with end-to-end encryption",
                  "Works offline with PWA technology",
                  "AI-powered insights and recommendations",
                  "Multi-currency support for global users",
                  "Export your data anytime - no vendor lock-in",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">
                    Ready to Get Started?
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Join thousands of users who are already taking control of
                    their finances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-full bg-white text-blue-600 hover:bg-gray-100"
                    asChild
                  >
                    <Link href="/auth/signup">Create Free Account</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">FinMate</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your ultimate personal finance companion for tracking expenses,
                managing investments, and achieving financial goals.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Expense Tracking
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Budget Planning
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Investment Management
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Financial Reports
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Press
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} FinMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
