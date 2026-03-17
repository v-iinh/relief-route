import { useRef, useCallback } from 'react';

export default function useMarkers(map, onSelect) {
  const markersRef = useRef([]);
  const currentInfoWindowRef = useRef(null);
  const currentMarkerRef = useRef(null);

  const addMarker = useCallback(location => {
    if (!map || !window.google?.maps) return;

    if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return null;
    }

    const marker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: location.name,
    });

    const infoContent = document.createElement('div');
    infoContent.className = 'mpop';
    infoContent.innerHTML = `
      <div class="mpop-name">${location.name}</div>
      ${location.address && location.address !== '\u2014' ? `<div class="mpop-address">${location.address}</div>` : ''}
      <div class="mpop-actions">
        <button class="mpop-btn mpop-btn--primary js-more-info">More Info</button>
        <button class="mpop-btn mpop-btn--secondary js-directions">Directions</button>
      </div>
    `;

    const infoWindow = new window.google.maps.InfoWindow({
      content: infoContent,
      maxWidth: 260,
    });

    infoContent.querySelector('.js-directions').addEventListener('click', () => {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`,
        '_blank',
        'noopener,noreferrer'
      );
    });

    infoContent.querySelector('.js-more-info').addEventListener('click', () => {
      infoWindow.close();
      currentInfoWindowRef.current = null;
      currentMarkerRef.current = null;
      onSelect?.(location.id);
    });

    marker.addListener('click', () => {
      if (currentInfoWindowRef.current && currentMarkerRef.current === marker) {
        currentInfoWindowRef.current.close();
        currentInfoWindowRef.current = null;
        currentMarkerRef.current = null;
      } else {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }
        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;
        currentMarkerRef.current = marker;
      }
    });

    markersRef.current.push({ marker, infoWindow, location });
    return marker;
  }, [map, onSelect]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(entry => {
      entry.marker.setMap(null);
      if (entry.infoWindow) entry.infoWindow.close();
    });
    markersRef.current = [];
    if (currentInfoWindowRef.current) {
      currentInfoWindowRef.current.close();
      currentInfoWindowRef.current = null;
    }
    currentMarkerRef.current = null;
  }, []);

  return { addMarker, clearMarkers, markers: markersRef.current };
}
