import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return initialValue;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null) return initialValue;
    if (Array.isArray(initialValue) && !Array.isArray(parsed)) return initialValue;
    if (
      typeof initialValue === "object" &&
      initialValue !== null &&
      !Array.isArray(initialValue) &&
      (typeof parsed !== "object" || Array.isArray(parsed))
    ) {
      return initialValue;
    }
    return parsed as T;
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
