import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase, get, ref } from 'firebase/database';

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
