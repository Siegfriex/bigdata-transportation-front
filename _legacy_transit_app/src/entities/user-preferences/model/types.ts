export interface UserPreferences {
  home: string;
  work: string;
  crowdSensitivity: "low" | "normal" | "high";
  maxTaxiFee: number;
  walkLimitMin: number;
  useBike: boolean;
  aiStyle: "brief" | "detailed" | "emergency";
  favoriteRoutes: string[];
}
