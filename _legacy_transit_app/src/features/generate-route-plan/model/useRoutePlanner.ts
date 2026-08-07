import { useCallback, useEffect, useState } from "react";
import { getCarSurvivalDetails, getRoutePlans, type CarDetail, type RoutePlan } from "../../../entities/route-plan";
import type { ReportType } from "../../../entities/report";
import type { UserPreferences } from "../../../entities/user-preferences";
import type { RoutePreset } from "./presets";

export function useRoutePlanner(preferences: UserPreferences) {
  const [startStation, setStartStation] = useState("염창역");
  const [endStation, setEndStation] = useState("여의도역");
  const [deadlineTime, setDeadlineTime] = useState("09:00");
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("deadline");
  const [plans, setPlans] = useState<RoutePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RoutePlan | null>(null);
  const [activeCarNo, setActiveCarNo] = useState("3-3");
  const [carDetails, setCarDetails] = useState<CarDetail[]>([]);

  const getPlansForStations = useCallback(
    (from: string, to: string) =>
      getRoutePlans(from, to, {
        useBike: preferences.useBike,
        maxTaxiFee: preferences.maxTaxiFee,
      }),
    [preferences.maxTaxiFee, preferences.useBike]
  );

  const updateRoutePlans = useCallback(() => {
    const calculatedPlans = getPlansForStations(startStation, endStation);
    setPlans(calculatedPlans);

    setSelectedPlan((prev) => {
      if (prev && calculatedPlans.some((plan) => plan.id === prev.id)) {
        return calculatedPlans.find((plan) => plan.id === prev.id)!;
      }
      return calculatedPlans[0] || null;
    });

    if (startStation === "사당역") {
      setSelectedReportType("boarding");
    } else if (startStation === "홍대입구역") {
      setSelectedReportType("recovery");
    } else {
      setSelectedReportType("deadline");
    }
  }, [endStation, getPlansForStations, startStation]);

  useEffect(() => {
    updateRoutePlans();
  }, [updateRoutePlans]);

  useEffect(() => {
    setCarDetails(getCarSurvivalDetails("9호선"));
  }, []);

  const applyPreset = useCallback((preset: RoutePreset) => {
    setStartStation(preset.start);
    setEndStation(preset.end);
    setSelectedReportType(preset.report);
    if (preset.time) setDeadlineTime(preset.time);
  }, []);

  const applyStations = useCallback((from?: string, to?: string) => {
    if (from) setStartStation(from);
    if (to) setEndStation(to);
  }, []);

  return {
    startStation,
    endStation,
    deadlineTime,
    selectedReportType,
    plans,
    selectedPlan,
    carDetails,
    activeCarNo,
    setStartStation,
    setEndStation,
    setDeadlineTime,
    setSelectedReportType,
    setSelectedPlan,
    setActiveCarNo,
    applyPreset,
    applyStations,
    getPlansForStations,
  };
}
