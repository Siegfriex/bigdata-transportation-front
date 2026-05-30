export interface StationNode {
  id: string;
  name: string;
  type: "metro" | "bus" | "bike" | "district";
  lat: number;
  lng: number;
  placeId?: string;
  x?: number;
  y?: number;
  bikesAvailable?: number;
  busesAvailable?: number;
  crowdLevel: "empty" | "normal" | "crowded" | "danger";
}
