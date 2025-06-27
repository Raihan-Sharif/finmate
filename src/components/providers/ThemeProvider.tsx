"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Custom hook for theme management
export function useTheme() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, resolvedTheme } = require("next-themes");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Return default values during SSR
  if (!mounted) {
    return {
      theme: "light",
      setTheme: () => {},
      resolvedTheme: "light",
      toggleTheme: () => {},
      mounted: false,
    };
  }

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    mounted,
  };
}
