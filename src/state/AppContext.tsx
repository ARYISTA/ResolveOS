"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import type { AppState, AppAction } from "@/lib/schemas";

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: AppState = {
  domain: null,
  companyId: null,
  role: "admin",
  mode: "mock",
  theme: "light",
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_DOMAIN":
      return { ...state, domain: action.domain, companyId: null };
    case "SET_COMPANY":
      return { ...state, companyId: action.companyId };
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_THEME":
      return { ...state, theme: action.theme };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sync theme class on <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [state.theme]);

  // Detect system preference on first mount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.matches) {
      dispatch({ type: "SET_THEME", theme: "dark" });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({
      type: "SET_THEME",
      theme: state.theme === "light" ? "dark" : "light",
    });
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
