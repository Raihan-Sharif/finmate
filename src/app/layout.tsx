import { AnalyticsWrapper } from "@/components/analytics/AnalyticsWrapper";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PWAPrompt } from "@/components/pwa/PWAPrompt";
import { AuthProvider } from "@/hooks/useAuth";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "FinMate - Ultimate Personal Finance Companion",
    template: "%s | FinMate",
  },
  description:
    "Take control of your finances with FinMate - the comprehensive personal finance app for tracking expenses, managing investments, budgeting, and achieving your financial goals.",
  keywords: [
    "personal finance",
    "expense tracker",
    "budget planner",
    "investment tracker",
    "money management",
    "financial planning",
    "EMI calculator",
    "lending tracker",
    "financial goals",
    "expense management",
  ],
  authors: [{ name: "FinMate Team" }],
  creator: "FinMate",
  publisher: "FinMate",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://finmate.app",
    siteName: "FinMate",
    title: "FinMate - Ultimate Personal Finance Companion",
    description:
      "Take control of your finances with comprehensive expense tracking, budgeting, investment management, and financial insights.",
    images: [
      {
        url: "https://finmate.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinMate - Personal Finance App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinMate - Ultimate Personal Finance Companion",
    description:
      "Take control of your finances with comprehensive expense tracking, budgeting, investment management, and financial insights.",
    images: ["https://finmate.app/og-image.png"],
    creator: "@finmate_app",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#3B82F6",
      },
    ],
  },
  category: "finance",
  classification: "business",
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://finmate.app",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FinMate",
  description:
    "Ultimate Personal Finance Companion for managing expenses, budgets, investments, and financial goals",
  url: "https://finmate.app",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser, iOS, Android",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "FinMate Team",
  },
  publisher: {
    "@type": "Organization",
    name: "FinMate",
    logo: {
      "@type": "ImageObject",
      url: "https://finmate.app/logo.png",
    },
  },
  screenshot: "https://finmate.app/screenshot.png",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* Performance hints */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.openai.com" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />

        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinMate" />
        <meta name="application-name" content="FinMate" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Prevent zoom on input focus for iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-background font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Critical CSS for loading states */}
        <style jsx global>{`
          .loading-skeleton {
            background: linear-gradient(
              90deg,
              #f0f0f0 25%,
              #e0e0e0 50%,
              #f0f0f0 75%
            );
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }

          @keyframes loading {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }

          /* PWA display mode styles */
          @media (display-mode: standalone) {
            body {
              padding-top: env(safe-area-inset-top);
              padding-bottom: env(safe-area-inset-bottom);
            }
          }
        `}</style>

        {/* App Providers */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {/* Main App Content */}
              <div id="app-root" className="relative">
                {children}

                {/* Global Components */}
                <PWAPrompt />

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  reverseOrder={false}
                  gutter={8}
                  containerClassName=""
                  containerStyle={{}}
                  toastOptions={{
                    // Default options
                    className: "",
                    duration: 4000,
                    style: {
                      background: "hsl(var(--background))",
                      color: "hsl(var(--foreground))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "14px",
                      maxWidth: "500px",
                    },
                    // Success styles
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "hsl(var(--primary))",
                        secondary: "hsl(var(--primary-foreground))",
                      },
                    },
                    // Error styles
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: "hsl(var(--destructive))",
                        secondary: "hsl(var(--destructive-foreground))",
                      },
                    },
                    // Loading styles
                    loading: {
                      duration: Infinity,
                    },
                  }}
                />
              </div>

              {/* Analytics */}
              <AnalyticsWrapper />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />

        {/* Performance monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Web Vitals monitoring
              if (typeof window !== 'undefined') {
                import('/web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                  getCLS(console.log);
                  getFID(console.log);
                  getFCP(console.log);
                  getLCP(console.log);
                  getTTFB(console.log);
                }).catch(e => console.log('Web Vitals not available'));
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
