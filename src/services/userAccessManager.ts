import { User } from 'firebase/auth';
import { UserAccessProfile, AccessSettings, ADMIN_EMAIL } from '../types';
import { uploadMultipartFile, getOrCreateInvoiceFolder } from './googleDrive';

const STORAGE_KEY_SETTINGS = 'ps_invoice_access_settings';
const STORAGE_KEY_PROFILES = 'ps_invoice_user_profiles';

const DEFAULT_SETTINGS: AccessSettings = {
  defaultAllowedDays: 7, // Admin specified default: 7 days
  autoNotifyAdminOnExpiry: true,
};

/**
 * Get current system access settings
 */
export function getAccessSettings(): AccessSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load access settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save access settings (Admin only)
 */
export function saveAccessSettings(settings: AccessSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save access settings:', err);
  }
}

/**
 * Get all registered user access profiles
 */
export function getAllUserProfiles(): UserAccessProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load user profiles:', err);
    return [];
  }
}

/**
 * Save user profiles list to storage
 */
function persistProfiles(profiles: UserAccessProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to persist user profiles:', err);
  }
}

/**
 * Formats a timestamp into human-readable date string
 */
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Register or update a user on login.
 * Admin (psgss91@gmail.com) always gets status 'unlimited'.
 * New users receive defaultAllowedDays (e.g. 7 days).
 */
export function registerOrUpdateUserAccess(
  user: User,
  driveAccessToken?: string | null
): UserAccessProfile {
  const profiles = getAllUserProfiles();
  const settings = getAccessSettings();
  const now = Date.now();
  const userEmail = (user.email || '').trim().toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

  const existingIndex = profiles.findIndex(
    (p) => p.userId === user.uid || p.email.toLowerCase() === userEmail
  );

  let profile: UserAccessProfile;

  if (existingIndex >= 0) {
    // Existing user login
    const existing = profiles[existingIndex];
    const isExpired =
      existing.status !== 'unlimited' &&
      existing.status !== 'blocked' &&
      now > existing.expiresAt;

    profile = {
      ...existing,
      email: user.email || existing.email,
      displayName: user.displayName || existing.displayName,
      photoURL: user.photoURL || existing.photoURL,
      lastLoginTime: now,
      lastLoginString: new Date(now).toLocaleString(),
      status: isAdmin
        ? 'unlimited'
        : isExpired
        ? 'expired'
        : existing.status,
    };

    profiles[existingIndex] = profile;
  } else {
    // New user first-time registration!
    const allowedDays = isAdmin ? 9999 : settings.defaultAllowedDays;
    const expiresAt = isAdmin
      ? now + 36500 * 86400000 // 100 years for admin
      : now + allowedDays * 86400000;

    profile = {
      userId: user.uid,
      email: user.email || 'No Email',
      displayName: user.displayName || 'Google User',
      photoURL: user.photoURL || undefined,
      firstLoginTime: now,
      firstLoginString: formatDate(now),
      allowedDays,
      expiresAt,
      expiresAtString: formatDate(expiresAt),
      status: isAdmin ? 'unlimited' : 'active',
      lastLoginTime: now,
      lastLoginString: new Date(now).toLocaleString(),
      notes: isAdmin ? 'System Administrator & Owner' : `New user (${allowedDays} days trial)`,
    };

    profiles.unshift(profile);
  }

  persistProfiles(profiles);

  // Sync to Google Drive if admin token is available
  if (driveAccessToken) {
    syncProfilesToDrive(driveAccessToken, profiles).catch((err) => {
      console.warn('Failed to sync user profiles to Google Drive:', err);
    });
  }

  return profile;
}

/**
 * Check if the user is allowed to access the system.
 * Returns detailed access info: { isAllowed, isAdmin, daysRemaining, isExpired, isBlocked }
 */
export function checkUserAccessStatus(user: { uid: string; email: string | null } | null): {
  isAllowed: boolean;
  isAdmin: boolean;
  daysRemaining: number;
  isExpired: boolean;
  isBlocked: boolean;
  profile: UserAccessProfile | null;
} {
  if (!user) {
    return {
      isAllowed: false,
      isAdmin: false,
      daysRemaining: 0,
      isExpired: false,
      isBlocked: false,
      profile: null,
    };
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

  // psgss91@gmail.com is always Admin with unlimited access
  if (isAdmin) {
    return {
      isAllowed: true,
      isAdmin: true,
      daysRemaining: 9999,
      isExpired: false,
      isBlocked: false,
      profile: null,
    };
  }

  const profiles = getAllUserProfiles();
  const profile = profiles.find(
    (p) => p.userId === user.uid || p.email.toLowerCase() === userEmail
  );

  if (!profile) {
    // If user profile not found yet, grant default trial days
    const settings = getAccessSettings();
    return {
      isAllowed: true,
      isAdmin: false,
      daysRemaining: settings.defaultAllowedDays,
      isExpired: false,
      isBlocked: false,
      profile: null,
    };
  }

  // Admin granted unlimited access
  if (profile.status === 'unlimited') {
    return {
      isAllowed: true,
      isAdmin: false,
      daysRemaining: 9999,
      isExpired: false,
      isBlocked: false,
      profile,
    };
  }

  // Admin manually blocked this user
  if (profile.status === 'blocked') {
    return {
      isAllowed: false,
      isAdmin: false,
      daysRemaining: 0,
      isExpired: false,
      isBlocked: true,
      profile,
    };
  }

  const now = Date.now();
  const msRemaining = profile.expiresAt - now;

  if (msRemaining <= 0) {
    // Expired!
    if (profile.status !== 'expired') {
      profile.status = 'expired';
      persistProfiles(profiles);
    }
    return {
      isAllowed: false,
      isAdmin: false,
      daysRemaining: 0,
      isExpired: true,
      isBlocked: false,
      profile,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    isAllowed: true,
    isAdmin: false,
    daysRemaining,
    isExpired: false,
    isBlocked: false,
    profile,
  };
}

const STORAGE_KEY_GUEST = 'ps_invoice_guest_access';

/**
 * Check guest access status
 */
export function checkGuestAccessStatus(): {
  isAllowed: boolean;
  daysRemaining: number;
  isExpired: boolean;
  firstUsed: number;
} {
  const settings = getAccessSettings();
  const allowedMs = settings.defaultAllowedDays * 86400000;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(STORAGE_KEY_GUEST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GUEST, JSON.stringify({ firstUsed: now }));
      return {
        isAllowed: true,
        daysRemaining: settings.defaultAllowedDays,
        isExpired: false,
        firstUsed: now,
      };
    }

    const data = JSON.parse(raw);
    const firstUsed = Number(data.firstUsed) || now;
    const elapsed = now - firstUsed;

    if (elapsed > allowedMs) {
      return {
        isAllowed: false,
        daysRemaining: 0,
        isExpired: true,
        firstUsed,
      };
    }

    const msRemaining = allowedMs - elapsed;
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / 86400000));

    return {
      isAllowed: true,
      daysRemaining,
      isExpired: false,
      firstUsed,
    };
  } catch {
    return {
      isAllowed: true,
      daysRemaining: settings.defaultAllowedDays,
      isExpired: false,
      firstUsed: now,
    };
  }
}

/**
 * Admin action: Extend a user's access by a given number of days
 */
export function extendUserAccessDays(userId: string, additionalDays: number): UserAccessProfile | null {
  const profiles = getAllUserProfiles();
  const index = profiles.findIndex((p) => p.userId === userId);
  if (index === -1) return null;

  const user = profiles[index];
  const now = Date.now();
  const baseTime = user.expiresAt > now ? user.expiresAt : now;
  const newExpiresAt = baseTime + additionalDays * 86400000;
  const newAllowedDays = user.allowedDays + additionalDays;

  const updated: UserAccessProfile = {
    ...user,
    allowedDays: newAllowedDays,
    expiresAt: newExpiresAt,
    expiresAtString: formatDate(newExpiresAt),
    status: 'active',
    notes: `Extended by +${additionalDays} days on ${formatDate(now)}`,
  };

  profiles[index] = updated;
  persistProfiles(profiles);
  return updated;
}

/**
 * Admin action: Set exact access days from registration date
 */
export function setUserExactAllowedDays(userId: string, totalDays: number): UserAccessProfile | null {
  const profiles = getAllUserProfiles();
  const index = profiles.findIndex((p) => p.userId === userId);
  if (index === -1) return null;

  const user = profiles[index];
  const newExpiresAt = user.firstLoginTime + totalDays * 86400000;
  const now = Date.now();
  const isExpired = now > newExpiresAt;

  const updated: UserAccessProfile = {
    ...user,
    allowedDays: totalDays,
    expiresAt: newExpiresAt,
    expiresAtString: formatDate(newExpiresAt),
    status: isExpired ? 'expired' : 'active',
  };

  profiles[index] = updated;
  persistProfiles(profiles);
  return updated;
}

/**
 * Admin action: Toggle unlimited access for a user
 */
export function toggleUserUnlimited(userId: string, isUnlimited: boolean): UserAccessProfile | null {
  const profiles = getAllUserProfiles();
  const index = profiles.findIndex((p) => p.userId === userId);
  if (index === -1) return null;

  const user = profiles[index];
  const updated: UserAccessProfile = {
    ...user,
    status: isUnlimited ? 'unlimited' : 'active',
  };

  profiles[index] = updated;
  persistProfiles(profiles);
  return updated;
}

/**
 * Admin action: Block or unblock a user
 */
export function toggleUserBlocked(userId: string, isBlocked: boolean): UserAccessProfile | null {
  const profiles = getAllUserProfiles();
  const index = profiles.findIndex((p) => p.userId === userId);
  if (index === -1) return null;

  const user = profiles[index];
  const updated: UserAccessProfile = {
    ...user,
    status: isBlocked ? 'blocked' : 'active',
  };

  profiles[index] = updated;
  persistProfiles(profiles);
  return updated;
}

/**
 * Admin action: Delete a user profile
 */
export function deleteUserProfile(userId: string): void {
  const profiles = getAllUserProfiles().filter((p) => p.userId !== userId);
  persistProfiles(profiles);
}

/**
 * Generate a pre-filled mailto link for expired user to request renewal from psgss91@gmail.com
 */
export function createRenewalMailtoLink(profile?: UserAccessProfile | null, userEmail?: string): string {
  const email = profile?.email || userEmail || 'Registered User';
  const name = profile?.displayName || 'PS Invoice User';
  const registered = profile?.firstLoginString || 'Recent';
  const expired = profile?.expiresAtString || 'Today';

  const subject = encodeURIComponent(`[PS Invoice] Access Renewal / Update Request - ${email}`);

  const body =
    `Hello Administrator (${ADMIN_EMAIL}),\n\n` +
    `My trial access period for PS Invoice has expired.\n` +
    `Please renew or update my access so I can continue generating and exporting invoices.\n\n` +
    `--- USER DETAILS ---\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Registered Date: ${registered}\n` +
    `Expired Date: ${expired}\n` +
    `Allowed Days Given: ${profile?.allowedDays || 7} Days\n\n` +
    `Thank you,\n` +
    `${name}`;

  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
}

/**
 * Sync user access profiles to Google Drive
 */
async function syncProfilesToDrive(
  accessToken: string,
  profiles: UserAccessProfile[]
): Promise<void> {
  try {
    const folder = await getOrCreateInvoiceFolder(accessToken);
    const data = {
      app: 'PS Invoice',
      admin: ADMIN_EMAIL,
      lastUpdated: new Date().toISOString(),
      userCount: profiles.length,
      users: profiles,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    await uploadMultipartFile(
      accessToken,
      folder.id,
      'PS_Invoice_User_Access_Profiles.json',
      'application/json',
      blob
    );
  } catch (err) {
    console.warn('Error syncing profiles to Drive:', err);
  }
}
