export interface StationNode {
  name: string;
  x: number;
  y: number;
  type: "metro" | "bus" | "bike" | "district";
  id: string;
  bikesAvailable?: number;
  busesAvailable?: number;
  crowdLevel: "empty" | "normal" | "crowded" | "danger";
}
