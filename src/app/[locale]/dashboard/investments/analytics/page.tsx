'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Shield,
  AlertCircle,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestmentChart } from '@/components/investments/InvestmentChart';
import { InvestmentDashboardStats } from '@/components/investments/InvestmentDashboardStats';
import { useInvestmentAnalytics, useInvestmentDashboard } from '@/hooks/useInvestmentAnalytics';
import { formatCurrency } from '@/lib/utils';

export default function InvestmentAnalyticsPage() {
  const t = useTranslations('investments.analytics');
  const tCommon = useTranslations('common');
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [activeTab, setActiveTab] = useState('performance');

  const dashboard = useInvestmentDashboard();
  const analytics = useInvestmentAnalytics();

  // Mock data for charts
  const mockPerformanceData = [
    { date: '2024-01', value: 50000, invested: 45000, gain_loss: 5000 },
    { date: '2024-02', value: 52000, invested: 47000, gain_loss: 5000 },
    { date: '2024-03', value: 48000, invested: 49000, gain_loss: -1000 },
    { date: '2024-04', value: 55000, invested: 51000, gain_loss: 4000 },
    { date: '2024-05', value: 58000, invested: 53000, gain_loss: 5000 },
    { date: '2024-06', value: 62000, invested: 55000, gain_loss: 7000 },
    { date: '2024-07', value: 59000, invested: 57000, gain_loss: 2000 },
    { date: '2024-08', value: 65000, invested: 59000, gain_loss: 6000 },
    { date: '2024-09', value: 68000, invested: 61000, gain_loss: 7000 },
    { date: '2024-10', value: 72000, invested: 63000, gain_loss: 9000 },
    { date: '2024-11', value: 75000, invested: 65000, gain_loss: 10000 },
    { date: '2024-12', value: 78000, invested: 67000, gain_loss: 11000 }
  ];

  const mockAssetAllocation = [
    { name: 'Stocks', value: 35000, percentage: 44.9, color: '#3B82F6', type: 'equity' },
    { name: 'DPS/FD', value: 18000, percentage: 23.1, color: '#10B981', type: 'fixed_income' },
    { name: 'Real Estate', value: 12000, percentage: 15.4, color: '#F59E0B', type: 'real_estate' },
    { name: 'Gold', value: 8000, percentage: 10.3, color: '#EF4444', type: 'commodity' },
    { name: 'SIP Funds', value: 5000, percentage: 6.4, color: '#8B5CF6', type: 'mutual_fund' }
  ];

  const mockMonthlyTrend = [
    { month: 'Jan', invested: 45000, current_value: 50000, gain_loss: 5000, return_percentage: 11.1 },
    { month: 'Feb', invested: 47000, current_value: 52000, gain_loss: 5000, return_percentage: 10.6 },
    { month: 'Mar', invested: 49000, current_value: 48000, gain_loss: -1000, return_percentage: -2.0 },
    { month: 'Apr', invested: 51000, current_value: 55000, gain_loss: 4000, return_percentage: 7.8 },
    { month: 'May', invested: 53000, current_value: 58000, gain_loss: 5000, return_percentage: 9.4 },
    { month: 'Jun', invested: 55000, current_value: 62000, gain_loss: 7000, return_percentage: 12.7 },
    { month: 'Jul', invested: 57000, current_value: 59000, gain_loss: 2000, return_percentage: 3.5 },
    { month: 'Aug', invested: 59000, current_value: 65000, gain_loss: 6000, return_percentage: 10.2 },
    { month: 'Sep', invested: 61000, current_value: 68000, gain_loss: 7000, return_percentage: 11.5 },
    { month: 'Oct', invested: 63000, current_value: 72000, gain_loss: 9000, return_percentage: 14.3 },
    { month: 'Nov', invested: 65000, current_value: 75000, gain_loss: 10000, return_percentage: 15.4 },
    { month: 'Dec', invested: 67000, current_value: 78000, gain_loss: 11000, return_percentage: 16.4 }
  ];

  // Mock dashboard stats
  const mockDashboardStats = {
    total_portfolios: 3,
    total_investments: 12,
    total_invested: 67000,
    total_current_value: 78000,
    total_gain_loss: 11000,
    total_return_percentage: 16.42,
    dividend_income: 3500,
    active_sips: 5,
    monthly_sip_amount: 12000,
    top_performing_investment: {
      name: 'Grameenphone Share',
      current_value: 18000,
      gain_loss_percentage: 24.5
    },
    worst_performing_investment: {
      name: 'AB Bank Bond',
      current_value: 8000,
      gain_loss_percentage: -2.1
    },
    upcoming_executions: []
  };

  const AnalyticsCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color,
    description 
  }: {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: any;
    color: string;
    description?: string;
  }) => (
    <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", `bg-gradient-to-br ${color}`)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <Badge 
            variant={changeType === 'positive' ? 'default' : changeType === 'negative' ? 'destructive' : 'secondary'}
            className="font-semibold"
          >
            {changeType === 'positive' ? '+' : changeType === 'negative' ? '' : ''}{change}
          </Badge>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const RiskAnalysisCard = () => (
    <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span>Risk Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Portfolio Risk Score</span>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600">
              6.2 / 10 (Medium)
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: '62%' }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Diversification Score</span>
            <span className="font-semibold text-green-600">8.4 / 10</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Volatility</span>
            <span className="font-semibold text-orange-600">Medium</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Beta</span>
            <span className="font-semibold text-blue-600">1.15</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-gray-600">
              Consider reducing high-risk investments to 60% of portfolio
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SIPAnalysisCard = () => (
    <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-green-600" />
          <span>SIP Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">5</p>
            <p className="text-xs text-green-700">Active SIPs</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">₹12,000</p>
            <p className="text-xs text-blue-700">Monthly Amount</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Avg. SIP Return</span>
            <span className="font-semibold text-green-600">+14.2%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Best Performing SIP</span>
            <span className="font-semibold text-green-600">+22.1%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total SIP Invested</span>
            <span className="font-semibold text-gray-900">₹45,000</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <Button variant="outline" size="sm" className="w-full">
            <Target className="h-4 w-4 mr-2" />
            View SIP Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <AnalyticsCard
          title="Total Return"
          value="₹11,000"
          change="16.42%"
          changeType="positive"
          icon={TrendingUp}
          color="from-green-500 to-emerald-600"
          description="Overall portfolio gain"
        />
        <AnalyticsCard
          title="Annual Return"
          value="18.7%"
          change="2.3%"
          changeType="positive"
          icon={BarChart3}
          color="from-blue-500 to-indigo-600"
          description="Year-over-year return"
        />
        <AnalyticsCard
          title="Dividend Earned"
          value="₹3,500"
          change="₹450"
          changeType="positive"
          icon={DollarSign}
          color="from-purple-500 to-violet-600"
          description="This quarter"
        />
        <AnalyticsCard
          title="Portfolio Beta"
          value="1.15"
          change="0.08"
          changeType="neutral"
          icon={Activity}
          color="from-orange-500 to-red-600"
          description="Market correlation"
        />
      </motion.div>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-gray-200">
            <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="allocation" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <PieChart className="h-4 w-4 mr-2" />
              Allocation
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Shield className="h-4 w-4 mr-2" />
              Risk Analysis
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-8">
          <InvestmentChart
            chartType="performance"
            performanceData={mockPerformanceData}
            currency="BDT"
            height={400}
            title="Portfolio Performance Over Time"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskAnalysisCard />
            <SIPAnalysisCard />
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InvestmentChart
              chartType="allocation"
              assetAllocation={mockAssetAllocation}
              currency="BDT"
              height={400}
              title="Asset Allocation"
            />
            
            <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle>Allocation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAssetAllocation.map((asset, index) => (
                  <motion.div
                    key={asset.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: asset.color }}
                      />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(asset.value, 'BDT')}</p>
                      <p className="text-sm text-gray-500">{asset.percentage.toFixed(1)}%</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6 mt-8">
          <InvestmentChart
            chartType="trend"
            monthlyTrend={mockMonthlyTrend}
            currency="BDT"
            height={400}
            title="Monthly Investment Trends"
          />
          
          <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">+16.4%</p>
                  <p className="text-xs text-blue-700">Best Month</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">-2.0%</p>
                  <p className="text-xs text-red-700">Worst Month</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">9.2%</p>
                  <p className="text-xs text-green-700">Avg Monthly</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">3.8%</p>
                  <p className="text-xs text-purple-700">Volatility</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskAnalysisCard />
            
            <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Investment Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-800">Increase Fixed Income</p>
                    <p className="text-xs text-green-600">Consider adding 10% more bonds for stability</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-800">Rebalance Portfolio</p>
                    <p className="text-xs text-blue-600">Equity allocation is slightly high at 45%</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-sm font-medium text-yellow-800">Monitor SIP Performance</p>
                    <p className="text-xs text-yellow-600">Review underperforming SIP plans</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle>Tax Planning Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">₹1,200</p>
                  <p className="text-sm text-blue-700">Estimated Tax Liability</p>
                  <p className="text-xs text-gray-600">On capital gains</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">₹8,500</p>
                  <p className="text-sm text-green-700">Tax Saved (80C)</p>
                  <p className="text-xs text-gray-600">Through investments</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">₹2,100</p>
                  <p className="text-sm text-purple-700">Potential Savings</p>
                  <p className="text-xs text-gray-600">With optimization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}