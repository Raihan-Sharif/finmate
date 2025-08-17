'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, ArrowLeft } from 'lucide-react'
import EMICalculator from '@/components/emi-calculator'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LoanEMICalculatorPage() {
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
                Loan & EMI Calculator
              </h1>
              <p className="text-muted-foreground mt-1">
                Calculate loan EMIs, interest amounts, and payment schedules
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
        </motion.div>

        {/* Calculator Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EMICalculator />
        </motion.div>

        {/* Help Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-lg dark:bg-card/40">
            <CardHeader>
              <CardTitle className="text-lg">How to Use the Calculator</CardTitle>
              <CardDescription>
                Follow these simple steps to calculate your loan EMI and understand your repayment schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">Input Parameters</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Loan Amount:</strong> Enter the principal amount you want to borrow</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Interest Rate:</strong> Annual interest rate offered by the lender</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Loan Tenure:</strong> Repayment period in years or months</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">Understanding Results</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Monthly EMI:</strong> Fixed amount you'll pay each month</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Total Interest:</strong> Total interest amount over the loan tenure</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Total Amount:</strong> Principal + Interest (total repayment)</span>
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