export type TabId = "map" | "archive" | "settings";

export const APP_TABS: Array<{ id: TabId; label: string }> = [
  { id: "map", label: "지도" },
  { id: "archive", label: "기록" },
  { id: "settings", label: "설정" },
];
