"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Google Analytics ID from environment
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: any
    ) => void;
  }
}

// Initialize Google Analytics
export function initGA() {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  // Load gtag script
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag =
    window.gtag ||
    function () {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: title || document.title,
    page_location: url,
  });
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...customParameters,
  });
}

// Track user properties
export function setUserProperties(properties: Record<string, any>) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    custom_map: properties,
  });
}

// Finance-specific event tracking
export const financeEvents = {
  // Transaction events
  transactionAdded: (
    type: "income" | "expense",
    amount: number,
    category?: string
  ) => {
    trackEvent("transaction_added", "finance", type, amount, {
      transaction_type: type,
      category: category,
    });
  },

  transactionEdited: (type: "income" | "expense") => {
    trackEvent("transaction_edited", "finance", type);
  },

  transactionDeleted: (type: "income" | "expense") => {
    trackEvent("transaction_deleted", "finance", type);
  },

  // Budget events
  budgetCreated: (amount: number) => {
    trackEvent("budget_created", "finance", "budget", amount);
  },

  budgetExceeded: (categoryName: string, percentage: number) => {
    trackEvent("budget_exceeded", "finance", categoryName, percentage);
  },

  // Investment events
  investmentAdded: (type: string, amount: number) => {
    trackEvent("investment_added", "finance", type, amount);
  },

  // Goal events
  goalCreated: (type: string) => {
    trackEvent("goal_created", "finance", type);
  },

  goalAchieved: (type: string) => {
    trackEvent("goal_achieved", "finance", type);
  },

  // Export/Import events
  dataExported: (format: string) => {
    trackEvent("data_exported", "data", format);
  },

  dataImported: (source: string, recordCount: number) => {
    trackEvent("data_imported", "data", source, recordCount);
  },

  // PWA events
  pwaInstalled: () => {
    trackEvent("pwa_installed", "app", "install");
  },

  pwaPromptShown: () => {
    trackEvent("pwa_prompt_shown", "app", "prompt");
  },

  pwaPromptDismissed: () => {
    trackEvent("pwa_prompt_dismissed", "app", "prompt");
  },

  // Feature usage
  featureUsed: (featureName: string, context?: string) => {
    trackEvent("feature_used", "engagement", featureName, undefined, {
      context: context,
    });
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string, page?: string) => {
    trackEvent("error_occurred", "error", errorType, undefined, {
      error_message: errorMessage,
      page: page || window.location.pathname,
    });
  },

  // Performance tracking
  pageLoadTime: (loadTime: number, page: string) => {
    trackEvent("page_load_time", "performance", page, loadTime);
  },
};

export function AnalyticsWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Initialize GA on mount
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      initGA();
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      const url =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : "");
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  // Set user properties when user changes
  useEffect(() => {
    if (user && process.env.NODE_ENV === "production") {
      setUserProperties({
        user_id: user.id,
        user_type: "authenticated",
      });
    }
  }, [user]);

  // Track performance metrics
  useEffect(() => {
    if (typeof window !== "undefined" && "performance" in window) {
      // Track page load time
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType(
            "navigation"
          )[0] as PerformanceNavigationTiming;
          if (perfData) {
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            financeEvents.pageLoadTime(loadTime, pathname);
          }
        }, 0);
      });

      // Track Core Web Vitals
      if ("web-vitals" in window) {
        import("web-vitals")
          .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS((metric) => {
              trackEvent(
                "web_vital",
                "performance",
                "CLS",
                Math.round(metric.value * 1000)
              );
            });

            getFID((metric) => {
              trackEvent(
                "web_vital",
                "performance",
                "FID",
                Math.round(metric.value)
              );
            });

            getFCP((metric) => {
              trackEvent(
                "web_vital",
                "performance",
                "FCP",
                Math.round(metric.value)
              );
            });

            getLCP((metric) => {
              trackEvent(
                "web_vital",
                "performance",
                "LCP",
                Math.round(metric.value)
              );
            });

            getTTFB((metric) => {
              trackEvent(
                "web_vital",
                "performance",
                "TTFB",
                Math.round(metric.value)
              );
            });
          })
          .catch(() => {
            // Web Vitals not available
          });
      }
    }
  }, [pathname]);

  return null;
}
