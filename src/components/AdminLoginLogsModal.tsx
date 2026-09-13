import React, { useState, useEffect } from 'react';
import { UserLoginRecord, UserAccessProfile, AccessSettings, ADMIN_EMAIL } from '../types';
import { Translations } from '../i18n/translations';
import {
  exportLoginRecordsCSV,
  createMailtoReportForAdmin,
  clearLoginRecords,
} from '../services/loginTracker';
import {
  getAccessSettings,
  saveAccessSettings,
  getAllUserProfiles,
  extendUserAccessDays,
  setUserExactAllowedDays,
  toggleUserUnlimited,
  toggleUserBlocked,
  deleteUserProfile,
} from '../services/userAccessManager';
import {
  Shield,
  X,
  Search,
  Download,
  Mail,
  Trash2,
  Users,
  Clock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Plus,
  Settings,
  Lock,
  Unlock,
  Infinity as InfinityIcon,
  UserCheck,
  Check,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { CloudServerManagerTab } from './CloudServerManagerTab';
import { CloudSyncSummary } from '../services/cloudServer';

interface AdminLoginLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: UserLoginRecord[];
  onRecordsUpdated: (updated: UserLoginRecord[]) => void;
  t: Translations;
  initialTab?: 'users' | 'logs' | 'cloud';
  user?: any;
  driveAccessToken?: string | null;
  onSyncAllToCloud?: () => Promise<CloudSyncSummary | null>;
  onRestoreFromCloud?: () => Promise<boolean>;
  isCloudSyncing?: boolean;
  lastCloudSync?: CloudSyncSummary | null;
  savedInvoicesCount?: number;
  savedClientsCount?: number;
  savedCompaniesCount?: number;
  onConnectGoogle?: () => Promise<void>;
}

export function AdminLoginLogsModal({
  isOpen,
  onClose,
  records,
  onRecordsUpdated,
  t,
  initialTab = 'users',
  user,
  driveAccessToken,
  onSyncAllToCloud,
  onRestoreFromCloud,
  isCloudSyncing = false,
  lastCloudSync = null,
  savedInvoicesCount = 0,
  savedClientsCount = 0,
  savedCompaniesCount = 0,
  onConnectGoogle,
}: AdminLoginLogsModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'cloud'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Access Settings state
  const [settings, setSettings] = useState<AccessSettings>(getAccessSettings);
  const [defaultDaysInput, setDefaultDaysInput] = useState<number>(() => getAccessSettings().defaultAllowedDays);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // User profiles state
  const [userProfiles, setUserProfiles] = useState<UserAccessProfile[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [customDaysInput, setCustomDaysInput] = useState<number>(7);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshData = () => {
    setUserProfiles(getAllUserProfiles());
    const currentSettings = getAccessSettings();
    setSettings(currentSettings);
    setDefaultDaysInput(currentSettings.defaultAllowedDays);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtered Users
  const filteredUsers = userProfiles.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered Login Logs
  const filteredLogs = records.filter(
    (r) =>
      r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.deviceInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalUsersCount = userProfiles.length;
  const activeUsersCount = userProfiles.filter(
    (u) => u.status === 'active' || u.status === 'unlimited'
  ).length;
  const expiredUsersCount = userProfiles.filter((u) => u.status === 'expired').length;
  const uniqueEmails = new Set(records.map((r) => r.userEmail.toLowerCase())).size;

  // Save default access days
  const handleSaveDefaultDays = () => {
    const updated: AccessSettings = {
      ...settings,
      defaultAllowedDays: Math.max(1, defaultDaysInput),
    };
    saveAccessSettings(updated);
    setSettings(updated);
    setSettingsSavedMsg(true);
    showToast(t.settingsSavedSuccess);
    setTimeout(() => setSettingsSavedMsg(false), 2500);
  };

  // Grant extra days
  const handleExtendDays = (userId: string, extraDays: number) => {
    extendUserAccessDays(userId, extraDays);
    refreshData();
    showToast(`${t.grant7Days} ${t.userDaysUpdatedSuccess}`);
  };

  // Set exact days
  const handleSetExactDays = (userId: string) => {
    if (customDaysInput <= 0) return;
    setUserExactAllowedDays(userId, customDaysInput);
    setEditingUserId(null);
    refreshData();
    showToast(t.userDaysUpdatedSuccess);
  };

  // Toggle unlimited
  const handleToggleUnlimited = (user: UserAccessProfile) => {
    const isCurrentlyUnlimited = user.status === 'unlimited';
    toggleUserUnlimited(user.userId, !isCurrentlyUnlimited);
    refreshData();
    showToast(t.userDaysUpdatedSuccess);
  };

  // Toggle block / expire
  const handleToggleBlock = (user: UserAccessProfile) => {
    const isCurrentlyBlocked = user.status === 'blocked';
    toggleUserBlocked(user.userId, !isCurrentlyBlocked);
    refreshData();
    showToast(t.userDaysUpdatedSuccess);
  };

  // Expire immediately
  const handleExpireImmediately = (userId: string) => {
    setUserExactAllowedDays(userId, 0);
    refreshData();
    showToast('User marked as expired');
  };

  // Delete profile
  const handleDeleteUser = (userId: string, email: string) => {
    if (window.confirm(`Delete user access record for ${email}?`)) {
      deleteUserProfile(userId);
      refreshData();
      showToast('User record deleted');
    }
  };

  // CSV & Mail handlers
  const handleExportCSV = () => {
    exportLoginRecordsCSV(records);
  };

  const handleEmailAdmin = () => {
    const mailto = createMailtoReportForAdmin(records);
    window.location.href = mailto;
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all login logs?')) {
      clearLoginRecords();
      onRecordsUpdated([]);
      showToast('Login logs cleared');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {t.adminPanel}
                </h2>
                <span className="text-[11px] font-mono bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t.adminOnlyNotice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {toastMsg && (
          <div className="bg-indigo-600 text-white text-xs px-4 py-2 text-center font-medium flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">
              {t.registeredUsers}
            </div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {totalUsersCount}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-emerald-600 font-medium">
              {t.activeUsers}
            </div>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {activeUsersCount}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-rose-600 font-medium">
              {t.expiredUsers}
            </div>
            <div className="text-lg font-extrabold text-rose-700 mt-0.5">
              {expiredUsersCount}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-indigo-600 font-medium">
              {t.totalLogins}
            </div>
            <div className="text-lg font-extrabold text-indigo-700 mt-0.5">
              {records.length}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-2 -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.userAccessControl}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-bold">
                {userProfiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'logs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t.loginHistoryTitle}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-bold">
                {records.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-cloud-server"
              onClick={() => setActiveTab('cloud')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'cloud'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>{t.cloudServer}</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Drive
              </span>
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-48 sm:w-64 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, email..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* TAB 1: USER ACCESS & ALLOWED DAYS CONTROL */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* DEFAULT ALLOWED DAYS CONFIGURATION BOX */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    {t.defaultAllowedDays}
                  </h4>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.2 rounded-full">
                    Active: {settings.defaultAllowedDays} Days
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {t.setDefaultDaysPrompt} (Default: 7 Days).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDefaultDaysInput(d)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                        defaultDaysInput === d
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={defaultDaysInput}
                    onChange={(e) => setDefaultDaysInput(parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-0.5 text-xs font-bold text-center border-l border-slate-200 focus:outline-none"
                    title="Custom days"
                  />
                  <span className="text-[11px] text-slate-400 pr-2">days</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDefaultDays}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {settingsSavedMsg ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{t.saveDefaultDays}</span>
                </button>
              </div>
            </div>

            {/* USERS TABLE */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No registered users found yet. When a user signs in via Google, they will appear here with {settings.defaultAllowedDays} days access.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">User / Email</th>
                        <th className="px-3 py-3">Registered Date</th>
                        <th className="px-3 py-3">Allowed Days</th>
                        <th className="px-3 py-3">Status / Days Remaining</th>
                        <th className="px-4 py-3 text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => {
                        const isAdminUser = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                        const now = Date.now();
                        const msLeft = user.expiresAt - now;
                        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
                        const isExpired = user.status === 'expired' || (!isAdminUser && user.status !== 'unlimited' && msLeft <= 0);

                        return (
                          <tr key={user.userId} className="hover:bg-slate-50/70 transition-colors">
                            {/* USER INFO */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {user.photoURL ? (
                                  <img
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                    {user.displayName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span className="truncate max-w-[160px] sm:max-w-xs">{user.displayName}</span>
                                    {isAdminUser && (
                                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-md border border-amber-200">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] sm:max-w-xs">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* REGISTRATION */}
                            <td className="px-3 py-3 text-slate-600 font-medium">
                              <div>{user.firstLoginString}</div>
                              <div className="text-[10px] text-slate-400">Last: {new Date(user.lastLoginTime).toLocaleDateString()}</div>
                            </td>

                            {/* ALLOWED DAYS */}
                            <td className="px-3 py-3">
                              {editingUserId === user.userId ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="3650"
                                    value={customDaysInput}
                                    onChange={(e) => setCustomDaysInput(parseInt(e.target.value) || 1)}
                                    className="w-14 px-1.5 py-0.5 border border-indigo-400 rounded text-xs font-bold text-center"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSetExactDays(user.userId)}
                                    className="p-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500"
                                    title="Save Days"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="p-1 bg-slate-200 text-slate-700 rounded text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">
                                    {isAdminUser || user.status === 'unlimited' ? '∞' : `${user.allowedDays}d`}
                                  </span>
                                  {!isAdminUser && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUserId(user.userId);
                                        setCustomDaysInput(user.allowedDays);
                                      }}
                                      className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* STATUS & DAYS REMAINING */}
                            <td className="px-3 py-3">
                              {isAdminUser || user.status === 'unlimited' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <InfinityIcon className="w-3 h-3" />
                                  <span>Unlimited</span>
                                </span>
                              ) : user.status === 'blocked' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  <Lock className="w-3 h-3" />
                                  <span>Blocked</span>
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Expired ({user.expiresAtString})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Clock className="w-3 h-3" />
                                  <span>{daysLeft} days left (till {user.expiresAtString})</span>
                                </span>
                              )}
                            </td>

                            {/* CONTROLS */}
                            <td className="px-4 py-3 text-right">
                              {isAdminUser ? (
                                <span className="text-[11px] text-slate-400 italic">Permanent Admin</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* +7 DAYS */}
                                  <button
                                    type="button"
                                    onClick={() => handleExtendDays(user.userId, 7)}
                                    className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                                    title="Add 7 Days Access"
                                  >
                                    +7d
                                  </button>

                                  {/* +30 DAYS */}
                                  <button
                                    type="button"
                                    onClick={() => handleExtendDays(user.userId, 30)}
                                    className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                                    title="Add 30 Days Access"
                                  >
                                    +30d
                                  </button>

                                  {/* UNLIMITED TOGGLE */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUnlimited(user)}
                                    className={`px-2 py-1 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                                      user.status === 'unlimited'
                                        ? 'text-indigo-800 bg-indigo-100 border-indigo-300'
                                        : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
                                    }`}
                                    title="Toggle Unlimited Access"
                                  >
                                    <InfinityIcon className="w-3 h-3 inline mr-0.5" />
                                  </button>

                                  {/* EXPIRE / BLOCK */}
                                  {!isExpired && (
                                    <button
                                      type="button"
                                      onClick={() => handleExpireImmediately(user.userId)}
                                      className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                                      title="Expire User Access Immediately"
                                    >
                                      Expire
                                    </button>
                                  )}

                                  {/* DELETE */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user.userId, user.email)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Delete User Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LOGIN ACTIVITY AUDIT */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="text-xs text-slate-500 font-medium">
                Recorded login events from Google Authentication.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEmailAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                  title={t.emailReportToAdmin}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t.emailReportToAdmin}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={records.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.exportCSV}</span>
                </button>

                {records.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title={t.clearHistory}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* LOGS LIST */}
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                {t.noLoginsYet}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                {filteredLogs.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {record.userPhoto ? (
                        <img
                          src={record.userPhoto}
                          alt={record.userName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {record.userName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {record.userName}
                          </span>
                          {record.userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {record.userEmail}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {record.deviceInfo}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-xs font-semibold text-slate-700">
                        {record.loginTimeString}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 sm:justify-end mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Logged for {ADMIN_EMAIL}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLOUD SERVER & APP UPDATES */}
        {activeTab === 'cloud' && (
          <div className="flex-1 overflow-y-auto">
            <CloudServerManagerTab
              user={user || null}
              driveAccessToken={driveAccessToken || null}
              t={t}
              onSyncAllToCloud={onSyncAllToCloud || (async () => null)}
              onRestoreFromCloud={onRestoreFromCloud || (async () => false)}
              isCloudSyncing={isCloudSyncing}
              lastCloudSync={lastCloudSync || null}
              savedInvoicesCount={savedInvoicesCount}
              savedClientsCount={savedClientsCount}
              savedCompaniesCount={savedCompaniesCount}
              totalUsersCount={totalUsersCount}
              totalLoginsCount={records.length}
              onConnectGoogle={onConnectGoogle || (async () => {})}
              showToast={showToast}
            />
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{t.adminSavedToNotice}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
