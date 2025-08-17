'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Receipt, Target, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const calculators = [
  {
    title: 'Loan & EMI Calculator',
    description: 'Calculate monthly EMI, total interest, and repayment schedule for any loan',
    icon: Calculator,
    href: '/dashboard/calculators/loan-emi',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-900/20',
    available: true,
  },
  {
    title: 'Tax Calculator',
    description: 'Calculate income tax, VAT, and other tax obligations accurately',
    icon: Receipt,
    href: '/dashboard/calculators/tax',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    darkBgColor: 'dark:bg-green-900/20',
    available: false,
  },
  {
    title: 'Zakat Calculator',
    description: 'Calculate Zakat amount based on your wealth and Islamic guidelines',
    icon: Target,
    href: '/dashboard/calculators/zakat',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-900/20',
    available: false,
  },
]

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Financial Calculators
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access a comprehensive suite of financial calculators to make informed decisions about loans, taxes, and religious obligations
          </p>
        </motion.div>

        {/* Calculators Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {calculators.map((calculator, index) => (
            <motion.div
              key={calculator.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className={`bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-card/40 ${!calculator.available ? 'opacity-75' : ''}`}>
                <CardHeader className="space-y-4">
                  <div className={`p-4 ${calculator.bgColor} ${calculator.darkBgColor} rounded-2xl w-fit`}>
                    <calculator.icon className={`h-8 w-8 ${calculator.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center justify-between">
                      {calculator.title}
                      {!calculator.available && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {calculator.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {calculator.available ? (
                    <Link href={calculator.href}>
                      <Button className="w-full group">
                        Open Calculator
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span>Why Use Our Calculators?</span>
              </CardTitle>
              <CardDescription>
                Professional-grade financial calculators designed for accuracy and ease of use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl w-fit mx-auto">
                    <Calculator className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Accurate Calculations</h3>
                  <p className="text-sm text-muted-foreground">
                    Precise mathematical formulas ensure accurate results for all your financial planning needs
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl w-fit mx-auto">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Real-time Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant calculations with dynamic updates as you change input parameters
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl w-fit mx-auto">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">User-Friendly</h3>
                  <p className="text-sm text-muted-foreground">
                    Intuitive interface with helpful explanations and step-by-step guidance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}