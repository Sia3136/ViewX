"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("examguard-theme") as Theme | null;
    const initial = stored ?? "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setIsTransitioning(true);

    const apply = () => {
      setTheme(next);
      document.documentElement.setAttribute("data-theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.localStorage.setItem("examguard-theme", next);
    };

    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(apply);
    } else {
      apply();
    }

    window.setTimeout(() => setIsTransitioning(false), 700);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
