import { useState, useCallback } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function parseTimeToMinutes(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[\u202F\u00A0\u2009]/g, ' ').trim();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const mins = Number(match[2] || '0');
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(mins) || mins < 0 || mins > 59) return null;
  if (hour < 1 || hour > 12) return null;

  if (hour === 12) hour = 0;
  if (meridiem === 'PM') hour += 12;

  return hour * 60 + mins;
}

function getNowAtPlace(utcOffsetMinutes) {
  if (typeof utcOffsetMinutes !== 'number' || Number.isNaN(utcOffsetMinutes)) {
    const now = new Date();
    return {
      dayIndex: now.getDay(),
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }

  const placeNow = new Date(Date.now() + utcOffsetMinutes * 60 * 1000);
  return {
    dayIndex: placeNow.getUTCDay(),
    minutes: placeNow.getUTCHours() * 60 + placeNow.getUTCMinutes(),
  };
}

function isOpenForTodayRow(todayRow, nowMinutes) {
  if (typeof todayRow !== 'string') return null;

  const split = todayRow.split(':');
  if (split.length < 2) return null;

  const value = split.slice(1).join(':').trim();
  if (!value) return null;
  if (/open\s+24\s+hours/i.test(value)) return true;
  if (/closed/i.test(value)) return false;

  const normalized = value
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u202F\u00A0\u2009]/g, ' ');

  const ranges = normalized
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  for (const range of ranges) {
    const [openPart, closePart] = range.split('-').map(part => part.trim());
    if (!openPart || !closePart) continue;

    const openMinutes = parseTimeToMinutes(openPart);
    const closeMinutes = parseTimeToMinutes(closePart);
    if (openMinutes === null || closeMinutes === null) continue;

    if (openMinutes <= closeMinutes) {
      if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) return true;
    } else {
      // Handles overnight ranges like 9:00 PM - 2:00 AM.
      if (nowMinutes >= openMinutes || nowMinutes < closeMinutes) return true;
    }
  }

  return false;
}

function resolveOpenNow(openingHours, utcOffsetMinutes = null) {
  if (!openingHours) return null;

  if (typeof openingHours.open_now === 'boolean') {
    return openingHours.open_now;
  }

  if (Array.isArray(openingHours.weekday_text)) {
    const nowAtPlace = getNowAtPlace(utcOffsetMinutes);
    const today = LONG_DAYS[nowAtPlace.dayIndex];
    const todayRow = openingHours.weekday_text.find(
      row => typeof row === 'string' && row.startsWith(`${today}:`)
    );

    if (typeof todayRow === 'string') {
      return isOpenForTodayRow(todayRow, nowAtPlace.minutes);
    }
  }

  if (typeof openingHours.isOpen === 'function') {
    try {
      return openingHours.isOpen(new Date());
    } catch {
      try {
        return openingHours.isOpen();
      } catch {
        // Ignore and return unknown.
      }
    }
  }

  return null;
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
    status: openNow === true ? 'open' : openNow === false ? 'closed' : 'unknown',
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
                      'utc_offset_minutes',
                      'types',
                      'rating',
                    ],
                  },
                  (detailsResult, detailsStatus) => {
                    if (
                      detailsStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                      detailsResult
                    ) {
                      const detailsOpenNow = resolveOpenNow(
                        detailsResult?.opening_hours,
                        detailsResult?.utc_offset_minutes
                      );

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
