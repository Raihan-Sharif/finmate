'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Loan } from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'

interface DeleteLoanDialogProps {
  loan: Loan | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

export default function DeleteLoanDialog({ 
  loan, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting = false 
}: DeleteLoanDialogProps) {
  const { formatAmount } = useAppStore()

  if (!loan) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Trash2 className="h-4 w-4" />
            </div>
            Delete Loan
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">This action cannot be undone</span>
              </div>
              
              <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{loan.lender}</span>
                    <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Outstanding: <span className="font-semibold">{formatAmount(loan.outstanding_amount)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Monthly EMI: <span className="font-semibold">{formatAmount(loan.emi_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm">
                Are you sure you want to delete this loan? This will permanently remove the loan record and all associated data including payment history.
              </div>

              {loan.status === 'active' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">This is an active loan</span>
                  </div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Consider marking it as closed instead of deleting if the loan has been paid off.
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Loan
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}