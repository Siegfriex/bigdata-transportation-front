import type { UserPreferences } from "./types";

export function getDefaultPreferences(): UserPreferences {
  return {
    home: "염창역",
    work: "여의도역",
    crowdSensitivity: "normal",
    maxTaxiFee: 10000,
    walkLimitMin: 15,
    useBike: true,
    aiStyle: "detailed",
    favoriteRoutes: ["염창역 → 여의도역", "사당역 → 강남역"],
  };
}
