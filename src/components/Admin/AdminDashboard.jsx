import { useEffect, useMemo, useState } from 'react';
import AdminTopBar from './AdminTopBar';
import AdminMetrics from './AdminMetrics';
import AdminListingsTable from './AdminListingsTable';
import AdminEditListingModal from './AdminEditListingModal';
import {
  approveListing,
  removeListing,
  subscribeAnalytics,
  subscribeListings,
  updateListing,
} from '../../firebase';

function formatMetricValue(value) {
  return Number(value || 0).toLocaleString();
}

export default function AdminDashboard() {
  const [allListings, setAllListings] = useState([]);
  const [period, setPeriod] = useState('alltime');
  const [activeTab, setActiveTab] = useState('current');
  const [searchValue, setSearchValue] = useState('');
  const [toast, setToast] = useState('');
  const [editingListing, setEditingListing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    allTime: { visits: 0, users: 0, searches: 0 },
    month: { key: null, visits: 0, users: 0, searches: 0 },
  });

  const metricsSource = period === 'month' ? analyticsData.month : analyticsData.allTime;
  const metrics = [
    { label: 'Visits', value: formatMetricValue(metricsSource.visits), delta: 'Live', context: 'page loads' },
    { label: 'Users', value: formatMetricValue(metricsSource.users), delta: 'Live', context: 'unique visitors' },
    { label: 'Searches', value: formatMetricValue(metricsSource.searches), delta: 'Live', context: 'search actions' },
  ];

  const currentListings = useMemo(() => {
    return allListings.filter((row) => row.status === 'approved');
  }, [allListings]);

  const pendingListings = useMemo(() => {
    return allListings.filter((row) => row.status !== 'approved');
  }, [allListings]);

  const filteredListings = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const source = activeTab === 'pending' ? pendingListings : currentListings;
    if (!query) return source;

    return source.filter((row) => {
      const fields = [
        row.name,
        row.address,
        row.phone,
        row.website,
        row.hoursSummary,
        row.notes,
      ];

      return fields.some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [activeTab, currentListings, pendingListings, searchValue]);

  useEffect(() => {
    const unsubscribe = subscribeAnalytics(
      (nextData) => setAnalyticsData(nextData),
      () => {
        // Ignore live metrics errors; dashboard still works with last values.
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeListings(
      (nextData) => setAllListings(nextData),
      () => {
        showToast('Could not load listings');
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function handleRemove(id) {
    removeListing(id)
      .then(() => {
        showToast(activeTab === 'pending' ? 'Submission rejected' : 'Listing removed');
      })
      .catch(() => {
        showToast('Action failed. Please try again.');
      });
  }

  function handleEdit(row) {
    if (activeTab === 'pending') {
      approveListing(row.id)
        .then(() => showToast(`Approved ${row.name}`))
        .catch(() => showToast('Could not approve listing'));
      return;
    }

    setEditingListing(row);
  }

  function handleSaveEdit(payload) {
    if (!editingListing?.id) return;

    setSavingEdit(true);
    updateListing(editingListing.id, payload)
      .then(() => {
        setSavingEdit(false);
        setEditingListing(null);
        showToast('Listing updated');
      })
      .catch(() => {
        setSavingEdit(false);
        showToast('Could not update listing');
      });
  }

  return (
    <div className="admin-dashboard">
      <AdminTopBar />

      <main className="admin-page-wrap">
        <AdminMetrics metrics={metrics} period={period} onPeriodChange={setPeriod} />

        <AdminListingsTable
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentCount={currentListings.length}
          pendingCount={pendingListings.length}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          rows={filteredListings}
          onEdit={handleEdit}
          onRemove={handleRemove}
        />
      </main>

      <div className={`admin-toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>

      <AdminEditListingModal
        isOpen={Boolean(editingListing)}
        listing={editingListing}
        onClose={() => {
          if (!savingEdit) setEditingListing(null);
        }}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />
    </div>
  );
}
