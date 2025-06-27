import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as React from "react";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    gradient?: boolean;
    loading?: boolean;
  }
>(
  (
    { className, hover = false, gradient = false, loading = false, ...props },
    ref
  ) => (
    <motion.div
      ref={ref}
      initial={false}
      whileHover={
        hover ? { y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" } : {}
      }
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
        hover && "hover:shadow-md cursor-pointer",
        gradient &&
          "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        loading && "animate-pulse",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  }
>(({ className, as: Component = "h3", ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Specialized card variants for finance app
const StatCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    color?: "blue" | "green" | "red" | "purple" | "orange" | "gray";
    loading?: boolean;
  }
>(
  (
    {
      className,
      title,
      value,
      change,
      changeLabel,
      icon,
      color = "blue",
      loading = false,
      ...props
    },
    ref
  ) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      green: "text-green-600 bg-green-50 dark:bg-green-900/20",
      red: "text-red-600 bg-red-50 dark:bg-red-900/20",
      purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
      orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
      gray: "text-gray-600 bg-gray-50 dark:bg-gray-900/20",
    };

    if (loading) {
      return (
        <Card ref={ref} className={cn("p-6", className)} loading {...props}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn("p-6", className)} hover {...props}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{value}</h3>
              {change !== undefined && (
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      change >= 0
                        ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20"
                        : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20"
                    )}
                  >
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                  {changeLabel && (
                    <span className="text-xs text-muted-foreground">
                      {changeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {icon && (
            <div
              className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center",
                colorClasses[color]
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StatCard,
};
