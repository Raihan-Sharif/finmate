'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  CreditCard,
  Building,
  Car,
  GraduationCap,
  Briefcase,
  FileText,
  Calendar,
  Percent,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { LoanWithRelations, LOAN_TYPES } from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'

const loanTypeIcons = {
  personal: CreditCard,
  home: Building,
  car: Car,
  education: GraduationCap,
  business: Briefcase,
  purchase_emi: FileText,
  credit_card: CreditCard,
  other: FileText
}

interface LoanCardProps {
  loan: LoanWithRelations
  onEdit?: (loan: LoanWithRelations) => void
  onDelete?: (loanId: string) => void
  onViewDetails?: (loan: LoanWithRelations) => void
  showActions?: boolean
  className?: string
}

export default function LoanCard({ 
  loan, 
  onEdit, 
  onDelete, 
  onViewDetails,
  showActions = true,
  className = '' 
}: LoanCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { formatAmount } = useAppStore()
  
  const IconComponent = loanTypeIcons[loan.type]
  const loanType = LOAN_TYPES.find(t => t.value === loan.type)
  
  // Calculate progress
  const paidAmount = loan.principal_amount - loan.outstanding_amount
  const progressPercentage = (paidAmount / loan.principal_amount) * 100
  
  // Calculate days until next payment
  const getDaysUntilDue = () => {
    if (!loan.next_due_date) return null
    const today = new Date()
    const dueDate = new Date(loan.next_due_date)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const daysUntilDue = getDaysUntilDue()
  
  const getStatusColor = () => {
    switch (loan.status) {
      case 'active':
        if (daysUntilDue !== null && daysUntilDue < 0) return 'destructive'
        if (daysUntilDue !== null && daysUntilDue <= 3) return 'default'
        return 'secondary'
      case 'closed':
        return 'secondary'
      case 'defaulted':
        return 'destructive'
      default:
        return 'secondary'
    }
  }
  
  const getStatusText = () => {
    if (loan.status === 'closed') return 'Closed'
    if (loan.status === 'defaulted') return 'Defaulted'
    if (daysUntilDue !== null && daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`
    if (daysUntilDue !== null && daysUntilDue <= 3) return `Due in ${daysUntilDue} days`
    return 'Active'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        className={className}
      >
        <Card className={`group hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-900 ${
          loan.status === 'active' && daysUntilDue !== null && daysUntilDue < 0
            ? 'border-2 border-orange-600/50 shadow-orange-100/50 dark:shadow-orange-900/20'
            : loan.status === 'active'
              ? 'border-2 border-blue-600/50 shadow-blue-100/50 dark:shadow-blue-900/20'
              : loan.status === 'closed'
                ? 'border-2 border-green-600/50 shadow-green-100/50 dark:shadow-green-900/20'
                : loan.status === 'defaulted'
                  ? 'border-2 border-red-600/50 shadow-red-100/50 dark:shadow-red-900/20'
                  : 'border-2 border-gray-200 dark:border-gray-800'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                    {loan.lender}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {loanType?.label}
                  </p>
                </div>
              </div>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewDetails && (
                      <DropdownMenuItem onClick={() => onViewDetails(loan)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(loan)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* EMI Amount */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatAmount(loan.emi_amount)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outstanding</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatAmount(loan.outstanding_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Interest Rate</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {loan.interest_rate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tenure</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {loan.tenure_months} months
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Due</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge variant={getStatusColor()} className="flex items-center gap-1">
                {(daysUntilDue !== null && daysUntilDue < 0) && <AlertTriangle className="h-3 w-3" />}
                {getStatusText()}
              </Badge>
              
              {loan.auto_debit && (
                <Badge variant="outline" className="text-xs">
                  Auto Debit
                </Badge>
              )}
            </div>

            {/* Notes */}
            {loan.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {loan.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan from {loan.lender}? This action cannot be undone and will remove all associated EMI schedules and payment history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) onDelete(loan.id)
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}