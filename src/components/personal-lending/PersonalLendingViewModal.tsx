'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Users,
  HandHeart,
  Banknote,
  User,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus,
  History
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useLending } from '@/hooks/useLending'
import { useAccounts } from '@/hooks/useAccounts'

interface PersonalLendingViewModalProps {
  lending: any | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddPayment: () => void
}

export default function PersonalLendingViewModal({
  lending,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddPayment
}: PersonalLendingViewModalProps) {
  const { formatAmount } = useAppStore()
  const { getLendingPayments } = useLending()
  const { accounts } = useAccounts()
  const [payments, setPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  useEffect(() => {
    if (lending && isOpen) {
      loadPayments()
    }
  }, [lending, isOpen])

  const loadPayments = async () => {
    if (!lending) return
    setLoadingPayments(true)
    try {
      const result = await getLendingPayments(lending.id)
      if (result.success) {
        // Sort payments by date to ensure consistency and remove any potential duplicates by transaction_id
        const uniquePayments = (result.data || []).filter((payment, index, arr) => 
          index === arr.findIndex(p => p.transaction_id === payment.transaction_id)
        )
        setPayments(uniquePayments)
      }
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  if (!lending) return null

  const isOverdue = lending.due_date && lending.status !== 'paid' && new Date(lending.due_date) < new Date()
  const progressPercentage = ((lending.amount - lending.pending_amount) / lending.amount) * 100
  const paidAmount = lending.amount - lending.pending_amount

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const typeColors = {
    lent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    borrowed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personal Lending Details
          </DialogTitle>
          <DialogDescription>
            Complete information about your {lending.type === 'lent' ? 'lending' : 'borrowing'} record
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{lending.person_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={typeColors[lending.type as keyof typeof typeColors]}>
                  {lending.type === 'lent' ? 'Money Lent' : 'Money Borrowed'}
                </Badge>
                <Badge className={statusColors[lending.status as keyof typeof statusColors]}>
                  {lending.status}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatAmount(lending.pending_amount)}</p>
              <p className="text-sm text-muted-foreground">Remaining Amount</p>
            </div>
          </div>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Payment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(1)}% completed</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {lending.type === 'lent' ? 'Received Back' : 'Paid Back'}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{formatAmount(lending.pending_amount)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{formatAmount(lending.amount)}</p>
                    <p className="text-xs text-muted-foreground">Original Amount</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial and Date Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Amount:</span>
                  <span className="font-semibold">{formatAmount(lending.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Amount:</span>
                  <span className="font-semibold text-orange-600">{formatAmount(lending.pending_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-semibold text-green-600">{formatAmount(paidAmount)}</span>
                </div>
                {lending.interest_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-semibold">{lending.interest_rate}% per year</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-semibold">{lending.currency}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lending.type === 'lent' ? 'Lent Date:' : 'Borrowed Date:'}
                  </span>
                  <span className="font-semibold">{new Date(lending.date).toLocaleDateString()}</span>
                </div>
                {lending.due_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                      {new Date(lending.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reminder Days:</span>
                  <span className="font-semibold">{lending.reminder_days || 7} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-semibold">{new Date(lending.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-semibold">{new Date(lending.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          {lending.contact_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lending.contact_info.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{lending.contact_info.phone}</span>
                    </div>
                  )}
                  {lending.contact_info.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{lending.contact_info.email}</span>
                    </div>
                  )}
                  {lending.contact_info.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{lending.contact_info.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Payment History ({payments.length})
                </div>
                {lending.status !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={onAddPayment}
                    className={`${
                      lending.type === 'lent' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading payments...</p>
                </div>
              ) : payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{formatAmount(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                            {payment.account_id && (() => {
                              const account = accounts?.find(acc => acc.id === payment.account_id)
                              return account ? ` • ${account.name}` : ''
                            })()}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            Payment #{payments.length - index}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No payments recorded yet</p>
                  <p className="text-sm">
                    {lending.type === 'lent' 
                      ? 'Record payments as you receive them back from ' + lending.person_name
                      : 'Record payments as you pay back ' + lending.person_name
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lending.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lending.notes}</p>
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
                <span className="font-semibold">Overdue</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This {lending.type === 'lent' ? 'lending' : 'borrowing'} is overdue. 
                {lending.type === 'lent' 
                  ? ` Follow up with ${lending.person_name} for repayment.`
                  : ` Make the payment to ${lending.person_name} as soon as possible.`
                }
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-3">
              {lending.status !== 'paid' && (
                <Button
                  onClick={onAddPayment}
                  className={`${
                    lending.type === 'lent' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              )}
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}