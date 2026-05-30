import type { StationNode } from "../../../entities/station";

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export function getStationCenter(stations: StationNode[]): LatLngLiteral {
  if (stations.length === 0) return { lat: 37.5665, lng: 126.978 };

  const total = stations.reduce(
    (sum, station) => ({
      lat: sum.lat + station.lat,
      lng: sum.lng + station.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: total.lat / stations.length,
    lng: total.lng / stations.length,
  };
}

export function getStationByName(stations: StationNode[], name: string): StationNode | undefined {
  return stations.find((station) => station.name === name);
}

export function getRoutePath(start?: StationNode, end?: StationNode): LatLngLiteral[] {
  if (!start || !end) return [];
  return [
    { lat: start.lat, lng: start.lng },
    {
      lat: start.lat + (end.lat - start.lat) * 0.45 + 0.012,
      lng: start.lng + (end.lng - start.lng) * 0.42 - 0.006,
    },
    {
      lat: start.lat + (end.lat - start.lat) * 0.72 - 0.006,
      lng: start.lng + (end.lng - start.lng) * 0.75 + 0.01,
    },
    { lat: end.lat, lng: end.lng },
  ];
}
