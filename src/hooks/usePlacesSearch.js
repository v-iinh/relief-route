import { useState, useCallback } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function haversineMiles(from, to) {
  if (!from || !to) return null;
  const toRad = val => (val * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 3958.8 * c;
}

function toHoursMap(weekdayText) {
  const hours = {
    Mon: '—',
    Tue: '—',
    Wed: '—',
    Thu: '—',
    Fri: '—',
    Sat: '—',
    Sun: '—',
  };

  if (!Array.isArray(weekdayText)) return hours;

  weekdayText.forEach(row => {
    if (typeof row !== 'string') return;
    const match = row.match(/^([^:]+):\s*(.+)$/);
    if (!match) return;

    const dayName = match[1];
    const value = match[2];
    const idx = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(
      dayName.trim()
    );
    if (idx === -1) return;
    const shortDay = DAYS[(idx + 1) % 7];
    hours[shortDay] = value.trim();
  });

  return hours;
}

function normalizePlace(place, idx, origin, openNow = null) {
  const lat = place.geometry?.location?.lat?.() ?? null;
  const lng = place.geometry?.location?.lng?.() ?? null;
  const isCommunity = (place.types || []).includes('community_center');
  const dist =
    lat !== null && lng !== null && origin
      ? haversineMiles(origin, { lat, lng })
      : null;

  return {
    id: place.place_id || `place_${idx}`,
    place_id: place.place_id,
    name: place.name || 'Unknown place',
    address: place.formatted_address || place.vicinity || 'Address not available',
    lat,
    lng,
    phone: place.formatted_phone_number || '—',
    website: place.website || '',
    hours: toHoursMap(place.opening_hours?.weekday_text),
    status: openNow === true ? 'open' : 'closed',
    isOpen: openNow,
    dist: dist === null ? 0 : Number(dist.toFixed(1)),
    rating: place.rating || null,
    types: place.types || [],
    type: isCommunity ? 'Community Listing' : 'Food Pantry',
    filter: isCommunity ? 'community' : 'pantry',
    tags: [],
    needs: [],
    notes: '',
  };
}

export default function usePlacesSearch(map, apiReady) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runTextSearch = useCallback(
    (searchQuery, center, radius = 10000) => {
      if (!map || !apiReady || !window.google?.maps?.places) {
        setError('Google Maps Places API not ready');
        return;
      }

      setLoading(true);
      setError('');

      const service = new window.google.maps.places.PlacesService(map);
      service.textSearch(
        {
          location: center,
          radius,
          query: `${searchQuery} food pantry`,
        },
        async (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            Array.isArray(results)
          ) {
            const detailsPromises = results.map((place, idx) =>
              new Promise(resolve => {
                if (!place.place_id) {
                  resolve(normalizePlace(place, idx, center));
                  return;
                }

                service.getDetails(
                  {
                    placeId: place.place_id,
                    fields: [
                      'place_id',
                      'name',
                      'formatted_address',
                      'formatted_phone_number',
                      'website',
                      'geometry',
                      'opening_hours',
                      'types',
                      'rating',
                    ],
                  },
                  (detailsResult, detailsStatus) => {
                    if (
                      detailsStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                      detailsResult
                    ) {
                      const detailsOpenNow =
                        typeof detailsResult?.opening_hours?.isOpen === 'function'
                          ? detailsResult.opening_hours.isOpen()
                          : null;

                      resolve(normalizePlace(detailsResult, idx, center, detailsOpenNow));
                    } else {
                      resolve(normalizePlace(place, idx, center, null));
                    }
                  }
                );
              })
            );

            const normalized = await Promise.all(detailsPromises);
            setPlaces(normalized);
          } else if (
            status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setPlaces([]);
            setError(`Search failed: ${status}`);
          } else {
            setPlaces([]);
          }

          setLoading(false);
        }
      );
    },
    [map, apiReady]
  );

  const searchNearby = useCallback(
    (center, radius = 10000, searchType = 'food pantry') => {
      runTextSearch(searchType, center, radius);
    },
    [runTextSearch]
  );

  const searchByText = useCallback(
    (query, center, radius = 10000) => {
      if (!map || !apiReady || !window.google?.maps?.Geocoder) {
        setError('Google Maps geocoder not ready');
        return;
      }

      if (!query.trim()) return;

      setLoading(true);
      setError('');

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results, status) => {
        if (
          status === window.google.maps.GeocoderStatus.OK &&
          Array.isArray(results) &&
          results[0]
        ) {
          const location = results[0].geometry.location;
          const centerPoint = { lat: location.lat(), lng: location.lng() };
          map.setCenter(centerPoint);
          runTextSearch(query, centerPoint, radius);
          return;
        }

        // Fallback: run text search around the current map center if geocoding fails.
        if (center) {
          runTextSearch(query, center, radius);
          return;
        }

        setLoading(false);
        setError(`Geocoding failed: ${status}`);
      });
    },
    [map, apiReady, runTextSearch]
  );

  return {
    places,
    loading,
    error,
    searchNearby,
    searchByText,
    setPlaces,
  };
}
