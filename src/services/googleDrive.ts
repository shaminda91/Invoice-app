import { Invoice } from '../types';
import { generateInvoicePDFBlob } from '../utils/exportUtils';

export interface DriveSyncResult {
  success: boolean;
  folderId?: string;
  folderUrl?: string;
  pdfFileUrl?: string;
  jsonFileUrl?: string;
  syncedAt: number;
  error?: string;
}

const FOLDER_NAME = 'PS Invoice - Backup';

/**
 * Searches for or creates the PS Invoice folder in Google Drive
 */
export async function getOrCreateInvoiceFolder(accessToken: string): Promise<{ id: string; webViewLink?: string }> {
  // 1. Search for existing folder
  const query = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to search Drive folder: ${searchRes.status} ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      webViewLink: searchData.files[0].webViewLink,
    };
  }

  // 2. Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'PS Invoice automated cloud storage and backup folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Drive folder: ${createRes.status} ${errText}`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    webViewLink: newFolder.webViewLink,
  };
}

/**
 * Checks if a file already exists in a given folder by name
 */
export async function findFileInFolder(
  accessToken: string,
  folderId: string,
  fileName: string
): Promise<{ id: string; webViewLink?: string } | null> {
  const query = `'${folderId}' in parents and name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,webViewLink)&pageSize=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Downloads text or json content of a file from Google Drive
 */
export async function downloadDriveFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to download file from Google Drive: ${res.status} ${err}`);
  }
  return await res.text();
}

/**
 * Uploads or updates a file in Google Drive using multipart upload
 */
export async function uploadMultipartFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  contentBlob: Blob
): Promise<{ id: string; webViewLink?: string }> {
  const existingFile = await findFileInFolder(accessToken, folderId, fileName);

  const boundary = '-------PSInvoiceDriveBoundary' + Date.now().toString(16);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };
  if (!existingFile) {
    metadata.parents = [folderId];
  }

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;

  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  // Combine metadata and file blob
  const multipartBlob = new Blob(
    [metadataPart, mediaHeader, contentBlob, closeDelimiter],
    { type: `multipart/related; boundary=${boundary}` }
  );

  let uploadUrl: string;
  let method: string;

  if (existingFile) {
    // Update existing file
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart&fields=id,name,webViewLink`;
    method = 'PATCH';
  } else {
    // Create new file
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink`;
    method = 'POST';
  }

  const res = await fetch(uploadUrl, {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBlob,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} ${err}`);
  }

  return await res.json();
}

/**
 * Synchronizes an invoice to Google Drive (JSON + PDF)
 */
export async function syncInvoiceToGoogleDrive(
  accessToken: string,
  invoice: Invoice,
  includePdf = true
): Promise<DriveSyncResult> {
  try {
    // 1. Get or create root folder
    const folder = await getOrCreateInvoiceFolder(accessToken);

    const safeNumber = (invoice.invoiceNumber || 'Invoice').replace(/[/\\?%*:|"<>]/g, '_');

    // 2. Upload structured JSON data
    const jsonBlob = new Blob([JSON.stringify(invoice, null, 2)], {
      type: 'application/json',
    });
    const jsonUpload = await uploadMultipartFile(
      accessToken,
      folder.id,
      `${safeNumber}.json`,
      'application/json',
      jsonBlob
    );

    // 3. Generate and upload PDF if possible
    let pdfUpload: { id: string; webViewLink?: string } | undefined;
    if (includePdf) {
      try {
        const pdfBlob = await generateInvoicePDFBlob(invoice);
        pdfUpload = await uploadMultipartFile(
          accessToken,
          folder.id,
          `${safeNumber}.pdf`,
          'application/pdf',
          pdfBlob
        );
      } catch (pdfErr) {
        console.warn('Could not generate PDF for Drive upload, JSON saved:', pdfErr);
      }
    }

    return {
      success: true,
      folderId: folder.id,
      folderUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      jsonFileUrl: jsonUpload.webViewLink,
      pdfFileUrl: pdfUpload?.webViewLink,
      syncedAt: Date.now(),
    };
  } catch (error: any) {
    console.error('Google Drive sync error:', error);
    return {
      success: false,
      syncedAt: Date.now(),
      error: error?.message || 'Failed to sync to Google Drive',
    };
  }
}
