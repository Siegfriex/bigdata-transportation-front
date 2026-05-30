import { STORAGE_KEYS } from "../../../shared/config";
import { usePersistentState } from "../../../shared/model/usePersistentState";
import type { SavedReport } from "./types";

export function useSavedReportsStore() {
  return usePersistentState<SavedReport[]>(STORAGE_KEYS.savedReports, []);
}
