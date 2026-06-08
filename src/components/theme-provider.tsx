"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { themeStorageKey, type ThemePreference } from "@/lib/theme";

type AppliedTheme = "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  appliedTheme: AppliedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function getSystemTheme(): AppliedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  const appliedTheme = preference === "system" ? getSystemTheme() : preference;
  const root = document.documentElement;

  root.classList.toggle("dark", appliedTheme === "dark");
  root.dataset.themePreference = preference;
  root.dataset.theme = appliedTheme;
  root.style.colorScheme = appliedTheme;

  return appliedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<AppliedTheme>(getSystemTheme);
  const appliedTheme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    applyTheme(preference);
  }, [preference, systemTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    window.localStorage.setItem(themeStorageKey, nextPreference);
    setPreferenceState(nextPreference);
    applyTheme(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ preference, appliedTheme, setPreference }),
    [appliedTheme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

export type { ThemePreference };
