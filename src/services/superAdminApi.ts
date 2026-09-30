import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './googleAuth';
import { UserAccessProfile, UserRole, SUPER_ADMIN_EMAIL } from '../types';
import { getDefaultPermissions } from './userAccessManager';

export interface ServerUsersResponse {
  superAdmin: string;
  defaultAllowedDays: number;
  totalUsers: number;
  unreadCount: number;
  users: UserAccessProfile[];
}

export interface SystemStatusResponse {
  status: string;
  superAdminEmail: string;
  totalAccounts: number;
  registeredClients: number;
  unreadRegistrations: number;
  pendingApprovals: number;
  newestClients: Array<{
    userId: string;
    email: string;
    name: string;
    registeredAt: string;
    role: string;
  }>;
}

const STORAGE_KEY_PROFILES = 'ps_invoice_user_profiles';

export function getCachedProfiles(): UserAccessProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function mapDocToProfile(docSnap: any): UserAccessProfile {
  const data = docSnap.data ? docSnap.data() : docSnap;
  const isSuperAdmin = (data.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const rawRole = isSuperAdmin ? 'super_admin' : (data.role || 'user');
  const role: UserRole = rawRole as UserRole;
  const now = Date.now();

  const firstLogin = data.firstLoginTime || (data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.lastLoginTime || now));
  const allowed = isSuperAdmin ? 99999 : (typeof data.allowedDays === 'number' ? data.allowedDays : 0);
  const expires = isSuperAdmin ? now + 36500 * 86400000 : (data.expiresAt || (firstLogin + allowed * 86400000));
  const status = isSuperAdmin ? 'unlimited' : (data.status || 'pending');

  return {
    userId: data.userId || data.uid || docSnap.id || `user_${now}`,
    email: data.email || '',
    displayName: data.displayName || data.email?.split('@')[0] || 'User',
    photoURL: data.photoURL || undefined,
    role,
    parentAdminEmail: SUPER_ADMIN_EMAIL,
    firstLoginTime: firstLogin,
    firstLoginString: data.firstLoginString || new Date(firstLogin).toLocaleDateString(),
    allowedDays: allowed,
    expiresAt: expires,
    expiresAtString: data.expiresAtString || (isSuperAdmin ? 'Permanent / Unlimited' : new Date(expires).toLocaleDateString()),
    status,
    lastLoginTime: data.lastLoginTime || now,
    lastLoginString: data.lastLoginString || new Date(now).toLocaleString(),
    notes: data.notes || '',
    unreadBySuperAdmin: isSuperAdmin ? false : !!data.unreadBySuperAdmin,
    deviceInfo: data.deviceInfo,
    browser: data.browser,
    os: data.os,
    permissions: data.permissions || getDefaultPermissions(role),
  };
}

/**
 * Seed initial test registered client (psdata91@gmail.com) if Firestore is fresh
 * Ensures Admin never sees an empty registered list on Cloudflare deployment.
 */
export async function seedInitialAdminUsers(): Promise<void> {
  try {
    const testDoc = doc(db, 'users', 'test_psdata91');
    const snap = await getDoc(testDoc);
    if (!snap.exists()) {
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString();
      const timeStr = new Date(now).toLocaleString();
      await setDoc(testDoc, {
        userId: 'test_psdata91',
        uid: 'test_psdata91',
        email: 'psdata91@gmail.com',
        displayName: 'pramesh shaminda',
        photoURL: null,
        role: 'user',
        status: 'pending',
        allowedDays: 0,
        expiresAt: now,
        expiresAtString: dateStr,
        firstLoginTime: now,
        firstLoginString: dateStr,
        lastLoginTime: now,
        lastLoginString: timeStr,
        notes: 'Awaiting Admin Approval (පරිපාලකගේ අනුමැතිය අවශ්‍යයි)',
        unreadBySuperAdmin: true,
        ownerEmail: SUPER_ADMIN_EMAIL,
        parentAdminEmail: SUPER_ADMIN_EMAIL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        permissions: getDefaultPermissions('user' as UserRole),
      });
      await setDoc(doc(db, 'approval_requests', 'test_psdata91'), {
        requestId: 'test_psdata91',
        userId: 'test_psdata91',
        email: 'psdata91@gmail.com',
        displayName: 'pramesh shaminda',
        photoURL: null,
        status: 'pending',
        notes: 'Awaiting Admin Approval (පරිපාලකගේ අනුමැතිය අවශ්‍යයි)',
        ownerEmail: SUPER_ADMIN_EMAIL,
        targetAdminEmail: SUPER_ADMIN_EMAIL,
        createdAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Initial seed error:', err);
  }
}

/**
 * Fetch all users registered under Super Admin directly from Firestore
 * (Super Admin exclusive operation)
 */
export async function fetchServerUsers(): Promise<ServerUsersResponse | null> {
  try {
    const usersCol = collection(db, 'users');
    const reqCol = collection(db, 'approval_requests');

    const [snapshot, reqSnap] = await Promise.all([
      getDocs(usersCol),
      getDocs(reqCol).catch(() => ({ docs: [] } as any)),
    ]);

    let users: UserAccessProfile[] = snapshot.docs.map((docSnap) => mapDocToProfile(docSnap));

    // Merge approval requests from approval_requests collection
    reqSnap.docs.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (!data || !data.email) return;
      const cleanEmail = data.email.trim().toLowerCase();
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) return;

      const existingIdx = users.findIndex(
        (u) => u.userId === (data.userId || docSnap.id) || u.email.toLowerCase() === cleanEmail
      );
      if (existingIdx >= 0) {
        if (data.status === 'pending') {
          users[existingIdx] = {
            ...users[existingIdx],
            status: 'pending',
            unreadBySuperAdmin: true,
            notes: data.notes || users[existingIdx].notes || 'Approval Requested',
          };
        }
      } else {
        const now = Date.now();
        const reqCreated = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;
        users.push({
          userId: data.userId || docSnap.id,
          email: data.email,
          displayName: data.displayName || cleanEmail.split('@')[0],
          photoURL: data.photoURL || undefined,
          role: 'user',
          parentAdminEmail: SUPER_ADMIN_EMAIL,
          firstLoginTime: reqCreated,
          firstLoginString: new Date(reqCreated).toLocaleDateString(),
          allowedDays: 0,
          expiresAt: reqCreated,
          expiresAtString: new Date(reqCreated).toLocaleDateString(),
          status: 'pending',
          lastLoginTime: reqCreated,
          lastLoginString: new Date(reqCreated).toLocaleString(),
          notes: data.notes || 'Approval Requested',
          unreadBySuperAdmin: true,
          permissions: getDefaultPermissions('user' as UserRole),
        });
      }
    });

    // Guarantee Super Admin presence
    const hasSuperAdmin = users.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
    if (!hasSuperAdmin) {
      const now = Date.now();
      const superAdminProfile: UserAccessProfile = {
        userId: 'super_admin_psgss91',
        email: SUPER_ADMIN_EMAIL,
        displayName: 'Super Admin (psgss91)',
        role: 'super_admin',
        parentAdminEmail: SUPER_ADMIN_EMAIL,
        firstLoginTime: now,
        firstLoginString: new Date(now).toLocaleDateString(),
        allowedDays: 99999,
        expiresAt: now + 36500 * 86400000,
        expiresAtString: 'Permanent / Unlimited',
        status: 'unlimited',
        lastLoginTime: now,
        lastLoginString: new Date(now).toLocaleString(),
        notes: 'Root Super Administrator & System Owner',
        unreadBySuperAdmin: false,
        permissions: getDefaultPermissions('super_admin'),
      };
      users.unshift(superAdminProfile);
    }

    // Sort: Super Admin first, then pending approvals, then unread, then recent logins
    users.sort((a, b) => {
      if (a.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return -1;
      if (b.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return 1;
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (a.unreadBySuperAdmin && !b.unreadBySuperAdmin) return -1;
      if (!a.unreadBySuperAdmin && b.unreadBySuperAdmin) return 1;
      return (b.lastLoginTime || 0) - (a.lastLoginTime || 0);
    });

    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(users));
    } catch {}

    const clientsOnly = users.filter((u) => u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase());
    const unreadCount = clientsOnly.filter((u) => u.unreadBySuperAdmin || u.status === 'pending').length;

    return {
      superAdmin: SUPER_ADMIN_EMAIL,
      defaultAllowedDays: 7,
      totalUsers: users.length,
      unreadCount,
      users,
    };
  } catch (err) {
    console.warn('Error fetching Firestore users:', err);
    const cached = getCachedProfiles();
    return {
      superAdmin: SUPER_ADMIN_EMAIL,
      defaultAllowedDays: 7,
      totalUsers: cached.length,
      unreadCount: cached.filter((u) => u.unreadBySuperAdmin || u.status === 'pending').length,
      users: cached,
    };
  }
}

/**
 * Real-time listener for Firestore users & approval requests (Super Admin exclusive)
 */
export function subscribeToFirestoreUsers(
  onUpdate: (res: ServerUsersResponse) => void
): () => void {
  const usersCol = collection(db, 'users');
  const reqCol = collection(db, 'approval_requests');

  let latestUsersDocs: any[] = [];
  let latestReqDocs: any[] = [];

  const emit = () => {
    let users: UserAccessProfile[] = latestUsersDocs.map((docSnap) => mapDocToProfile(docSnap));

    // Merge approval requests
    latestReqDocs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data || !data.email) return;
      const cleanEmail = data.email.trim().toLowerCase();
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) return;

      const existingIdx = users.findIndex(
        (u) => u.userId === (data.userId || docSnap.id) || u.email.toLowerCase() === cleanEmail
      );
      if (existingIdx >= 0) {
        if (data.status === 'pending') {
          users[existingIdx] = {
            ...users[existingIdx],
            status: 'pending',
            unreadBySuperAdmin: true,
            notes: data.notes || users[existingIdx].notes || 'Approval Requested',
          };
        }
      } else {
        const now = Date.now();
        const reqCreated = data.createdAt?.toMillis ? data.createdAt.toMillis() : now;
        users.push({
          userId: data.userId || docSnap.id,
          email: data.email,
          displayName: data.displayName || cleanEmail.split('@')[0],
          photoURL: data.photoURL || undefined,
          role: 'user',
          parentAdminEmail: SUPER_ADMIN_EMAIL,
          firstLoginTime: reqCreated,
          firstLoginString: new Date(reqCreated).toLocaleDateString(),
          allowedDays: 0,
          expiresAt: reqCreated,
          expiresAtString: new Date(reqCreated).toLocaleDateString(),
          status: 'pending',
          lastLoginTime: reqCreated,
          lastLoginString: new Date(reqCreated).toLocaleString(),
          notes: data.notes || 'Approval Requested',
          unreadBySuperAdmin: true,
          permissions: getDefaultPermissions('user' as UserRole),
        });
      }
    });

    const hasSuperAdmin = users.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
    if (!hasSuperAdmin) {
      const now = Date.now();
      users.unshift({
        userId: 'super_admin_psgss91',
        email: SUPER_ADMIN_EMAIL,
        displayName: 'Super Admin (psgss91)',
        role: 'super_admin',
        parentAdminEmail: SUPER_ADMIN_EMAIL,
        firstLoginTime: now,
        firstLoginString: new Date(now).toLocaleDateString(),
        allowedDays: 99999,
        expiresAt: now + 36500 * 86400000,
        expiresAtString: 'Permanent / Unlimited',
        status: 'unlimited',
        lastLoginTime: now,
        lastLoginString: new Date(now).toLocaleString(),
        notes: 'Root Super Administrator & System Owner',
        unreadBySuperAdmin: false,
        permissions: getDefaultPermissions('super_admin'),
      });
    }

    users.sort((a, b) => {
      if (a.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return -1;
      if (b.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return 1;
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (a.unreadBySuperAdmin && !b.unreadBySuperAdmin) return -1;
      if (!a.unreadBySuperAdmin && b.unreadBySuperAdmin) return 1;
      return (b.lastLoginTime || 0) - (a.lastLoginTime || 0);
    });

    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(users));
    } catch {}

    const clientsOnly = users.filter((u) => u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase());
    const unreadCount = clientsOnly.filter((u) => u.unreadBySuperAdmin || u.status === 'pending').length;

    onUpdate({
      superAdmin: SUPER_ADMIN_EMAIL,
      defaultAllowedDays: 7,
      totalUsers: users.length,
      unreadCount,
      users,
    });
  };

  const unsubUsers = onSnapshot(
    usersCol,
    (snap) => {
      latestUsersDocs = snap.docs;
      emit();
    },
    (err) => {
      console.warn('Real-time Firestore users listener error:', err);
    }
  );

  const unsubReqs = onSnapshot(
    reqCol,
    (snap) => {
      latestReqDocs = snap.docs;
      emit();
    },
    (err) => {
      console.warn('Real-time approval requests listener error:', err);
    }
  );

  return () => {
    unsubUsers();
    unsubReqs();
  };
}

/**
 * Fetch a single user profile from Firestore (used by normal users)
 */
export async function fetchUserProfile(userId: string): Promise<UserAccessProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return mapDocToProfile(snap);
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
    return null;
  }
}

/**
 * Real-time listener for a single user's profile (used by normal users so approval auto-unlocks)
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserAccessProfile | null) => void
): () => void {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const profile = mapDocToProfile(docSnap);
        onUpdate(profile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('User status snapshot error:', err);
    }
  );
}

/**
 * Register or update a user on Firestore under Super Admin psgss91@gmail.com
 * Requirements 1, 2, 3:
 * 1. psgss91@gmail.com is ALWAYS Super Admin with unlimited permanent access.
 * 2. When any other Google user signs in for the first time:
 *    - Create /users/{uid} in Firestore with role="user", status="pending", ownerEmail="psgss91@gmail.com", uid, email, displayName, createdAt, lastLoginAt.
 * 3. Also create approval request in /approval_requests/{requestId} containing:
 *    userId, email, displayName, status="pending", ownerEmail="psgss91@gmail.com", createdAt.
 */
export async function registerUserOnServer(
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  },
  deviceInfo?: string,
  browser?: string,
  os?: string
): Promise<UserAccessProfile | null> {
  if (!user.uid || !user.email) return null;
  const cleanEmail = user.email.trim().toLowerCase();
  const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
  const userRef = doc(db, 'users', user.uid);
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString();
  const timeStr = new Date(now).toLocaleString();

  try {
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? snap.data() : null;

    let profile: UserAccessProfile;

    if (isSuperAdmin) {
      profile = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || existing?.displayName || 'Super Admin (psgss91)',
        photoURL: user.photoURL || existing?.photoURL || undefined,
        role: 'super_admin',
        parentAdminEmail: SUPER_ADMIN_EMAIL,
        firstLoginTime: existing?.firstLoginTime || now,
        firstLoginString: existing?.firstLoginString || dateStr,
        allowedDays: 99999,
        expiresAt: now + 36500 * 86400000,
        expiresAtString: 'Permanent / Unlimited',
        status: 'unlimited',
        lastLoginTime: now,
        lastLoginString: timeStr,
        notes: 'Root Super Administrator & System Owner',
        unreadBySuperAdmin: false,
        deviceInfo: deviceInfo || existing?.deviceInfo || undefined,
        browser: browser || existing?.browser || undefined,
        os: os || existing?.os || undefined,
        permissions: getDefaultPermissions('super_admin'),
      };

      await setDoc(
        userRef,
        {
          uid: user.uid,
          userId: user.uid,
          email: user.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL || null,
          role: 'super_admin',
          status: 'unlimited',
          allowedDays: 99999,
          expiresAt: profile.expiresAt,
          expiresAtString: 'Permanent / Unlimited',
          ownerEmail: SUPER_ADMIN_EMAIL,
          parentAdminEmail: SUPER_ADMIN_EMAIL,
          lastLoginTime: now,
          lastLoginString: timeStr,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          notes: profile.notes,
        },
        { merge: true }
      );
    } else {
      if (!existing) {
        // STRICT REQUIREMENT 2: Create /users/{uid} in Firestore
        // role="user", status="pending", ownerEmail="psgss91@gmail.com", uid, email, displayName, createdAt, lastLoginAt
        profile = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || cleanEmail.split('@')[0],
          photoURL: user.photoURL || undefined,
          role: 'user',
          parentAdminEmail: SUPER_ADMIN_EMAIL,
          firstLoginTime: now,
          firstLoginString: dateStr,
          allowedDays: 0,
          expiresAt: now,
          expiresAtString: dateStr,
          status: 'pending',
          lastLoginTime: now,
          lastLoginString: timeStr,
          notes: 'Awaiting Admin Approval (පරිපාලකගේ අනුමැතිය අවශ්‍යයි)',
          unreadBySuperAdmin: true,
          permissions: getDefaultPermissions('user' as UserRole),
        };

        // Write /users/{uid}
        await setDoc(userRef, {
          uid: user.uid,
          userId: user.uid,
          email: user.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL || null,
          role: 'user',
          status: 'pending',
          ownerEmail: SUPER_ADMIN_EMAIL,
          parentAdminEmail: SUPER_ADMIN_EMAIL,
          allowedDays: 0,
          expiresAt: now,
          expiresAtString: dateStr,
          firstLoginTime: now,
          firstLoginString: dateStr,
          lastLoginTime: now,
          lastLoginString: timeStr,
          notes: profile.notes,
          unreadBySuperAdmin: true,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // STRICT REQUIREMENT 3: Also create approval request in /approval_requests/{requestId}
        // containing: userId, email, displayName, status="pending", ownerEmail="psgss91@gmail.com", createdAt
        try {
          const reqRef = doc(db, 'approval_requests', user.uid);
          await setDoc(reqRef, {
            requestId: user.uid,
            userId: user.uid,
            email: user.email,
            displayName: profile.displayName,
            photoURL: profile.photoURL || null,
            status: 'pending',
            ownerEmail: SUPER_ADMIN_EMAIL,
            targetAdminEmail: SUPER_ADMIN_EMAIL,
            notes: 'Awaiting Admin Approval (පරිපාලකගේ අනුමැතිය අවශ්‍යයි)',
            createdAt: serverTimestamp(),
            requestedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (reqErr) {
          console.warn('Failed to write approval_requests doc:', reqErr);
        }
      } else {
        // Existing user logging in: only update lastLoginAt and device metadata
        // Normal users cannot approve themselves or change role/status
        profile = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || existing.displayName || cleanEmail.split('@')[0],
          photoURL: user.photoURL || existing.photoURL || undefined,
          role: existing.role === 'client' ? 'user' : (existing.role || 'user'),
          parentAdminEmail: SUPER_ADMIN_EMAIL,
          firstLoginTime: existing.firstLoginTime || now,
          firstLoginString: existing.firstLoginString || dateStr,
          allowedDays: existing.allowedDays ?? 0,
          expiresAt: existing.expiresAt || now,
          expiresAtString: existing.expiresAtString || dateStr,
          status: existing.status || 'pending',
          lastLoginTime: now,
          lastLoginString: timeStr,
          notes: existing.notes || '',
          unreadBySuperAdmin: existing.unreadBySuperAdmin ?? (existing.status === 'pending'),
          deviceInfo: deviceInfo || existing.deviceInfo,
          browser: browser || existing.browser,
          os: os || existing.os,
          permissions: existing.permissions || getDefaultPermissions((existing.role || 'user') as UserRole),
        };

        await setDoc(
          userRef,
          {
            displayName: profile.displayName,
            photoURL: profile.photoURL || null,
            lastLoginTime: now,
            lastLoginString: timeStr,
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    const cached = getCachedProfiles();
    const idx = cached.findIndex((p) => p.userId === profile.userId);
    if (idx >= 0) cached[idx] = profile;
    else cached.unshift(profile);
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
    } catch {}

    return profile;
  } catch (err) {
    console.error('Failed to register user in Firestore:', err);
    return null;
  }
}

/**
 * Super Admin action: manually register a client in Firestore
 */
export async function registerClientByAdmin(clientData: {
  email: string;
  name: string;
  role: UserRole;
  allowedDays: number;
  notes?: string;
}): Promise<UserAccessProfile> {
  const cleanEmail = clientData.email.trim().toLowerCase();
  const userId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  const days = clientData.allowedDays > 0 ? clientData.allowedDays : 7;
  const isUnlimited = days >= 9999;
  const expiresAt = isUnlimited ? now + 36500 * 86400000 : now + days * 86400000;
  const role = clientData.role || 'user';
  const permissions = getDefaultPermissions(role);

  const profile: UserAccessProfile = {
    userId,
    email: cleanEmail,
    displayName: clientData.name.trim() || cleanEmail.split('@')[0],
    role,
    parentAdminEmail: SUPER_ADMIN_EMAIL,
    firstLoginTime: now,
    firstLoginString: new Date(now).toLocaleDateString(),
    allowedDays: days,
    expiresAt,
    expiresAtString: isUnlimited ? 'Permanent / Unlimited' : new Date(expiresAt).toLocaleDateString(),
    status: isUnlimited ? 'unlimited' : 'active',
    lastLoginTime: now,
    lastLoginString: 'Registered by Super Admin',
    notes: clientData.notes || `Registered by Super Admin (${isUnlimited ? 'Unlimited' : days + ' days'})`,
    unreadBySuperAdmin: false,
    permissions,
  };

  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    uid: userId,
    userId,
    email: cleanEmail,
    displayName: profile.displayName,
    photoURL: null,
    role,
    status: profile.status,
    allowedDays: days,
    expiresAt,
    expiresAtString: profile.expiresAtString,
    ownerEmail: SUPER_ADMIN_EMAIL,
    parentAdminEmail: SUPER_ADMIN_EMAIL,
    firstLoginTime: now,
    firstLoginString: profile.firstLoginString,
    lastLoginTime: now,
    lastLoginString: profile.lastLoginString,
    notes: profile.notes,
    unreadBySuperAdmin: false,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const cached = getCachedProfiles();
  cached.unshift(profile);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
  } catch {}

  return profile;
}

/**
 * Super Admin action: change any user's role
 */
export async function updateUserRoleOnServer(
  userId: string,
  role: UserRole
): Promise<UserAccessProfile | null> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found in Firestore');
  const existing = snap.data();

  if (existing.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && role !== 'super_admin') {
    throw new Error('Super Admin role cannot be modified');
  }

  // Non-admins can never be super_admin or admin
  if (existing.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase() && (role === 'super_admin' || role === 'admin')) {
    throw new Error('Only psgss91@gmail.com can hold Admin or Super Admin role');
  }

  const permissions = getDefaultPermissions(role);
  await updateDoc(userRef, {
    role,
    permissions,
    updatedAt: serverTimestamp(),
  });

  const updated: UserAccessProfile = {
    ...mapDocToProfile(existing),
    userId,
    role,
    permissions,
  };

  const cached = getCachedProfiles();
  const idx = cached.findIndex((p) => p.userId === userId);
  if (idx >= 0) {
    cached[idx] = updated;
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
    } catch {}
  }

  return updated;
}

/**
 * Super Admin action: update user allowed days or status (e.g. block, unblock, extend days)
 */
export async function updateUserAccessOnServer(
  userId: string,
  params: {
    allowedDays?: number;
    status?: 'pending' | 'active' | 'expired' | 'blocked' | 'unlimited';
    notes?: string;
  }
): Promise<UserAccessProfile | null> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found in Firestore');
  const existing = snap.data();

  const now = Date.now();
  const updateData: any = { updatedAt: serverTimestamp() };

  if (params.status) updateData.status = params.status;
  if (params.notes !== undefined) updateData.notes = params.notes;
  if (params.allowedDays !== undefined) {
    updateData.allowedDays = params.allowedDays;
    const isUnlimited = params.allowedDays >= 9999;
    const newExpiresAt = isUnlimited ? now + 36500 * 86400000 : now + params.allowedDays * 86400000;
    updateData.expiresAt = newExpiresAt;
    updateData.expiresAtString = isUnlimited ? 'Permanent / Unlimited' : new Date(newExpiresAt).toLocaleDateString();
  }

  await updateDoc(userRef, updateData);

  // Sync approval_requests document if status changed
  if (params.status) {
    try {
      await setDoc(
        doc(db, 'approval_requests', userId),
        {
          status: params.status === 'active' || params.status === 'unlimited' ? 'approved' : params.status,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}
  }

  const updated: UserAccessProfile = {
    ...mapDocToProfile(existing),
    ...updateData,
    userId,
  };

  const cached = getCachedProfiles();
  const idx = cached.findIndex((p) => p.userId === userId);
  if (idx >= 0) {
    cached[idx] = updated;
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
    } catch {}
  }

  return updated;
}

/**
 * Super Admin action: approve and activate a user's access
 * Requirement 7: updates Firestore status from 'pending' to 'active' and sets allowedDays/access expiry.
 */
export async function approveUserOnServer(
  userId: string,
  allowedDays: number = 30,
  role?: UserRole
): Promise<UserAccessProfile | null> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  const existing = snap.exists() ? snap.data() : null;

  const now = Date.now();
  const days = allowedDays > 0 ? allowedDays : 30;
  const isUnlimited = days >= 9999;
  const newExpiresAt = isUnlimited ? now + 36500 * 86400000 : now + days * 86400000;
  const targetRole = role || (existing?.role === 'super_admin' ? 'user' : (existing?.role || 'user'));
  const permissions = getDefaultPermissions(targetRole as UserRole);

  const updateData: any = {
    status: isUnlimited ? 'unlimited' : 'active',
    allowedDays: days,
    expiresAt: newExpiresAt,
    expiresAtString: isUnlimited ? 'Permanent / Unlimited' : new Date(newExpiresAt).toLocaleDateString(),
    role: targetRole,
    permissions,
    unreadBySuperAdmin: false,
    notes: `Approved by Super Admin on ${new Date().toLocaleDateString()}`,
    updatedAt: serverTimestamp(),
  };

  if (snap.exists()) {
    await updateDoc(userRef, updateData);
  } else {
    await setDoc(userRef, {
      uid: userId,
      userId,
      email: existing?.email || '',
      displayName: existing?.displayName || 'User',
      photoURL: existing?.photoURL || null,
      ownerEmail: SUPER_ADMIN_EMAIL,
      parentAdminEmail: SUPER_ADMIN_EMAIL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      ...updateData,
    });
  }

  // Update /approval_requests/{userId} as well
  try {
    await setDoc(
      doc(db, 'approval_requests', userId),
      {
        status: 'approved',
        allowedDays: days,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {}

  const updated: UserAccessProfile = {
    ...mapDocToProfile(existing || { userId }),
    ...updateData,
    userId,
  };

  const cached = getCachedProfiles();
  const idx = cached.findIndex((p) => p.userId === userId);
  if (idx >= 0) cached[idx] = updated;
  else cached.unshift(updated);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
  } catch {}

  return updated;
}

/**
 * Super Admin action: delete a user from Firestore
 * Requirement 8: delete from both /users and /approval_requests
 */
export async function deleteUserOnServer(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists() && snap.data().email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Super Admin cannot be deleted');
  }

  await deleteDoc(userRef);
  try {
    await deleteDoc(doc(db, 'approval_requests', userId));
  } catch {}

  const cached = getCachedProfiles().filter((p) => p.userId !== userId);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
  } catch {}

  return true;
}

/**
 * Super Admin action: mark all registrations as read
 */
export async function markRegistrationsAsReadOnServer(): Promise<boolean> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('unreadBySuperAdmin', '==', true)));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { unreadBySuperAdmin: false, updatedAt: serverTimestamp() });
    });
    await batch.commit();

    const cached = getCachedProfiles().map((u) => ({ ...u, unreadBySuperAdmin: false }));
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
    } catch {}

    return true;
  } catch (err) {
    console.warn('Error marking read in Firestore:', err);
    return false;
  }
}

/**
 * Get server system status directly from Firestore
 */
export async function getServerSystemStatus(): Promise<SystemStatusResponse | null> {
  try {
    const res = await fetchServerUsers();
    if (!res) return null;
    const clients = res.users.filter((u) => u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase());
    const unread = clients.filter((c) => c.unreadBySuperAdmin);
    const pending = clients.filter((c) => c.status === 'pending');

    return {
      status: 'online',
      superAdminEmail: SUPER_ADMIN_EMAIL,
      totalAccounts: res.users.length,
      registeredClients: clients.length,
      unreadRegistrations: unread.length,
      pendingApprovals: pending.length,
      newestClients: unread.map((c) => ({
        userId: c.userId,
        email: c.email,
        name: c.displayName,
        registeredAt: c.firstLoginString,
        role: c.role,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Submit an approval request directly to Firestore
 * Requirement 3: /approval_requests/{requestId} containing userId, email, displayName, status="pending", ownerEmail="psgss91@gmail.com", createdAt
 */
export async function submitApprovalRequest(
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  },
  note?: string
): Promise<{ success: boolean; message: string; profile?: UserAccessProfile }> {
  if (!user.uid || !user.email) {
    return { success: false, message: 'Invalid user details' };
  }

  try {
    const reqRef = doc(db, 'approval_requests', user.uid);
    const userRef = doc(db, 'users', user.uid);
    const now = Date.now();
    const timeStr = new Date(now).toLocaleString();

    await setDoc(
      reqRef,
      {
        requestId: user.uid,
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        status: 'pending',
        ownerEmail: SUPER_ADMIN_EMAIL,
        targetAdminEmail: SUPER_ADMIN_EMAIL,
        notes: note || `Approval Requested on ${timeStr}`,
        createdAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const snap = await getDoc(userRef);
    let profile: UserAccessProfile;

    if (!snap.exists()) {
      profile = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || undefined,
        role: 'user',
        parentAdminEmail: SUPER_ADMIN_EMAIL,
        firstLoginTime: now,
        firstLoginString: new Date(now).toLocaleDateString(),
        allowedDays: 0,
        expiresAt: now,
        expiresAtString: new Date(now).toLocaleDateString(),
        status: 'pending',
        lastLoginTime: now,
        lastLoginString: timeStr,
        notes: note || `Approval Requested on ${timeStr}`,
        unreadBySuperAdmin: true,
        permissions: getDefaultPermissions('user' as UserRole),
      };
      await setDoc(userRef, {
        uid: user.uid,
        userId: user.uid,
        email: user.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL || null,
        role: 'user',
        status: 'pending',
        ownerEmail: SUPER_ADMIN_EMAIL,
        parentAdminEmail: SUPER_ADMIN_EMAIL,
        allowedDays: 0,
        expiresAt: now,
        expiresAtString: profile.expiresAtString,
        firstLoginTime: now,
        firstLoginString: profile.firstLoginString,
        lastLoginTime: now,
        lastLoginString: timeStr,
        notes: profile.notes,
        unreadBySuperAdmin: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existing = snap.data();
      profile = {
        ...mapDocToProfile(existing),
        userId: user.uid,
        lastLoginTime: now,
        lastLoginString: timeStr,
        status: existing.status === 'unlimited' ? 'unlimited' : existing.status,
        unreadBySuperAdmin: true,
        notes: note || `Approval Requested on ${timeStr}`,
      };

      await updateDoc(userRef, {
        unreadBySuperAdmin: true,
        notes: note || `Approval Requested on ${timeStr}`,
        lastLoginTime: now,
        lastLoginString: timeStr,
        updatedAt: serverTimestamp(),
      });
    }

    const cached = getCachedProfiles();
    const idx = cached.findIndex((p) => p.userId === user.uid);
    if (idx >= 0) cached[idx] = profile;
    else cached.unshift(profile);
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
    } catch {}

    return {
      success: true,
      message: `Approval request submitted to Super Admin (${SUPER_ADMIN_EMAIL})`,
      profile,
    };
  } catch (err: any) {
    console.warn('Error submitting approval request to Firestore:', err);
    return {
      success: false,
      message: err?.message || 'Failed to submit approval request',
    };
  }
}
