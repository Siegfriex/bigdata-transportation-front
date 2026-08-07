import type { RoutePlanOptions } from "../../entities/route-plan/model/types";

export const queryKeys = {
  routePlans: (params: { start: string; end: string; options: RoutePlanOptions }) =>
    ["routePlans", params] as const,
  aiChat: (sessionId: string) => ["aiChat", sessionId] as const,
  stationContext: (stationName: string) => ["stationContext", stationName] as const,
} as const;
