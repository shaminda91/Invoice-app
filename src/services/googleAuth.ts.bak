import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let tokenExpiryTime = 0;

/**
 * Initialize auth state listener. Call this on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken && Date.now() < tokenExpiryTime) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // User is logged into Firebase, but OAuth access token might need re-prompt if expired
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      tokenExpiryTime = 0;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Initiates Google OAuth popup with Drive permissions
 */
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned');
    }

    cachedAccessToken = credential.accessToken;
    tokenExpiryTime = Date.now() + 50 * 60 * 1000; // ~50 minutes validity
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getDriveAccessToken = (): string | null => {
  if (cachedAccessToken && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }
  return cachedAccessToken;
};

/**
 * Sign out user and clear in-memory token
 */
export const logOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  tokenExpiryTime = 0;
};
