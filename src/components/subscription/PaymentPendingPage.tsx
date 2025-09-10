'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Timer,
  Bell,
  Crown,
  Zap,
  Users,
  RefreshCw,
  Home,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import confetti from 'canvas-confetti'

interface PaymentPendingPageProps {
  selectedPlan: string
  billingCycle: 'monthly' | 'yearly'
  price: number
}

const verificationSteps = [
  {
    id: 'submitted',
    title: 'Payment Submitted',
    description: 'Your payment details have been received',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  {
    id: 'verification',
    title: 'Under Verification',
    description: 'Our team is verifying your payment',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  {
    id: 'activation',
    title: 'Account Activation',
    description: 'Activating your premium features',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  {
    id: 'complete',
    title: 'All Set!',
    description: 'Your premium subscription is active',
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
  }
]

const planFeatures = {
  pro: [
    '15 Accounts (All Types)',
    'Advanced Analytics',
    'Investment Tracking',
    'Premium Support',
    'Export Features'
  ],
  max: [
    'Unlimited Accounts',
    'Family Sharing',
    'AI-Powered Insights',
    'Priority Support',
    'All Premium Features'
  ]
}

const estimatedTimes = {
  '9-17': '30 minutes - 2 hours',  // Business hours
  '17-21': '2-6 hours',            // Evening
  '21-9': '6-12 hours'             // Night/early morning
}

export default function PaymentPendingPage({
  selectedPlan,
  billingCycle,
  price
}: PaymentPendingPageProps) {
  const router = useRouter()
  const t = useTranslations('subscription')
  const [currentStep, setCurrentStep] = useState(1) // 0-indexed
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Simulate verification progress
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    // Simulate step progression for demo
    const stepTimer = setTimeout(() => {
      if (currentStep < 1) {
        setCurrentStep(1)
      }
    }, 3000)

    return () => {
      clearInterval(timer)
      clearTimeout(stepTimer)
    }
  }, [currentStep])

  // Trigger confetti on completion
  useEffect(() => {
    if (currentStep >= 3 && !showConfetti) {
      setShowConfetti(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [currentStep, showConfetti])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    } else if (mins > 0) {
      return `${mins}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getEstimatedTime = () => {
    const hour = new Date().getHours()
    if (hour >= 9 && hour < 17) return estimatedTimes['9-17']
    if (hour >= 17 && hour < 21) return estimatedTimes['17-21']
    return estimatedTimes['21-9']
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
    toast.info('Status checked. Still processing...')
  }

  const progressPercentage = ((currentStep + 1) / verificationSteps.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="inline-flex p-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-2xl"
          >
            <CheckCircle className="h-12 w-12" />
          </motion.div>
          
          {/* Pulse rings */}
          <motion.div
            animate={{ 
              scale: [1, 1.8],
              opacity: [0.8, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity
            }}
            className="absolute inset-0 rounded-full bg-green-400 opacity-20"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.5],
              opacity: [0.6, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
            className="absolute inset-0 rounded-full bg-blue-400 opacity-20"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Payment Submitted Successfully!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            We're processing your <strong>{selectedPlan.toUpperCase()}</strong> subscription
          </p>
        </div>
      </motion.div>

      {/* Progress Section */}
      <Card className="overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Timer className="h-6 w-6 text-blue-600" />
                <span>Verification in Progress</span>
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Expected completion time: <strong>{getEstimatedTime()}</strong>
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Verification Steps */}
          <div className="space-y-4">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
                      : isCurrent
                      ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 shadow-md'
                      : 'border-slate-200 bg-slate-50 dark:bg-slate-800 opacity-60'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    isCompleted 
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-slate-300 text-slate-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isCompleted ? 'text-green-700 dark:text-green-300' : isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}>
                      {step.title}
                    </h4>
                    <p className={`text-sm ${isCompleted ? 'text-green-600 dark:text-green-400' : isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <CheckCircle className="h-6 w-6" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Refresh Status Button */}
          <div className="text-center pt-4 border-t">
            <Button
              onClick={handleRefreshStatus}
              variant="outline"
              disabled={isRefreshing}
              className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* What's Next */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
              <Sparkles className="h-5 w-5" />
              <span>What's Coming Next</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {planFeatures[selectedPlan as keyof typeof planFeatures]?.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support & Contact */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
              <Phone className="h-5 w-5" />
              <span>Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Our support team is here to help if you have any questions.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Email Support</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">support@finmate.com</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Phone Support</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">+880 1700-000000</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium text-sm">Live Chat</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Available 9 AM - 6 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Payment Processing:</strong> Your payment is being verified manually by our team. 
          This typically takes 30 minutes to 12 hours depending on the time of submission. 
          You'll receive an email confirmation once your subscription is activated.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard/subscription')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Subscription Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-500 max-w-lg mx-auto">
          You can safely close this page. We'll send you an email notification once your payment is verified and your subscription is activated.
        </p>
      </div>
    </div>
  )
}