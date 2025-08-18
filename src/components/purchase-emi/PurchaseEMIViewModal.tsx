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
  ShoppingCart,
  Package,
  Store,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'

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

  if (!emi) return null

  const getItemName = (notes: string | null | undefined): string => {
    if (!notes) return 'Unknown Item'
    const match = notes.match(/Item: (.+?)(\n|$)/)
    return match ? match[1] || 'Unknown Item' : 'Unknown Item'
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
            Purchase EMI Details
          </DialogTitle>
          <DialogDescription>
            Complete information about your purchase EMI
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
                  {emi.status}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatAmount(emi.emi_amount)}</p>
              <p className="text-sm text-muted-foreground">Monthly EMI</p>
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
                    <p className="text-2xl font-bold text-green-600">{formatAmount(calculateTotalPaid())}</p>
                    <p className="text-xs text-muted-foreground">Paid Amount</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{formatAmount(emi.outstanding_amount)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{getRemainingMonths()}</p>
                    <p className="text-xs text-muted-foreground">Months Left</p>
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
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Principal Amount:</span>
                  <span className="font-semibold">{formatAmount(emi.principal_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="font-semibold">{emi.interest_rate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure:</span>
                  <span className="font-semibold">{emi.tenure_months} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly EMI:</span>
                  <span className="font-semibold text-primary">{formatAmount(emi.emi_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding:</span>
                  <span className="font-semibold text-orange-600">{formatAmount(emi.outstanding_amount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-semibold">{new Date(emi.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Due Date:</span>
                  <span className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                    {emi.next_due_date ? new Date(emi.next_due_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Day:</span>
                  <span className="font-semibold">{emi.payment_day || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto Debit:</span>
                  <span className={`font-semibold ${emi.auto_debit ? 'text-green-600' : 'text-gray-600'}`}>
                    {emi.auto_debit ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reminder Days:</span>
                  <span className="font-semibold">{emi.reminder_days || 3} days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store/Vendor:</span>
                    <span className="font-semibold">{emi.lender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Date:</span>
                    <span className="font-semibold">{new Date(emi.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EMI Type:</span>
                    <span className="font-semibold">Purchase EMI</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-semibold">{emi.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-semibold">{new Date(emi.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
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
                  Notes
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
                <span className="font-semibold">Overdue Payment</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This EMI payment is overdue. Please make the payment as soon as possible to avoid penalties.
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
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
      </DialogContent>
    </Dialog>
  )
}