import type { ComponentProps } from "react";
import { MapWorkspace } from "../../widgets/map-workspace";

export type MapPageProps = ComponentProps<typeof MapWorkspace>;

export function MapPage(props: MapPageProps) {
  return <MapWorkspace {...props} />;
}
