'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Plus,
  Search,
  Filter,
  Clock,
  Zap,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SIPTemplateCard } from '@/components/investments/SIPTemplateCard';
import { CreateSIPForm } from '@/components/investments/CreateSIPForm';
import { useSIPTemplates, useCreateInvestmentTemplate } from '@/hooks/useInvestmentTemplates';
import { useInvestmentPortfolios } from '@/hooks/useInvestmentPortfolios';
import { formatCurrency } from '@/lib/utils';

export default function SIPManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: sipTemplates = [], isLoading } = useSIPTemplates();
  const { data: portfolios = [], isLoading: portfoliosLoading } = useInvestmentPortfolios();
  const createSIPMutation = useCreateInvestmentTemplate();

  // Filter SIPs based on search and status
  const filteredSIPs = sipTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.investment_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && template.is_active) ||
                         (statusFilter === 'paused' && !template.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate SIP statistics
  const stats = {
    totalSIPs: sipTemplates.length,
    activeSIPs: sipTemplates.filter(s => s.is_active).length,
    pausedSIPs: sipTemplates.filter(s => !s.is_active).length,
    monthlyAmount: sipTemplates
      .filter(s => s.is_active && s.frequency === 'monthly')
      .reduce((sum, s) => sum + s.amount, 0),
    totalInvested: sipTemplates.reduce((sum, s) => sum + (s.executed_count || 0) * s.amount, 0),
    upcomingExecutions: sipTemplates
      .filter(s => s.is_active && s.next_execution_date)
      .filter(s => {
        const nextDate = new Date(s.next_execution_date!);
        const now = new Date();
        const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length
  };

  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color,
    delay = 0 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-white/95 to-white/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                `bg-gradient-to-br ${color}`
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Show create form if requested
  if (showCreateForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CreateSIPForm
          portfolios={portfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
          onSubmit={async (data) => {
            try {
              console.log('SIP Management: Submitting SIP data:', data);
              const result = await createSIPMutation.mutateAsync(data);
              console.log('SIP Management: SIP creation result:', result);
              setShowCreateForm(false);
            } catch (error: any) {
              console.error('SIP Management: Failed to create SIP:', error);
              console.error('SIP Management: Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
              });
            }
          }}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createSIPMutation.isPending}
        />
      </div>
    );
  }

  const QuickActions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap gap-3"
    >
      <Button 
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => {
          console.log('🎯 SIP MANAGEMENT: Create SIP button clicked!');
          setShowCreateForm(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create SIP
      </Button>
      <Button variant="outline" className="hover:bg-white/70">
        <Play className="h-4 w-4 mr-2" />
        Bulk Resume
      </Button>
      <Button variant="outline" className="hover:bg-white/70">
        <Pause className="h-4 w-4 mr-2" />
        Bulk Pause
      </Button>
      <Button variant="ghost">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </motion.div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SIP Management</h1>
          <p className="text-gray-600">Manage your systematic investment plans</p>
        </div>
        <QuickActions />
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total SIPs"
          value={stats.totalSIPs}
          subtitle={`${stats.activeSIPs} active, ${stats.pausedSIPs} paused`}
          icon={Zap}
          color="from-blue-500 to-indigo-600"
          delay={0}
        />
        <StatsCard
          title="Monthly Investment"
          value={formatCurrency(stats.monthlyAmount, 'BDT')}
          subtitle="Active SIP amount"
          icon={Calendar}
          color="from-green-500 to-emerald-600"
          delay={0.1}
        />
        <StatsCard
          title="Total Invested"
          value={formatCurrency(stats.totalInvested, 'BDT')}
          subtitle="Via SIP executions"
          icon={DollarSign}
          color="from-purple-500 to-violet-600"
          delay={0.2}
        />
        <StatsCard
          title="Upcoming (7 days)"
          value={stats.upcomingExecutions}
          subtitle="Executions due"
          icon={Clock}
          color="from-orange-500 to-red-600"
          delay={0.3}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Activity className="h-4 w-4 mr-2" />
              SIP Overview
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Play className="h-4 w-4 mr-2" />
              Active SIPs
            </TabsTrigger>
            <TabsTrigger value="paused" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Pause className="h-4 w-4 mr-2" />
              Paused SIPs
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex items-center justify-between py-6"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search SIP plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-80"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SIPs</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="paused">Paused Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {filteredSIPs.length} SIPs found
            </Badge>
          </div>
        </motion.div>

        {/* SIP Lists */}
        <TabsContent value="overview" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
              ))
            ) : filteredSIPs.length > 0 ? (
              filteredSIPs.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SIPTemplateCard
                    template={template}
                    onView={(t) => console.log('View SIP:', t)}
                    onEdit={(t) => console.log('Edit SIP:', t)}
                    onDelete={(t) => console.log('Delete SIP:', t)}
                    onToggleStatus={(t) => console.log('Toggle SIP:', t)}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SIP plans found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Create your first systematic investment plan'}
                </p>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={() => {
                    console.log('🎯 SIP MANAGEMENT: Empty state Create SIP button clicked!');
                    setShowCreateForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create SIP
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSIPs
              .filter(template => template.is_active)
              .map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SIPTemplateCard
                    template={template}
                    onView={(t) => console.log('View SIP:', t)}
                    onEdit={(t) => console.log('Edit SIP:', t)}
                    onDelete={(t) => console.log('Delete SIP:', t)}
                    onToggleStatus={(t) => console.log('Toggle SIP:', t)}
                  />
                </motion.div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="paused" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSIPs
              .filter(template => !template.is_active)
              .map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SIPTemplateCard
                    template={template}
                    onView={(t) => console.log('View SIP:', t)}
                    onEdit={(t) => console.log('Edit SIP:', t)}
                    onDelete={(t) => console.log('Delete SIP:', t)}
                    onToggleStatus={(t) => console.log('Toggle SIP:', t)}
                  />
                </motion.div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}