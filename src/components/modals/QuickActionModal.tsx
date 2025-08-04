"use client";

import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { db, TABLES } from "@/lib/supabase/client";
import { CurrencyType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { PiggyBank, Plus, Receipt, TrendingUp, Users, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActionSchema = z.object({
  type: z.enum(["expense", "income", "investment", "lending"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  category_id: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string(),
});

type QuickActionFormData = z.infer<typeof quickActionSchema>;

const actionTypes = [
  {
    type: "expense",
    label: "Add Expense",
    icon: Receipt,
    color: "text-red-600 bg-red-50 dark:bg-red-900/20",
    description: "Record a new expense",
  },
  {
    type: "income",
    label: "Add Income",
    icon: TrendingUp,
    color: "text-green-600 bg-green-50 dark:bg-green-900/20",
    description: "Record new income",
  },
  {
    type: "investment",
    label: "Add Investment",
    icon: PiggyBank,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    description: "Record investment transaction",
  },
  {
    type: "lending",
    label: "Money Lent/Borrowed",
    icon: Users,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    description: "Record lending or borrowing",
  },
];

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuickActionFormData>({
    resolver: zodResolver(quickActionSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split("T")[0] || "",
    },
  });

  const selectedActionType = watch("type");

  const handleActionSelect = (actionType: string) => {
    setSelectedAction(actionType);
    setValue("type", actionType as any);
  };

  const onSubmit = async (data: QuickActionFormData) => {
    if (!user) return;

    try {
      setLoading(true);

      if (data.type === "expense" || data.type === "income") {
        // Create transaction
        await db.create(TABLES.TRANSACTIONS, {
          user_id: user.id,
          amount: data.amount,
          description: data.description,
          notes: data.notes,
          type: data.type,
          transaction_date: data.transaction_date,
          category_id: data.category_id || null,
          currency: profile?.currency || "USD",
        });

        toast.success(
          `${
            data.type === "expense" ? "Expense" : "Income"
          } added successfully!`
        );
      } else if (data.type === "investment") {
        // Create investment
        await db.create(TABLES.INVESTMENTS, {
          user_id: user.id,
          name: data.description,
          initial_amount: data.amount,
          current_value: data.amount,
          purchase_date: data.transaction_date,
          type: "other",
          currency: profile?.currency || "USD",
          notes: data.notes,
        });

        toast.success("Investment added successfully!");
      } else if (data.type === "lending") {
        // Create lending record
        await db.create(TABLES.LENDING, {
          user_id: user.id,
          person_name: data.description,
          amount: data.amount,
          type: "lent", // Default to lent, user can change later
          lending_date: data.transaction_date,
          status: "lent",
          currency: profile?.currency || "USD",
          notes: data.notes,
        });

        toast.success("Lending record added successfully!");
      }

      handleClose();
    } catch (error: any) {
      console.error("Error adding quick action:", error);
      toast.error("Failed to add record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    reset();
    onClose();
  };

  const renderActionSelection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          What would you like to add?
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose an action to quickly record your financial activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actionTypes.map((action) => (
          <motion.button
            key={action.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActionSelect(action.type)}
            className="flex items-center space-x-3 p-4 rounded-lg border-2 border-transparent hover:border-border bg-card hover:bg-accent/50 transition-all text-left"
          >
            <div className={`p-3 rounded-lg ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium">{action.label}</h4>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderForm = () => {
    const selectedActionData = actionTypes.find(
      (a) => a.type === selectedActionType
    );

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${selectedActionData?.color}`}>
            {selectedActionData?.icon && (
              <selectedActionData.icon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {selectedActionData?.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedActionData?.description}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <CurrencyInput
            value={watch("amount") || 0}
            onValueChange={(value) => setValue("amount", value)}
            currency={(profile?.currency as CurrencyType) || "USD"}
            placeholder="0.00"
            showCurrencySelect={false}
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {selectedActionType === "lending" ? "Person Name" : "Description"} *
          </Label>
          <Input
            id="description"
            placeholder={
              selectedActionType === "lending"
                ? "Enter person name"
                : selectedActionType === "investment"
                ? "Investment name"
                : "What was this for?"
            }
            {...register("description")}
            {...(errors.description?.message && { error: errors.description.message })}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Date</Label>
          <Input
            id="transaction_date"
            type="date"
            {...register("transaction_date")}
            {...(errors.transaction_date?.message && { error: errors.transaction_date.message })}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes..."
            rows={3}
            {...register("notes")}
          />
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedAction(null)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {selectedActionData?.label.split(" ")[1]}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Quick Add
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Quickly add financial records without navigating to different pages
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AnimatePresence mode="wait">
            {!selectedAction ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {renderActionSelection()}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderForm()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
