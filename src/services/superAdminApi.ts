import { UserAccessProfile, UserRole, SUPER_ADMIN_EMAIL } from '../types';

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
  newestClients: Array<{
    userId: string;
    email: string;
    name: string;
    registeredAt: string;
    role: string;
  }>;
}

const STORAGE_KEY_PROFILES = 'ps_invoice_user_profiles';

/**
 * Fetch all users registered under Super Admin from server
 */
export async function fetchServerUsers(): Promise<ServerUsersResponse | null> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) {
      console.warn('Server /api/users returned status', res.status);
      return null;
    }
    const data: ServerUsersResponse = await res.json();
    if (data && Array.isArray(data.users)) {
      // Update local storage cache
      try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(data.users));
      } catch (err) {
        console.warn('Could not cache users locally:', err);
      }
      return data;
    }
    return null;
  } catch (err) {
    console.warn('Network error fetching server users:', err);
    return null;
  }
}

/**
 * Register or update a user on the central server under Super Admin
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
  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        deviceInfo,
        browser,
        os,
      }),
    });

    if (!res.ok) {
      console.warn('Failed to register user on server:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.profile) {
      // Refresh local cache
      const cached = getCachedProfiles();
      const idx = cached.findIndex((p) => p.userId === data.profile.userId);
      if (idx >= 0) {
        cached[idx] = data.profile;
      } else {
        cached.unshift(data.profile);
      }
      try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
      } catch {}
      return data.profile;
    }
    return null;
  } catch (err) {
    console.warn('Network error registering user on server:', err);
    return null;
  }
}

/**
 * Super Admin action: change any user's role
 */
export async function updateUserRoleOnServer(
  userId: string,
  role: UserRole,
  requesterEmail: string = SUPER_ADMIN_EMAIL
): Promise<UserAccessProfile | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, requesterEmail }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user role');
    }

    const data = await res.json();
    if (data.profile) {
      // Update local storage cache
      const cached = getCachedProfiles();
      const idx = cached.findIndex((p) => p.userId === userId);
      if (idx >= 0) {
        cached[idx] = data.profile;
        try {
          localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
        } catch {}
      }
      return data.profile;
    }
    return null;
  } catch (err) {
    console.error('Error updating user role on server:', err);
    throw err;
  }
}

/**
 * Super Admin action: update user allowed days or status
 */
export async function updateUserAccessOnServer(
  userId: string,
  params: {
    allowedDays?: number;
    status?: 'pending' | 'active' | 'expired' | 'blocked' | 'unlimited';
    notes?: string;
  }
): Promise<UserAccessProfile | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update access');
    }

    const data = await res.json();
    if (data.profile) {
      const cached = getCachedProfiles();
      const idx = cached.findIndex((p) => p.userId === userId);
      if (idx >= 0) {
        cached[idx] = data.profile;
        try {
          localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
        } catch {}
      }
      return data.profile;
    }
    return null;
  } catch (err) {
    console.error('Error updating user access on server:', err);
    throw err;
  }
}

/**
 * Super Admin action: approve and activate a user's access
 */
export async function approveUserOnServer(
  userId: string,
  allowedDays: number = 30,
  role?: UserRole
): Promise<UserAccessProfile | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedDays, role }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to approve user');
    }

    const data = await res.json();
    if (data.profile) {
      const cached = getCachedProfiles();
      const idx = cached.findIndex((p) => p.userId === userId);
      if (idx >= 0) {
        cached[idx] = data.profile;
      } else {
        cached.unshift(data.profile);
      }
      try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
      } catch {}
      return data.profile;
    }
    return null;
  } catch (err) {
    console.error('Error approving user on server:', err);
    throw err;
  }
}

/**
 * Super Admin action: delete a user from server
 */
export async function deleteUserOnServer(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }
    const cached = getCachedProfiles().filter((p) => p.userId !== userId);
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(cached));
    } catch {}
    return true;
  } catch (err) {
    console.error('Error deleting user on server:', err);
    throw err;
  }
}

/**
 * Super Admin action: mark all registrations as read
 */
export async function markRegistrationsAsReadOnServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/users/mark-read', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get server system status
 */
export async function getServerSystemStatus(): Promise<SystemStatusResponse | null> {
  try {
    const res = await fetch('/api/system/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getCachedProfiles(): UserAccessProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
