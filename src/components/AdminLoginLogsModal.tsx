import React, { useState, useEffect } from 'react';
import {
  UserLoginRecord,
  UserAccessProfile,
  AccessSettings,
  ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
  UserRole,
} from '../types';
import { Translations } from '../i18n/translations';
import {
  exportLoginRecordsCSV,
  createMailtoReportForAdmin,
  clearLoginRecords,
  fetchLoginRecordsFromDrive,
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
  registerNewClientManually,
  syncProfilesToDrive,
  fetchProfilesFromDrive,
  changeUserRole,
  approveUserAccess,
  getRoleBadgeClass,
  getRoleLabel,
} from '../services/userAccessManager';
import {
  fetchServerUsers,
  markRegistrationsAsReadOnServer,
  updateUserAccessOnServer,
} from '../services/superAdminApi';
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
  Crown,
  ChevronDown,
  Bell,
  Filter,
  Hourglass,
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
  initialRoleFilter?: string;
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
  initialRoleFilter,
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

  // New Client Registration Form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientRole, setNewClientRole] = useState<UserRole>('client');
  const [newClientDays, setNewClientDays] = useState(7);
  const [newClientNotes, setNewClientNotes] = useState('');
  const [isDriveSyncingUsers, setIsDriveSyncingUsers] = useState(false);

  // Role filtering & updating state
  const [roleFilter, setRoleFilter] = useState<string>(initialRoleFilter || 'all');
  const [isUpdatingRoleId, setIsUpdatingRoleId] = useState<string | null>(null);

  const refreshData = () => {
    setUserProfiles(getAllUserProfiles());
    const currentSettings = getAccessSettings();
    setSettings(currentSettings);
    setDefaultDaysInput(currentSettings.defaultAllowedDays);
    setNewClientDays(currentSettings.defaultAllowedDays);

    // Also fetch fresh users from central server
    fetchServerUsers().then((res) => {
      if (res && res.users && res.users.length > 0) {
        setUserProfiles(res.users);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialRoleFilter) {
        setRoleFilter(initialRoleFilter);
      }
      // Auto-refresh data every 3 seconds while modal is open so approval requests appear live
      const liveInterval = setInterval(refreshData, 3000);

      // Auto-fetch from Drive if token is available
      if (driveAccessToken) {
        fetchProfilesFromDrive(driveAccessToken).then((profiles) => {
          if (profiles && profiles.length > 0) {
            setUserProfiles(profiles);
          }
        }).catch(() => {});
        fetchLoginRecordsFromDrive(driveAccessToken).then((logs) => {
          if (logs && logs.length > 0) {
            onRecordsUpdated(logs);
          }
        }).catch(() => {});
      }

      return () => clearInterval(liveInterval);
    }
  }, [isOpen, initialTab, initialRoleFilter, driveAccessToken]);

  const handleRegisterClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientEmail.trim()) {
      showToast('Please enter client email address');
      return;
    }
    const profile = registerNewClientManually(
      newClientEmail,
      newClientName,
      newClientDays,
      newClientNotes,
      newClientRole
    );
    if (driveAccessToken) {
      syncProfilesToDrive(driveAccessToken).catch(() => {});
    }
    showToast(`${profile.email} - ${t.clientRegisteredSuccess} (${newClientRole})`);
    setNewClientEmail('');
    setNewClientName('');
    setNewClientNotes('');
    setNewClientRole('client');
    setShowRegisterForm(false);
    refreshData();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, displayName: string) => {
    setIsUpdatingRoleId(userId);
    try {
      const updated = await changeUserRole(userId, newRole);
      if (updated) {
        setUserProfiles((prev) =>
          prev.map((u) => (u.userId === userId ? updated : u))
        );
        showToast(`${displayName} - ${t.roleUpdatedSuccess} (${newRole})`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update role');
    } finally {
      setIsUpdatingRoleId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markRegistrationsAsReadOnServer();
      setUserProfiles((prev) =>
        prev.map((u) => ({ ...u, unreadBySuperAdmin: false }))
      );
      showToast('All new registrations marked as seen');
    } catch {}
  };

  const handleDriveSyncUsers = async () => {
    if (!driveAccessToken) {
      showToast(t.driveNotConnected);
      if (onConnectGoogle) onConnectGoogle();
      return;
    }
    setIsDriveSyncingUsers(true);
    try {
      const fetchedProfiles = await fetchProfilesFromDrive(driveAccessToken);
      const fetchedLogs = await fetchLoginRecordsFromDrive(driveAccessToken);
      setUserProfiles(fetchedProfiles);
      onRecordsUpdated(fetchedLogs);
      showToast('Profiles and login records synchronized with Google Drive');
    } catch (err: any) {
      showToast(err?.message || 'Failed to sync with Google Drive');
    } finally {
      setIsDriveSyncingUsers(false);
    }
  };

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApproveUser = async (userId: string, days: number = 30) => {
    try {
      const updated = await approveUserAccess(userId, days);
      if (updated) {
        setUserProfiles((prev) =>
          prev.map((u) => (u.userId === userId ? updated : u))
        );
        showToast(`${updated.displayName} - ${days >= 9999 ? 'Unlimited' : days + 'd'} access approved!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve user');
    }
  };

  // Filtered Users with Search Term and Role Filter
  const filteredUsers = userProfiles.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'pending'
        ? u.status === 'pending'
        : (u.role || 'client') === roleFilter;

    return matchesSearch && matchesRole;
  });

  const unreadRegistrations = userProfiles.filter(
    (u) => u.unreadBySuperAdmin && u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()
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
  const pendingUsersCount = userProfiles.filter((u) => u.status === 'pending').length;
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

  const userEmail = (user?.email || '').trim().toLowerCase();
  const isAuthorizedSuperAdmin =
    userEmail === ADMIN_EMAIL.toLowerCase() ||
    userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  // If user is not Super Admin (psgss91@gmail.com), block access completely
  if (!isAuthorizedSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              පරිපාලක ප්‍රවේශය සීමා කර ඇත (Access Denied)
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              මෙම Admin Control Panel එකට පිවිසිය හැක්කේ ප්‍රධාන පරිපාලක <strong>{SUPER_ADMIN_EMAIL}</strong> ගිණුමට පමණි.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              ඔබ ලොග් වී ඇති ගිණුම: <span className="font-mono font-bold text-slate-800">{userEmail || 'Guest / Standard User'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md font-black shrink-0">
              <Crown className="w-5 h-5 text-amber-950 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>{t.superAdminTitle}</span>
                </h2>
                <span className="text-[11px] font-mono bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black border border-amber-300 shadow-2xs flex items-center gap-1">
                  👑 {SUPER_ADMIN_EMAIL}
                </span>
                <span className="text-[10px] font-bold bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/30">
                  {t.accountsUnderSuperAdmin}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Super Admin යටතේ register වන සියලුම ගිණුම් කළමනාකරණය සහ භූමිකාව (Role) වෙනස් කිරීම.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data from Server"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">
              {t.registeredUsers}
            </div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {totalUsersCount}
            </div>
          </div>

          <div className={`border rounded-xl p-3 shadow-2xs cursor-pointer transition-all ${
            pendingUsersCount > 0
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-white border-slate-200'
          }`}
            onClick={() => {
              setActiveTab('users');
              setRoleFilter('pending');
            }}
            title="Click to view users waiting for approval"
          >
            <div className="text-[11px] text-amber-800 font-bold flex items-center justify-between">
              <span>Pending Approval</span>
              {pendingUsersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-lg font-black text-amber-700 mt-0.5 flex items-center gap-1">
              <span>{pendingUsersCount}</span>
              {pendingUsersCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full">
                  Needs Approval
                </span>
              )}
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
            {/* UNREAD NEW CLIENT REGISTRATION ALERT BANNER */}
            {unreadRegistrations.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-pulse">
                    <Bell className="w-5 h-5 fill-amber-100" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-2 flex-wrap">
                      <span>{t.newClientAlertTitle} ({unreadRegistrations.length})</span>
                      <span className="text-[10px] bg-rose-500 text-white px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                        New
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      {unreadRegistrations.map((u) => u.displayName || u.email).join(', ')} - ඔබගේ Super Admin ගිණුම යටතේ ලියාපදිංචි වී ඇත.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Mark All Seen
                </button>
              </div>
            )}

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

            {/* CLIENT REGISTRATION STATUS & POLICY MESSAGE BOX (සේවාලාභී ලියාපදිංචි පණිවිඩය) */}
            <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-emerald-950">
                      {t.clientRegisterMessage}
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                      {userProfiles.filter((u) => u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()).length} {t.registeredClientsCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                    {t.clientRegistrationNotice}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm((prev) => !prev)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.registerNewClient}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDriveSyncUsers}
                    disabled={isDriveSyncingUsers}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title={t.refreshFromDrive}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDriveSyncingUsers ? 'animate-spin text-emerald-600' : ''}`} />
                    <span className="hidden sm:inline">{t.refreshFromDrive}</span>
                  </button>
                </div>
              </div>

              {/* QUICK CLIENT REGISTRATION FORM (COLLAPSIBLE) */}
              {showRegisterForm && (
                <form
                  onSubmit={handleRegisterClientSubmit}
                  className="bg-white border border-emerald-300 rounded-xl p-3.5 space-y-3 shadow-xs animate-in fade-in duration-150"
                >
                  <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <span>{t.registerNewClient} (Pre-approve Client Access under Super Admin)</span>
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Client Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="client@gmail.com"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Client Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kasun Perera"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Assigned Role (භූමිකාව)
                      </label>
                      <select
                        value={newClientRole}
                        onChange={(e) => setNewClientRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-bold"
                      >
                        <option value="client">👤 User / Client (සේවාලාභියා)</option>
                        <option value="editor">✍️ Editor (සකසන්නා)</option>
                        <option value="manager">💼 Manager (කළමනාකරු)</option>
                        <option value="viewer">👁️ Viewer (නරඹන්නා)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Trial Access Period
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[7, 14, 30, 90, 9999].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setNewClientDays(days)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                              newClientDays === days
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {days >= 9999 ? 'Unlimited' : `${days}d`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Notes / Client Info
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Retail client"
                        value={newClientNotes}
                        onChange={(e) => setNewClientNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      {t.registerNewClient}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ROLE FILTER QUICK SELECTOR BUTTONS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All Users', count: userProfiles.length },
                { id: 'pending', label: '⏳ Pending Approval', count: pendingUsersCount, isAlert: pendingUsersCount > 0 },
                { id: 'super_admin', label: '👑 Super Admin', count: userProfiles.filter((u) => u.role === 'super_admin' || u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()).length },
                { id: 'admin', label: '🛡️ Admin', count: userProfiles.filter((u) => u.role === 'admin').length },
                { id: 'manager', label: '💼 Manager', count: userProfiles.filter((u) => u.role === 'manager').length },
                { id: 'editor', label: '✍️ Editor', count: userProfiles.filter((u) => u.role === 'editor').length },
                { id: 'client', label: '👤 Client', count: userProfiles.filter((u) => (!u.role || u.role === 'client') && u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()).length },
                { id: 'viewer', label: '👁️ Viewer', count: userProfiles.filter((u) => u.role === 'viewer').length },
              ].map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    roleFilter === rf.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : (rf as any).isAlert
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{rf.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    roleFilter === rf.id
                      ? 'bg-white/20 text-white'
                      : (rf as any).isAlert
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {rf.count}
                  </span>
                </button>
              ))}
            </div>

            {/* PENDING APPROVAL ALERT BANNER */}
            {pendingUsersCount > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <Hourglass className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span>අනුමැතිය බලාපොරොත්තුවෙන් සිටින නව පරිශීලකයින්: {pendingUsersCount}</span>
                      <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        Action Needed
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      පරිශීලකයින්ට නොමිලේ පද්ධතිය භාවිත කළ නොහැකි අතර ප්‍රධාන පරිපාලක ({SUPER_ADMIN_EMAIL}) ගේ අනුමැතිය අවශ්‍ය වේ. පහතින් අනුමත කරන්න.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('pending')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    View Pending ({pendingUsersCount})
                  </button>
                </div>
              </div>
            )}

            {/* USERS TABLE */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No registered users found matching the criteria. All registered users under Super Admin ({SUPER_ADMIN_EMAIL}) will appear here.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">User / Email</th>
                        <th className="px-3 py-3">Role / භූමිකාව</th>
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
                                    {isAdminUser ? (
                                      <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded-md border border-amber-300 flex items-center gap-0.5">
                                        <Crown className="w-3 h-3 fill-amber-400" /> Super Admin
                                      </span>
                                    ) : (
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md border ${getRoleBadgeClass(user.role || 'client')}`}>
                                        {user.role || 'client'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] sm:max-w-xs">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* ROLE COLUMN WITH INTERACTIVE ROLE SELECTOR */}
                            <td className="px-3 py-3">
                              {isAdminUser ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                  <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-900" />
                                  <span>Super Admin</span>
                                </span>
                              ) : (
                                <div className="relative inline-block">
                                  <select
                                    value={user.role || 'client'}
                                    disabled={isUpdatingRoleId === user.userId}
                                    onChange={(e) =>
                                      handleRoleChange(
                                        user.userId,
                                        e.target.value as UserRole,
                                        user.displayName
                                      )
                                    }
                                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border appearance-none pr-6 cursor-pointer transition-all shadow-2xs focus:ring-2 focus:ring-indigo-400 ${getRoleBadgeClass(
                                      user.role || 'client'
                                    )} ${isUpdatingRoleId === user.userId ? 'opacity-50 pointer-events-none' : ''}`}
                                    title={t.changeRole}
                                  >
                                    <option value="client">👤 User / Client (සේවාලාභියා)</option>
                                    <option value="editor">✍️ Editor (සකසන්නා)</option>
                                    <option value="manager">💼 Manager (කළමනාකරු)</option>
                                    <option value="viewer">👁️ Viewer (නරඹන්නා)</option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                </div>
                              )}
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
                              ) : user.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <Hourglass className="w-3 h-3 text-amber-700" />
                                  <span>⏳ Awaiting Approval</span>
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
                              ) : user.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* QUICK APPROVE 7 DAYS */}
                                  <button
                                    type="button"
                                    onClick={() => handleApproveUser(user.userId, 7)}
                                    className="px-2 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    title="Approve user with 7 days trial"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve (7d)</span>
                                  </button>

                                  {/* QUICK APPROVE 30 DAYS */}
                                  <button
                                    type="button"
                                    onClick={() => handleApproveUser(user.userId, 30)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    title="Approve user with 30 days access"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve (30d)</span>
                                  </button>

                                  {/* QUICK APPROVE UNLIMITED */}
                                  <button
                                    type="button"
                                    onClick={() => handleApproveUser(user.userId, 99999)}
                                    className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                                    title="Approve user with Unlimited access"
                                  >
                                    <span>Approve (∞)</span>
                                  </button>

                                  {/* DELETE */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user.userId, user.email)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Reject & Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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

                                  {/* REVOKE / SET PENDING */}
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`Revoke approval for ${user.displayName}? User will be locked until approved again.`)) {
                                        await updateUserAccessOnServer(user.userId, { status: 'pending', allowedDays: 0 });
                                        refreshData();
                                        showToast(`${user.displayName} access revoked - set to Pending Approval`);
                                      }
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors cursor-pointer"
                                    title="Revoke Approval (Lock until re-approved)"
                                  >
                                    Revoke
                                  </button>

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
