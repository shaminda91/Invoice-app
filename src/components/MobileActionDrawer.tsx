import React from 'react';
import { Translations } from '../i18n/translations';
import {
  X,
  FileDown,
  FileSpreadsheet,
  Printer,
  Cloud,
  Save,
  Plus,
  Sparkles,
  FolderOpen,
  BarChart3,
  Building2,
  Users,
  Shield,
  Download,
  Upload,
  Languages,
  LogOut,
  LogIn,
  Clock,
  ExternalLink,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface MobileActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  language: 'en' | 'si';
  onSetLanguage: (lang: 'en' | 'si') => void;
  // User & Access
  googleUser: any;
  accessCheck: {
    allowed: boolean;
    isAdmin: boolean;
    daysRemaining: number;
    profile?: any;
  };
  onLoginGoogle: () => void;
  onSignOut: () => void;
  // Cloud & Drive
  driveAccessToken: string | null;
  isDriveSyncing: boolean;
  onOpenDriveModal: () => void;
  onOpenCloudServer: () => void;
  // Invoices & Actions
  onSaveDraft: () => void;
  onExportPDF: () => void;
  isExportingPDF: boolean;
  onExportExcel: () => void;
  onPrint: () => void;
  onNewInvoice: () => void;
  onLoadSample: () => void;
  onDownloadJSON: () => void;
  onOpenHistoryModal: () => void;
  onOpenReportsModal: () => void;
  onOpenCompaniesModal: () => void;
  onOpenClientsModal: () => void;
  onOpenAdminPanel: () => void;
  savedInvoicesCount: number;
  savedCompaniesCount: number;
  savedClientsCount: number;
}

export const MobileActionDrawer: React.FC<MobileActionDrawerProps> = ({
  isOpen,
  onClose,
  t,
  language,
  onSetLanguage,
  googleUser,
  accessCheck,
  onLoginGoogle,
  onSignOut,
  driveAccessToken,
  isDriveSyncing,
  onOpenDriveModal,
  onOpenCloudServer,
  onSaveDraft,
  onExportPDF,
  isExportingPDF,
  onExportExcel,
  onPrint,
  onNewInvoice,
  onLoadSample,
  onDownloadJSON,
  onOpenHistoryModal,
  onOpenReportsModal,
  onOpenCompaniesModal,
  onOpenClientsModal,
  onOpenAdminPanel,
  savedInvoicesCount,
  savedCompaniesCount,
  savedClientsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* DRAWER HEADER */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                PS
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {t.mobileMenuTitle}
                </h2>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                  <Smartphone className="w-3 h-3 text-emerald-600" />
                  <span>{t.phoneTabletOptimized}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DRAWER CONTENT SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-slate-100">
            {/* 1. LANGUAGE SELECTOR */}
            <div className="pb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Language / භාෂාව
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => onSetLanguage('si')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    language === 'si'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>සිංහල</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetLanguage('en')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* 2. USER STATUS OR SIGN IN */}
            <div className="pt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {googleUser ? t.loggedInAs : t.login}
              </label>
              {googleUser ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="User"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                        {(googleUser.displayName || googleUser.email || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {googleUser.displayName || 'Google User'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {googleUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                    {accessCheck.isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        <Shield className="w-3 h-3 text-indigo-600" />
                        Admin Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {accessCheck.daysRemaining} days left
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSignOut();
                      }}
                      className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLoginGoogle();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'si' ? 'Gmail මගින් පිවිසෙන්න' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>

            {/* 3. CLOUD SERVER & GOOGLE DRIVE */}
            <div className="pt-4 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Cloud Server & Storage
              </label>

              {/* Master Cloud Server */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCloudServer();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>Cloud Server</span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-mono font-bold">
                        psgss91
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-700">Master Backup & Updates</p>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* Google Drive Auto-Save */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDriveModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-950">
                      {driveAccessToken ? 'Drive Auto-Save (Active)' : t.connectGoogleDrive}
                    </div>
                    <p className="text-[11px] text-blue-700">
                      {driveAccessToken ? (isDriveSyncing ? t.driveSyncing : 'Drive Synced') : 'Auto cloud save'}
                    </p>
                  </div>
                </div>
                {driveAccessToken && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            </div>

            {/* 4. EXPORT & ACTIONS */}
            <div className="pt-4 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Export & Download
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExportPDF();
                  }}
                  disabled={isExportingPDF}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center gap-1.5 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-5 h-5" />
                  <span>{t.savePdf}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExportExcel();
                  }}
                  className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex flex-col items-center justify-center gap-1.5 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>{t.saveExcel}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSaveDraft();
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  <span>{t.saveDraft}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrint();
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>{t.print}</span>
                </button>
              </div>
            </div>

            {/* 5. DIRECTORY & HISTORY */}
            <div className="pt-4 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Data & Records
              </label>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistoryModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                  <span>{t.invoiceHistory}</span>
                </div>
                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {savedInvoicesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReportsModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-xs font-semibold text-emerald-900 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>{t.reportsTab} (7d / Month)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700">Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCompaniesModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>{t.savedCompanies}</span>
                </div>
                <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {savedCompaniesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClientsModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{t.savedClients}</span>
                </div>
                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {savedClientsCount}
                </span>
              </button>
            </div>

            {/* 6. ADMIN PANEL (For psgss91@gmail.com) */}
            {accessCheck.isAdmin && (
              <div className="pt-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Admin Management
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4" />
                    <span>{t.adminPanel}</span>
                  </div>
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                    psgss91
                  </span>
                </button>
              </div>
            )}

            {/* 7. QUICK UTILITIES */}
            <div className="pt-4 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Utilities
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewInvoice();
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 justify-center cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.newInvoice}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLoadSample();
                  }}
                  className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 justify-center cursor-pointer font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.loadSample}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDownloadJSON();
                }}
                className="w-full p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.backupJson}</span>
              </button>
            </div>
          </div>

          {/* DRAWER FOOTER */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
            PS Invoice • Responsive Phone & Tablet Edition
          </div>
        </div>
      </div>
    </div>
  );
};
