'use client'

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
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/stores/useAppStore'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  FileText,
  Package,
  ShoppingCart,
  Trash2
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PurchaseEMIViewModalProps {
  emi: any | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function PurchaseEMIViewModal({
  emi,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: PurchaseEMIViewModalProps) {
  const { formatAmount } = useAppStore()
  const t = useTranslations('credit')
  const tCommon = useTranslations('common')

  if (!emi) return null

  const getItemName = (notes: string | null | undefined): string => {
    if (!notes) return t('common.placeholders.notSpecified')
    const match = notes.match(/Item: (.+?)(\n|$)/)
    return match ? match[1] || t('common.placeholders.notSpecified') : t('common.placeholders.notSpecified')
  }

  const isOverdue = emi.status === 'active' && emi.next_due_date && new Date(emi.next_due_date) < new Date()
  const progressPercentage = ((emi.principal_amount - emi.outstanding_amount) / emi.principal_amount) * 100

  const calculateTotalPaid = () => {
    return emi.principal_amount - emi.outstanding_amount
  }

  const getRemainingMonths = () => {
    if (emi.outstanding_amount <= 0) return 0
    return Math.ceil(emi.outstanding_amount / emi.emi_amount)
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('purchaseEmi.viewDetails')}
          </DialogTitle>
          <DialogDescription>
            {t('purchaseEmi.completeInformation')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{getItemName(emi.notes)}</h3>
              <p className="text-muted-foreground">{emi.lender}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[emi.status as keyof typeof statusColors]}>
                  {tCommon(`status.${emi.status}`) || emi.status}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">
                    {tCommon('overdue')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatAmount(emi.emi_amount)}</p>
              <p className="text-sm text-muted-foreground">{tCommon('monthlyEmi')}</p>
            </div>
          </div>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t('purchaseEmi.paymentProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{tCommon('progress')}</span>
                  <span>{progressPercentage.toFixed(1)}% {tCommon('completed')}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(calculateTotalPaid())}</p>
                    <p className="text-xs text-muted-foreground">{t('purchaseEmi.paidAmount')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{formatAmount(emi.outstanding_amount)}</p>
                    <p className="text-xs text-muted-foreground">{tCommon('outstanding')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{getRemainingMonths()}</p>
                    <p className="text-xs text-muted-foreground">{t('purchaseEmi.monthsLeft')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {tCommon('financialDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('principalAmount')}:</span>
                  <span className="font-semibold">{formatAmount(emi.principal_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('interestRate')}:</span>
                  <span className="font-semibold">{emi.interest_rate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('tenure')}:</span>
                  <span className="font-semibold">{emi.tenure_months} {tCommon('timeUnits.months')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('monthlyEmi')}:</span>
                  <span className="font-semibold text-primary">{formatAmount(emi.emi_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('outstanding')}:</span>
                  <span className="font-semibold text-orange-600">{formatAmount(emi.outstanding_amount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('purchaseEmi.datesSchedule')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('startDate')}:</span>
                  <span className="font-semibold">{new Date(emi.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('nextDueDate')}:</span>
                  <span className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                    {emi.next_due_date ? new Date(emi.next_due_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('paymentDay')}:</span>
                  <span className="font-semibold">{emi.payment_day || tCommon('notSet')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('autoDebit')}:</span>
                  <span className={`font-semibold ${emi.auto_debit ? 'text-green-600' : 'text-gray-600'}`}>
                    {emi.auto_debit ? tCommon('enabled') : tCommon('disabled')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCommon('reminderDays')}:</span>
                  <span className="font-semibold">{emi.reminder_days || 3} {t('common.days') || 'days'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('purchaseEmi.purchaseInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('purchaseEmi.storeVendor')}:</span>
                    <span className="font-semibold">{emi.lender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('purchaseEmi.purchaseDate')}:</span>
                    <span className="font-semibold">{new Date(emi.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('purchaseEmi.emiType')}:</span>
                    <span className="font-semibold">{t('purchaseEmi.title')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tCommon('currency')}:</span>
                    <span className="font-semibold">{emi.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tCommon('created')}:</span>
                    <span className="font-semibold">{new Date(emi.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tCommon('lastUpdated')}:</span>
                    <span className="font-semibold">{new Date(emi.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {emi.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {tCommon('notes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{emi.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {isOverdue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">{t('purchaseEmi.overduePayment')}</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t('purchaseEmi.overduePaymentMessage')}
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {tCommon('close')}
            </Button>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {tCommon('edit')}
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {tCommon('delete')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}