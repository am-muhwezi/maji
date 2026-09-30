"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { isoDay } from "./format";
import { reduce, type Action } from "./reducer";
import { seed } from "./seed";
import type { OpsState } from "./types";

/**
 * App state lives in the browser (localStorage) so the demo is fully usable with no backend.
 * Saved state from a previous calendar day is discarded and reseeded: every visit starts on "today".
 */
const STORAGE_KEY = "hydroflow.ops.v2";

type Toast = { id: number; message: string; tone: "success" | "error" };

interface StoreValue {
  state: OpsState;
  dispatch: (action: Action) => boolean;
  toast: Toast | null;
  notify: (message: string, tone?: Toast["tone"]) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function loadSaved(raw: string | null, today: string): OpsState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OpsState;
    if (parsed?.today !== today || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function StoreProvider({ children, today }: { children: React.ReactNode; today?: string }) {
  const initialDay = today ?? isoDay(new Date());
  const [state, rawDispatch] = useReducer(
    (s: OpsState, a: Action | { type: "hydrate"; state: OpsState }) =>
      a.type === "hydrate" ? a.state : reduce(s, a),
    initialDay,
    seed,
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const hydrated = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist every change after hydration. Declared before the load effect so the
  // mount pass never overwrites saved data with the seed.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the app keeps working for this session.
    }
  }, [state]);

  // Load saved state once on mount.
  useEffect(() => {
    let saved: OpsState | null = null;
    try {
      saved = loadSaved(localStorage.getItem(STORAGE_KEY), initialDay);
    } catch {
      saved = null;
    }
    if (saved) rawDispatch({ type: "hydrate", state: saved });
    hydrated.current = true;
  }, [initialDay]);

  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  /** Dispatch and report whether the action changed anything. */
  const dispatch = useCallback((action: Action) => {
    const before = stateRef.current;
    const after = reduce(before, action);
    if (after === before) return false;
    stateRef.current = after;
    rawDispatch(action);
    return true;
  }, []);

  const value = useMemo(() => ({ state, dispatch, toast, notify }), [state, dispatch, toast, notify]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
