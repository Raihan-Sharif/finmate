'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { 
  Building,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Bell,
  FileText,
  X,
  Calculator,
  Car,
  GraduationCap,
  Briefcase,
  Home
} from 'lucide-react'
import { LOAN_TYPES, Loan } from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useTranslations } from 'next-intl'

const loanTypeIcons = {
  personal: CreditCard,
  home: Home,
  car: Car,
  education: GraduationCap,
  business: Briefcase,
  purchase_emi: CreditCard,
  credit_card: CreditCard,
  other: FileText
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

interface LoanViewModalProps {
  loan: Loan | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function LoanViewModal({ loan, isOpen, onClose, onEdit, onDelete }: LoanViewModalProps) {
  const { formatAmount } = useAppStore()
  const t = useTranslations('credit')
  const tCommon = useTranslations('common')

  if (!loan) return null

  const IconComponent = loanTypeIcons[loan.type]
  const loanTypeLabel = LOAN_TYPES.find(t => t.value === loan.type)?.label
  const isOverdue = loan.status === 'active' && loan.next_due_date && new Date(loan.next_due_date) < new Date()
  
  // Calculate progress
  const totalPaid = loan.principal_amount - loan.outstanding_amount
  const progress = (totalPaid / loan.principal_amount) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{loan.lender}</h3>
                <p className="text-sm text-muted-foreground">{tCommon(`types.${loan.type}`) || loanTypeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[loan.status]}>
                {tCommon(`status.${loan.status}`) || loan.status}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {tCommon('status.overdue')}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {t('bankLoans.viewLoan')} - {tCommon(`types.${loan.type}`) || loanTypeLabel?.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {formatAmount(loan.emi_amount)}
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {tCommon('financial.monthlyEmi')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {formatAmount(loan.outstanding_amount)}
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-300 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {tCommon('financial.outstanding')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {loan.interest_rate}%
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center justify-center">
                    <Percent className="h-4 w-4 mr-1" />
                    {tCommon('interestRate')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-primary" />
                  {tCommon('loanProgress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>{tCommon('amountPaid')}: {formatAmount(totalPaid)}</span>
                    <span>{tCommon('financial.outstanding')}: {formatAmount(loan.outstanding_amount)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 0.6, duration: 1 }}
                      className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {progress.toFixed(1)}% {tCommon('completed')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loan Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Building className="h-5 w-5 mr-2 text-primary" />
                    {tCommon('loanDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{tCommon('principalAmount')}</p>
                      <p className="font-semibold">{formatAmount(loan.principal_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('tenure')}</p>
                      <p className="font-semibold">{loan.tenure_months} {tCommon('timeUnits.months')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('startDate')}</p>
                      <p className="font-semibold">{new Date(loan.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('paymentDay')}</p>
                      <p className="font-semibold">{loan.payment_day || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('autoDebit')}</p>
                      <p className="font-semibold flex items-center">
                        {loan.auto_debit ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            {tCommon('enabled')}
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1 text-red-600" />
                            {tCommon('disabled')}
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('reminderDays')}</p>
                      <p className="font-semibold flex items-center">
                        <Bell className="h-4 w-4 mr-1" />
                        {loan.reminder_days || 0} {tCommon('timeUnits.days')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    {tCommon('paymentInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">{tCommon('nextDueDate')}</p>
                      <p className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                        {loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : 'N/A'}
                        {isOverdue && (
                          <span className="ml-2 text-red-600 text-xs">({tCommon('status.overdue')})</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('lastPayment')}</p>
                      <p className="font-semibold">
                        {loan.last_payment_date ? new Date(loan.last_payment_date).toLocaleDateString() : tCommon('noPaymentsYet')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon('prepaymentAmount')}</p>
                      <p className="font-semibold">
                        {loan.prepayment_amount ? formatAmount(loan.prepayment_amount) : tCommon('none')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{tCommon('totalInterestCost')}</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatAmount((loan.emi_amount * loan.tenure_months) - loan.principal_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tCommon('totalRepayment')}: {formatAmount(loan.emi_amount * loan.tenure_months)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Notes */}
          {loan.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    {tCommon('notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {loan.notes}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-end gap-3"
          >
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                {tCommon('actions.edit')}
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                {tCommon('actions.delete')}
              </Button>
            )}
            <Button onClick={onClose}>
              {tCommon('actions.close')}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}