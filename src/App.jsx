import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import MobileHeader from './components/MobileHeader/MobileHeader';
import Drawer from './components/Drawer/Drawer';
import Map from './components/Map/Map';
import Modal from './components/Modal/Modal';
import AdminLogin from './components/Admin/AdminLogin';
import Toast from './components/common/Toast';
import usePlacesSearch from './hooks/usePlacesSearch';
import './index.css';

export default function App() {
  const [activeId, setActiveId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [apiReady, setApiReady] = useState(false);
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const didAutoSearch = useRef(false);
  const hasUserSearchedRef = useRef(false);

  const showToast = useCallback(msg => setToast(msg), []);
  const hideToast = useCallback(() => setToast(''), []);
  const { places, loading, error, searchNearby, searchByText, setPlaces } = usePlacesSearch(
    map,
    apiReady
  );

  // Called once geolocation resolves (or fails with fallback coords)
  const handleLocationReady = useCallback((coords) => {
    if (didAutoSearch.current) return;
    didAutoSearch.current = true;
    searchNearby(coords, 10000, 'food pantry');
  }, [searchNearby]);

  function handleSelect(id) {
    setActiveId(id);
    if (map && id) {
      const loc = places.find(l => l.id === id);
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
    const center = map?.getCenter();
    const fallbackCenter = center
      ? { lat: center.lat(), lng: center.lng() }
      : { lat: 42.3601, lng: -71.0589 };

    searchByText(query, fallbackCenter, 10000);
  }

  const activeLocation = places.find(l => l.id === activeId);

  const isAdminRoute = window.location.pathname === '/admin';

  if (isAdminRoute) {
    return <AdminLogin />;
  }

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const dragListener = map.addListener('dragend', () => {
      if (!hasUserSearchedRef.current) return;
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
  }, [map, searchNearby, setPlaces]);

  return (
    <>
      <MobileHeader
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(o => !o)}
        onOpenModal={() => setModalOpen(true)}
      />

      <div className="app">
        <Sidebar
          locations={places}
          activeId={activeId}
          onSelect={handleSelect}
          onClearSelect={handleClearSelect}
          onOpenModal={() => setModalOpen(true)}
          onToast={showToast}
          onSearch={handleSearch}
          searchLoading={loading}
        />

        <Map
          locations={places}
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
        locations={places}
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
