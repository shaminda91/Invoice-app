import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Translations } from '../i18n/translations';
import { DriveSyncResult } from '../services/googleDrive';
import {
  Cloud,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  X,
  Smartphone,
  ShieldCheck,
  FolderSync,
  LogOut,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  isAutoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
  onConnectGoogle: () => Promise<void>;
  onDisconnectGoogle: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  lastSyncResult: DriveSyncResult | null;
  t: Translations;
}

export function GoogleDriveSyncModal({
  isOpen,
  onClose,
  user,
  accessToken,
  isAutoSaveEnabled,
  onToggleAutoSave,
  onConnectGoogle,
  onDisconnectGoogle,
  onSyncNow,
  isSyncing,
  lastSyncResult,
  t,
}: GoogleDriveSyncModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setErrorMsg(null);
      setIsConnecting(true);
      await onConnectGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Google Drive connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const isConnected = !!user && !!accessToken;

  return (
    <div
      id="google-drive-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="google-drive-modal-content"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.googleDrive} Auto-Save
              </h2>
              <p className="text-xs text-slate-500">
                {t.drivePermissionDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PHONE PERMISSION NOTICE BANNER */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-indigo-900 block">
                {t.phonePermissionNotice}
              </span>
              <p className="text-indigo-700 leading-relaxed text-[11px]">
                {t.driveFolderCreated}
              </p>
            </div>
          </div>

          {/* AUTH STATUS SECTION */}
          {!isConnected ? (
            <div className="text-center py-4 space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {t.driveNotConnected}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t.drivePermissionTitle}: Google Drive හි ඉන්වොයිසි ආරක්ෂිතව Auto Save වීම සඳහා ඔබගේ දුරකථනයෙන් හෝ බ්‍රවුසරයෙන් අවසර ලබා දෙන්න.
                </p>
              </div>

              {/* OFFICIAL SIGN IN WITH GOOGLE BUTTON (Google Identity Standards compliant) */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  id="btn-google-sign-in"
                  onClick={handleSignIn}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5 block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isConnecting ? t.connectingGoogle : t.signInWithGoogle}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Drive File Scope: Only accesses files created by PS Invoice</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* CONNECTED USER PROFILE */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {user.displayName || 'Google Account'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onDisconnectGoogle}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title={t.disconnectDrive}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.disconnectDrive}</span>
                </button>
              </div>

              {/* AUTO-SAVE TOGGLE SWITCH */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    {t.driveAutoSave}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isAutoSaveEnabled ? t.driveAutoSaveEnabled : t.driveAutoSaveDisabled}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoSaveEnabled}
                    onChange={(e) => onToggleAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* SYNC STATUS & ACTIONS */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {t.driveLastSynced}
                  </span>
                  <span className="text-slate-700 font-mono font-medium">
                    {lastSyncResult?.syncedAt
                      ? new Date(lastSyncResult.syncedAt).toLocaleTimeString()
                      : 'Not yet synced'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? t.driveSyncing : t.driveSyncNow}</span>
                  </button>

                  {lastSyncResult?.folderUrl && (
                    <a
                      href={lastSyncResult.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title={t.driveOpenFolder}
                    >
                      <FolderSync className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">{t.driveOpenFolder}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                </div>

                {/* CLOUD SERVER INFO BANNER */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-indigo-950 bg-indigo-50/60 px-3 py-2 rounded-lg border border-indigo-100/80">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-bold">{t.cloudServer}: </span>
                      <span className="font-mono text-indigo-800">psgss91@gmail.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Drive Sync Ready
                  </span>
                </div>

                {lastSyncResult?.success && lastSyncResult.pdfFileUrl && (
                  <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.driveSyncedJustNow}</span>
                    </span>
                    <a
                      href={lastSyncResult.pdfFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-emerald-900 hover:text-emerald-700 inline-flex items-center gap-0.5"
                    >
                      <span>PDF</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Folder: PS Invoice - Backup</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
