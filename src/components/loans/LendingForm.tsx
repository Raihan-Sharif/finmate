'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowUpDown, Phone, Mail, MapPin } from 'lucide-react'
import { LENDING_TYPES, LendingFormData, Lending } from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'

const lendingSchema = z.object({
  person_name: z.string().min(1, 'Person name is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  interest_rate: z.number().min(0, 'Interest rate must be 0 or greater').max(100, 'Interest rate cannot exceed 100%').optional(),
  due_date: z.string().optional(),
  type: z.enum(['lent', 'borrowed']),
  reminder_days: z.number().min(0, 'Reminder days must be 0 or greater').max(30, 'Reminder days cannot exceed 30').optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_address: z.string().optional(),
  notes: z.string().optional(),
})

type LendingFormSchema = z.infer<typeof lendingSchema>

interface LendingFormProps {
  lending?: Lending | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LendingFormData) => Promise<void>
  isLoading?: boolean
}

export default function LendingForm({ lending, isOpen, onClose, onSubmit, isLoading }: LendingFormProps) {
  const { formatAmount, currency } = useAppStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<LendingFormSchema>({
    resolver: zodResolver(lendingSchema),
    defaultValues: lending ? {
      person_name: lending.person_name,
      amount: lending.amount,
      interest_rate: lending.interest_rate || 0,
      due_date: lending.due_date || '',
      type: lending.type,
      reminder_days: lending.reminder_days || 3,
      contact_phone: lending.contact_info?.phone || '',
      contact_email: lending.contact_info?.email || '',
      contact_address: lending.contact_info?.address || '',
      notes: lending.notes || '',
    } : {
      interest_rate: 0,
      reminder_days: 3,
      type: 'lent',
    }
  })

  const selectedType = watch('type')
  const amount = watch('amount')
  const interestRate = watch('interest_rate')

  const calculateInterestAmount = () => {
    if (amount > 0 && interestRate && interestRate > 0) {
      // Simple annual interest calculation
      return (amount * interestRate) / 100
    }
    return 0
  }

  const handleFormSubmit = async (data: LendingFormSchema) => {
    try {
      const contactInfo = {
        ...(data.contact_phone && { phone: data.contact_phone }),
        ...(data.contact_email && { email: data.contact_email }),
        ...(data.contact_address && { address: data.contact_address }),
      }

      await onSubmit({
        person_name: data.person_name,
        amount: Number(data.amount),
        interest_rate: data.interest_rate ? Number(data.interest_rate) : undefined,
        due_date: data.due_date || undefined,
        type: data.type,
        reminder_days: data.reminder_days || 3,
        contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
        notes: data.notes || undefined,
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting lending form:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const interestAmount = calculateInterestAmount()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            {lending ? 'Edit Personal Lending' : 'Add Personal Lending'}
          </DialogTitle>
          <DialogDescription>
            {lending ? 'Update personal lending information' : 'Track money lent to or borrowed from friends and family'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lending Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="person_name">Person Name</Label>
                  <Input
                    id="person_name"
                    placeholder="e.g., John Doe, Sarah Ahmed"
                    {...register('person_name')}
                    className={errors.person_name ? 'border-red-500' : ''}
                  />
                  {errors.person_name && (
                    <p className="text-sm text-red-500">{errors.person_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select onValueChange={(value) => setValue('type', value as any)}>
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENDING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({currency})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest_rate">Interest Rate (%) - Optional</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('interest_rate', { valueAsNumber: true })}
                    className={errors.interest_rate ? 'border-red-500' : ''}
                  />
                  {errors.interest_rate && (
                    <p className="text-sm text-red-500">{errors.interest_rate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date - Optional</Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...register('due_date')}
                    className={errors.due_date ? 'border-red-500' : ''}
                  />
                  {errors.due_date && (
                    <p className="text-sm text-red-500">{errors.due_date.message}</p>
                  )}
                </div>
              </div>

              {/* Interest Preview */}
              {interestAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <span className="font-medium">Annual Interest:</span>
                      <Badge variant="secondary">{formatAmount(interestAmount)}</Badge>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Total: {formatAmount(amount + interestAmount)}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Transaction Type Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant={selectedType === 'lent' ? 'default' : 'secondary'}
                  className={selectedType === 'lent' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }
                >
                  {selectedType === 'lent' ? '📤 Money Lent' : '📥 Money Borrowed'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contact Information (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Phone Number
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    placeholder="+8801234567890"
                    {...register('contact_phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email Address
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('contact_email')}
                    className={errors.contact_email ? 'border-red-500' : ''}
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-red-500">{errors.contact_email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_address" className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Address
                </Label>
                <Input
                  id="contact_address"
                  placeholder="Street address, city, country"
                  {...register('contact_address')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder_days">Reminder Days Before Due</Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min="0"
                    max="30"
                    placeholder="3"
                    {...register('reminder_days', { valueAsNumber: true })}
                    className={errors.reminder_days ? 'border-red-500' : ''}
                  />
                  {errors.reminder_days && (
                    <p className="text-sm text-red-500">{errors.reminder_days.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this transaction..."
                  {...register('notes')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={selectedType === 'lent' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                lending ? 'Update Record' : 'Add Record'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}