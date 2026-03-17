import { useEffect, useRef, useState } from 'react';
import useMap from '../../hooks/useMap';
import useMarkers from '../../hooks/useMarkers';

const GMAPS_SCRIPT_ID = 'google-maps-js-sdk';

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (window.__googleMapsLoadPromise) {
    return window.__googleMapsLoadPromise;
  }

  window.__googleMapsLoadPromise = new Promise((resolve, reject) => {
    const callbackName = '__initGoogleMaps';
    window[callbackName] = () => {
      resolve();
      delete window[callbackName];
    };

    const existingScript = document.getElementById(GMAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('error', () => {
        reject(new Error('Google Maps script failed to load'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = GMAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      reject(new Error('Google Maps script failed to load'));
      delete window[callbackName];
    };
    document.head.appendChild(script);
  }).catch(error => {
    window.__googleMapsLoadPromise = null;
    throw error;
  });

  return window.__googleMapsLoadPromise;
}

export default function Map({ locations = [], onMapReady, mapRefCallback, onLocationReady, onSelect }) {
  const [apiReady, setApiReady] = useState(Boolean(window.google?.maps));
  const [apiError, setApiError] = useState(false);
  const { mapRef, map } = useMap(apiReady, onLocationReady);
  const { addMarker, clearMarkers } = useMarkers(map, onSelect);
  const scriptLoadAttempted = useRef(false);

  // Expose map reference to parent
  useEffect(() => {
    if (map && mapRefCallback) {
      mapRefCallback(map);
    }
  }, [map, mapRefCallback]);

  // Notify parent when API is ready
  useEffect(() => {
    if (apiReady && onMapReady) {
      onMapReady(map);
    }
  }, [apiReady, map, onMapReady]);

  // Load Google Maps API
  useEffect(() => {
    if (apiReady || scriptLoadAttempted.current) return;
    scriptLoadAttempted.current = true;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    loadGoogleMaps(apiKey)
      .then(() => setApiReady(true))
      .catch(() => setApiError(true));
  }, [apiReady]);

  // Add markers when locations change
  useEffect(() => {
    if (!apiReady || !map) return;

    clearMarkers();
    locations.forEach(location => addMarker(location));
  }, [apiReady, map, locations, addMarker, clearMarkers]);

  if (apiError) {
    return (
      <div id="map-container">
        <div className="map-placeholder">
          <div className="map-placeholder-code">⚠</div>
          <div className="map-placeholder-title">Map failed to load</div>
          <div className="map-placeholder-desc">
            Check your API key restrictions and restart the dev server.
          </div>
          <div className="map-placeholder-badge">Google Maps API error</div>
        </div>
      </div>
    );
  }

  return (
    <div id="map-container">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
