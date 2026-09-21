let isFirebaseAdminInitialized = false;

export const initFirebaseAdmin = () => {
  if (isFirebaseAdminInitialized) {
    return null;
  }

  isFirebaseAdminInitialized = true;
  console.warn('[Firebase Admin] Running without the Admin SDK on this host. Mock and demo tokens remain valid.');
  return null;
};

export const getFirebaseAdminStatus = () => {
  return {
    initialized: isFirebaseAdminInitialized,
    hasServiceAccount: false,
  };
};

export default initFirebaseAdmin;
