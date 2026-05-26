import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Navigation, Bike, Compass, Bus, ShieldAlert, Train, Plus, Minus } from "lucide-react";
import { RoutePlan } from "../types";

interface InteractiveMapProps {
  startStation: string;
  endStation: string;
  onSelectStation: (type: "start" | "end", name: string) => void;
  selectedPlan: RoutePlan | null;
  visibleLayers: {
    subway: boolean;
    bus: boolean;
    bike: boolean;
    crowd: boolean;
  };
  onToggleLayer: (layer: "subway" | "bus" | "bike" | "crowd") => void;
}

interface StationNode {
  name: string;
  x: number;
  y: number;
  type: "metro" | "bus" | "bike" | "district";
  id: string;
  bikesAvailable?: number;
  busesAvailable?: number;
  crowdLevel: "empty" | "normal" | "crowded" | "danger";
}

// Setup coordinates for major Seoul hubs matching the PRD scenarios
const stations: StationNode[] = [
  { name: "염창역", x: 60, y: 180, type: "metro", id: "yc", bikesAvailable: 15, busesAvailable: 3, crowdLevel: "danger" },
  { name: "여의도역", x: 170, y: 210, type: "metro", id: "yd", bikesAvailable: 24, busesAvailable: 5, crowdLevel: "crowded" },
  { name: "홍대입구역", x: 130, y: 130, type: "metro", id: "hd", bikesAvailable: 19, busesAvailable: 4, crowdLevel: "crowded" },
  { name: "사당역", x: 220, y: 310, type: "metro", id: "sd", bikesAvailable: 11, busesAvailable: 2, crowdLevel: "crowded" },
  { name: "강남역", x: 310, y: 300, type: "metro", id: "gn", bikesAvailable: 8, busesAvailable: 6, crowdLevel: "danger" },
  { name: "구리역", x: 420, y: 110, type: "metro", id: "gr", bikesAvailable: 12, busesAvailable: 1, crowdLevel: "normal" },
  { name: "남양주시", x: 470, y: 70, type: "district", id: "ny", bikesAvailable: 5, busesAvailable: 1, crowdLevel: "empty" },
];

const InteractiveMap = React.memo(function InteractiveMap({
  startStation,
  endStation,
  onSelectStation,
  selectedPlan,
  visibleLayers,
  onToggleLayer,
}: InteractiveMapProps) {
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [contextMenuStation, setContextMenuStation] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [legendTooltip, setLegendTooltip] = useState<"subway" | "bus" | "bike" | "crowd" | null>(null);
  const legendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeLayerCount = Object.values(visibleLayers).filter(Boolean).length;

  const isLayerDanger = (layer: "subway" | "bus" | "bike" | "crowd") => {
    if (layer === "crowd") return stations.some((s) => s.crowdLevel === "danger");
    if (layer === "subway") return stations.some((s) => s.type === "metro" && s.crowdLevel === "danger");
    if (layer === "bus") return stations.some((s) => s.type === "bus" && s.crowdLevel === "danger");
    if (layer === "bike") return stations.some((s) => s.type === "bike" && s.crowdLevel === "danger");
    return false;
  };

  const getLayerDensityScore = (layer: "subway" | "bus" | "bike" | "crowd") => {
    let relevantStations = stations;
    if (layer === "subway") relevantStations = stations.filter(s => s.type === "metro");
    else if (layer === "bus") relevantStations = stations.filter(s => s.type === "bus" || (s.busesAvailable && s.busesAvailable > 0));
    else if (layer === "bike") relevantStations = stations.filter(s => s.type === "bike" || (s.bikesAvailable && s.bikesAvailable > 0));

    if (relevantStations.length === 0) return 30;

    const scores = relevantStations.map(s => {
      switch(s.crowdLevel) {
        case "danger": return 95;
        case "crowded": return 75;
        case "normal": return 45;
        case "empty": return 20;
        default: return 30;
      }
    });
    
    // For general crowd, maybe return the max to emphasize the risk
    if (layer === "crowd") return Math.max(...scores);
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleResetLayers = () => {
    if (visibleLayers.subway) onToggleLayer("subway");
    if (visibleLayers.bus) onToggleLayer("bus");
    if (visibleLayers.bike) onToggleLayer("bike");
    if (visibleLayers.crowd) onToggleLayer("crowd");
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));

  const handleLayerClick = (layer: "subway" | "bus" | "bike" | "crowd") => {
    onToggleLayer(layer);
    setLegendTooltip(layer);
    if (legendTimeoutRef.current) clearTimeout(legendTimeoutRef.current);
    legendTimeoutRef.current = setTimeout(() => {
      setLegendTooltip(null);
    }, 3000);
  };

  // SVG dimensions
  const viewWidth = 500;
  const viewHeight = 400;

  // Get active start & end coords
  const startNode = stations.find((s) => s.name === startStation);
  const endNode = stations.find((s) => s.name === endStation);

  useEffect(() => {
    if (selectedPlan && startNode && endNode) {
      // Base start/end bounds
      let minX = Math.min(startNode.x, endNode.x);
      let maxX = Math.max(startNode.x, endNode.x);
      let minY = Math.min(startNode.y, endNode.y);
      let maxY = Math.max(startNode.y, endNode.y);

      // Compute midpoint curves for camera bounds
      const mid1X = startNode.x + (endNode.x - startNode.x) * 0.35 + (selectedPlan.id === "plan_a" ? 30 : -25);
      const mid1Y = startNode.y + (endNode.y - startNode.y) * 0.25 + (selectedPlan.id === "plan_b" ? -35 : 15);
      const mid2X = startNode.x + (endNode.x - startNode.x) * 0.75 + (selectedPlan.id === "plan_a" ? -15 : 20);
      const mid2Y = startNode.y + (endNode.y - startNode.y) * 0.80 + (selectedPlan.id === "plan_b" ? 25 : -15);

      minX = Math.min(minX, mid1X, mid2X);
      maxX = Math.max(maxX, mid1X, mid2X);
      minY = Math.min(minY, mid1Y, mid2Y);
      maxY = Math.max(maxY, mid1Y, mid2Y);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // We use base SVG dimensions
      const vw = 500;
      const vh = 400;

      const dxDist = Math.max(80, Math.abs(maxX - minX));
      const dyDist = Math.max(80, Math.abs(maxY - minY));

      const padding = 200;
      let targetZoom = 1;
      if (dxDist > dyDist) {
        targetZoom = vw / (dxDist + padding);
      } else {
        targetZoom = vh / (dyDist + padding);
      }
      targetZoom = Math.max(0.85, Math.min(targetZoom, 2.2));

      // pan offset scales with zoom so we first find distance to center,
      // and adjust for the transform order
      const dx = (vw / 2) - centerX;
      const dy = (vh / 2) - centerY;

      setPanOffset({ x: dx, y: dy });
      setZoomLevel(targetZoom);
    }
  }, [selectedPlan, startNode, endNode]);

  // Active path coordinates based on the selected plan
  const getPathSegments = () => {
    if (!startNode || !endNode) return null;
    if (!selectedPlan) {
      // Return straight dashed gray line
      return `M ${startNode.x} ${startNode.y} L ${endNode.x} ${endNode.y}`;
    }

    // Adapt layout line based on route type
    let segmentsString = `M ${startNode.x} ${startNode.y}`;
    
    // If the path includes multiple modes, let's draw structured midpoints to represent real navigation steps
    const mid1X = startNode.x + (endNode.x - startNode.x) * 0.35 + (selectedPlan.id === "plan_a" ? 30 : -25);
    const mid1Y = startNode.y + (endNode.y - startNode.y) * 0.25 + (selectedPlan.id === "plan_b" ? -35 : 15);
    const mid2X = startNode.x + (endNode.x - startNode.x) * 0.75 + (selectedPlan.id === "plan_a" ? -15 : 20);
    const mid2Y = startNode.y + (endNode.y - startNode.y) * 0.80 + (selectedPlan.id === "plan_b" ? 25 : -15);
    
    segmentsString += ` Q ${mid1X} ${mid1Y}, ${mid2X} ${mid2Y} T ${endNode.x} ${endNode.y}`;
    return segmentsString;
  };

  const handleStationClick = (stationName: string) => {
    setContextMenuStation(stationName);
  };

  const selectAs = (type: "start" | "end", name: string) => {
    onSelectStation(type, name);
    setContextMenuStation(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - (panOffset.x * zoomLevel), 
      y: e.clientY - (panOffset.y * zoomLevel) 
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPanOffset({ 
      x: (e.clientX - dragStart.x) / zoomLevel, 
      y: (e.clientY - dragStart.y) / zoomLevel 
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#141618] overflow-hidden select-none z-0">
      <div 
        className={`absolute inset-0 origin-center pointer-events-none z-0 ${!isDragging ? "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" : "transition-none"}`}
        style={{ transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)` }}
      >
        {/* Background Stylized Grid Layout Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:25px_25px] pointer-events-none" />

        {/* Low Saturation Waterway / Han-River Mock Overlay Line */}
        <div className="absolute top-[48%] left-[-10%] w-[120%] h-[24px] bg-[#1a2123] rounded-full filter blur-[1px] rotate-[-7deg] border-y border-[#263134] opacity-70 pointer-events-none -z-10 flex items-center justify-end px-24">
          <span className="text-[9px] font-mono tracking-wider text-[#354347]">HAN RIVER (한강)</span>
        </div>
      </div>

      {/* Floating Compass HUD info */}
      <div className="absolute top-3 left-3 apple-glass/95 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2 pointer-events-none z-10">
        <Compass className="w-4 h-4 text-[#0A84FF] animate-spin-slow" />
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-[#FFFFFF] tracking-wider uppercase">Seoul Grid</span>
          <span className="text-[8px] font-mono text-white/50">FSD Engine Active</span>
        </div>
      </div>

      {/* Layer Controls Overlaid on Map */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        <div className="relative w-full">
          <AnimatePresence>
            {legendTooltip === "subway" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-3 top-0 max-w-[180px] w-max apple-glass/95 backdrop-blur-md border border-white/10 text-white/90 text-[10px] px-3 py-2 rounded-lg shadow-xl font-sans"
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-white text-[11px]">지하철망 혼잡도</strong>
                  <span className={`font-mono font-bold ${getLayerDensityScore("subway") >= 80 ? "text-[#FF3B30]" : "text-[#0A84FF]"}`}>
                    {getLayerDensityScore("subway")}%
                  </span>
                </div>
                지하철역과 노선 연결망을 표시합니다.
              </motion.div>
            )}
          </AnimatePresence>
          <button
            id="toggle-subway"
            onClick={() => handleLayerClick("subway")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border w-full ${
              visibleLayers.subway
                ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_0_12px_rgba(10,132,255,0.4)]"
                : isLayerDanger("subway")
                ? "apple-glass text-[#FF3B30] border-[#FF3B30]/60 shadow-[0_0_12px_rgba(255,59,48,0.3)] hover:bg-white/10"
                : "apple-glass text-white/70 border-white/10 hover:bg-white/10"
            } ${isLayerDanger("subway") ? "animate-pulse" : ""}`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>지하철</span>
          </button>
        </div>

        <div className="relative w-full">
          <AnimatePresence>
            {legendTooltip === "bus" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-3 top-0 max-w-[180px] w-max apple-glass/95 backdrop-blur-md border border-white/10 text-white/90 text-[10px] px-3 py-2 rounded-lg shadow-xl font-sans"
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-white text-[11px]">버스 노선 혼잡도</strong>
                  <span className={`font-mono font-bold ${getLayerDensityScore("bus") >= 80 ? "text-[#FF3B30]" : "text-[#0A84FF]"}`}>
                    {getLayerDensityScore("bus")}%
                  </span>
                </div>
                현재 운행 중인 버스의 실시간 위치를 표시합니다.
              </motion.div>
            )}
          </AnimatePresence>
          <button
            id="toggle-bus"
            onClick={() => handleLayerClick("bus")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border w-full ${
              visibleLayers.bus
                ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_0_12px_rgba(10,132,255,0.4)]"
                : isLayerDanger("bus")
                ? "apple-glass text-[#FF3B30] border-[#FF3B30]/60 shadow-[0_0_12px_rgba(255,59,48,0.3)] hover:bg-white/10"
                : "apple-glass text-white/70 border-white/10 hover:bg-white/10"
            } ${isLayerDanger("bus") ? "animate-pulse" : ""}`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>버스</span>
          </button>
        </div>

        <div className="relative w-full">
          <AnimatePresence>
            {legendTooltip === "bike" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-3 top-0 max-w-[180px] w-max apple-glass/95 backdrop-blur-md border border-white/10 text-white/90 text-[10px] px-3 py-2 rounded-lg shadow-xl font-sans"
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-white text-[11px]">따릉이 가용률</strong>
                  <span className={`font-mono font-bold ${100 - getLayerDensityScore("bike") <= 20 ? "text-[#FF3B30]" : "text-[#0A84FF]"}`}>
                    {100 - getLayerDensityScore("bike")}%
                  </span>
                </div>
                따릉이 대여소와 실시간 잔여 대수를 표시합니다.
              </motion.div>
            )}
          </AnimatePresence>
          <button
            id="toggle-bike"
            onClick={() => handleLayerClick("bike")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border w-full ${
              visibleLayers.bike
                ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_0_12px_rgba(10,132,255,0.4)]"
                : isLayerDanger("bike")
                ? "apple-glass text-[#FF3B30] border-[#FF3B30]/60 shadow-[0_0_12px_rgba(255,59,48,0.3)] hover:bg-white/10"
                : "apple-glass text-white/70 border-white/10 hover:bg-white/10"
            } ${isLayerDanger("bike") ? "animate-pulse" : ""}`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>따릉이</span>
          </button>
        </div>

        <div className="relative w-full">
          <AnimatePresence>
            {legendTooltip === "crowd" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-3 top-0 max-w-[180px] w-max apple-glass/95 backdrop-blur-md border border-[#FF3B30]/30 text-[#FF3B30] font-medium text-[10px] px-3 py-2 rounded-lg shadow-xl font-sans"
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-[#FF3B30] text-[11px]">전체 과밀 경고</strong>
                  <span className="font-mono font-bold text-[#FF3B30]">
                    {getLayerDensityScore("crowd")}%
                  </span>
                </div>
                인파 과밀 구간 및 주요 혼잡 위험 경고입니다.
              </motion.div>
            )}
          </AnimatePresence>
          <button
            id="toggle-crowd"
            onClick={() => handleLayerClick("crowd")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border w-full ${
              visibleLayers.crowd
                ? "bg-[#FF3B30] text-white border-[#FF3B30] shadow-[0_0_15px_rgba(255,59,48,0.4)]"
                : isLayerDanger("crowd")
                ? "apple-glass text-[#FF3B30] border-[#FF3B30]/60 shadow-[0_0_12px_rgba(255,59,48,0.3)] hover:bg-white/10"
                : "apple-glass text-white/70 border-white/10 hover:bg-white/10"
            } ${isLayerDanger("crowd") ? "animate-pulse" : ""}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>공포 혼잡</span>
          </button>
        </div>

        <AnimatePresence>
          {activeLayerCount > 2 && (
            <motion.button
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 4 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              onClick={handleResetLayers}
              className="flex items-center overflow-hidden justify-center py-1.5 rounded-lg text-[9px] font-mono font-bold text-white/70 apple-glass-light border border-white/10 hover:text-white hover:bg-white/10 transition-colors w-full"
            >
              RESET ALL
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-6 right-3 flex flex-col z-20 transition-all rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <button
          onClick={handleZoomIn}
          className="apple-glass/90 backdrop-blur border border-white/10 text-white p-2 rounded-t-lg hover:bg-white/10 active:bg-[#0A84FF] active:text-black transition-all flex items-center justify-center"
          aria-label="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="h-[1px] bg-white/20 w-full" />
        <button
          onClick={handleZoomOut}
          className="apple-glass/90 backdrop-blur border border-white/10 text-white p-2 rounded-b-lg hover:bg-white/10 active:bg-[#0A84FF] active:text-black transition-all flex items-center justify-center"
          aria-label="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dynamic Svg Overlay Canvas */}
      <div 
        className={`w-full h-full absolute inset-0 origin-center pointer-events-none ${!isDragging ? "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" : "transition-none"}`}
        style={{ transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)` }}
      >
      <svg
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing pointer-events-auto"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid slice"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Dynamic Route Line */}
        {startNode && endNode && (
          <g>
            {/* Background Thick shadow line */}
            <motion.path
              key={`bg-${selectedPlan?.id || "default"}-${startStation}-${endStation}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              d={getPathSegments() || ""}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.12"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Colored Mode Indicator Route Line */}
            <motion.path
              key={`fg-${selectedPlan?.id || "default"}-${startStation}-${endStation}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeInOut", delay: 0.1 }}
              d={getPathSegments() || ""}
              fill="none"
              stroke={
                selectedPlan
                  ? selectedPlan.risk === "high"
                    ? "#FF3B30"
                    : "#0A84FF"
                  : "#FFFFFF"
              }
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={selectedPlan ? "shadow-[0_0_12px_rgba(10,132,255,0.7)] drop-shadow-xl" : ""}
            />
            {/* Flow indicator dashes moving continuously */}
            {selectedPlan && (
              <motion.path
                key={`flow-${selectedPlan.id}-${startStation}-${endStation}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                d={getPathSegments() || ""}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-dash-animated drop-shadow-md"
              />
            )}
          </g>
        )}

        {/* Dynamic Crowded overlay heatmap shadows if true */}
        {visibleLayers.crowd &&
          stations
            .filter((s) => s.crowdLevel === "danger" || s.crowdLevel === "crowded")
            .map((s, idx) => (
              <circle
                key={`crowd-${idx}`}
                cx={s.x}
                cy={s.y}
                r={s.crowdLevel === "danger" ? 42 : 28}
                fill={s.crowdLevel === "danger" ? "#FF3B30" : "#FF9500"}
                opacity="0.25"
                className="animate-pulse drop-shadow-xl"
              />
            ))}

        {/* Dynamic Bus locations representation if bus layer active */}
        {visibleLayers.bus &&
          stations
            .filter((s) => s.busesAvailable && s.busesAvailable > 0)
            .map((s, idx) => (
              <g key={`bus-pos-${idx}`} opacity="0.95" className="drop-shadow-lg">
                <circle cx={s.x - 18} cy={s.y - 12} r="8" fill="#0A84FF" />
                <circle cx={s.x - 18} cy={s.y - 12} r="9" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
                <text
                  x={s.x - 18}
                  y={s.y - 9}
                  fill="#FFF"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  B
                </text>
              </g>
            ))}

        {/* Station Markers & Nodes */}
        {stations.map((station) => {
          const isSelectedStart = station.name === startStation;
          const isSelectedEnd = station.name === endStation;
          const isHovered = hoveredStation === station.name;

          return (
            <g
              key={station.id}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredStation(station.name)}
              onMouseLeave={() => setHoveredStation(null)}
              onClick={() => handleStationClick(station.name)}
            >
              {/* Highlight Circle Background */}
              {(isSelectedStart || isSelectedEnd || isHovered) && (
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={isSelectedStart || isSelectedEnd ? 16 : 11}
                  fill={isSelectedStart ? "#A6D600" : isSelectedEnd ? "#F5B700" : "#2E3236"}
                  opacity="0.3"
                  className="transition-all duration-200"
                />
              )}

              {/* Central Station Dot */}
              <circle
                cx={station.x}
                cy={station.y}
                r={isSelectedStart || isSelectedEnd ? 6.5 : 4.5}
                fill={
                  isSelectedStart
                    ? "#A6D600"
                    : isSelectedEnd
                    ? "#F5B700"
                    : station.type === "district"
                    ? "#4E545B"
                    : "#FFFFFF"
                }
                stroke="#141618"
                strokeWidth={1.5}
              />

              {/* Station label */}
              <text
                x={station.x}
                y={station.y - 12}
                fill={isSelectedStart || isSelectedEnd ? "#FFFFFF" : "#A8ADB3"}
                fontSize="10"
                fontWeight={isSelectedStart || isSelectedEnd ? "700" : "500"}
                textAnchor="middle"
                className="font-sans antialiased select-none"
              >
                {station.name}
              </text>

              {/* Small details inside the layer overlay flags i.e. bike, buses remaining counts */}
              {visibleLayers.bike && station.bikesAvailable && (
                <g transform={`translate(${station.x + 12}, ${station.y + 4})`}>
                  <rect
                    width="22"
                    height="11"
                    rx="3"
                    fill="#1E2124"
                    stroke="#2D3135"
                    strokeWidth="0.5"
                  />
                  <text
                    x="11"
                    y="8"
                    fontSize="7"
                    fill="#A6D600"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    🚲{station.bikesAvailable}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      {/* Interactive station context action popup sheet */}
      {contextMenuStation && (
        <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 apple-glass border border-white/10 rounded-xl p-3 shadow-2xl z-30 flex flex-col gap-2 min-w-[160px] animate-in fade-in-50 zoom-in-95 fill-mode-both">
          <div className="flex justify-between items-center border-b border-white/15 pb-1.5">
            <span className="text-xs font-bold text-white pr-2">{contextMenuStation} 선택</span>
            <button
              id="close-context-menu"
              onClick={() => setContextMenuStation(null)}
              className="text-[10px] text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
          <button
            id="set-start-station"
            onClick={() => selectAs("start", contextMenuStation)}
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-transparent rounded text-left text-xs text-[#0A84FF] font-medium transition-all"
          >
            <Navigation className="w-3 h-3 text-[#0A84FF] rotate-45" />
            <span>출발지로 설정</span>
          </button>
          <button
            id="set-end-station"
            onClick={() => selectAs("end", contextMenuStation)}
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-transparent rounded text-left text-xs text-[#FF9500] font-medium transition-all"
          >
            <MapPin className="w-3 h-3 text-[#FF9500]" />
            <span>목적지로 설정</span>
          </button>
        </div>
      )}

      {/* Tiny instructions helper indicator bar */}
      <div className="absolute bottom-2 left-3 text-[9px] text-white/50 font-mono select-none pointer-events-none italic">
        * 지도의 역설점을 터치하여 출발지/목적지를 실시간 변경할 수 있습니다.
      </div>
    </div>
  );
});

export default InteractiveMap;
