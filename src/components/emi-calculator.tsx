'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  TrendingUp,
  PieChart,
  Info
} from 'lucide-react';
import { formatCurrency, calculateEMI } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EMIResult {
  emi: number;
  totalAmount: number;
  totalInterest: number;
  principalPercentage: number;
  interestPercentage: number;
  breakdown: {
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

export default function EMICalculator() {
  const [principal, setPrincipal] = useState<string>('100000');
  const [rate, setRate] = useState<string>('8.5');
  const [tenure, setTenure] = useState<string>('12');
  const [result, setResult] = useState<EMIResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const calculateEMIDetails = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseInt(tenure);

    if (!p || !r || !t || p <= 0 || r <= 0 || t <= 0) {
      return;
    }

    const monthlyRate = r / 12 / 100;
    const emi = calculateEMI(p, r, t);
    const totalAmount = emi * t;
    const totalInterest = totalAmount - p;
    const principalPercentage = (p / totalAmount) * 100;
    const interestPercentage = (totalInterest / totalAmount) * 100;

    // Calculate month-wise breakdown
    const breakdown = [];
    let remainingBalance = p;

    for (let month = 1; month <= t; month++) {
      const interestForMonth = remainingBalance * monthlyRate;
      const principalForMonth = emi - interestForMonth;
      remainingBalance -= principalForMonth;

      breakdown.push({
        month,
        emi: emi,
        principal: principalForMonth,
        interest: interestForMonth,
        balance: Math.max(0, remainingBalance)
      });
    }

    setResult({
      emi,
      totalAmount,
      totalInterest,
      principalPercentage,
      interestPercentage,
      breakdown
    });
  };

  const resetCalculator = () => {
    setPrincipal('100000');
    setRate('8.5');
    setTenure('12');
    setResult(null);
    setShowBreakdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calculator className="h-8 w-8 mr-3 text-blue-600" />
            EMI Calculator
          </h1>
          <p className="text-gray-600 mt-1">
            Calculate your Equated Monthly Installment for loans and mortgages
          </p>
        </div>
        <Button variant="outline" onClick={resetCalculator}>
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Loan Details
            </CardTitle>
            <CardDescription>
              Enter your loan information to calculate EMI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Loan Amount ($)</Label>
              <Input
                id="principal"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="Enter loan amount"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Interest Rate (% per annum)</Label>
              <Input
                id="rate"
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Enter interest rate"
                min="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenure">Tenure (months)</Label>
              <Input
                id="tenure"
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="Enter tenure in months"
                min="1"
              />
            </div>

            <Button 
              onClick={calculateEMIDetails} 
              className="w-full"
              disabled={!principal || !rate || !tenure}
            >
              Calculate EMI
            </Button>

            {/* Quick Tenure Options */}
            <div className="space-y-2">
              <Label>Quick Tenure Selection</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '1 Year', value: '12' },
                  { label: '2 Years', value: '24' },
                  { label: '3 Years', value: '36' },
                  { label: '5 Years', value: '60' },
                  { label: '7 Years', value: '84' },
                  { label: '10 Years', value: '120' }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={tenure === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTenure(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              EMI Calculation Results
            </CardTitle>
            <CardDescription>
              Your loan repayment breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(result.emi)}
                    </div>
                    <p className="text-sm text-blue-800 font-medium">Monthly EMI</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(result.totalAmount)}
                    </div>
                    <p className="text-sm text-green-800 font-medium">Total Amount</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(result.totalInterest)}
                    </div>
                    <p className="text-sm text-orange-800 font-medium">Total Interest</p>
                  </div>
                </div>

                {/* Principal vs Interest Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <PieChart className="h-4 w-4 mr-2" />
                    Payment Composition
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                        <span>Principal Amount</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {result.principalPercentage.toFixed(1)}%
                        </Badge>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(principal))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                        <span>Interest Amount</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {result.interestPercentage.toFixed(1)}%
                        </Badge>
                        <span className="font-medium">
                          {formatCurrency(result.totalInterest)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 float-left"
                      style={{ width: `${result.principalPercentage}%` }}
                    ></div>
                    <div 
                      className="h-full bg-orange-500 float-left"
                      style={{ width: `${result.interestPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Summary Information */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You will pay <strong>{formatCurrency(result.emi)}</strong> every month for{' '}
                    <strong>{tenure} months</strong>, totaling{' '}
                    <strong>{formatCurrency(result.totalAmount)}</strong>. The interest component is{' '}
                    <strong>{formatCurrency(result.totalInterest)}</strong> ({result.interestPercentage.toFixed(1)}% of total payment).
                  </AlertDescription>
                </Alert>

                {/* Detailed Breakdown Toggle */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                  >
                    {showBreakdown ? 'Hide' : 'Show'} Monthly Breakdown
                  </Button>
                </div>

                {/* Monthly Breakdown Table */}
                {showBreakdown && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="font-semibold flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Month-wise Payment Breakdown
                    </h3>
                    
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-3 text-left font-medium">Month</th>
                            <th className="p-3 text-right font-medium">EMI</th>
                            <th className="p-3 text-right font-medium">Principal</th>
                            <th className="p-3 text-right font-medium">Interest</th>
                            <th className="p-3 text-right font-medium">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.breakdown.map((row, index) => (
                            <tr key={row.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-3 font-medium">{row.month}</td>
                              <td className="p-3 text-right">{formatCurrency(row.emi)}</td>
                              <td className="p-3 text-right text-blue-600">
                                {formatCurrency(row.principal)}
                              </td>
                              <td className="p-3 text-right text-orange-600">
                                {formatCurrency(row.interest)}
                              </td>
                              <td className="p-3 text-right text-gray-600">
                                {formatCurrency(row.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Enter loan details and click "Calculate EMI" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EMI Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 EMI Tips & Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-green-700">Tips to Reduce EMI:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Make a larger down payment</li>
                <li>• Choose a longer repayment tenure</li>
                <li>• Compare interest rates from different lenders</li>
                <li>• Consider prepayment when possible</li>
                <li>• Maintain a good credit score</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">Things to Remember:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• EMI remains fixed throughout the tenure</li>
                <li>• Initial payments have more interest component</li>
                <li>• Later payments have more principal component</li>
                <li>• Processing fees and other charges are extra</li>
                <li>• Interest rates may vary based on credit score</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}