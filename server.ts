import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const SUPER_ADMIN_EMAIL = 'psgss91@gmail.com';
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'ps_super_admin_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserPermissions {
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canExportPDF: boolean;
  canManageClients: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

function getDefaultPermissions(role: string): UserPermissions {
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

interface ServerDatabase {
  superAdminEmail: string;
  defaultAllowedDays: number;
  users: Array<{
    userId: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: string;
    parentAdminEmail: string;
    firstLoginTime: number;
    firstLoginString: string;
    allowedDays: number;
    expiresAt: number;
    expiresAtString: string;
    status: 'active' | 'expired' | 'blocked' | 'unlimited';
    lastLoginTime: number;
    lastLoginString: string;
    notes?: string;
    unreadBySuperAdmin?: boolean;
    deviceInfo?: string;
    browser?: string;
    os?: string;
    permissions?: UserPermissions;
  }>;
}

function loadDatabase(): ServerDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.users)) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error loading database file:', err);
  }

  // Initial seed with Super Admin
  const now = Date.now();
  const initialDb: ServerDatabase = {
    superAdminEmail: SUPER_ADMIN_EMAIL,
    defaultAllowedDays: 7,
    users: [
      {
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
      },
    ],
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: ServerDatabase): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Get all users registered under Super Admin
app.get('/api/users', (req, res) => {
  const db = loadDatabase();
  const unreadCount = db.users.filter(
    (u) => u.unreadBySuperAdmin && u.email.toLowerCase() !== SUPER_ADMIN_EMAIL
  ).length;

  res.json({
    superAdmin: SUPER_ADMIN_EMAIL,
    defaultAllowedDays: db.defaultAllowedDays || 7,
    totalUsers: db.users.length,
    unreadCount,
    users: db.users,
  });
});

// 2. Register or update a user (called when any user logs in)
app.post('/api/users/register', (req, res) => {
  const {
    userId,
    email,
    displayName,
    photoURL,
    deviceInfo,
    browser,
    os,
  } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
  const db = loadDatabase();
  const now = Date.now();

  const existingIndex = db.users.findIndex(
    (u) =>
      (userId && u.userId === userId) ||
      u.email.toLowerCase() === cleanEmail
  );

  let profile: ServerDatabase['users'][0];

  if (existingIndex >= 0) {
    const existing = db.users[existingIndex];
    const role = isSuperAdmin ? 'super_admin' : existing.role || 'client';
    const status = isSuperAdmin
      ? 'unlimited'
      : existing.status === 'blocked'
      ? 'blocked'
      : existing.status === 'unlimited'
      ? 'unlimited'
      : now > existing.expiresAt
      ? 'expired'
      : existing.status;

    profile = {
      ...existing,
      userId: userId || existing.userId,
      email: cleanEmail,
      displayName: displayName || existing.displayName || cleanEmail.split('@')[0],
      photoURL: photoURL || existing.photoURL,
      role,
      parentAdminEmail: SUPER_ADMIN_EMAIL,
      lastLoginTime: now,
      lastLoginString: new Date(now).toLocaleString(),
      status,
      deviceInfo: deviceInfo || existing.deviceInfo,
      browser: browser || existing.browser,
      os: os || existing.os,
      permissions: existing.permissions || getDefaultPermissions(role),
    };

    db.users[existingIndex] = profile;
  } else {
    // Brand new user registration under Super Admin!
    const role = isSuperAdmin ? 'super_admin' : 'client';
    const allowedDays = isSuperAdmin ? 99999 : (db.defaultAllowedDays || 7);
    const expiresAt = isSuperAdmin
      ? now + 36500 * 86400000
      : now + allowedDays * 86400000;

    profile = {
      userId: userId || `user_${now}_${Math.random().toString(36).substring(2, 8)}`,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      photoURL,
      role,
      parentAdminEmail: SUPER_ADMIN_EMAIL, // Registered under Super Admin!
      firstLoginTime: now,
      firstLoginString: new Date(now).toLocaleDateString(),
      allowedDays,
      expiresAt,
      expiresAtString: new Date(expiresAt).toLocaleDateString(),
      status: isSuperAdmin ? 'unlimited' : 'active',
      lastLoginTime: now,
      lastLoginString: new Date(now).toLocaleString(),
      notes: isSuperAdmin
        ? 'Root Super Administrator & System Owner'
        : `Registered under Super Admin (${allowedDays} days trial)`,
      unreadBySuperAdmin: !isSuperAdmin, // Notify Super Admin of new client!
      deviceInfo,
      browser,
      os,
      permissions: getDefaultPermissions(role),
    };

    // Keep Super Admin at the top, unshift new user right under
    if (isSuperAdmin) {
      db.users.unshift(profile);
    } else {
      db.users.push(profile);
    }
  }

  saveDatabase(db);
  res.json({ success: true, profile, isSuperAdmin });
});

// 3. Super Admin changes any user's role
app.put('/api/users/:userId/role', (req, res) => {
  const { userId } = req.params;
  const { role, requesterEmail } = req.body;

  const validRoles = ['super_admin', 'admin', 'manager', 'editor', 'client', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role: ${role}` });
  }

  const db = loadDatabase();
  const index = db.users.findIndex((u) => u.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.users[index];

  // Prevent demoting the root Super Admin psgss91@gmail.com
  if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && role !== 'super_admin') {
    return res.status(403).json({ error: 'Root Super Admin role cannot be modified' });
  }

  const updated = {
    ...user,
    role,
    permissions: getDefaultPermissions(role),
    notes: `${user.notes || ''} [Role updated to ${role} on ${new Date().toLocaleDateString()}]`.trim(),
  };

  db.users[index] = updated;
  saveDatabase(db);

  res.json({ success: true, profile: updated });
});

// 4. Update user access days or status
app.put('/api/users/:userId/access', (req, res) => {
  const { userId } = req.params;
  const { allowedDays, status, notes } = req.body;

  const db = loadDatabase();
  const index = db.users.findIndex((u) => u.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.users[index];
  const now = Date.now();

  let newAllowedDays = user.allowedDays;
  let newExpiresAt = user.expiresAt;
  let newStatus = status || user.status;

  if (typeof allowedDays === 'number') {
    newAllowedDays = allowedDays;
    newExpiresAt = user.firstLoginTime + allowedDays * 86400000;
    if (newExpiresAt <= now && newStatus !== 'unlimited' && newStatus !== 'blocked') {
      newStatus = 'expired';
    } else if (newExpiresAt > now && newStatus === 'expired') {
      newStatus = 'active';
    }
  }

  const updated = {
    ...user,
    allowedDays: newAllowedDays,
    expiresAt: newExpiresAt,
    expiresAtString: new Date(newExpiresAt).toLocaleDateString(),
    status: newStatus,
    notes: notes !== undefined ? notes : user.notes,
  };

  db.users[index] = updated;
  saveDatabase(db);

  res.json({ success: true, profile: updated });
});

// 5. Delete a user profile (Super Admin action)
app.delete('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDatabase();

  const user = db.users.find((u) => u.userId === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Root Super Admin cannot be deleted' });
  }

  db.users = db.users.filter((u) => u.userId !== userId);
  saveDatabase(db);

  res.json({ success: true, deletedUserId: userId });
});

// 6. Super Admin marks all client registrations as read
app.post('/api/users/mark-read', (req, res) => {
  const db = loadDatabase();
  db.users.forEach((u) => {
    u.unreadBySuperAdmin = false;
  });
  saveDatabase(db);
  res.json({ success: true, unreadCount: 0 });
});

// 7. System status & Super Admin summary
app.get('/api/system/status', (req, res) => {
  const db = loadDatabase();
  const clients = db.users.filter((u) => u.userId?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase());
  const unread = clients.filter((c) => c.unreadBySuperAdmin);

  res.json({
    status: 'online',
    superAdminEmail: SUPER_ADMIN_EMAIL,
    totalAccounts: db.users.length,
    registeredClients: clients.length,
    unreadRegistrations: unread.length,
    newestClients: unread.map((c) => ({
      userId: c.userId,
      email: c.email,
      name: c.displayName,
      registeredAt: c.firstLoginString,
      role: c.role,
    })),
  });
});

// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PSN Invoice server running on http://0.0.0.0:${PORT}`);
    console.log(`Super Admin: ${SUPER_ADMIN_EMAIL}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
