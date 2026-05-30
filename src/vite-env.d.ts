/// <reference types="vite/client" />

interface Window {
  google?: any;
  __talsuGoogleMapsPromise?: Promise<void>;
  __talsuGoogleMapsReady?: () => void;
}
