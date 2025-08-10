'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface ConfirmationDialogProps {
  children: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'destructive' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  children,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive',
  isLoading = false
}: ConfirmationDialogProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: Trash2,
          iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
          buttonClass: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
          iconColor: 'text-red-500',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-600',
          buttonClass: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
          iconColor: 'text-yellow-500',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      default:
        return {
          icon: CheckCircle,
          iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
          buttonClass: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const Icon = variantStyles.icon;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AnimatePresence>
        <AlertDialogContent 
          className={cn(
            "max-w-md border-0 backdrop-blur-xl shadow-2xl",
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95'
              : 'bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95',
            variantStyles.borderColor
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <AlertDialogHeader className="text-center space-y-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              >
                <div className={cn(
                  "w-full h-full rounded-full flex items-center justify-center",
                  variantStyles.iconBg
                )}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </motion.div>

              {/* Title */}
              <AlertDialogTitle className={cn(
                "text-xl font-bold text-center",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {title}
              </AlertDialogTitle>

              {/* Description */}
              <AlertDialogDescription className={cn(
                "text-base leading-relaxed text-center",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <AlertDialogCancel asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full sm:w-auto order-2 sm:order-1",
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 border-gray-600' 
                      : 'hover:bg-gray-50 border-gray-200'
                  )}
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelText}
                </Button>
              </AlertDialogCancel>
              
              <AlertDialogAction asChild>
                <Button
                  className={cn(
                    "w-full sm:w-auto order-1 sm:order-2 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200",
                    variantStyles.buttonClass
                  )}
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Processing...' : confirmText}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>

            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={cn(
                "absolute top-0 left-0 w-full h-1 rounded-t-lg",
                variantStyles.iconBg
              )} />
            </div>
          </motion.div>
        </AlertDialogContent>
      </AnimatePresence>
    </AlertDialog>
  );
}