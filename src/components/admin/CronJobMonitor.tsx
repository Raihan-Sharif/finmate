'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Calendar,
  TrendingUp,
  Play,
  Eye,
  Database
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import toast from 'react-hot-toast'

interface CronJobLog {
  id: string
  job_name: string
  status: string
  message: string
  started_at: string
  completed_at: string
  duration_seconds: number
  payments_processed: number
  reminders_created: number
  errors_count: number
}

interface CronJobStats {
  job_name: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  avg_duration_seconds: number
  last_run: string
  total_payments_processed: number
  total_reminders_created: number
}

interface CronJobStatus {
  jobname: string
  schedule: string
  active: boolean
  last_run: string
  next_run: string
}

const supabase = createClient()

const statusColors = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed_with_errors: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const statusIcons = {
  completed: CheckCircle,
  completed_with_errors: AlertTriangle,
  failed: XCircle,
  running: RefreshCw,
  healthy: CheckCircle,
  warning: AlertTriangle,
  critical: XCircle
}

export default function CronJobMonitor() {
  const [recentJobs, setRecentJobs] = useState<CronJobLog[]>([])
  const [jobStats, setJobStats] = useState<CronJobStats[]>([])
  const [jobStatus, setJobStatus] = useState<CronJobStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTriggering, setIsTriggering] = useState(false)
  const { formatAmount } = useAppStore()

  const fetchCronData = async () => {
    try {
      setIsLoading(true)

      // Fetch recent job logs
      const { data: recent, error: recentError } = await supabase
        .from('recent_cron_jobs')
        .select('*')
        .limit(10)

      if (recentError) {
        console.error('Error fetching recent jobs:', recentError)
      } else {
        setRecentJobs(recent || [])
      }

      // Fetch job statistics
      const { data: stats, error: statsError } = await supabase
        .from('cron_job_stats')
        .select('*')

      if (statsError) {
        console.error('Error fetching job stats:', statsError)
      } else {
        setJobStats(stats || [])
      }

      // Fetch job status
      const { data: status, error: statusError } = await supabase
        .rpc('get_cron_job_status')

      if (statusError) {
        console.error('Error fetching job status:', statusError.message || statusError)
      } else {
        setJobStatus(status || [])
      }

    } catch (error) {
      console.error('Error fetching cron data:', error)
      toast.error('Failed to fetch cron job data')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerManualRun = async () => {
    try {
      setIsTriggering(true)
      toast.loading('Triggering manual payment processing...')

      const { data, error } = await supabase.rpc('trigger_auto_payments_now')

      if (error) {
        throw error
      }

      if (data.success) {
        toast.success(
          `✅ Processing completed! ${data.payments_processed} payments, ${data.reminders_created} reminders`
        )
      } else {
        toast.error(`❌ Processing failed: ${data.error}`)
      }

      // Refresh data after manual run
      await fetchCronData()

    } catch (error) {
      console.error('Error triggering manual run:', error)
      toast.error('Failed to trigger manual processing')
    } finally {
      setIsTriggering(false)
    }
  }

  useEffect(() => {
    fetchCronData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCronData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Cron Job Monitor</h2>
          <p className="text-muted-foreground">Auto payment processing system status</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCronData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={triggerManualRun} 
            disabled={isTriggering}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isTriggering ? 'Processing...' : 'Manual Run'}
          </Button>
        </div>
      </div>

      {/* Job Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobStatus.map((job, index) => {
          const StatusIcon = statusIcons[job.active ? 'healthy' : 'critical']
          return (
            <motion.div
              key={job.jobname || `job-status-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{job.jobname}</h3>
                    <StatusIcon className={`h-5 w-5 ${job.active ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <span className="font-mono">{job.schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <Badge className={job.active ? statusColors.healthy : statusColors.critical}>
                        {job.active ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {job.last_run && (
                      <div className="flex justify-between">
                        <span>Last Run:</span>
                        <span>{new Date(job.last_run).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {jobStats.map((stat, index) => (
          <motion.div
            key={stat.job_name || `job-stat-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{stat.job_name}</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Runs:</span>
                    <span className="font-semibold">{stat.total_runs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-semibold text-green-600">
                      {stat.total_runs > 0 ? Math.round((stat.successful_runs / stat.total_runs) * 100) : 0}%
                    </span>
                  </div>
                  {stat.total_payments_processed > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Payments:</span>
                      <span className="font-semibold">{stat.total_payments_processed}</span>
                    </div>
                  )}
                  {stat.total_reminders_created > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Reminders:</span>
                      <span className="font-semibold">{stat.total_reminders_created}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Job Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Job Executions
          </CardTitle>
          <CardDescription>Last 10 job executions with details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.map((job, index) => {
              const StatusIcon = statusIcons[job.status as keyof typeof statusIcons] || Activity
              return (
                <motion.div
                  key={job.id || `job-log-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <StatusIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{job.job_name}</h4>
                      <p className="text-sm text-muted-foreground">{job.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(job.started_at).toLocaleString()}
                        </span>
                        {job.duration_seconds > 0 && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.duration_seconds}s
                          </span>
                        )}
                        {job.payments_processed > 0 && (
                          <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {job.payments_processed} payments
                          </span>
                        )}
                        {job.reminders_created > 0 && (
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {job.reminders_created} reminders
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.errors_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {job.errors_count} errors
                      </Badge>
                    )}
                    <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </motion.div>
              )
            })}
            
            {recentJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent job executions found</p>
                <p className="text-sm">Jobs will appear here once they start running</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}