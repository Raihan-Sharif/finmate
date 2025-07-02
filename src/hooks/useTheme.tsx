"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Return safe values during SSR
  if (!mounted) {
    return {
      theme: "light",
      setTheme: () => {},
      resolvedTheme: "light",
      systemTheme: "light",
      toggleTheme: () => {},
      mounted: false,
    };
  }

  return {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    toggleTheme,
    mounted,
  };
}
