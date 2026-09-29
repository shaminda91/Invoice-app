import { User } from 'firebase/auth';
import {
  UserAccessProfile,
  AccessSettings,
  ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
  UserRole,
  UserPermissions,
} from '../types';
import {
  uploadMultipartFile,
  getOrCreateInvoiceFolder,
  findFileInFolder,
  downloadDriveFileContent,
} from './googleDrive';
import {
  registerUserOnServer,
  updateUserRoleOnServer,
  updateUserAccessOnServer,
  deleteUserOnServer,
  fetchServerUsers,
} from './superAdminApi';

const STORAGE_KEY_SETTINGS = 'ps_invoice_access_settings';
const STORAGE_KEY_PROFILES = 'ps_invoice_user_profiles';

const DEFAULT_SETTINGS: AccessSettings = {
  defaultAllowedDays: 7, // Admin specified default: 7 days
  autoNotifyAdminOnExpiry: true,
};

/**
 * Default permission matrix by role
 */
export function getDefaultPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'super_admin':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canDeleteInvoice: true,
        canExportPDF: true,
        canManageClients: true,
        canViewReports: true,
        canManageUsers: true,
      };
    case 'admin':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canDeleteInvoice: true,
        canExportPDF: true,
        canManageClients: true,
        canViewReports: true,
        canManageUsers: false,
      };
    case 'manager':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canDeleteInvoice: true,
        canExportPDF: true,
        canManageClients: true,
        canViewReports: true,
        canManageUsers: false,
      };
    case 'editor':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canDeleteInvoice: false,
        canExportPDF: true,
        canManageClients: true,
        canViewReports: false,
        canManageUsers: false,
      };
    case 'client':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canDeleteInvoice: false,
        canExportPDF: true,
        canManageClients: false,
        canViewReports: false,
        canManageUsers: false,
      };
    case 'viewer':
    default:
      return {
        canCreateInvoice: false,
        canEditInvoice: false,
        canDeleteInvoice: false,
        canExportPDF: true,
        canManageClients: false,
        canViewReports: false,
        canManageUsers: false,
      };
  }
}

/**
 * Role badge styling
 */
export function getRoleBadgeClass(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'bg-amber-100 text-amber-900 border-amber-300 font-black';
    case 'admin':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold';
    case 'manager':
      return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
    case 'editor':
      return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
    case 'client':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
    case 'viewer':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
  }
}

/**
 * Role label details
 */
export function getRoleLabel(role: UserRole, lang: string = 'si'): { name: string; icon: string; desc: string } {
  switch (role) {
    case 'super_admin':
      return {
        name: 'Super Admin',
        icon: '👑',
        desc: lang === 'si' ? 'ප්‍රධාන පරිපාලක (සම්පූර්ණ පාලනය)' : 'Root Super Administrator',
      };
    case 'admin':
      return {
        name: lang === 'si' ? 'පරිපාලක (Admin)' : lang === 'ta' ? 'நிர்வாகி (Admin)' : 'Admin',
        icon: '🛡️',
        desc: lang === 'si' ? 'පද්ධති පරිපාලක' : 'System Administrator',
      };
    case 'manager':
      return {
        name: lang === 'si' ? 'කළමනාකරු (Manager)' : lang === 'ta' ? 'மேலாளர் (Manager)' : 'Manager',
        icon: '💼',
        desc: lang === 'si' ? 'ඉන්වොයිස් සහ ගනුදෙනුකරු කළමනාකරු' : 'Invoices & Clients Manager',
      };
    case 'editor':
      return {
        name: lang === 'si' ? 'සකසන්නා (Editor)' : lang === 'ta' ? 'தொகுப்பாளர் (Editor)' : 'Editor',
        icon: '✍️',
        desc: lang === 'si' ? 'ඉන්වොයිස් සකසන්නා' : 'Invoice Creator & Editor',
      };
    case 'client':
      return {
        name: lang === 'si' ? 'සේවාලාභියා (Client)' : lang === 'ta' ? 'வாடிக்கையாளர் (Client)' : 'Client',
        icon: '👤',
        desc: lang === 'si' ? 'සේවාලාභියා' : 'Standard Client Account',
      };
    case 'viewer':
    default:
      return {
        name: lang === 'si' ? 'නරඹන්නා (Viewer)' : lang === 'ta' ? 'பார்வையாளர் (Viewer)' : 'Viewer',
        icon: '👁️',
        desc: lang === 'si' ? 'බැලීම සහ බාගත කිරීම පමණි' : 'View & Download Only',
      };
  }
}

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
 * Super Admin (psgss91@gmail.com) always gets role 'super_admin' and status 'unlimited'.
 * New users receive role 'client' under Super Admin, with defaultAllowedDays (e.g. 7 days).
 */
export function registerOrUpdateUserAccess(
  user: User,
  driveAccessToken?: string | null
): UserAccessProfile {
  const profiles = getAllUserProfiles();
  const settings = getAccessSettings();
  const now = Date.now();
  const userEmail = (user.email || '').trim().toLowerCase();
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  const existingIndex = profiles.findIndex(
    (p) => p.userId === user.uid || p.email.toLowerCase() === userEmail
  );

  let profile: UserAccessProfile;

  if (existingIndex >= 0) {
    // Existing user login
    const existing = profiles[existingIndex];
    const role: UserRole = isSuperAdmin ? 'super_admin' : (existing.role || 'client');
    const isExpired =
      role !== 'super_admin' &&
      existing.status !== 'unlimited' &&
      existing.status !== 'blocked' &&
      now > existing.expiresAt;

    profile = {
      ...existing,
      email: user.email || existing.email,
      displayName: user.displayName || existing.displayName,
      photoURL: user.photoURL || existing.photoURL,
      role,
      parentAdminEmail: SUPER_ADMIN_EMAIL,
      lastLoginTime: now,
      lastLoginString: new Date(now).toLocaleString(),
      status: isSuperAdmin
        ? 'unlimited'
        : isExpired
        ? 'expired'
        : existing.status,
      permissions: existing.permissions || getDefaultPermissions(role),
    };

    profiles[existingIndex] = profile;
  } else {
    // New user first-time registration under Super Admin!
    const role: UserRole = isSuperAdmin ? 'super_admin' : 'client';
    const allowedDays = isSuperAdmin ? 99999 : settings.defaultAllowedDays;
    const expiresAt = isSuperAdmin
      ? now + 36500 * 86400000 // 100 years for super admin
      : now + allowedDays * 86400000;

    profile = {
      userId: user.uid,
      email: user.email || 'No Email',
      displayName: user.displayName || 'Google User',
      photoURL: user.photoURL || undefined,
      role,
      parentAdminEmail: SUPER_ADMIN_EMAIL,
      firstLoginTime: now,
      firstLoginString: formatDate(now),
      allowedDays,
      expiresAt,
      expiresAtString: formatDate(expiresAt),
      status: isSuperAdmin ? 'unlimited' : 'active',
      lastLoginTime: now,
      lastLoginString: new Date(now).toLocaleString(),
      notes: isSuperAdmin
        ? 'Root Super Administrator & System Owner'
        : `Registered under Super Admin (${allowedDays} days trial)`,
      unreadBySuperAdmin: !isSuperAdmin,
      permissions: getDefaultPermissions(role),
    };

    if (isSuperAdmin) {
      profiles.unshift(profile);
    } else {
      profiles.push(profile);
    }
  }

  persistProfiles(profiles);

  // Asynchronously register on central server
  registerUserOnServer(user).catch((err) => {
    console.warn('Failed to sync registration to central server:', err);
  });

  // Sync to Google Drive if admin token is available
  if (driveAccessToken) {
    syncProfilesToDrive(driveAccessToken, profiles).catch((err) => {
      console.warn('Failed to sync user profiles to Google Drive:', err);
    });
  }

  return profile;
}

/**
 * Super Admin action: change any registered user's role
 */
export async function changeUserRole(userId: string, newRole: UserRole): Promise<UserAccessProfile | null> {
  const profiles = getAllUserProfiles();
  const index = profiles.findIndex((p) => p.userId === userId);
  if (index === -1) return null;

  const user = profiles[index];
  if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && newRole !== 'super_admin') {
    throw new Error('Super Admin role cannot be demoted');
  }

  const updated: UserAccessProfile = {
    ...user,
    role: newRole,
    permissions: getDefaultPermissions(newRole),
    notes: `${user.notes || ''} [Role changed to ${newRole} on ${new Date().toLocaleDateString()}]`.trim(),
  };

  profiles[index] = updated;
  persistProfiles(profiles);

  // Sync to central server
  try {
    await updateUserRoleOnServer(userId, newRole);
  } catch (err) {
    console.warn('Failed to sync role change to server:', err);
  }

  return updated;
}

/**
 * Check if the user is allowed to access the system.
 * Returns detailed access info: { isAllowed, isAdmin, isSuperAdmin, role, permissions, daysRemaining, isExpired, isBlocked, profile }
 */
export function checkUserAccessStatus(user: { uid: string; email: string | null } | null): {
  isAllowed: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: UserRole;
  permissions: UserPermissions;
  daysRemaining: number;
  isExpired: boolean;
  isBlocked: boolean;
  profile: UserAccessProfile | null;
} {
  if (!user) {
    return {
      isAllowed: false,
      isAdmin: false,
      isSuperAdmin: false,
      role: 'client',
      permissions: getDefaultPermissions('client'),
      daysRemaining: 0,
      isExpired: false,
      isBlocked: false,
      profile: null,
    };
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  // psgss91@gmail.com is always Super Admin with permanent unlimited access
  if (isSuperAdmin) {
    return {
      isAllowed: true,
      isAdmin: true,
      isSuperAdmin: true,
      role: 'super_admin',
      permissions: getDefaultPermissions('super_admin'),
      daysRemaining: 99999,
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
    // If user profile not found yet, grant default trial days as client
    const settings = getAccessSettings();
    return {
      isAllowed: true,
      isAdmin: false,
      isSuperAdmin: false,
      role: 'client',
      permissions: getDefaultPermissions('client'),
      daysRemaining: settings.defaultAllowedDays,
      isExpired: false,
      isBlocked: false,
      profile: null,
    };
  }

  const userRole: UserRole = profile.role || 'client';
  const permissions: UserPermissions = profile.permissions || getDefaultPermissions(userRole);
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  // Super Admin granted unlimited access
  if (profile.status === 'unlimited' || userRole === 'super_admin') {
    return {
      isAllowed: true,
      isAdmin,
      isSuperAdmin: userRole === 'super_admin',
      role: userRole,
      permissions,
      daysRemaining: 99999,
      isExpired: false,
      isBlocked: false,
      profile,
    };
  }

  // Admin manually blocked this user
  if (profile.status === 'blocked') {
    return {
      isAllowed: false,
      isAdmin,
      isSuperAdmin: false,
      role: userRole,
      permissions,
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
      isAdmin,
      isSuperAdmin: false,
      role: userRole,
      permissions,
      daysRemaining: 0,
      isExpired: true,
      isBlocked: false,
      profile,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    isAllowed: true,
    isAdmin,
    isSuperAdmin: false,
    role: userRole,
    permissions,
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

  updateUserAccessOnServer(userId, { allowedDays: newAllowedDays, status: 'active', notes: updated.notes }).catch(() => {});

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

  updateUserAccessOnServer(userId, { allowedDays: totalDays, status: updated.status }).catch(() => {});

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

  updateUserAccessOnServer(userId, { status: updated.status }).catch(() => {});

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

  updateUserAccessOnServer(userId, { status: updated.status }).catch(() => {});

  return updated;
}

/**
 * Admin action: Delete a user profile
 */
export function deleteUserProfile(userId: string): void {
  const profiles = getAllUserProfiles().filter((p) => p.userId !== userId);
  persistProfiles(profiles);
  deleteUserOnServer(userId).catch(() => {});
}

/**
 * Generate a pre-filled mailto link for expired user to request renewal from psgss91@gmail.com
 */
export function createRenewalMailtoLink(profile?: UserAccessProfile | null, userEmail?: string): string {
  const email = profile?.email || userEmail || 'Registered User';
  const name = profile?.displayName || 'PSN Invoice User';
  const registered = profile?.firstLoginString || 'Recent';
  const expired = profile?.expiresAtString || 'Today';

  const subject = encodeURIComponent(`[PSN Invoice] Access Renewal / Update Request - ${email}`);

  const body =
    `Hello Administrator (${ADMIN_EMAIL}),\n\n` +
    `My trial access period for PSN Invoice has expired.\n` +
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
 * Admin action: Manually register a new client
 */
export function registerNewClientManually(
  email: string,
  name: string,
  allowedDays: number = 7,
  notes?: string,
  initialRole: UserRole = 'client'
): UserAccessProfile {
  const profiles = getAllUserProfiles();
  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const expiresAt = allowedDays >= 9999 ? now + 36500 * 86400000 : now + allowedDays * 86400000;
  const isUnlimited = allowedDays >= 9999;

  const existingIndex = profiles.findIndex((p) => p.email.toLowerCase() === cleanEmail);

  const profile: UserAccessProfile = {
    userId: existingIndex >= 0 ? profiles[existingIndex].userId : 'client_' + now + '_' + Math.random().toString(36).substring(2, 7),
    email: cleanEmail,
    displayName: name.trim() || cleanEmail.split('@')[0],
    role: initialRole,
    parentAdminEmail: SUPER_ADMIN_EMAIL,
    allowedDays,
    expiresAt,
    expiresAtString: formatDate(expiresAt),
    status: isUnlimited ? 'unlimited' : 'active',
    firstLoginTime: existingIndex >= 0 ? profiles[existingIndex].firstLoginTime : now,
    firstLoginString: existingIndex >= 0 ? profiles[existingIndex].firstLoginString : formatDate(now),
    lastLoginTime: now,
    lastLoginString: 'Registered by Super Admin',
    notes: notes || `Registered by Super Admin (${isUnlimited ? 'Unlimited' : allowedDays + ' days'})`,
    unreadBySuperAdmin: false,
    permissions: getDefaultPermissions(initialRole),
  };

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.unshift(profile);
  }

  persistProfiles(profiles);

  // Sync to central server
  registerUserOnServer({
    uid: profile.userId,
    email: profile.email,
    displayName: profile.displayName,
  }).then(() => {
    if (initialRole !== 'client') {
      updateUserRoleOnServer(profile.userId, initialRole).catch(() => {});
    }
  }).catch(() => {});

  return profile;
}

/**
 * Sync user access profiles to Google Drive
 */
export async function syncProfilesToDrive(
  accessToken: string,
  profiles?: UserAccessProfile[]
): Promise<void> {
  const list = profiles || getAllUserProfiles();
  try {
    const folder = await getOrCreateInvoiceFolder(accessToken);
    const data = {
      app: 'PSN Invoice',
      admin: ADMIN_EMAIL,
      lastUpdated: new Date().toISOString(),
      userCount: list.length,
      users: list,
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

/**
 * Fetch and merge user profiles from Google Drive
 */
export async function fetchProfilesFromDrive(
  accessToken: string
): Promise<UserAccessProfile[]> {
  try {
    const folder = await getOrCreateInvoiceFolder(accessToken);
    const file = await findFileInFolder(accessToken, folder.id, 'PS_Invoice_User_Access_Profiles.json');
    if (file) {
      const content = await downloadDriveFileContent(accessToken, file.id);
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        const current = getAllUserProfiles();
        const mergedMap = new Map<string, UserAccessProfile>();
        current.forEach((p) => mergedMap.set(p.userId || p.email.toLowerCase(), p));
        parsed.users.forEach((p: UserAccessProfile) => {
          const key = p.userId || p.email.toLowerCase();
          const existing = mergedMap.get(key);
          if (!existing || p.lastLoginTime > (existing.lastLoginTime || 0)) {
            mergedMap.set(key, p);
          }
        });
        const mergedList = Array.from(mergedMap.values());
        persistProfiles(mergedList);
        return mergedList;
      }
    }
  } catch (err) {
    console.warn('Could not fetch profiles from Drive:', err);
  }
  return getAllUserProfiles();
}
