import type { StationNode } from "../model/types";

export const stations: StationNode[] = [
  { name: "염창역", lat: 37.5469, lng: 126.8747, x: 60, y: 180, type: "metro", id: "yc", bikesAvailable: 15, busesAvailable: 3, crowdLevel: "danger" },
  { name: "여의도역", lat: 37.5216, lng: 126.9243, x: 170, y: 210, type: "metro", id: "yd", bikesAvailable: 24, busesAvailable: 5, crowdLevel: "crowded" },
  { name: "홍대입구역", lat: 37.5572, lng: 126.9245, x: 130, y: 130, type: "metro", id: "hd", bikesAvailable: 19, busesAvailable: 4, crowdLevel: "crowded" },
  { name: "사당역", lat: 37.4765, lng: 126.9816, x: 220, y: 310, type: "metro", id: "sd", bikesAvailable: 11, busesAvailable: 2, crowdLevel: "crowded" },
  { name: "강남역", lat: 37.4979, lng: 127.0276, x: 310, y: 300, type: "metro", id: "gn", bikesAvailable: 8, busesAvailable: 6, crowdLevel: "danger" },
  { name: "구리역", lat: 37.6033, lng: 127.1433, x: 420, y: 110, type: "metro", id: "gr", bikesAvailable: 12, busesAvailable: 1, crowdLevel: "normal" },
  { name: "남양주시", lat: 37.636, lng: 127.2165, x: 470, y: 70, type: "district", id: "ny", bikesAvailable: 5, busesAvailable: 1, crowdLevel: "empty" },
];

export const stationNames = stations.map((station) => station.name);
