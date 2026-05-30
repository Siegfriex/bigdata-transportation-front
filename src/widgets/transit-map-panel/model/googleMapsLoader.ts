type GoogleMapsWindow = Window & {
  google?: any;
  __talsuGoogleMapsPromise?: Promise<void>;
  __talsuGoogleMapsReady?: () => void;
};

export function loadGoogleMaps(apiKey: string, mapId?: string): Promise<void> {
  const typedWindow = window as GoogleMapsWindow;
  if (typedWindow.google?.maps?.Map) return Promise.resolve();
  if (typedWindow.__talsuGoogleMapsPromise) return typedWindow.__talsuGoogleMapsPromise;

  typedWindow.__talsuGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    typedWindow.__talsuGoogleMapsReady = () => resolve();
    const params = new URLSearchParams({
      key: apiKey,
      loading: "async",
      v: "weekly",
      region: "KR",
      language: "ko",
      callback: "__talsuGoogleMapsReady",
    });

    if (mapId) params.set("map_ids", mapId);

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps JavaScript API failed to load"));
    document.head.appendChild(script);
  });

  return typedWindow.__talsuGoogleMapsPromise;
}
