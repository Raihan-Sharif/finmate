import { CURRENCY_SYMBOLS, CurrencyType } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting
export function formatCurrency(
  amount: number,
  currency: CurrencyType = "USD",
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
    compact?: boolean;
  }
) {
  const {
    showSymbol = true,
    showCode = false,
    decimals = 2,
    compact = false,
  } = options || {};

  // Handle compact formatting for large numbers
  if (compact && Math.abs(amount) >= 1000) {
    const units = ["", "K", "M", "B", "T"];
    const unitIndex = Math.floor(Math.log10(Math.abs(amount)) / 3);
    const scaledAmount = amount / Math.pow(1000, unitIndex);

    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: scaledAmount % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(scaledAmount);

    const symbol = showSymbol ? CURRENCY_SYMBOLS[currency] : "";
    const code = showCode ? ` ${currency}` : "";
    const unit = units[unitIndex] || "";

    return `${symbol}${formatted}${unit}${code}`;
  }

  // Standard formatting
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));

  const symbol = showSymbol ? CURRENCY_SYMBOLS[currency] : "";
  const code = showCode ? ` ${currency}` : "";
  const sign = amount < 0 ? "-" : "";

  return `${sign}${symbol}${formatted}${code}`;
}

// Parse currency string back to number
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Date formatting
export function formatDate(
  date: string | Date,
  options?: {
    format?: "short" | "medium" | "long" | "relative";
    includeTime?: boolean;
  }
) {
  const { format = "medium", includeTime = false } = options || {};

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return formatRelativeDate(dateObj);
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: format === "short" ? "2-digit" : "numeric",
    month:
      format === "short" ? "numeric" : format === "medium" ? "short" : "long",
    day: "numeric",
  };

  if (includeTime) {
    formatOptions.hour = "2-digit";
    formatOptions.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("en-US", formatOptions).format(dateObj);
}

// Relative date formatting (e.g., "2 days ago", "in 3 hours")
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return "just now";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const intervals = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
    if (count >= 1) {
      return rtf.format(diffInSeconds > 0 ? -count : count, interval.unit);
    }
  }

  return "just now";
}

// Number formatting
export function formatNumber(
  num: number,
  options?: {
    decimals?: number;
    compact?: boolean;
    percent?: boolean;
  }
) {
  const { decimals = 0, compact = false, percent = false } = options || {};

  if (percent) {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num / 100);
  }

  if (compact && Math.abs(num) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(num);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Percentage calculation and formatting
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Color utilities
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export function lightenColor(hexColor: string, percent: number): string {
  const hex = hexColor.replace("#", "");
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

// String utilities
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function camelToTitle(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// File utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  return imageExtensions.includes(getFileExtension(filename));
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Local storage utilities with error handling
export const storage = {
  get: (key: string, defaultValue?: any) => {
    if (typeof window === "undefined") return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: (key: string, value: any) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  },

  remove: (key: string) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  },

  clear: () => {
    if (typeof window === "undefined") return;

    try {
      localStorage.clear();
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  },
};

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Finance-specific utilities
export function calculateLoanEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  if (annualRate === 0) return principal / tenureMonths;

  const monthlyRate = annualRate / 1200; // Convert annual % to monthly decimal
  const numerator =
    principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;

  return numerator / denominator;
}

export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundingFrequency: number = 1
): number {
  return (
    principal *
    Math.pow(
      1 + rate / (100 * compoundingFrequency),
      compoundingFrequency * time
    )
  );
}

export function calculateSIP(
  monthlyAmount: number,
  annualRate: number,
  years: number
): { maturityAmount: number; totalInvested: number; gains: number } {
  const monthlyRate = annualRate / 1200;
  const months = years * 12;

  const maturityAmount =
    ((monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate) *
    (1 + monthlyRate);

  const totalInvested = monthlyAmount * months;
  const gains = maturityAmount - totalInvested;

  return {
    maturityAmount,
    totalInvested,
    gains,
  };
}

// Transaction categorization helpers
export function categorizeTransaction(
  description: string,
  vendor?: string
): string {
  const text = `${description} ${vendor || ""}`.toLowerCase();

  const categories = {
    food: [
      "restaurant",
      "food",
      "dining",
      "cafe",
      "pizza",
      "burger",
      "coffee",
      "starbucks",
      "mcdonalds",
    ],
    transport: [
      "uber",
      "lyft",
      "taxi",
      "bus",
      "train",
      "gas",
      "fuel",
      "parking",
    ],
    shopping: ["amazon", "walmart", "target", "mall", "store", "shopping"],
    entertainment: [
      "movie",
      "netflix",
      "spotify",
      "game",
      "entertainment",
      "cinema",
    ],
    utilities: ["electric", "water", "internet", "phone", "utility", "bill"],
    healthcare: [
      "hospital",
      "doctor",
      "pharmacy",
      "medical",
      "health",
      "clinic",
    ],
    education: [
      "school",
      "university",
      "course",
      "book",
      "education",
      "tuition",
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "other";
}

// Export all utilities as a single object for easier importing
export const utils = {
  formatCurrency,
  parseCurrency,
  formatDate,
  formatRelativeDate,
  formatNumber,
  calculatePercentage,
  formatPercentage,
  getContrastColor,
  lightenColor,
  truncateText,
  slugify,
  capitalizeFirst,
  camelToTitle,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  groupBy,
  sortBy,
  uniqueBy,
  formatFileSize,
  getFileExtension,
  isImageFile,
  debounce,
  throttle,
  storage,
  getErrorMessage,
  safeJsonParse,
  calculateLoanEMI,
  calculateCompoundInterest,
  calculateSIP,
  categorizeTransaction,
};
