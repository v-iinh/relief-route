import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import MobileHeader from './components/MobileHeader/MobileHeader';
import Drawer from './components/Drawer/Drawer';
import Map from './components/Map/Map';
import Modal from './components/Modal/Modal';
import AdminLogin from './components/Admin/AdminLogin';
import Toast from './components/common/Toast';
import usePlacesSearch from './hooks/usePlacesSearch';
import {
  subscribeListings,
  trackSearch,
  trackVisitAndUser,
  updateListingCoordinates,
} from './firebase';
import './index.css';

function haversineMiles(from, to) {
  if (!from || !to) return null;
  const toRad = value => (value * Math.PI) / 180;
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

function listingHoursToTable(hours) {
  const fallback = {
    Mon: '—',
    Tue: '—',
    Wed: '—',
    Thu: '—',
    Fri: '—',
    Sat: '—',
    Sun: '—',
  };

  if (!hours || typeof hours !== 'object') return fallback;

  const mapped = { ...fallback };
  Object.keys(fallback).forEach((day) => {
    const value = hours[day];
    if (!value || typeof value !== 'object') {
      return;
    }

    if (value.closed) {
      mapped[day] = 'Closed';
      return;
    }

    if (value.open && value.close) {
      mapped[day] = `${value.open}-${value.close}`;
      return;
    }

    mapped[day] = value.open || value.close || '—';
  });

  return mapped;
}

function parseTimeToMinutes(value) {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minutes = Number(match[2] || '0');
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minutes)) return null;
  if (hour < 1 || hour > 12 || minutes < 0 || minutes > 59) return null;

  if (hour === 12) hour = 0;
  if (meridiem === 'PM') hour += 12;

  return hour * 60 + minutes;
}

function isAlwaysOpenText(value) {
  if (typeof value !== 'string') return false;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\u202f\u00a0\u2009]/g, ' ')
    .replace(/\s+/g, ' ');

  return normalized === 'open 24 hours' || normalized === 'open 24h' || normalized === 'open 24/7';
}

function resolveCustomOpenNow(hours) {
  if (!hours || typeof hours !== 'object') return null;

  const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = dayKeys[new Date().getDay()];
  const today = hours[todayKey];

  if (!today || typeof today !== 'object') return null;
  if (today.closed === true) return false;
  if (isAlwaysOpenText(today.open)) return true;

  const openMinutes = parseTimeToMinutes(today.open);
  const closeMinutes = parseTimeToMinutes(today.close);
  if (openMinutes === null || closeMinutes === null) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (openMinutes <= closeMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  // Overnight windows, e.g. 9:00 PM - 2:00 AM
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
}

export default function App() {
  const [activeId, setActiveId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [apiReady, setApiReady] = useState(false);
  const [map, setMap] = useState(null);
  const [approvedListings, setApprovedListings] = useState([]);
  const [hasUserSearched, setHasUserSearched] = useState(false);
  const [visibleApprovedMapLocations, setVisibleApprovedMapLocations] = useState([]);
  const mapRef = useRef(null);
  const didAutoSearch = useRef(false);
  const hasUserSearchedRef = useRef(false);
  const geocodeInFlightRef = useRef(new Set());
  const geocodeFailedRef = useRef(new Set());

  const showToast = useCallback(msg => setToast(msg), []);
  const hideToast = useCallback(() => setToast(''), []);
  const { places, loading, error, searchNearby, searchByText, setPlaces } = usePlacesSearch(
    map,
    apiReady
  );

  useEffect(() => {
    const unsubscribe = subscribeListings(
      (listings) => {
        const approved = listings.filter((listing) => listing.status === 'approved');
        setApprovedListings(approved);
      },
      () => {
        // Ignore listing sync errors so map/search UX stays available.
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!apiReady || !window.google?.maps?.Geocoder) return;

    const geocoder = new window.google.maps.Geocoder();

    approvedListings.forEach((listing) => {
      const hasCoordinates = typeof listing.lat === 'number' && typeof listing.lng === 'number';
      if (hasCoordinates || !listing.address) return;
      if (geocodeInFlightRef.current.has(listing.id)) return;
      if (geocodeFailedRef.current.has(listing.id)) return;

      geocodeInFlightRef.current.add(listing.id);
      geocoder.geocode({ address: listing.address }, (results, status) => {
        geocodeInFlightRef.current.delete(listing.id);

        if (
          status === window.google.maps.GeocoderStatus.OK &&
          Array.isArray(results) &&
          results[0]?.geometry?.location
        ) {
          const location = results[0].geometry.location;
          updateListingCoordinates(listing.id, {
            lat: location.lat(),
            lng: location.lng(),
          }).catch(() => {
            // Ignore write error and retry on next listing sync.
          });
          return;
        }

        geocodeFailedRef.current.add(listing.id);
      });
    });
  }, [apiReady, approvedListings]);

  const center = map?.getCenter();
  const centerPoint = center
    ? { lat: center.lat(), lng: center.lng() }
    : { lat: 42.3601, lng: -71.0589 };

  const approvedMapLocations = useMemo(() => {
    return approvedListings
      .filter((listing) => typeof listing.lat === 'number' && typeof listing.lng === 'number')
      .map((listing) => {
        const miles = haversineMiles(centerPoint, { lat: listing.lat, lng: listing.lng });
        const openNow = resolveCustomOpenNow(listing.hours);

        return {
          id: `db_${listing.id}`,
          place_id: listing.id,
          name: listing.name,
          address: listing.address,
          lat: listing.lat,
          lng: listing.lng,
          phone: listing.phone || '—',
          website: listing.website || '',
          hours: listingHoursToTable(listing.hours),
          status: openNow === true ? 'open' : openNow === false ? 'closed' : 'unknown',
          isOpen: openNow,
          dist: miles === null ? 0 : Number(miles.toFixed(1)),
          rating: null,
          types: [],
          type: 'Community Listing',
          filter: 'pantry',
          tags: [],
          needs: [],
          notes: listing.notes || '',
        };
      });
  }, [approvedListings, centerPoint.lat, centerPoint.lng]);

  const refreshVisibleApprovedLocations = useCallback((targetMap = map) => {
    if (!hasUserSearchedRef.current) {
      setVisibleApprovedMapLocations([]);
      return;
    }

    const bounds = targetMap?.getBounds?.();
    if (!bounds || !window.google?.maps?.LatLng) {
      setVisibleApprovedMapLocations(approvedMapLocations);
      return;
    }

    const inView = approvedMapLocations.filter((loc) => {
      const point = new window.google.maps.LatLng(loc.lat, loc.lng);
      return bounds.contains(point);
    });

    setVisibleApprovedMapLocations(inView);
  }, [map, approvedMapLocations]);

  useEffect(() => {
    refreshVisibleApprovedLocations(map);
  }, [map, approvedMapLocations, refreshVisibleApprovedLocations]);

  const locations = [...(hasUserSearched ? visibleApprovedMapLocations : []), ...places];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__reliefRouteVisitTracked) return;

    window.__reliefRouteVisitTracked = true;
    trackVisitAndUser().catch(() => {
      // Ignore analytics errors so page UX is unaffected.
    });
  }, []);

  // Called once geolocation resolves (or fails with fallback coords)
  const handleLocationReady = useCallback((coords) => {
    if (didAutoSearch.current) return;
    didAutoSearch.current = true;
    searchNearby(coords, 10000, 'food pantry');
  }, [searchNearby]);

  function handleSelect(id) {
    setActiveId(id);
    if (map && id) {
      const loc = locations.find(l => l.id === id);
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        map.panTo({ lat: loc.lat, lng: loc.lng });
      }
    }
  }

  function handleClearSelect() {
    setActiveId(null);
  }

  function handleSearch(query) {
    hasUserSearchedRef.current = true;
    setHasUserSearched(true);
    refreshVisibleApprovedLocations(map);

    trackSearch().catch(() => {
      // Ignore analytics errors so searching continues.
    });

    const center = map?.getCenter();
    const fallbackCenter = center
      ? { lat: center.lat(), lng: center.lng() }
      : { lat: 42.3601, lng: -71.0589 };

    searchByText(query, fallbackCenter, 10000);
  }

  const activeLocation = locations.find(l => l.id === activeId);

  const normalizedPathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const isAdminRoute = normalizedPathname === '/admin';

  if (isAdminRoute) {
    return <AdminLogin />;
  }

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const dragListener = map.addListener('dragend', () => {
      if (!hasUserSearchedRef.current) return;

      refreshVisibleApprovedLocations(map);

      const center = map.getCenter();
      if (!center) return;

      setActiveId(null);
      setPlaces([]);
      searchNearby(
        { lat: center.lat(), lng: center.lng() },
        10000,
        'food pantry'
      );
    });

    return () => {
      if (dragListener) dragListener.remove();
    };
  }, [map, refreshVisibleApprovedLocations, searchNearby, setPlaces]);

  return (
    <>
      <MobileHeader
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(o => !o)}
        onOpenModal={() => setModalOpen(true)}
      />

      <div className="app">
        <Sidebar
          locations={locations}
          activeId={activeId}
          onSelect={handleSelect}
          onClearSelect={handleClearSelect}
          onOpenModal={() => setModalOpen(true)}
          onToast={showToast}
          onSearch={handleSearch}
          searchLoading={loading}
        />

        <Map
          locations={locations}
          onMapReady={() => setApiReady(true)}
          mapRefCallback={m => {
            mapRef.current = m;
            setMap(m);
          }}
          onLocationReady={handleLocationReady}
          onSelect={handleSelect}
        />
      </div>

      <Drawer
        isOpen={drawerOpen}
        locations={locations}
        activeId={activeId}
        activeLocation={activeLocation}
        onSelect={handleSelect}
        onClearSelect={handleClearSelect}
        onToast={showToast}
        onSearch={handleSearch}
        searchLoading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onToast={showToast}
      />

      <Toast message={toast} onHide={hideToast} />
    </>
  );
}
