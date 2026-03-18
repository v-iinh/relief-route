import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase, get, onValue, ref, runTransaction } from 'firebase/database';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    analytics = undefined;
  });
}

export { analytics };

const ANALYTICS_PATH = 'analytics';

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function buildDefaultAnalytics(monthKey) {
  return {
    allTime: {
      visits: 0,
      users: 0,
      searches: 0,
    },
    month: {
      key: monthKey,
      visits: 0,
      users: 0,
      searches: 0,
    },
  };
}

function normalizeAnalytics(rawValue) {
  const monthKey = getMonthKey();
  const base = buildDefaultAnalytics(monthKey);
  const current = rawValue && typeof rawValue === 'object' ? rawValue : {};

  const allTime = {
    visits: Number(current.allTime?.visits || 0),
    users: Number(current.allTime?.users || 0),
    searches: Number(current.allTime?.searches || 0),
  };

  const monthNode = current.month && typeof current.month === 'object' ? current.month : {};
  const useCurrentMonth = monthNode.key === monthKey;

  const month = {
    key: monthKey,
    visits: useCurrentMonth ? Number(monthNode.visits || 0) : 0,
    users: useCurrentMonth ? Number(monthNode.users || 0) : 0,
    searches: useCurrentMonth ? Number(monthNode.searches || 0) : 0,
  };

  return {
    ...base,
    allTime,
    month,
  };
}

async function incrementAnalyticsCounters({ visits = 0, users = 0, searches = 0 }) {
  const analyticsRef = ref(db, ANALYTICS_PATH);
  const monthKey = getMonthKey();

  await runTransaction(analyticsRef, (currentValue) => {
    const normalized = normalizeAnalytics(currentValue);

    normalized.allTime.visits += visits;
    normalized.allTime.users += users;
    normalized.allTime.searches += searches;

    normalized.month.key = monthKey;
    normalized.month.visits += visits;
    normalized.month.users += users;
    normalized.month.searches += searches;

    return normalized;
  });
}

export async function trackVisitAndUser() {
  const userKey = 'relief-route-has-visited';
  const isFirstVisit = typeof window !== 'undefined' && !window.localStorage.getItem(userKey);

  if (isFirstVisit) {
    window.localStorage.setItem(userKey, '1');
  }

  await incrementAnalyticsCounters({
    visits: 1,
    users: isFirstVisit ? 1 : 0,
    searches: 0,
  });
}

export async function trackSearch() {
  await incrementAnalyticsCounters({ visits: 0, users: 0, searches: 1 });
}

export function subscribeAnalytics(onChange, onError) {
  const analyticsRef = ref(db, ANALYTICS_PATH);

  return onValue(
    analyticsRef,
    (snapshot) => {
      onChange?.(normalizeAnalytics(snapshot.val()));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function validateAdminCredentials(email, password) {
  const snapshot = await get(ref(db, 'admin'));

  if (!snapshot.exists()) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admins = Object.values(snapshot.val() || {});

  return admins.some((admin) => {
    return admin?.email?.toLowerCase() === normalizedEmail && admin?.password === password;
  });
}
