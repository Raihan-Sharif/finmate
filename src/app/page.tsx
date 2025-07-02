import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FinMate
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your Ultimate Personal Finance Companion. Take control of your
            finances with comprehensive expense tracking, smart budgeting, and
            AI-powered insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
            >
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            <Button variant="outline" asChild className="text-lg px-8 py-3">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Smart Analytics</CardTitle>
              <CardDescription>
                AI-powered insights help you understand your spending patterns
                and make better financial decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Bank-Level Security</CardTitle>
              <CardDescription>
                Your financial data is protected with enterprise-grade
                encryption and security measures.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Works Everywhere</CardTitle>
              <CardDescription>
                Access your finances from any device. Our PWA works online and
                offline seamlessly.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Join thousands of users who are already managing their money smarter
            with FinMate.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
          >
            <Link href="/auth/signup">
              Start Your Financial Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
