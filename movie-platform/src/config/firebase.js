import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isConfigured = 
  Boolean(firebaseConfig.apiKey) && 
  firebaseConfig.apiKey !== 'mock-api-key' &&
  Boolean(firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    console.log('[Firebase Client] Initialized successfully for project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Firebase Client] Initialization warning:', err.message);
  }
} else {
  console.info('[Firebase Client] Running in local demo mode. Set VITE_FIREBASE_* in movie-platform/.env to connect to your Firebase project.');
}

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  isConfigured as isFirebaseConfigured,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
};

