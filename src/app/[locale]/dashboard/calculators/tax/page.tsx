'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Receipt, ArrowLeft, Construction, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TaxCalculatorPage() {
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
                Tax Calculator
              </h1>
              <p className="text-muted-foreground mt-1">
                Calculate income tax, VAT, and other tax obligations
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Receipt className="h-8 w-8 text-primary" />
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
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                  <Construction className="h-12 w-12 text-orange-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Tax Calculator Coming Soon</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're building a comprehensive tax calculator to help you calculate income tax, VAT, and other tax obligations accurately.
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
                What to expect when the tax calculator is ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Income Tax Calculator</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Personal income tax calculation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Tax slab wise breakdown</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Deduction planning</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Tax saving recommendations</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Business Tax Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>VAT calculation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Corporate tax estimation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Advance tax planning</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Multi-country support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}