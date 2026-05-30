import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bike, Bus, Compass, MapPin, Navigation, ShieldAlert, Train } from "lucide-react";
import { stations } from "../../../entities/station";
import type { TransitLayer } from "../../../features/toggle-map-layer";
import { getRoutePath, getStationByName, getStationCenter } from "../model/mapAdapter";
import { loadGoogleMaps } from "../model/googleMapsLoader";
import type { TransitMapProps } from "./SvgTransitMapFallback";

interface GoogleTransitMapProps extends TransitMapProps {
  apiKey: string;
  mapId?: string;
  onLoadError: () => void;
}

const layerLabels: Record<TransitLayer, string> = {
  subway: "지하철",
  bus: "버스",
  bike: "따릉이",
  crowd: "공포 혼잡",
};

const layerIcons: Record<TransitLayer, React.ComponentType<{ className?: string }>> = {
  subway: Train,
  bus: Bus,
  bike: Bike,
  crowd: ShieldAlert,
};

function clearMarkers(markers: any[]) {
  markers.forEach((marker) => {
    if (typeof marker.setMap === "function") marker.setMap(null);
    else marker.map = null;
  });
}

function createAdvancedMarkerContent(stationName: string, color: string, isSelected: boolean) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "3px";
  wrapper.style.transform = "translateY(-2px)";

  const dot = document.createElement("div");
  dot.style.width = isSelected ? "18px" : "14px";
  dot.style.height = isSelected ? "18px" : "14px";
  dot.style.borderRadius = "999px";
  dot.style.background = color;
  dot.style.border = "2px solid #141618";
  dot.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";

  const label = document.createElement("div");
  label.textContent = stationName;
  label.style.padding = "2px 6px";
  label.style.borderRadius = "999px";
  label.style.background = "rgba(20,22,24,0.82)";
  label.style.border = "1px solid rgba(255,255,255,0.14)";
  label.style.color = "#fff";
  label.style.font = `${isSelected ? 700 : 600} 11px system-ui, sans-serif`;
  label.style.whiteSpace = "nowrap";

  wrapper.append(dot, label);
  return wrapper;
}

function getMarkerColor(stationName: string, startStation: string, endStation: string, crowdLevel: string) {
  if (stationName === startStation) return "#A6D600";
  if (stationName === endStation) return "#F5B700";
  if (crowdLevel === "danger") return "#FF3B30";
  if (crowdLevel === "crowded") return "#FF9500";
  return "#0A84FF";
}

const GoogleTransitMap = React.memo(function GoogleTransitMap({
  apiKey,
  mapId,
  startStation,
  endStation,
  onSelectStation,
  selectedPlan,
  visibleLayers,
  onToggleLayer,
  onLoadError,
}: GoogleTransitMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const startNode = useMemo(() => getStationByName(stations, startStation), [startStation]);
  const endNode = useMemo(() => getStationByName(stations, endStation), [endStation]);

  useEffect(() => {
    let cancelled = false;

    void loadGoogleMaps(apiKey, mapId)
      .then(() => {
        if (cancelled || !mapElementRef.current) return;
        const center = getStationCenter(stations);
        mapRef.current = new window.google.maps.Map(mapElementRef.current, {
          center,
          zoom: 11,
          mapId,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: mapId
            ? undefined
            : [
                { elementType: "geometry", stylers: [{ color: "#171a1d" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#d7dde3" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#111315" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#252b30" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#111f25" }] },
                { featureType: "poi", stylers: [{ visibility: "off" }] },
              ],
        });
        infoRef.current = new window.google.maps.InfoWindow();
        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) onLoadError();
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, mapId, onLoadError]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    let cancelled = false;

    const renderMarkers = async () => {
      clearMarkers(markersRef.current);
      markersRef.current = [];
      const markerLibrary = mapId && window.google.maps.importLibrary
        ? await window.google.maps.importLibrary("marker")
        : null;
      if (cancelled) return;

      markersRef.current = stations.map((station) => {
        const color = getMarkerColor(station.name, startStation, endStation, station.crowdLevel);
        const isSelected = station.name === startStation || station.name === endStation;
        const usesAdvancedMarker = Boolean(markerLibrary?.AdvancedMarkerElement);
        const marker = usesAdvancedMarker
          ? new markerLibrary.AdvancedMarkerElement({
              map: mapRef.current,
              position: { lat: station.lat, lng: station.lng },
              title: station.name,
              content: createAdvancedMarkerContent(station.name, color, isSelected),
              gmpClickable: true,
            })
          : new window.google.maps.Marker({
              map: mapRef.current,
              position: { lat: station.lat, lng: station.lng },
              title: station.name,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isSelected ? 9 : 7,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#141618",
                strokeWeight: 2,
              },
              label: {
                text: station.name,
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: isSelected ? "700" : "500",
              },
            });

        const openStationMenu = () => {
          infoRef.current?.setContent(`
            <div style="min-width:132px;color:#111827;font-family:system-ui,sans-serif;">
              <strong style="display:block;margin-bottom:8px;">${station.name}</strong>
              <button data-station-action="start" style="margin-right:6px;padding:6px 8px;border:0;border-radius:6px;background:#0A84FF;color:#fff;font-weight:700;">출발</button>
              <button data-station-action="end" style="padding:6px 8px;border:0;border-radius:6px;background:#FF9500;color:#111;font-weight:700;">도착</button>
            </div>
          `);
          infoRef.current?.open({ map: mapRef.current, anchor: marker });
          window.google.maps.event.addListenerOnce(infoRef.current, "domready", () => {
            document.querySelectorAll("[data-station-action]").forEach((button) => {
              button.addEventListener("click", () => {
                const type = button.getAttribute("data-station-action") === "start" ? "start" : "end";
                onSelectStation(type, station.name);
                infoRef.current?.close();
              });
            });
          });
        };

        if (usesAdvancedMarker) marker.addEventListener("gmp-click", openStationMenu);
        else marker.addListener("click", openStationMenu);

        return marker;
      });
    };

    void renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [endStation, isLoaded, mapId, onSelectStation, startStation]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    routeRef.current?.setMap(null);
    const path = selectedPlan?.geometry?.path ?? getRoutePath(startNode, endNode);
    if (path.length < 2) return;

    routeRef.current = new window.google.maps.Polyline({
      map: mapRef.current,
      path,
      strokeColor: selectedPlan?.risk === "high" ? "#FF3B30" : "#0A84FF",
      strokeOpacity: 0.92,
      strokeWeight: 5,
      geodesic: true,
    });

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    mapRef.current.fitBounds(bounds, 72);
  }, [endNode, isLoaded, selectedPlan, startNode]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#141618] overflow-hidden select-none z-0">
      <div ref={mapElementRef} data-testid="google-transit-map" className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_42%,transparent_0%,transparent_58%,rgba(20,22,24,0.34)_100%)]" />

      <div className="absolute top-3 left-3 apple-glass/95 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2 pointer-events-none z-10">
        <Compass className="w-4 h-4 text-[#0A84FF]" />
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-white tracking-wider uppercase">Google Seoul</span>
          <span className="text-[8px] font-mono text-white/50">Maps JS Renderer</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        {(Object.keys(layerLabels) as TransitLayer[]).map((layer) => {
          const Icon = layerIcons[layer];
          const active = visibleLayers[layer];
          return (
            <button
              key={layer}
              id={`toggle-${layer}`}
              onClick={() => onToggleLayer(layer)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                active
                  ? layer === "crowd"
                    ? "bg-[#FF3B30] text-white border-[#FF3B30]"
                    : "bg-[#0A84FF] text-white border-[#0A84FF]"
                  : "apple-glass text-white/75 border-white/10 hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{layerLabels[layer]}</span>
            </button>
          );
        })}
      </div>

      {visibleLayers.crowd && (
        <div className="absolute bottom-12 left-3 right-16 z-20 rounded-xl border border-[#FF3B30]/30 bg-[#141618]/80 px-3 py-2 text-[10px] font-medium text-[#FFB4AE] backdrop-blur-md">
          혼잡 레이어는 현재 mock station 위험도를 마커 색상으로 표시합니다.
        </div>
      )}

      <div className="absolute bottom-2 left-3 text-[9px] text-white/60 font-mono select-none pointer-events-none italic">
        * 마커를 터치하여 출발지/목적지를 변경할 수 있습니다.
      </div>
    </div>
  );
});

export default GoogleTransitMap;
