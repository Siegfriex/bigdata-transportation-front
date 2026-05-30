import React, { useCallback, useState } from "react";
import GoogleTransitMap from "./GoogleTransitMap";
import SvgTransitMapFallback from "./SvgTransitMapFallback";
import type { TransitMapProps } from "./SvgTransitMapFallback";

const InteractiveMap = React.memo(function InteractiveMap(props: TransitMapProps) {
  const [googleMapFailed, setGoogleMapFailed] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

  const handleGoogleMapError = useCallback(() => {
    setGoogleMapFailed(true);
  }, []);

  if (!apiKey || googleMapFailed) {
    return <SvgTransitMapFallback {...props} />;
  }

  return (
    <GoogleTransitMap
      {...props}
      apiKey={apiKey}
      mapId={mapId}
      onLoadError={handleGoogleMapError}
    />
  );
});

export default InteractiveMap;
