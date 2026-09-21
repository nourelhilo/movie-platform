import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let isFirebaseAdminInitialized = false;

export const initFirebaseAdmin = () => {
  if (isFirebaseAdminInitialized) {
    return admin;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

  const projectId = process.env.FIREBASE_PROJECT_ID || 'movie-platform-dev';

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      isFirebaseAdminInitialized = true;
      console.log(`[Firebase Admin] Initialized with service account: ${serviceAccount.project_id}`);
      return admin;
    } catch (err) {
      console.warn(`[Firebase Admin Warning] Error parsing service account file: ${err.message}`);
    }
  } else {
    console.warn(`[Firebase Admin Warning] No serviceAccountKey.json found at ${serviceAccountPath}`);
    console.warn('[Firebase Admin Warning] Running with mock token verification for development until real serviceAccountKey.json is provided.');
  }

  // Fallback initialization with project ID if available
  try {
    admin.initializeApp({
      projectId: projectId
    });
    isFirebaseAdminInitialized = true;
    console.log(`[Firebase Admin] Initialized with project ID: ${projectId}`);
  } catch (err) {
    // If already initialized or fails without credentials
  }

  return admin;
};

export const getFirebaseAdminStatus = () => {
  return {
    initialized: isFirebaseAdminInitialized,
    hasServiceAccount: fs.existsSync(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
        ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : path.resolve(process.cwd(), 'config', 'serviceAccountKey.json')
    )
  };
};

export default initFirebaseAdmin;
