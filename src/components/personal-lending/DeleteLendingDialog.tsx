'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Users } from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'

interface DeleteLendingDialogProps {
  lending: any | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export default function DeleteLendingDialog({
  lending,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}: DeleteLendingDialogProps) {
  const { formatAmount } = useAppStore()

  if (!lending) return null

  const hasOutstandingAmount = lending.pending_amount > 0
  const hasPaidAmount = lending.amount > lending.pending_amount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Lending Record
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this {lending.type === 'lent' ? 'lending' : 'borrowing'} record?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Record Summary */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-semibold">{lending.person_name}</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {lending.type === 'lent' ? 'Money Lent' : 'Money Borrowed'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Amount:</span>
                <span className="font-semibold">{formatAmount(lending.amount)}</span>
              </div>
              {hasPaidAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-semibold text-green-600">
                    {formatAmount(lending.amount - lending.pending_amount)}
                  </span>
                </div>
              )}
              {hasOutstandingAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding:</span>
                  <span className="font-semibold text-orange-600">
                    {formatAmount(lending.pending_amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-semibold capitalize ${
                  lending.status === 'paid' 
                    ? 'text-green-600' 
                    : lending.status === 'overdue' 
                      ? 'text-red-600' 
                      : 'text-orange-600'
                }`}>
                  {lending.status}
                </span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {hasOutstandingAmount && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold text-sm">Outstanding Amount</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                This record has an outstanding amount of {formatAmount(lending.pending_amount)}. 
                Deleting this record will remove all payment history and cannot be undone.
              </p>
            </div>
          )}

          {hasPaidAmount && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold text-sm">Payment History</span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                This record has payment history. Deleting will permanently remove all payment records 
                and associated transactions.
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <strong>This action cannot be undone.</strong> All associated payment records and transactions 
            will be permanently deleted from your account.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              'Delete Record'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}