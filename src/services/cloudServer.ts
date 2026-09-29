import { Invoice, SavedClient, SavedCompany, UserLoginRecord, UserAccessProfile, AccessSettings, ADMIN_EMAIL } from '../types';
import { AppLanguage } from '../i18n/translations';
import { uploadMultipartFile, findFileInFolder, downloadDriveFileContent } from './googleDrive';

export const MASTER_CLOUD_FOLDER_NAME = 'PS Invoice - Cloud Server (psgss91@gmail.com)';
export const MASTER_DB_FILENAME = 'ps_invoice_cloud_master_database.json';
export const APP_MANIFEST_FILENAME = 'ps_invoice_app_manifest.json';
export const CURRENT_APP_VERSION = '2.2.0';

export interface AppUpdateManifest {
  appVersion: string;
  lastUpdated: string;
  lastUpdatedTimestamp: number;
  serverAdmin: string; // psgss91@gmail.com
  updateTitle: string;
  updateNotes: string;
  systemBroadcast?: string;
  schemaVersion: number;
  totalInvoices: number;
  totalClients: number;
  totalUsers: number;
}

export interface FullAppDataSnapshot {
  metadata: {
    app: string;
    version: string;
    exportedAt: number;
    exportedAtString: string;
    cloudServerAdmin: string; // psgss91@gmail.com
    systemStatus: 'healthy' | 'updated';
    schemaVersion: number;
  };
  invoices: Invoice[];
  currentInvoice?: Invoice;
  clients: SavedClient[];
  companies: SavedCompany[];
  accessSettings: AccessSettings;
  userProfiles: UserAccessProfile[];
  loginRecords: UserLoginRecord[];
  language?: AppLanguage;
}

export interface CloudSyncSummary {
  success: boolean;
  timestamp: number;
  folderId?: string;
  folderUrl?: string;
  masterDbFileUrl?: string;
  manifestFileUrl?: string;
  invoicesCount: number;
  clientsCount: number;
  usersCount: number;
  error?: string;
}

const STORAGE_KEY_CLOUD_META = 'ps_invoice_cloud_server_sync_meta';

/**
 * Get or create the master Google Drive folder for psgss91@gmail.com
 */
export async function getOrCreateCloudServerFolder(
  accessToken: string
): Promise<{ id: string; webViewLink?: string }> {
  // 1. Search for existing folder
  const query = `name = '${MASTER_CLOUD_FOLDER_NAME.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Cloud Server folder search failed: ${searchRes.status} ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      webViewLink: searchData.files[0].webViewLink,
    };
  }

  // 2. Create master folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: MASTER_CLOUD_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'PS Invoice Master Cloud Storage Server & Central Database for psgss91@gmail.com',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Cloud Server folder: ${createRes.status} ${errText}`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    webViewLink: newFolder.webViewLink,
  };
}

/**
 * Sync entire application database to psgss91@gmail.com Cloud Server folder on Google Drive
 */
export async function syncFullAppToCloudServer(
  accessToken: string,
  snapshot: FullAppDataSnapshot
): Promise<CloudSyncSummary> {
  const now = Date.now();
  try {
    const folder = await getOrCreateCloudServerFolder(accessToken);

    // 1. Upload Master Database JSON
    const masterDbBlob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });

    const masterDbUpload = await uploadMultipartFile(
      accessToken,
      folder.id,
      MASTER_DB_FILENAME,
      'application/json',
      masterDbBlob
    );

    // 2. Upload / Update App Manifest for version tracking and updates
    const manifestData: AppUpdateManifest = {
      appVersion: snapshot.metadata.version || CURRENT_APP_VERSION,
      lastUpdated: new Date(now).toISOString(),
      lastUpdatedTimestamp: now,
      serverAdmin: ADMIN_EMAIL,
      updateTitle: 'PS Invoice Master Database Sync',
      updateNotes: `Automated snapshot containing ${snapshot.invoices.length} invoices, ${snapshot.clients.length} clients, and ${snapshot.userProfiles.length} registered access profiles.`,
      schemaVersion: snapshot.metadata.schemaVersion || 2,
      totalInvoices: snapshot.invoices.length,
      totalClients: snapshot.clients.length,
      totalUsers: snapshot.userProfiles.length,
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
      type: 'application/json',
    });

    const manifestUpload = await uploadMultipartFile(
      accessToken,
      folder.id,
      APP_MANIFEST_FILENAME,
      'application/json',
      manifestBlob
    );

    const summary: CloudSyncSummary = {
      success: true,
      timestamp: now,
      folderId: folder.id,
      folderUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      masterDbFileUrl: masterDbUpload.webViewLink,
      manifestFileUrl: manifestUpload.webViewLink,
      invoicesCount: snapshot.invoices.length,
      clientsCount: snapshot.clients.length,
      usersCount: snapshot.userProfiles.length,
    };

    // Store in local storage for instant access
    try {
      localStorage.setItem(STORAGE_KEY_CLOUD_META, JSON.stringify(summary));
    } catch {
      // ignore
    }

    return summary;
  } catch (err: any) {
    console.error('Cloud Server full sync error:', err);
    const failSummary: CloudSyncSummary = {
      success: false,
      timestamp: now,
      invoicesCount: snapshot.invoices.length,
      clientsCount: snapshot.clients.length,
      usersCount: snapshot.userProfiles.length,
      error: err?.message || 'Failed to sync to Cloud Server',
    };
    return failSummary;
  }
}

/**
 * Fetch and download full application database from psgss91@gmail.com Cloud Server
 */
export async function fetchFullAppFromCloudServer(
  accessToken: string
): Promise<{ snapshot: FullAppDataSnapshot; manifest?: AppUpdateManifest }> {
  const folder = await getOrCreateCloudServerFolder(accessToken);

  // 1. Locate Master DB File
  const file = await findFileInFolder(accessToken, folder.id, MASTER_DB_FILENAME);
  if (!file) {
    throw new Error(`Master database file (${MASTER_DB_FILENAME}) was not found in Cloud Server folder on Google Drive.`);
  }

  // 2. Download content
  const content = await downloadDriveFileContent(accessToken, file.id);
  const parsedSnapshot: FullAppDataSnapshot = JSON.parse(content);

  // 3. Optionally fetch manifest
  let manifest: AppUpdateManifest | undefined;
  try {
    const manifestFile = await findFileInFolder(accessToken, folder.id, APP_MANIFEST_FILENAME);
    if (manifestFile) {
      const manifestRaw = await downloadDriveFileContent(accessToken, manifestFile.id);
      manifest = JSON.parse(manifestRaw);
    }
  } catch (mErr) {
    console.warn('Could not fetch manifest:', mErr);
  }

  return { snapshot: parsedSnapshot, manifest };
}

/**
 * Publish a new application update manifest to psgss91@gmail.com Google Drive
 */
export async function publishCloudAppUpdate(
  accessToken: string,
  update: {
    version: string;
    title: string;
    notes: string;
    broadcast?: string;
    currentInvoicesCount?: number;
    currentClientsCount?: number;
    currentUsersCount?: number;
  }
): Promise<{ success: boolean; fileUrl?: string; timestamp: number }> {
  const now = Date.now();
  const folder = await getOrCreateCloudServerFolder(accessToken);

  const manifestData: AppUpdateManifest = {
    appVersion: update.version,
    lastUpdated: new Date(now).toISOString(),
    lastUpdatedTimestamp: now,
    serverAdmin: ADMIN_EMAIL,
    updateTitle: update.title,
    updateNotes: update.notes,
    systemBroadcast: update.broadcast,
    schemaVersion: 2,
    totalInvoices: update.currentInvoicesCount || 0,
    totalClients: update.currentClientsCount || 0,
    totalUsers: update.currentUsersCount || 0,
  };

  const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
    type: 'application/json',
  });

  const uploadResult = await uploadMultipartFile(
    accessToken,
    folder.id,
    APP_MANIFEST_FILENAME,
    'application/json',
    manifestBlob
  );

  return {
    success: true,
    fileUrl: uploadResult.webViewLink,
    timestamp: now,
  };
}

/**
 * Retrieve cached cloud sync metadata
 */
export function getStoredCloudSyncMeta(): CloudSyncSummary | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOUD_META);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
