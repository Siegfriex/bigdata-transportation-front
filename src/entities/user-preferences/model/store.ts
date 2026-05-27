import { STORAGE_KEYS } from "../../../shared/config";
import { usePersistentState } from "../../../shared/model/usePersistentState";
import { getDefaultPreferences } from "./defaults";
import type { UserPreferences } from "./types";

export function useUserPreferencesStore() {
  return usePersistentState<UserPreferences>(STORAGE_KEYS.preferences, getDefaultPreferences());
}
