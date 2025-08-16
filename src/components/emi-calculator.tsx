'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  TrendingUp,
  PieChart,
  Info,
  Save,
  Download,
  Share2,
  Sparkles,
  Target,
  CreditCard,
  Building,
  Car,
  GraduationCap,
  Briefcase,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateEMIDetails, EMICalculationResult } from '@/lib/services/emi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LOAN_TYPES } from '@/types/emi';

const loanTypeIcons = {
  personal: CreditCard,
  home: Building,
  car: Car,
  education: GraduationCap,
  business: Briefcase,
  purchase_emi: FileText,
  credit_card: CreditCard,
  other: FileText
};

export default function EMICalculator() {
  const [principal, setPrincipal] = useState<number>(500000);
  const [rate, setRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(24);
  const [loanType, setLoanType] = useState('personal');
  const [result, setResult] = useState<EMICalculationResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateEMI = async () => {
    if (!principal || !rate || !tenure || principal <= 0 || rate < 0 || tenure <= 0) {
      return;
    }

    setIsCalculating(true);
    
    try {
      const calculationResult = calculateEMIDetails({
        principal,
        interestRate: rate,
        tenureMonths: tenure
      });
      
      setResult(calculationResult);
    } catch (error) {
      console.error('Error calculating EMI:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto calculate when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (principal && rate >= 0 && tenure) {
        calculateEMI();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [principal, rate, tenure]);

  const resetCalculator = () => {
    setPrincipal(500000);
    setRate(8.5);
    setTenure(24);
    setLoanType('personal');
    setResult(null);
    setShowBreakdown(false);
  };

  const saveTemplate = () => {
    // TODO: Implement save template functionality
    console.log('Save template');
  };

  const exportResult = () => {
    // TODO: Implement export functionality
    console.log('Export result');
  };

  const shareResult = () => {
    // TODO: Implement share functionality
    console.log('Share result');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EMI Calculator
              </h1>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                <Sparkles className="h-4 w-4" />
                <span>Smart loan planning made simple</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetCalculator}>
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={saveTemplate}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={exportResult}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={shareResult}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="calculator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" />
              Tips
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Input Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="xl:col-span-1"
              >
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Loan Configuration
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Configure your loan parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Loan Type */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Loan Type</Label>
                      <Select value={loanType} onValueChange={setLoanType}>
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_TYPES.map((type) => {
                            const IconComponent = loanTypeIcons[type.value];
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Principal Amount */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Loan Amount</Label>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(principal)}</span>
                      </div>
                      <Slider
                        value={[principal]}
                        onValueChange={(value) => setPrincipal(value[0] || 10000)}
                        max={10000000}
                        min={10000}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>৳10K</span>
                        <span>৳1Cr</span>
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Interest Rate</Label>
                        <span className="text-lg font-bold text-green-600">{rate}%</span>
                      </div>
                      <Slider
                        value={[rate]}
                        onValueChange={(value) => setRate(value[0] || 0)}
                        max={30}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>30%</span>
                      </div>
                    </div>

                    {/* Tenure */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Tenure</Label>
                        <span className="text-lg font-bold text-purple-600">{tenure} months</span>
                      </div>
                      <Slider
                        value={[tenure]}
                        onValueChange={(value) => setTenure(value[0] || 6)}
                        max={360}
                        min={6}
                        step={6}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>6M</span>
                        <span>30Y</span>
                      </div>
                    </div>

                    {/* Quick Tenure Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Quick Selection</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '1Y', value: 12 },
                          { label: '2Y', value: 24 },
                          { label: '3Y', value: 36 },
                          { label: '5Y', value: 60 },
                          { label: '10Y', value: 120 },
                          { label: '15Y', value: 180 }
                        ].map(option => (
                          <Button
                            key={option.value}
                            variant={tenure === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTenure(option.value)}
                            className={tenure === option.value ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="xl:col-span-2"
              >
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      EMI Calculation Results
                      {isCalculating && (
                        <div className="ml-2 animate-spin">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      Your personalized loan breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AnimatePresence mode="wait">
                      {result ? (
                        <motion.div 
                          key="results"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-8"
                        >
                          {/* Key Metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="relative overflow-hidden"
                            >
                              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg">
                                <div className="text-3xl font-bold text-blue-600 mb-1">
                                  {formatCurrency(result.emi)}
                                </div>
                                <p className="text-sm text-blue-800 font-medium flex items-center justify-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Monthly EMI
                                </p>
                                <div className="absolute top-2 right-2">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                </div>
                              </div>
                            </motion.div>
                            
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="relative overflow-hidden"
                            >
                              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-lg">
                                <div className="text-3xl font-bold text-green-600 mb-1">
                                  {formatCurrency(result.totalAmount)}
                                </div>
                                <p className="text-sm text-green-800 font-medium flex items-center justify-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Total Amount
                                </p>
                                <div className="absolute top-2 right-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                </div>
                              </div>
                            </motion.div>
                            
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="relative overflow-hidden"
                            >
                              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-lg">
                                <div className="text-3xl font-bold text-orange-600 mb-1">
                                  {formatCurrency(result.totalInterest)}
                                </div>
                                <p className="text-sm text-orange-800 font-medium flex items-center justify-center">
                                  <Percent className="h-4 w-4 mr-1" />
                                  Total Interest
                                </p>
                                <div className="absolute top-2 right-2">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                </div>
                              </div>
                            </motion.div>
                          </div>

                          {/* Principal vs Interest Breakdown */}
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-6"
                          >
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                              <h3 className="font-bold text-xl mb-4 flex items-center text-gray-800">
                                <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                                Payment Composition
                              </h3>
                              
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 shadow-sm"></div>
                                    <span className="font-medium text-gray-700">Principal Amount</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                      {result.principalPercentage.toFixed(1)}%
                                    </Badge>
                                    <span className="font-bold text-blue-600">
                                      {formatCurrency(principal)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-3 shadow-sm"></div>
                                    <span className="font-medium text-gray-700">Interest Amount</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                      {result.interestPercentage.toFixed(1)}%
                                    </Badge>
                                    <span className="font-bold text-orange-600">
                                      {formatCurrency(result.totalInterest)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Visual Progress Bar */}
                              <div className="mt-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                  <span>Principal</span>
                                  <span>Interest</span>
                                </div>
                                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.principalPercentage}%` }}
                                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 float-left"
                                  />
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.interestPercentage}%` }}
                                    transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 float-left"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Summary Information */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <Alert className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-500 rounded-full mr-3">
                                  <Info className="h-4 w-4 text-white" />
                                </div>
                                <AlertDescription className="text-gray-700 leading-relaxed">
                                  <span className="block text-lg font-semibold text-gray-800 mb-2">Loan Summary</span>
                                  You will pay <strong className="text-blue-600">{formatCurrency(result.emi)}</strong> every month for{' '}
                                  <strong className="text-purple-600">{tenure} months</strong>, totaling{' '}
                                  <strong className="text-green-600">{formatCurrency(result.totalAmount)}</strong>. 
                                  <br />
                                  The interest component is <strong className="text-orange-600">{formatCurrency(result.totalInterest)}</strong> 
                                  ({result.interestPercentage.toFixed(1)}% of total payment).
                                </AlertDescription>
                              </div>
                            </Alert>
                          </motion.div>

                          {/* Detailed Breakdown Toggle */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex justify-center"
                          >
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => setShowBreakdown(!showBreakdown)}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {showBreakdown ? 'Hide' : 'Show'} Monthly Breakdown
                            </Button>
                          </motion.div>

                          {/* Monthly Breakdown Table */}
                          <AnimatePresence>
                            {showBreakdown && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                              >
                                <Separator className="bg-gradient-to-r from-blue-200 to-purple-200 h-0.5" />
                                <h3 className="font-bold text-xl flex items-center text-gray-800">
                                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                                  Month-wise Payment Breakdown
                                </h3>
                                
                                <div className="max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0">
                                      <tr>
                                        <th className="p-4 text-left font-semibold text-gray-700">Month</th>
                                        <th className="p-4 text-right font-semibold text-gray-700">EMI</th>
                                        <th className="p-4 text-right font-semibold text-gray-700">Principal</th>
                                        <th className="p-4 text-right font-semibold text-gray-700">Interest</th>
                                        <th className="p-4 text-right font-semibold text-gray-700">Balance</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {result.breakdown.map((row, index) => (
                                        <motion.tr 
                                          key={row.month} 
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.02 }}
                                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                          }`}
                                        >
                                          <td className="p-4 font-semibold text-gray-800">{row.month}</td>
                                          <td className="p-4 text-right font-medium text-gray-700">{formatCurrency(row.emi)}</td>
                                          <td className="p-4 text-right font-medium text-blue-600">
                                            {formatCurrency(row.principal)}
                                          </td>
                                          <td className="p-4 text-right font-medium text-orange-600">
                                            {formatCurrency(row.interest)}
                                          </td>
                                          <td className="p-4 text-right font-medium text-gray-600">
                                            {formatCurrency(row.balance)}
                                          </td>
                                        </motion.tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-16"
                        >
                          <div className="space-y-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-20 animate-pulse" />
                              <Calculator className="h-20 w-20 mx-auto text-gray-400 relative" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-gray-600">Configure Your Loan</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Adjust the loan parameters on the left to see your personalized EMI calculation and payment breakdown.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-white">Loan Comparison</CardTitle>
                  <CardDescription className="text-green-100">
                    Compare different loan scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Comparison feature coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="text-white">Interest Rate Impact</CardTitle>
                  <CardDescription className="text-purple-100">
                    See how rates affect your payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center text-gray-500">
                      <Percent className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Rate analysis coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Tips to Reduce EMI */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-white">
                    <Target className="h-5 w-5 mr-2" />
                    💰 Tips to Reduce EMI
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Smart strategies to lower your monthly payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { icon: '📊', title: 'Make a larger down payment', desc: 'Reduce principal amount' },
                      { icon: '📅', title: 'Choose longer tenure', desc: 'Spread payments over more months' },
                      { icon: '🔍', title: 'Compare interest rates', desc: 'Shop around for better deals' },
                      { icon: '💳', title: 'Improve credit score', desc: 'Get better interest rates' },
                      { icon: '⚡', title: 'Consider prepayment', desc: 'Pay extra when possible' }
                    ].map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <span className="text-lg">{tip.icon}</span>
                        <div>
                          <h4 className="font-semibold text-green-800">{tip.title}</h4>
                          <p className="text-sm text-green-600">{tip.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Important Considerations */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-white">
                    <Info className="h-5 w-5 mr-2" />
                    🧠 Important Considerations
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Key factors to remember when taking loans
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { icon: '🔒', title: 'EMI remains fixed', desc: 'Throughout the loan tenure' },
                      { icon: '📈', title: 'Early payments have more interest', desc: 'Interest component is higher initially' },
                      { icon: '📉', title: 'Later payments have more principal', desc: 'Principal component increases over time' },
                      { icon: '💰', title: 'Processing fees are extra', desc: 'Not included in EMI calculation' },
                      { icon: '📊', title: 'Rates may vary', desc: 'Based on credit score and profile' }
                    ].map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-lg">{tip.icon}</span>
                        <div>
                          <h4 className="font-semibold text-blue-800">{tip.title}</h4>
                          <p className="text-sm text-blue-600">{tip.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}