import { useEffect, useMemo, useState } from 'react';
import AdminTopBar from './AdminTopBar';
import AdminMetrics from './AdminMetrics';
import AdminListingsTable from './AdminListingsTable';
import { subscribeAnalytics } from '../../firebase';

function formatMetricValue(value) {
  return Number(value || 0).toLocaleString();
}

const INITIAL_CURRENT_LISTINGS = [
  {
    id: 1,
    name: 'City Food Bank - Downtown',
    address: '89 Washington St, Boston, MA',
    type: 'Pantry',
    status: 'open',
    distance: '0.7 mi',
    updated: '2 days ago',
  },
  {
    id: 2,
    name: 'Oak Street Community Fridge',
    address: '142 Oak St, Boston, MA',
    type: 'Community',
    status: 'open',
    distance: '0.3 mi',
    updated: 'Today',
  },
  {
    id: 3,
    name: "St. Mary's Pantry",
    address: '301 Cambridge St, Allston, MA',
    type: 'Pantry',
    status: 'closed',
    distance: '1.1 mi',
    updated: '1 week ago',
  },
  {
    id: 4,
    name: 'Riverside Aid Center',
    address: '55 River Rd, Brighton, MA',
    type: 'Pantry',
    status: 'limited',
    distance: '1.4 mi',
    updated: '3 days ago',
  },
  {
    id: 5,
    name: 'Fenway Free Fridge',
    address: 'Peterborough St, Boston, MA',
    type: 'Community',
    status: 'open',
    distance: '2.3 mi',
    updated: 'Today',
  },
];

const INITIAL_PENDING_LISTINGS = [
  {
    id: 101,
    name: 'Allston Mutual Aid Fridge',
    address: '79 Brighton Ave, Allston, MA',
    type: 'Community',
    submitted: 'Mar 15, 2026',
    submitter: 'm.patel@email.com',
  },
  {
    id: 102,
    name: 'Codman Square Food Pantry',
    address: '6 Norfolk St, Dorchester, MA',
    type: 'Pantry',
    submitted: 'Mar 14, 2026',
    submitter: 'volunteer@codman.org',
  },
  {
    id: 103,
    name: 'East Boston Fridge',
    address: '197 Meridian St, East Boston, MA',
    type: 'Community',
    submitted: 'Mar 12, 2026',
    submitter: 'eastbostonfridge@gmail.com',
  },
];

export default function AdminDashboard() {
  const [currentListings, setCurrentListings] = useState(INITIAL_CURRENT_LISTINGS);
  const [pendingListings, setPendingListings] = useState(INITIAL_PENDING_LISTINGS);
  const [period, setPeriod] = useState('alltime');
  const [activeTab, setActiveTab] = useState('current');
  const [searchValue, setSearchValue] = useState('');
  const [toast, setToast] = useState('');
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

  const filteredListings = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const source = activeTab === 'pending' ? pendingListings : currentListings;
    if (!query) return source;

    return source.filter((row) => {
      return row.name.toLowerCase().includes(query) || row.address.toLowerCase().includes(query);
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

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function handleRemove(id) {
    if (activeTab === 'pending') {
      setPendingListings((current) => current.filter((row) => row.id !== id));
    } else {
      setCurrentListings((current) => current.filter((row) => row.id !== id));
    }
    showToast('Listing removed');
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
          onView={(row) => showToast(`Viewing ${row.name}`)}
          onEdit={(row) => showToast(`Editing ${row.name}`)}
          onRemove={handleRemove}
        />
      </main>

      <div className={`admin-toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
