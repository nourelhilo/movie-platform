import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  auth, 
  isFirebaseConfigured, 
  googleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  onAuthStateChanged 
} from '../config/firebase.js';
import api from '../services/api.js';

export const getFriendlyAuthErrorMessage = (err) => {
  if (!err) return 'Authentication failed. Please try again.';
  const code = err.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Popup sign-in was cancelled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please log in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in your Firebase Console. Add this domain to Authorized Domains in Firebase Authentication settings.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet in your Firebase Console.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few moments.';
    default:
      return err.message || 'Authentication failed. Please try again.';
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Holds the username chosen during registration so the onAuthStateChanged
  // callback (which fires with a plain Firebase user) can pass it to the backend.
  const pendingUsernameRef = useRef(null);

  const syncWithBackend = async (firebaseUser) => {
    const usernameToUse = pendingUsernameRef.current || undefined;
    try {
      const response = await api.post('/auth/sync', {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        username: usernameToUse,
      });

      if (response.data?.success) {
        pendingUsernameRef.current = null; // clear after successful use
        setMongoUser(response.data.data);
      }
    } catch (err) {
      // Note: API interceptor transforms errors to { status, message } plain objects.
      // Backend no longer returns 409 — it auto-suffixes taken usernames instead.
      console.warn('[AuthContext] Backend sync warning:', err.message || err);
      setMongoUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        username: usernameToUse || firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user',
        displayName: firebaseUser.displayName || 'User',
        avatarUrl: firebaseUser.photoURL || '',
        favoriteMovies: [],
        statsSummary: { totalWatched: 0, totalMinutes: 0, averageRating: 0 },
      });
    }
  };

  useEffect(() => {
    // Purge any legacy demo user with dummy photo/movies
    localStorage.removeItem('demo_cinephile_user');

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          await syncWithBackend(user);
        } else {
          setCurrentUser(null);
          setMongoUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      const stored = localStorage.getItem('solander_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          setMongoUser(user);
        } catch (e) {
          localStorage.removeItem('solander_user');
        }
      }
      setLoading(false);
    }
  }, []);

  const createCleanUser = async (email, displayName, username) => {
    setLoading(true);
    const cleanUsername = (username || displayName || email.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const uid = `user_${cleanUsername}_${Date.now().toString(36)}`;
    const cleanProfile = {
      uid: uid,
      firebaseUid: uid,
      email: email,
      displayName: displayName || cleanUsername,
      username: cleanUsername,
      avatarUrl: '',
      bio: '',
      favoriteMovies: [],
      statsSummary: {
        totalWatched: 0,
        totalMinutes: 0,
        averageRating: 0,
        reviewsCount: 0,
      },
    };

    localStorage.setItem('solander_user', JSON.stringify(cleanProfile));
    setCurrentUser(cleanProfile);
    setMongoUser(cleanProfile);

    try {
      const res = await api.post('/auth/sync', {
        firebaseUid: cleanProfile.firebaseUid,
        email: cleanProfile.email,
        displayName: cleanProfile.displayName,
        username: cleanProfile.username,
        avatarUrl: cleanProfile.avatarUrl,
      });
      if (res.data?.success) {
        // Use the username the server actually assigned (may differ if chosen one was taken)
        const serverUser = res.data.data;
        const updated = { ...cleanProfile, username: serverUser.username, displayName: serverUser.displayName };
        localStorage.setItem('solander_user', JSON.stringify(updated));
        setMongoUser(serverUser);
      }
    } catch (e) {
      console.warn('[Auth] Sync note:', e.message || e);
    }

    setLoading(false);
    return cleanProfile;
  };

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      return createCleanUser(email, '', '');
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncWithBackend(cred.user);
      return cred.user;
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email, password, displayName, username) => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      return createCleanUser(email, displayName, username);
    }
    try {
      // Store username BEFORE Firebase creates the user so onAuthStateChanged can use it
      pendingUsernameRef.current = username || null;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        try {
          await updateProfile(cred.user, { displayName });
        } catch (nameErr) {
          console.warn('[AuthContext] Could not update displayName:', nameErr.message);
        }
      }
      // onAuthStateChanged will fire and call syncWithBackend, which reads pendingUsernameRef
      return cred.user;
    } catch (err) {
      pendingUsernameRef.current = null;
      const msg = getFriendlyAuthErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data) {
        setMongoUser(res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.warn('[AuthContext] refreshUser warning:', e.message);
    }
    return null;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem('solander_user');
    localStorage.removeItem('demo_cinephile_user');
    setCurrentUser(null);
    setMongoUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        mongoUser,
        setMongoUser,
        refreshUser,
        loading,
        authError,
        isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        logout,
        syncWithBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
