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

/** Store state: the ops data plus whether saved data has been loaded yet. */
export interface StoreState {
  ops: OpsState;
  /** False until the browser's saved data has been applied; nothing is saved before that. */
  loaded: boolean;
}

export type StoreAction = Action | { type: "load"; saved: OpsState | null };

/**
 * "load" marks the store loaded in the same update that applies saved data, so the save
 * effect can never run with pre-load state. (A ref flag set in an effect is not enough:
 * StrictMode re-runs effects and the save effect would write the seed over saved data.)
 */
export function storeReduce(s: StoreState, a: StoreAction): StoreState {
  if (a.type === "load") return s.loaded ? s : { ops: a.saved ?? s.ops, loaded: true };
  const ops = reduce(s.ops, a);
  return ops === s.ops ? s : { ...s, ops };
}

export function StoreProvider({ children, today }: { children: React.ReactNode; today?: string }) {
  const initialDay = today ?? isoDay(new Date());
  const [store, rawDispatch] = useReducer(storeReduce, initialDay, (d): StoreState => ({ ops: seed(d), loaded: false }));
  const state = store.ops;
  const [toast, setToast] = useState<Toast | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load saved state once on mount (idempotent: a second "load" is ignored).
  useEffect(() => {
    let saved: OpsState | null = null;
    try {
      saved = loadSaved(localStorage.getItem(STORAGE_KEY), initialDay);
    } catch {
      saved = null;
    }
    rawDispatch({ type: "load", saved });
  }, [initialDay]);

  // Save every change, but only after the load has been applied.
  useEffect(() => {
    if (!store.loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.ops));
    } catch {
      // Storage full or blocked: the app keeps working for this session.
    }
  }, [store]);

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
