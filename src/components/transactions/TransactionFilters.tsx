"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { db, TABLES } from "@/lib/supabase/client";
import { Category } from "@/types";
import { Filter, TrendingDown, TrendingUp, X } from "lucide-react";
import React, { useState } from "react";

interface TransactionFiltersProps {
  filters: {
    type: string;
    category: string;
    dateRange: string;
    amountRange: { min: number; max: number };
  };
  onFiltersChange: (filters: any) => void;
  totalCount: number;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  totalCount,
}: TransactionFiltersProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempAmountRange, setTempAmountRange] = useState(filters.amountRange);

  // Load categories on mount
  React.useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const categoriesData = await db.findMany<Category>(TABLES.CATEGORIES, {
        filter: { user_id: user?.id },
        orderBy: { column: "name", ascending: true },
      });
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const applyAmountRange = () => {
    updateFilter("amountRange", tempAmountRange);
    setShowAdvanced(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      type: "all",
      category: "all",
      dateRange: "month",
      amountRange: { min: 0, max: 0 },
    };
    onFiltersChange(defaultFilters);
    setTempAmountRange({ min: 0, max: 0 });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== "all") count++;
    if (filters.category !== "all") count++;
    if (filters.dateRange !== "month") count++;
    if (filters.amountRange.min > 0 || filters.amountRange.max > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type filter */}
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium">Type:</Label>
          <Select
            value={filters.type}
            onValueChange={(value) => updateFilter("type", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="income">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span>Income</span>
                </div>
              </SelectItem>
              <SelectItem value="expense">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span>Expense</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date range filter */}
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium">Period:</Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => updateFilter("dateRange", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category filter */}
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium">Category:</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => updateFilter("category", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced filters */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Amount range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Min Amount
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tempAmountRange.min || ""}
                      onChange={(e) =>
                        setTempAmountRange((prev) => ({
                          ...prev,
                          min: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Max Amount
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tempAmountRange.max || ""}
                      onChange={(e) =>
                        setTempAmountRange((prev) => ({
                          ...prev,
                          max: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset All
                </Button>
                <Button
                  size="sm"
                  onClick={applyAmountRange}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.type !== "all" && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Type: {filters.type}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("type", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.category !== "all" && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Category:{" "}
                {categories.find((c) => c.id === filters.category)?.name ||
                  "Unknown"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("category", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.dateRange !== "month" && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Period: {filters.dateRange}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("dateRange", "month")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(filters.amountRange.min > 0 || filters.amountRange.max > 0) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Amount:{" "}
                {filters.amountRange.min > 0
                  ? `$${filters.amountRange.min}`
                  : "0"}{" "}
                -
                {filters.amountRange.max > 0
                  ? `$${filters.amountRange.max}`
                  : "∞"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("amountRange", { min: 0, max: 0 })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {totalCount} transaction{totalCount !== 1 ? "s" : ""}
          {activeFiltersCount > 0 && " (filtered)"}
        </span>
      </div>
    </div>
  );
}
