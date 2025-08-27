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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('calculators');
  const tCommon = useTranslations('common');
  
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
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
                {t('emi.title')}
              </h1>
              <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>{t('emi.subtitle')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetCalculator}>
              {tCommon('actions.reset')}
            </Button>
            <Button variant="outline" size="sm" onClick={saveTemplate}>
              <Save className="h-4 w-4 mr-1" />
              {tCommon('actions.save')}
            </Button>
            <Button variant="outline" size="sm" onClick={exportResult}>
              <Download className="h-4 w-4 mr-1" />
              {tCommon('actions.export')}
            </Button>
            <Button variant="outline" size="sm" onClick={shareResult}>
              <Share2 className="h-4 w-4 mr-1" />
              {tCommon('actions.share')}
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-background shadow-md dark:bg-card">
            <TabsTrigger value="calculator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Calculator className="h-4 w-4 mr-2" />
              {t('emi.tabs.calculator')}
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('emi.tabs.comparison')}
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" />
              {t('emi.tabs.tips')}
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
                <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <DollarSign className="h-5 w-5 mr-2" />
                      {t('emi.sections.configuration')}
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      {t('emi.labels.configureLoan')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Loan Type */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground">{t('emi.fields.loanType')}</Label>
                      <Select value={loanType} onValueChange={setLoanType}>
                        <SelectTrigger className="h-12 border-2 border-border focus:border-primary dark:border-border dark:focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_TYPES.map((type) => {
                            const IconComponent = loanTypeIcons[type.value];
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{tCommon(`types.${type.value}`)}</span>
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
                        <Label className="text-sm font-semibold text-foreground">{t('emi.fields.loanAmount')}</Label>
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
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('emi.ranges.minAmount')}</span>
                        <span>{t('emi.ranges.maxAmount')}</span>
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-foreground">{t('emi.fields.interestRate')}</Label>
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
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('emi.ranges.minRate')}</span>
                        <span>{t('emi.ranges.maxRate')}</span>
                      </div>
                    </div>

                    {/* Tenure */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-foreground">{t('emi.fields.tenure')}</Label>
                        <span className="text-lg font-bold text-purple-600">{tenure} {tCommon('timeUnits.months')}</span>
                      </div>
                      <Slider
                        value={[tenure]}
                        onValueChange={(value) => setTenure(value[0] || 6)}
                        max={360}
                        min={6}
                        step={6}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('emi.ranges.minTenure')}</span>
                        <span>{t('emi.ranges.maxTenure')}</span>
                      </div>
                    </div>

                    {/* Quick Tenure Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground">{t('emi.labels.quickSelection')}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { labelKey: 'oneYear', value: 12 },
                          { labelKey: 'twoYears', value: 24 },
                          { labelKey: 'threeYears', value: 36 },
                          { labelKey: 'fiveYears', value: 60 },
                          { labelKey: 'tenYears', value: 120 },
                          { labelKey: 'fifteenYears', value: 180 }
                        ].map(option => (
                          <Button
                            key={option.value}
                            variant={tenure === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTenure(option.value)}
                            className={tenure === option.value ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}
                          >
                            {t(`emi.quickOptions.${option.labelKey}`)}
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
                <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-white">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      {t('emi.sections.results')}
                      {isCalculating && (
                        <div className="ml-2 animate-spin">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      {t('emi.labels.personalizedBreakdown')}
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
                              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                  {formatCurrency(result.emi)}
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium flex items-center justify-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {t('emi.fields.monthlyEMI')}
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
                              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl border border-green-200 dark:border-green-700 shadow-lg">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                  {formatCurrency(result.totalAmount)}
                                </div>
                                <p className="text-sm text-green-800 dark:text-green-300 font-medium flex items-center justify-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {t('emi.fields.totalAmount')}
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
                              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl border border-orange-200 dark:border-orange-700 shadow-lg">
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                                  {formatCurrency(result.totalInterest)}
                                </div>
                                <p className="text-sm text-orange-800 dark:text-orange-300 font-medium flex items-center justify-center">
                                  <Percent className="h-4 w-4 mr-1" />
                                  {t('emi.fields.totalInterest')}
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
                            <div className="bg-gradient-to-r from-muted/50 to-muted/30 dark:from-muted/20 dark:to-muted/10 rounded-2xl p-6">
                              <h3 className="font-bold text-xl mb-4 flex items-center text-foreground">
                                <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                                {t('emi.labels.paymentComposition')}
                              </h3>
                              
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-background dark:bg-card rounded-xl shadow-sm">
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 shadow-sm"></div>
                                    <span className="font-medium text-foreground">{t('emi.labels.principalAmount')}</span>
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
                                
                                <div className="flex items-center justify-between p-4 bg-background dark:bg-card rounded-xl shadow-sm">
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-3 shadow-sm"></div>
                                    <span className="font-medium text-foreground">{t('emi.labels.interestAmount')}</span>
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
                                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                  <span>{tCommon('financial.principal')}</span>
                                  <span>{tCommon('financial.interest')}</span>
                                </div>
                                <div className="w-full h-6 bg-muted dark:bg-muted/50 rounded-full overflow-hidden shadow-inner">
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
                            <Alert className="border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-500 rounded-full mr-3">
                                  <Info className="h-4 w-4 text-white" />
                                </div>
                                <AlertDescription className="text-foreground leading-relaxed">
                                  <span className="block text-lg font-semibold text-foreground mb-2">{t('emi.labels.loanSummary')}</span>
                                  {t('emi.summaryText.paymentInfo', {
                                    emi: formatCurrency(result.emi),
                                    tenure: tenure,
                                    totalAmount: formatCurrency(result.totalAmount)
                                  })}
                                  <br />
                                  {t('emi.summaryText.interestInfo', {
                                    totalInterest: formatCurrency(result.totalInterest),
                                    interestPercentage: result.interestPercentage.toFixed(1) + '%'
                                  })}
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
                              {showBreakdown ? t('emi.labels.hideBreakdown') : t('emi.labels.showBreakdown')}
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
                                <h3 className="font-bold text-xl flex items-center text-foreground">
                                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                                  {t('emi.labels.monthWiseBreakdown')}
                                </h3>
                                
                                <div className="max-h-96 overflow-y-auto bg-background dark:bg-card rounded-xl shadow-lg border border-border">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-muted/80 to-muted/60 dark:from-muted/40 dark:to-muted/20 sticky top-0">
                                      <tr>
                                        <th className="p-4 text-left font-semibold text-foreground">{t('emi.tableHeaders.month')}</th>
                                        <th className="p-4 text-right font-semibold text-foreground">{t('emi.tableHeaders.emi')}</th>
                                        <th className="p-4 text-right font-semibold text-foreground">{t('emi.tableHeaders.principal')}</th>
                                        <th className="p-4 text-right font-semibold text-foreground">{t('emi.tableHeaders.interest')}</th>
                                        <th className="p-4 text-right font-semibold text-foreground">{t('emi.tableHeaders.balance')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {result.breakdown.map((row, index) => (
                                        <motion.tr 
                                          key={row.month} 
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.02 }}
                                          className={`border-b border-border hover:bg-muted/50 transition-colors ${
                                            index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                                          }`}
                                        >
                                          <td className="p-4 font-semibold text-foreground">{row.month}</td>
                                          <td className="p-4 text-right font-medium text-muted-foreground">{formatCurrency(row.emi)}</td>
                                          <td className="p-4 text-right font-medium text-blue-600">
                                            {formatCurrency(row.principal)}
                                          </td>
                                          <td className="p-4 text-right font-medium text-orange-600">
                                            {formatCurrency(row.interest)}
                                          </td>
                                          <td className="p-4 text-right font-medium text-muted-foreground">
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
                              <Calculator className="h-20 w-20 mx-auto text-muted-foreground relative" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-muted-foreground">{t('emi.placeholderContent.title')}</h3>
                              <p className="text-muted-foreground max-w-md mx-auto">
                                {t('emi.placeholderContent.description')}
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
              <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-white">{t('comparison.title')}</CardTitle>
                  <CardDescription className="text-green-100">
                    {t('comparison.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>{t('comparison.comingSoon')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="text-white">{t('comparison.rateAnalysis.title')}</CardTitle>
                  <CardDescription className="text-purple-100">
                    {t('comparison.rateAnalysis.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground">
                      <Percent className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>{t('comparison.rateAnalysis.comingSoon')}</p>
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
              <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-white">
                    <Target className="h-5 w-5 mr-2" />
                    💰 {t('tips.reduceEMI.title')}
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    {t('tips.reduceEMI.description')}
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
                          <h4 className="font-semibold text-green-800">{t(`tips.reduceEMI.items.${index}.title`)}</h4>
                          <p className="text-sm text-green-600">{t(`tips.reduceEMI.items.${index}.description`)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Important Considerations */}
              <Card className="bg-card/70 backdrop-blur-sm border-0 shadow-xl dark:bg-card/40">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-white">
                    <Info className="h-5 w-5 mr-2" />
                    🧠 {t('tips.considerations.title')}
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    {t('tips.considerations.description')}
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
                          <h4 className="font-semibold text-blue-800">{t(`tips.considerations.items.${index}.title`)}</h4>
                          <p className="text-sm text-blue-600">{t(`tips.considerations.items.${index}.description`)}</p>
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