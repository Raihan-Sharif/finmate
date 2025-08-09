'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTheme } from 'next-themes';

// Chart data types
interface PerformanceData {
  date: string;
  value: number;
  invested: number;
  gain_loss: number;
}

interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  color: string;
  type: string;
}

interface MonthlyTrend {
  month: string;
  invested: number;
  current_value: number;
  gain_loss: number;
  return_percentage: number;
}

interface InvestmentChartProps {
  performanceData?: PerformanceData[];
  assetAllocation?: AssetAllocation[];
  monthlyTrend?: MonthlyTrend[];
  chartType?: 'performance' | 'allocation' | 'trend' | 'comparison';
  title?: string;
  currency?: string;
  height?: number;
  className?: string;
  isLoading?: boolean;
}

// Custom tooltip components
const PerformanceTooltip = ({ active, payload, label, currency = 'BDT', theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        "backdrop-blur-md border rounded-lg p-4 shadow-lg",
        theme === 'dark' 
          ? 'bg-gray-800/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      )}>
        <p className={cn(
          "font-semibold mb-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {formatCurrency(entry.value, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AllocationTooltip = ({ active, payload, currency = 'BDT', theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={cn(
        "backdrop-blur-md border rounded-lg p-4 shadow-lg",
        theme === 'dark' 
          ? 'bg-gray-800/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      )}>
        <p className={cn(
          "font-semibold mb-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>{data.name}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>Value:</span>
            <span className={cn(
              "font-semibold",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>{formatCurrency(data.value, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>Percentage:</span>
            <span className={cn(
              "font-semibold",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>{data.percentage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>Type:</span>
            <Badge variant="outline" className="text-xs">
              {data.type}
            </Badge>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Chart components
const PerformanceChart = ({ 
  data, 
  currency, 
  height,
  theme 
}: { 
  data: PerformanceData[], 
  currency: string, 
  height: number,
  theme: string | undefined 
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
        </linearGradient>
        <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} className="opacity-30" />
      <XAxis 
        dataKey="date" 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
        tickFormatter={(value) => formatCurrency(value, currency, true)}
      />
      <Tooltip content={<PerformanceTooltip currency={currency} theme={theme} />} />
      <Area
        type="monotone"
        dataKey="invested"
        stroke="#10B981"
        strokeWidth={2}
        fill="url(#investedGradient)"
        name="Total Invested"
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke="#3B82F6"
        strokeWidth={2}
        fill="url(#valueGradient)"
        name="Current Value"
      />
    </AreaChart>
  </ResponsiveContainer>
);

const AllocationChart = ({ 
  data, 
  currency, 
  height,
  theme 
}: { 
  data: AssetAllocation[], 
  currency: string, 
  height: number,
  theme: string | undefined 
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={120}
        paddingAngle={2}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={entry.color}
            stroke={entry.color}
            strokeWidth={2}
          />
        ))}
      </Pie>
      <Tooltip content={<AllocationTooltip currency={currency} theme={theme} />} />
    </PieChart>
  </ResponsiveContainer>
);

const TrendChart = ({ 
  data, 
  currency, 
  height,
  theme 
}: { 
  data: MonthlyTrend[], 
  currency: string, 
  height: number,
  theme: string | undefined 
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} className="opacity-30" />
      <XAxis 
        dataKey="month" 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
        tickFormatter={(value) => formatCurrency(value, currency, true)}
      />
      <Tooltip content={<PerformanceTooltip currency={currency} theme={theme} />} />
      <Bar 
        dataKey="invested" 
        fill="#10B981" 
        name="Invested"
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="current_value" 
        fill="#3B82F6" 
        name="Current Value"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);

export function InvestmentChart({
  performanceData = [],
  assetAllocation = [],
  monthlyTrend = [],
  chartType = 'performance',
  title,
  currency = 'BDT',
  height = 300,
  className,
  isLoading = false
}: InvestmentChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [selectedMetric, setSelectedMetric] = useState('value');
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <Card className={cn(
        "border-0 backdrop-blur-md shadow-lg",
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-900/90'
          : 'bg-gradient-to-br from-white via-white/95 to-white/90',
        className
      )}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className={cn(
              "h-6 rounded mb-4 w-1/3",
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            )} />
            <div className={cn(
              "h-64 rounded",
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            )} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChartIcon = () => {
    switch (chartType) {
      case 'allocation': return <PieChartIcon className="h-5 w-5" />;
      case 'trend': return <BarChart3 className="h-5 w-5" />;
      case 'comparison': return <Activity className="h-5 w-5" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getChartTitle = () => {
    if (title) return title;
    switch (chartType) {
      case 'performance': return 'Portfolio Performance';
      case 'allocation': return 'Asset Allocation';
      case 'trend': return 'Monthly Trend';
      case 'comparison': return 'Investment Comparison';
      default: return 'Investment Chart';
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'allocation':
        return <AllocationChart data={assetAllocation} currency={currency} height={height} theme={theme} />;
      case 'trend':
        return <TrendChart data={monthlyTrend} currency={currency} height={height} theme={theme} />;
      case 'performance':
      default:
        return <PerformanceChart data={performanceData} currency={currency} height={height} theme={theme} />;
    }
  };

  const renderChartStats = () => {
    if (chartType === 'performance' && performanceData.length > 0) {
      const latest = performanceData[performanceData.length - 1];
      const firstValue = performanceData[0]?.value || 0;
      const change = latest.value - firstValue;
      const changePercent = firstValue > 0 ? ((change / firstValue) * 100) : 0;
      const isPositive = change >= 0;

      return (
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className={cn(
              "text-2xl font-bold",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {formatCurrency(latest.value, currency)}
            </p>
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (chartType === 'allocation' && assetAllocation.length > 0) {
      const totalValue = assetAllocation.reduce((sum, item) => sum + item.value, 0);
      const topAsset = assetAllocation.reduce((prev, current) => 
        prev.value > current.value ? prev : current
      );

      return (
        <div className="text-right">
          <p className={cn(
            "text-2xl font-bold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {formatCurrency(totalValue, currency)}
          </p>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>
            Top: {topAsset.name} ({topAsset.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }

    if (chartType === 'trend' && monthlyTrend.length > 0) {
      const latest = monthlyTrend[monthlyTrend.length - 1];
      const isPositive = latest.gain_loss >= 0;

      return (
        <div className="text-right">
          <p className={cn(
            "text-2xl font-bold",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {formatCurrency(latest.current_value, currency)}
          </p>
          <div className="flex items-center space-x-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? '+' : ''}{latest.return_percentage.toFixed(2)}%
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderLegend = () => {
    if (chartType === 'allocation' && assetAllocation.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {assetAllocation.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className={cn(
                "text-sm truncate",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {item.name} ({item.percentage.toFixed(1)}%)
              </span>
            </motion.div>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = () => {
    switch (chartType) {
      case 'performance': return performanceData.length > 0;
      case 'allocation': return assetAllocation.length > 0;
      case 'trend': return monthlyTrend.length > 0;
      default: return false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={cn(
        "border-0 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300",
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-900/90'
          : 'bg-gradient-to-br from-white via-white/95 to-white/90'
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white"
              >
                {getChartIcon()}
              </motion.div>
              <CardTitle className={cn(
                "text-xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {getChartTitle()}
              </CardTitle>
            </div>
            
            {renderChartStats()}
          </div>
          
          {/* Chart Controls */}
          <div className="flex items-center space-x-4 pt-4">
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

            {chartType === 'performance' && (
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Current Value</SelectItem>
                  <SelectItem value="gain_loss">Gain/Loss</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {hasData() ? (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {renderChart()}
              </motion.div>
              
              {renderLegend()}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                )}>
                  {getChartIcon()}
                </div>
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>No data available</h3>
                <p className={cn(
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  Start investing to see your performance charts
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/5 to-transparent rounded-full blur-xl" />
      </Card>
    </motion.div>
  );
}