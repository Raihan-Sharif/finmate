'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, ArrowLeft, Construction, Calendar, Heart } from 'lucide-react'
import Link from 'next/link'

export default function ZakatCalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        >
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/calculators">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Zakat Calculator
              </h1>
              <p className="text-muted-foreground mt-1">
                Calculate Zakat based on Islamic guidelines and your wealth
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardContent className="text-center py-16 space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <Heart className="h-12 w-12 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Zakat Calculator Coming Soon</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're developing a comprehensive Zakat calculator that follows authentic Islamic guidelines to help you fulfill your religious obligations accurately.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Expected Release: Q2 2024</span>
              </div>

              <Link href="/dashboard/calculators">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Calculators
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardHeader>
              <CardTitle>Planned Features</CardTitle>
              <CardDescription>
                What to expect when the Zakat calculator is ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Wealth Categories</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Cash and savings</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Gold and silver</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Investment portfolios</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Business assets</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Real estate (investment)</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Islamic Guidelines</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Nisab calculation (current rates)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Lunar year consideration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Debt deduction</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Multiple currency support</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Scholarly references</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Zakat Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200">About Zakat</CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Understanding the third pillar of Islam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-800 dark:text-green-200 text-sm">
                Zakat is one of the Five Pillars of Islam and represents a form of obligatory charity. 
                It is calculated as 2.5% of a Muslim's total savings and wealth above a minimum amount known as nisab.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-semibold text-green-800 dark:text-green-200">Eligibility (Nisab)</h5>
                  <p className="text-green-700 dark:text-green-300">
                    Minimum wealth threshold based on current gold/silver prices
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-green-800 dark:text-green-200">Rate</h5>
                  <p className="text-green-700 dark:text-green-300">
                    2.5% of eligible wealth held for one lunar year
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-green-800 dark:text-green-200">Purpose</h5>
                  <p className="text-green-700 dark:text-green-300">
                    Purification of wealth and helping those in need
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