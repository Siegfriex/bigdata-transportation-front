import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return initialValue;
    return JSON.parse(raw) as T;
  } catch {
    return initialValue;
  }
}

export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private or embedded browser contexts.
    }
  }, [key, value]);

  return [value, setValue];
}
