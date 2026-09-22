"use client";

import { useEffect } from "react";

export const HABIT_DATA_UPDATED_EVENT = "habit:data-updated";

export type DataUpdateCategory =
  | "task"
  | "project"
  | "milestone"
  | "finance"
  | "shopping"
  | "ai-account"
  | "event"
  | "vault"
  | "all";

/**
 * Dispatches a global event across the application so any mounted view
 * can instantly re-fetch or sync state without a full page reload.
 */
export function notifyDataUpdated(category: DataUpdateCategory = "all") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(HABIT_DATA_UPDATED_EVENT, {
        detail: { category, timestamp: Date.now() },
      }),
    );
  }
}

/**
 * Custom React hook to listen for real-time background data updates.
 */
export function useDataUpdateListener(
  callback: (category?: DataUpdateCategory) => void,
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        category?: DataUpdateCategory;
        timestamp: number;
      }>;
      callback(customEvent.detail?.category);
    };

    window.addEventListener(HABIT_DATA_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HABIT_DATA_UPDATED_EVENT, handleUpdate);
    };
  }, [callback]);
}
