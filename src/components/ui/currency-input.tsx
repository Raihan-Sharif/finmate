"use client";

import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOLS, CurrencyType } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface CurrencyInputProps {
  value?: number;
  currency?: CurrencyType;
  onValueChange?: (value: number) => void;
  onCurrencyChange?: (currency: CurrencyType) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCurrencySelect?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export function CurrencyInput({
  value = 0,
  currency = "USD",
  onValueChange,
  onCurrencyChange,
  placeholder = "0.00",
  disabled = false,
  className,
  showCurrencySelect = true,
  min = 0,
  max,
  step = 0.01,
  precision = 2,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number for display
  const formatCurrency = (num: number): string => {
    if (isNaN(num) || num === 0) return "";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(num);
  };

  // Parse display value to number
  const parseValue = (str: string): number => {
    const cleaned = str.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update display value when external value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isFocused, precision]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    const numericValue = parseValue(inputValue);

    // Apply min/max constraints
    let constrainedValue = numericValue;
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max;
    }

    onValueChange?.(constrainedValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused
    setDisplayValue(value === 0 ? "" : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the value when losing focus
    const numericValue = parseValue(displayValue);
    setDisplayValue(formatCurrency(numericValue));
    onValueChange?.(numericValue);
  };

  const handleKeyDown = (e: React.KeyEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }

    // Ensure that it is a number or decimal point
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105) &&
      e.keyCode !== 190 &&
      e.keyCode !== 110
    ) {
      e.preventDefault();
    }

    // Only allow one decimal point
    if (
      (e.keyCode === 190 || e.keyCode === 110) &&
      displayValue.indexOf(".") !== -1
    ) {
      e.preventDefault();
    }
  };

  const quickAmounts = [10, 25, 50, 100, 250, 500, 1000];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative flex">
        {/* Currency symbol */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10">
          {CURRENCY_SYMBOLS[currency]}
        </div>

        {/* Amount input */}
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-8 pr-20 text-right font-mono text-lg",
            showCurrencySelect && "pr-24"
          )}
        />

        {/* Currency selector */}
        {showCurrencySelect && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Select
              value={currency}
              onValueChange={(value) =>
                onCurrencyChange?.(value as CurrencyType)
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-16 h-8 border-0 bg-transparent text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="BDT">BDT</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Quick amount buttons */}
      {!disabled && (
        <div className="flex flex-wrap gap-1">
          {quickAmounts.map((amount) => (
            <Button
              key={amount}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setDisplayValue(formatCurrency(amount));
                onValueChange?.(amount);
              }}
            >
              {CURRENCY_SYMBOLS[currency]}
              {amount}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            onClick={() => {
              setDisplayValue("");
              onValueChange?.(0);
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Validation message */}
      {min !== undefined && value < min && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Minimum amount is {CURRENCY_SYMBOLS[currency]}
          {min}
        </p>
      )}

      {max !== undefined && value > max && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Maximum amount is {CURRENCY_SYMBOLS[currency]}
          {max}
        </p>
      )}
    </div>
  );
}
