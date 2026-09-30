import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  signInWithCredential,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import firebaseConfig from '../../firebase-applet-config.json';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const registerFirestoreUser = async (user: User) => {
  if (!user.uid || !user.email) return;

  const userRef = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(userRef);
  const existing = existingSnap.exists() ? existingSnap.data() : null;

  const isSuperAdmin = user.email.trim().toLowerCase() === 'psgss91@gmail.com';

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || existing?.displayName || 'Google User',
    ...(isSuperAdmin
      ? { role: 'super_admin' }
      : !existing
        ? { role: 'user' }
        : {}),
    ownerEmail: 'psgss91@gmail.com',
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

const WEB_CLIENT_ID =
  '230263541714-0gf2432jk93lql4sur3dte7o846u8g1b.apps.googleusercontent.com';

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let tokenExpiryTime = 0;
let nativeGoogleInitialized = false;

const initNativeGoogle = async () => {
  if (!Capacitor.isNativePlatform() || nativeGoogleInitialized) return;

  await SocialLogin.initialize({
    google: {
      webClientId: WEB_CLIENT_ID,
      mode: 'online',
    },
  });

  nativeGoogleInitialized = true;
};

/**
 * Initialize auth state listener. Call this on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        await registerFirestoreUser(user);
      } catch (error) {
        console.error('Firestore user registration failed:', error);
      }

      if (cachedAccessToken && Date.now() < tokenExpiryTime) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
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
 * Sign in with Google and request Google Drive access.
 * Native Android uses Credential Manager.
 * Web keeps the existing Firebase popup flow.
 */
export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;

    if (Capacitor.isNativePlatform()) {
      await initNativeGoogle();

      const login = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile', ...DRIVE_SCOPES],
          filterByAuthorizedAccounts: false,
        },
      });

      const loginResult = login.result as any;
      const idToken = loginResult?.idToken;

      if (!idToken) {
        throw new Error('Google ID token was not returned');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseResult = await signInWithCredential(auth, credential);

      const accessToken = loginResult?.accessToken?.token;

      if (!accessToken) {
        throw new Error('Google Drive access token was not returned');
      }

      cachedAccessToken = accessToken;
      tokenExpiryTime = Date.now() + 50 * 60 * 1000;

      return {
        user: firebaseResult.user,
        accessToken: cachedAccessToken,
      };
    }

    // Existing Web login flow
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned');
    }

    cachedAccessToken = credential.accessToken;
    tokenExpiryTime = Date.now() + 50 * 60 * 1000;

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token.
 */
export const getDriveAccessToken = (): string | null => {
  if (cachedAccessToken && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }

  return cachedAccessToken;
};

/**
 * Sign out user and clear in-memory token.
 */
export const logOutGoogle = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      await SocialLogin.logout({
        provider: 'google',
      });
    }
  } catch (error) {
    console.warn('Native Google logout warning:', error);
  }

  await signOut(auth);
  cachedAccessToken = null;
  tokenExpiryTime = 0;
};

/**
 * Submit approval request to Firestore so Super Admin psgss91@gmail.com sees it across all devices
 */
export const submitApprovalRequestToFirestore = async (user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}): Promise<boolean> => {
  if (!user.uid || !user.email) return false;

  try {
    const isRootAdmin = user.email.trim().toLowerCase() === 'psgss91@gmail.com';

    await setDoc(doc(db, 'approval_requests', user.uid), {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || 'Google User',
      photoURL: user.photoURL || null,
      status: isRootAdmin ? 'approved' : 'pending',
      targetAdminEmail: 'psgss91@gmail.com',
      requestedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Google User',
      photoURL: user.photoURL || null,
      role: isRootAdmin ? 'super_admin' : 'client',
      status: isRootAdmin ? 'unlimited' : 'pending',
      ownerEmail: 'psgss91@gmail.com',
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (err) {
    console.warn('Could not submit request to Firestore:', err);
    return false;
  }
};

