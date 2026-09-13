import { User } from 'firebase/auth';
import { UserLoginRecord, ADMIN_EMAIL } from '../types';
import { uploadMultipartFile, getOrCreateInvoiceFolder } from './googleDrive';

const STORAGE_KEY_LOGINS = 'ps_invoice_user_logins';

/**
 * Detect client browser, OS, and device details
 */
function getClientEnvironment(): { browser: string; os: string; fullDevice: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  } else if (ua.includes('Win')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const fullDevice = `${os} (${isMobile ? 'Mobile' : 'Desktop'}, ${browser}, ${screenRes})`;

  return { browser, os, fullDevice };
}

/**
 * Retrieve all locally recorded login events
 */
export function getLoginRecords(): UserLoginRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGINS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse login records:', err);
    return [];
  }
}

/**
 * Save records to localStorage
 */
function persistRecords(records: UserLoginRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGINS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to persist login records:', err);
  }
}

/**
 * Records a user login event for psgss91@gmail.com
 */
export async function recordUserLogin(
  user: User,
  driveAccessToken?: string | null
): Promise<UserLoginRecord> {
  const now = Date.now();
  const timeStr = new Date(now).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
  const env = getClientEnvironment();

  const newRecord: UserLoginRecord = {
    id: 'login_' + now + '_' + Math.random().toString(36).substring(2, 7),
    userEmail: user.email || 'No Email Provided',
    userName: user.displayName || 'Google User',
    userPhoto: user.photoURL || undefined,
    userId: user.uid,
    loginTime: now,
    loginTimeString: timeStr,
    deviceInfo: env.fullDevice,
    browser: env.browser,
    os: env.os,
    targetAdminEmail: ADMIN_EMAIL,
    syncStatus: 'local',
  };

  // 1. Save locally
  const currentRecords = getLoginRecords();
  const updatedRecords = [newRecord, ...currentRecords.slice(0, 199)]; // retain last 200 logins
  persistRecords(updatedRecords);

  // 2. If Drive token available, push updated login audit log to Google Drive
  if (driveAccessToken) {
    try {
      const folder = await getOrCreateInvoiceFolder(driveAccessToken);
      const auditLogData = {
        app: 'PS Invoice',
        admin: ADMIN_EMAIL,
        lastUpdated: new Date().toISOString(),
        totalLoginsRecorded: updatedRecords.length,
        logins: updatedRecords,
      };

      const auditBlob = new Blob([JSON.stringify(auditLogData, null, 2)], {
        type: 'application/json',
      });

      await uploadMultipartFile(
        driveAccessToken,
        folder.id,
        `PS_Invoice_User_Logins_psgss91.json`,
        'application/json',
        auditBlob
      );

      newRecord.syncStatus = 'synced_to_drive';
      updatedRecords[0].syncStatus = 'synced_to_drive';
      persistRecords(updatedRecords);
    } catch (driveErr) {
      console.warn('Could not sync login audit log to Google Drive:', driveErr);
    }
  }

  return newRecord;
}

/**
 * Clear login records
 */
export function clearLoginRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGINS);
  } catch (err) {
    console.error('Failed to clear login records:', err);
  }
}

/**
 * Generate a mailto link to send login details summary to psgss91@gmail.com
 */
export function createMailtoReportForAdmin(records?: UserLoginRecord[]): string {
  const list = records || getLoginRecords();
  const subject = encodeURIComponent(`[PS Invoice] User Login Activity Report (${list.length} Logins)`);

  let bodyText = `PS INVOICE USER LOGIN AUDIT REPORT\n`;
  bodyText += `Recipient / Admin: ${ADMIN_EMAIL}\n`;
  bodyText += `Generated: ${new Date().toLocaleString()}\n`;
  bodyText += `Total Logins Recorded: ${list.length}\n`;
  bodyText += `--------------------------------------------------\n\n`;

  list.slice(0, 50).forEach((rec, idx) => {
    bodyText += `${idx + 1}. User: ${rec.userName} (${rec.userEmail})\n`;
    bodyText += `   Time: ${rec.loginTimeString}\n`;
    bodyText += `   Device/Browser: ${rec.deviceInfo}\n`;
    bodyText += `   Google UID: ${rec.userId}\n`;
    bodyText += `   Sync Status: ${rec.syncStatus || 'local'}\n\n`;
  });

  bodyText += `--------------------------------------------------\n`;
  bodyText += `This report was automatically compiled by PS Invoice System.`;

  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}

/**
 * Export login records as CSV
 */
export function exportLoginRecordsCSV(records?: UserLoginRecord[]): void {
  const list = records || getLoginRecords();
  if (list.length === 0) return;

  const headers = ['User Name', 'Email', 'Login Time', 'Browser', 'OS', 'Full Device', 'UID', 'Admin Email', 'Status'];
  const rows = list.map((r) => [
    `"${r.userName.replace(/"/g, '""')}"`,
    `"${r.userEmail.replace(/"/g, '""')}"`,
    `"${r.loginTimeString.replace(/"/g, '""')}"`,
    `"${r.browser}"`,
    `"${r.os}"`,
    `"${r.deviceInfo.replace(/"/g, '""')}"`,
    `"${r.userId}"`,
    `"${r.targetAdminEmail}"`,
    `"${r.syncStatus || 'local'}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ps_invoice_user_logins_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
