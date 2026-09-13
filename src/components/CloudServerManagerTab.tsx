import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Translations } from '../i18n/translations';
import { ADMIN_EMAIL } from '../types';
import {
  CloudSyncSummary,
  MASTER_CLOUD_FOLDER_NAME,
  MASTER_DB_FILENAME,
  APP_MANIFEST_FILENAME,
  CURRENT_APP_VERSION,
  publishCloudAppUpdate,
  fetchFullAppFromCloudServer,
  AppUpdateManifest,
} from '../services/cloudServer';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  FolderSync,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Database,
  Users,
  FileText,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Tag,
  Sparkles,
} from 'lucide-react';

interface CloudServerManagerTabProps {
  user: User | null;
  driveAccessToken: string | null;
  t: Translations;
  onSyncAllToCloud: () => Promise<CloudSyncSummary | null>;
  onRestoreFromCloud: () => Promise<boolean>;
  isCloudSyncing: boolean;
  lastCloudSync: CloudSyncSummary | null;
  savedInvoicesCount: number;
  savedClientsCount: number;
  savedCompaniesCount: number;
  totalUsersCount: number;
  totalLoginsCount: number;
  onConnectGoogle: () => Promise<void>;
  showToast: (msg: string) => void;
}

export function CloudServerManagerTab({
  user,
  driveAccessToken,
  t,
  onSyncAllToCloud,
  onRestoreFromCloud,
  isCloudSyncing,
  lastCloudSync,
  savedInvoicesCount,
  savedClientsCount,
  savedCompaniesCount,
  totalUsersCount,
  totalLoginsCount,
  onConnectGoogle,
  showToast,
}: CloudServerManagerTabProps) {
  // App Update Publisher state
  const [updateVersion, setUpdateVersion] = useState<string>(CURRENT_APP_VERSION);
  const [updateTitle, setUpdateTitle] = useState<string>('PS Invoice Cloud Server Update');
  const [updateNotes, setUpdateNotes] = useState<string>(
    'Centralized cloud database and automatic app synchronization enabled via psgss91@gmail.com Google Drive.'
  );
  const [broadcastMsg, setBroadcastMsg] = useState<string>('System Cloud Server Active - psgss91@gmail.com');
  const [isPublishingUpdate, setIsPublishingUpdate] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [driveManifest, setDriveManifest] = useState<AppUpdateManifest | null>(null);

  const isConnected = !!driveAccessToken;

  // Check Drive Manifest on mount if connected
  useEffect(() => {
    if (driveAccessToken) {
      checkDriveManifest();
    }
  }, [driveAccessToken]);

  const checkDriveManifest = async () => {
    if (!driveAccessToken) return;
    setIsCheckingUpdate(true);
    try {
      const { manifest } = await fetchFullAppFromCloudServer(driveAccessToken);
      if (manifest) {
        setDriveManifest(manifest);
      }
    } catch {
      // Manifest not uploaded yet
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handlePublishUpdate = async () => {
    if (!driveAccessToken) {
      showToast('Please connect Google Drive first.');
      return;
    }
    if (!updateVersion.trim()) {
      showToast('Please enter an update version.');
      return;
    }

    setIsPublishingUpdate(true);
    try {
      const res = await publishCloudAppUpdate(driveAccessToken, {
        version: updateVersion.trim(),
        title: updateTitle.trim() || 'PS Invoice Update',
        notes: updateNotes.trim(),
        broadcast: broadcastMsg.trim(),
        currentInvoicesCount: savedInvoicesCount,
        currentClientsCount: savedClientsCount,
        currentUsersCount: totalUsersCount,
      });

      if (res.success) {
        showToast(t.cloudUpdatePublishedSuccess);
        await checkDriveManifest();
      }
    } catch (err: any) {
      console.error('Publish update failed:', err);
      showToast(err?.message || 'Failed to publish update to Drive');
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  const handleRestoreClick = async () => {
    if (!driveAccessToken) {
      showToast('Please connect Google Drive first.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to update/restore app data from psgss91@gmail.com Cloud Server? This will update local invoices, clients, and settings from the Drive master database.'
    );
    if (!confirmed) return;

    await onRestoreFromCloud();
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. CLOUD SERVER HERO STATUS BANNER */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Cloud className="w-6 h-6 text-indigo-200" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold tracking-tight">
                  {t.cloudServerAdmin}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Primary Cloud Server
                </span>
                <span className="text-[10px] font-mono bg-indigo-800/60 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-700/50">
                  v{CURRENT_APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 leading-relaxed max-w-2xl">
                {t.cloudServerDesc}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-indigo-300/80 font-mono">
                <span>📁 {MASTER_CLOUD_FOLDER_NAME}</span>
                <span>•</span>
                <span>💾 {MASTER_DB_FILENAME}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {lastCloudSync?.folderUrl && (
              <a
                href={lastCloudSync.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-800/60 hover:bg-indigo-700 text-indigo-100 text-xs font-semibold rounded-xl border border-indigo-600/50 transition-colors shadow-2xs"
                title="Open Google Drive Cloud Folder"
              >
                <FolderSync className="w-3.5 h-3.5 text-indigo-300" />
                <span>Open Drive Folder</span>
                <ExternalLink className="w-3 h-3 text-indigo-400" />
              </a>
            )}
            {!isConnected && (
              <button
                type="button"
                onClick={onConnectGoogle}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME DATA STATS IN CLOUD REPOSITORY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Invoices</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{savedInvoicesCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">In master cloud database</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Clients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{savedClientsCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Saved clients in directory</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">User Profiles</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalUsersCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">7-day access rules saved</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Login Audits</span>
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalLoginsCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Recorded user sessions</p>
        </div>
      </div>

      {/* 3. PRIMARY CLOUD ACTIONS: FULL SYNC & UPDATE APP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SYNC ALL TO CLOUD CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700">
              <ArrowUpFromLine className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">{t.syncAllToCloud}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.syncAllToCloudDesc} ({savedInvoicesCount} invoices, {savedClientsCount} clients, {totalUsersCount} users, and all settings).
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {lastCloudSync?.timestamp ? (
                <span>
                  Last synced:{' '}
                  <span className="font-semibold text-slate-600">
                    {new Date(lastCloudSync.timestamp).toLocaleTimeString()}
                  </span>
                </span>
              ) : (
                <span>Not synced yet this session</span>
              )}
            </div>

            <button
              type="button"
              id="btn-sync-all-to-cloud"
              onClick={onSyncAllToCloud}
              disabled={isCloudSyncing || !isConnected}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'Syncing to Drive...' : 'Sync All Data Now'}</span>
            </button>
          </div>
        </div>

        {/* RESTORE / UPDATE FROM CLOUD CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <ArrowDownToLine className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">{t.pullFromCloud}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.pullFromCloudDesc} Enables instant multi-device synchronization and updating from psgss91@gmail.com Drive.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              <span>Source: Google Drive Master DB</span>
            </div>

            <button
              type="button"
              id="btn-restore-from-cloud"
              onClick={handleRestoreClick}
              disabled={!isConnected}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Update App from Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. APP UPDATE & RELEASE MANIFEST CENTER */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.appUpdateCenter}</h3>
              <p className="text-xs text-slate-500">
                Publish application updates, version release notes, and configuration flags to psgss91@gmail.com Google Drive.
              </p>
            </div>
          </div>

          {driveManifest && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 block font-medium">Drive Published Version</span>
              <span className="text-xs font-bold text-indigo-700 font-mono">
                v{driveManifest.appVersion} ({new Date(driveManifest.lastUpdatedTimestamp).toLocaleDateString()})
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Release Version
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={updateVersion}
                onChange={(e) => setUpdateVersion(e.target.value)}
                placeholder="2.2.0"
                className="w-full pl-9 pr-3 py-2 bg-white text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Update Title / Headline
            </label>
            <input
              type="text"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="Cloud Server Update"
              className="w-full px-3 py-2 bg-white text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Release Notes / Change Log
            </label>
            <textarea
              rows={2}
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="Describe new features, fixes, or database updates..."
              className="w-full px-3 py-2 bg-white text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              System Broadcast Announcement (Optional)
            </label>
            <input
              type="text"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Message to display to users..."
              className="w-full px-3 py-2 bg-white text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={checkDriveManifest}
            disabled={isCheckingUpdate || !isConnected}
            className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            <span>Check Published Version on Drive</span>
          </button>

          <button
            type="button"
            id="btn-publish-app-update"
            onClick={handlePublishUpdate}
            disabled={isPublishingUpdate || !isConnected}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishingUpdate ? 'Publishing to Drive...' : t.publishAppUpdate}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
