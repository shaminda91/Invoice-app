import React, { useState, useEffect } from 'react';
import { Invoice, SavedCompany, SavedClient, UserLoginRecord, ADMIN_EMAIL } from './types';
import { createDefaultInvoice, BLANK_INVOICE } from './data/defaultInvoice';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { SavedInvoicesModal } from './components/SavedInvoicesModal';
import { CompanyModal } from './components/CompanyModal';
import { ClientModal } from './components/ClientModal';
import { LoginPage } from './components/LoginPage';
import { AdminLoginLogsModal } from './components/AdminLoginLogsModal';
import { AccessExpiredScreen } from './components/AccessExpiredScreen';
import {
  registerOrUpdateUserAccess,
  checkUserAccessStatus,
  checkGuestAccessStatus,
  getAllUserProfiles,
  getAccessSettings,
  saveAccessSettings,
} from './services/userAccessManager';
import { recordUserLogin, getLoginRecords } from './services/loginTracker';
import { calculateInvoiceTotals, formatCurrency, generateInvoiceNumber } from './utils/calculations';
import { exportInvoiceToExcel, exportInvoiceToPDF } from './utils/exportUtils';
import { AppLanguage, translations } from './i18n/translations';
import { User } from 'firebase/auth';
import { initAuth, signInWithGoogleDrive, logOutGoogle } from './services/googleAuth';
import { syncInvoiceToGoogleDrive, DriveSyncResult } from './services/googleDrive';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import {
  syncFullAppToCloudServer,
  fetchFullAppFromCloudServer,
  getStoredCloudSyncMeta,
  CloudSyncSummary,
  FullAppDataSnapshot,
  CURRENT_APP_VERSION,
} from './services/cloudServer';
import {
  Printer,
  Save,
  FolderOpen,
  Plus,
  Download,
  Eye,
  Edit3,
  ZoomIn,
  ZoomOut,
  Receipt,
  Sparkles,
  Check,
  FileSpreadsheet,
  FileDown,
  Loader2,
  Languages,
  Cloud,
  Building2,
  Users,
  LogIn,
  LogOut,
  Shield,
  UserCheck,
  BarChart3,
  Clock,
  Menu,
  Maximize2,
  Smartphone,
  Columns,
} from 'lucide-react';
import { MobileActionDrawer } from './components/MobileActionDrawer';

const STORAGE_KEY_CURRENT = 'invoice_builder_current';
const STORAGE_KEY_LIST = 'invoice_builder_saved_list';
const STORAGE_KEY_LANG = 'ps_invoice_language';
const STORAGE_KEY_COMPANIES = 'ps_invoice_saved_companies';
const STORAGE_KEY_CLIENTS = 'ps_invoice_saved_clients';

export default function App() {
  // 1. Language State
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY_LANG) as AppLanguage;
      if (savedLang === 'en' || savedLang === 'si') return savedLang;
    } catch (e) {
      console.error('Failed to load language', e);
    }
    return 'si'; // Default to Sinhala per user's prompt
  });

  // 2. Initial State with LocalStorage fallbacks
  const [invoice, setInvoice] = useState<Invoice>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sender?.name === 'Apex Digital Solutions') {
          return createDefaultInvoice();
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load current invoice', e);
    }
    return createDefaultInvoice();
  });

  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.some((inv: Invoice) => inv.sender?.name === 'Apex Digital Solutions')) {
            return parsed.map((inv: Invoice) =>
              inv.sender?.name === 'Apex Digital Solutions' ? createDefaultInvoice() : inv
            );
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved invoices', e);
    }
    return [createDefaultInvoice()];
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'both'>('both');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [autoFitPreview, setAutoFitPreview] = useState<boolean>(true);
  const [calculatedScale, setCalculatedScale] = useState<number>(100);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [savedModalTab, setSavedModalTab] = useState<'history' | 'reports'>('history');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Saved Companies / Senders Directory
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPANIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load companies', e);
    }
    return [
      {
        id: 'comp_default_1',
        name: 'Ps ebay solution',
        email: 'psgss91@gmail.com',
        phone: '0769966075',
        address: 'Kaduwela Road',
        city: 'Malabe',
        postalCode: '10115',
        country: 'Sri Lanka',
        taxId: '',
        website: '',
        logoUrl: '',
        isDefault: true,
      },
    ];
  });

  // Saved Clients Directory
  const [savedClients, setSavedClients] = useState<SavedClient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load clients', e);
    }
    return [
      {
        id: 'client_default_1',
        name: 'Kasun Jayawardena',
        company: 'Horizon Retailers Pvt Ltd',
        email: 'kasun@horizonretail.com',
        phone: '+94 71 987 6543',
        address: '128 Kandy Road',
        city: 'Kadawatha',
        postalCode: '11850',
        country: 'Sri Lanka',
        hasShippingAddress: false,
        shippingAddress: '',
      },
    ];
  });

  // Google Drive & User Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState<boolean>(false);
  const [lastDriveSyncResult, setLastDriveSyncResult] = useState<DriveSyncResult | null>(() => {
    try {
      const saved = localStorage.getItem('ps_invoice_last_drive_sync');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDriveAutoSaveEnabled, setIsDriveAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ps_invoice_drive_autosave');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Login & Admin Activity State
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ps_invoice_guest_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAdminLogsModalOpen, setIsAdminLogsModalOpen] = useState<boolean>(false);
  const [adminModalTab, setAdminModalTab] = useState<'users' | 'logs' | 'cloud'>('users');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSync, setLastCloudSync] = useState<CloudSyncSummary | null>(() => getStoredCloudSyncMeta());
  const [accessRefreshCounter, setAccessRefreshCounter] = useState<number>(0);
  const [loginRecords, setLoginRecords] = useState<UserLoginRecord[]>(() => getLoginRecords());

  // Active translation dictionary
  const t = translations[language];

  // Initialize Firebase Auth listener for Google Drive & User Logins
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        if (token) {
          setDriveAccessToken(token);
        }
        // Record user login details for psgss91@gmail.com
        try {
          registerOrUpdateUserAccess(user, token);
          setAccessRefreshCounter((c) => c + 1);
        } catch (accErr) {
          console.error('Failed to register user access:', accErr);
        }

        try {
          await recordUserLogin(user, token);
          setLoginRecords(getLoginRecords());
        } catch (e) {
          console.error('Failed to record user login:', e);
        }
      },
      () => {
        setGoogleUser(null);
        setDriveAccessToken(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Persist Drive auto-save preference
  const handleToggleAutoSave = (enabled: boolean) => {
    setIsDriveAutoSaveEnabled(enabled);
    try {
      localStorage.setItem('ps_invoice_drive_autosave', JSON.stringify(enabled));
    } catch (e) {
      console.error('Failed to persist autosave toggle', e);
    }
    showToast(enabled ? t.driveAutoSaveEnabled : t.driveAutoSaveDisabled);
  };

  // Google Drive Auto-Save debounce effect (runs automatically when user edits invoice)
  useEffect(() => {
    if (!driveAccessToken || !isDriveAutoSaveEnabled) return;

    const timer = setTimeout(async () => {
      try {
        setIsDriveSyncing(true);
        const result = await syncInvoiceToGoogleDrive(driveAccessToken, invoice, true);
        setLastDriveSyncResult(result);
        if (result.success) {
          try {
            localStorage.setItem('ps_invoice_last_drive_sync', JSON.stringify(result));
          } catch {
            // ignore storage errors
          }
        }
      } catch (e) {
        console.error('Drive auto-save error:', e);
      } finally {
        setIsDriveSyncing(false);
      }
    }, 4000); // 4-second debounce to avoid spamming Drive API while typing

    return () => clearTimeout(timer);
  }, [invoice, driveAccessToken, isDriveAutoSaveEnabled]);

  // Connect Google Drive / Login
  const handleConnectGoogle = async () => {
    try {
      const { user, accessToken } = await signInWithGoogleDrive();
      setGoogleUser(user);
      setDriveAccessToken(accessToken);
      setIsGuestMode(false);
      try {
        localStorage.removeItem('ps_invoice_guest_mode');
      } catch {
        // ignore
      }

      // Record login details for psgss91@gmail.com
      try {
        await recordUserLogin(user, accessToken);
        setLoginRecords(getLoginRecords());
      } catch (logErr) {
        console.warn('Could not record login:', logErr);
      }

      showToast(`${user.displayName || user.email} - ${t.toastDriveSaved}`);

      // Immediately sync current invoice
      setIsDriveSyncing(true);
      try {
        const result = await syncInvoiceToGoogleDrive(accessToken, invoice, true);
        setLastDriveSyncResult(result);
        if (result.success) {
          try {
            localStorage.setItem('ps_invoice_last_drive_sync', JSON.stringify(result));
          } catch {
            // ignore
          }
        }
      } finally {
        setIsDriveSyncing(false);
      }
    } catch (err: any) {
      console.error('Google connect error:', err);
      showToast('Google login failed');
    }
  };

  // Login directly via Google (for Login Page)
  const handleLoginGoogle = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const { user, accessToken } = await signInWithGoogleDrive();
      setGoogleUser(user);
      setDriveAccessToken(accessToken);
      setIsGuestMode(false);
      try {
        localStorage.removeItem('ps_invoice_guest_mode');
      } catch {
        // ignore
      }

      // Record login details & register user access
      try {
        registerOrUpdateUserAccess(user, accessToken);
        setAccessRefreshCounter((c) => c + 1);
      } catch (accErr) {
        console.warn('Could not register user access:', accErr);
      }

      try {
        await recordUserLogin(user, accessToken);
        setLoginRecords(getLoginRecords());
      } catch (logErr) {
        console.warn('Could not record login:', logErr);
      }

      showToast(`${t.loginSuccess} (${user.displayName || user.email})`);
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Continue as guest
  const handleContinueGuest = () => {
    setIsGuestMode(true);
    try {
      localStorage.setItem('ps_invoice_guest_mode', 'true');
    } catch {
      // ignore
    }
  };

  // Disconnect Google Drive
  const handleDisconnectGoogle = async () => {
    await logOutGoogle();
    setGoogleUser(null);
    setDriveAccessToken(null);
    showToast(t.driveAutoSaveDisabled);
  };

  // Sign out user completely
  const handleSignOut = async () => {
    if (window.confirm(t.logoutConfirm)) {
      await logOutGoogle();
      setGoogleUser(null);
      setDriveAccessToken(null);
      setIsGuestMode(false);
      try {
        localStorage.removeItem('ps_invoice_guest_mode');
      } catch {
        // ignore
      }
      showToast(t.logout);
    }
  };

  // Manual Sync to Drive now
  const handleManualDriveSync = async () => {
    if (!driveAccessToken) {
      setIsDriveModalOpen(true);
      return;
    }

    setIsDriveSyncing(true);
    try {
      const result = await syncInvoiceToGoogleDrive(driveAccessToken, invoice, true);
      setLastDriveSyncResult(result);
      if (result.success) {
        try {
          localStorage.setItem('ps_invoice_last_drive_sync', JSON.stringify(result));
        } catch {
          // ignore
        }
        showToast(t.toastDriveSaved);
      } else {
        showToast(t.toastDriveFailed);
      }
    } catch (err: any) {
      console.error(err);
      showToast(t.toastDriveFailed);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Master Cloud Server Synchronization (saves all app state to psgss91@gmail.com Google Drive)
  const handleSyncAllToCloud = async (): Promise<CloudSyncSummary | null> => {
    if (!driveAccessToken) {
      showToast(t.connectGoogleDrive);
      setIsDriveModalOpen(true);
      return null;
    }

    setIsCloudSyncing(true);
    showToast(language === 'si' ? 'සියලු දත්ත Cloud Server වෙත සුරැකෙමින් පවතී...' : 'Syncing all data to psgss91@gmail.com Cloud Server...');
    try {
      const snapshot: FullAppDataSnapshot = {
        metadata: {
          app: 'PS Invoice Builder',
          version: CURRENT_APP_VERSION,
          exportedAt: Date.now(),
          exportedAtString: new Date().toISOString(),
          cloudServerAdmin: ADMIN_EMAIL,
          systemStatus: 'healthy',
          schemaVersion: 2,
        },
        invoices: savedInvoices,
        currentInvoice: invoice,
        clients: savedClients,
        companies: savedCompanies,
        accessSettings: getAccessSettings(),
        userProfiles: getAllUserProfiles(),
        loginRecords: getLoginRecords(),
        language: language,
      };

      const summary = await syncFullAppToCloudServer(driveAccessToken, snapshot);
      setLastCloudSync(summary);
      if (summary.success) {
        showToast(t.cloudServerSyncedSuccess);
      } else {
        showToast(summary.error || t.toastDriveFailed);
      }
      return summary;
    } catch (err: any) {
      console.error('Cloud server sync failed:', err);
      showToast(err?.message || 'Cloud Server sync failed');
      return null;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Restore/Update full app state from psgss91@gmail.com Cloud Server
  const handleRestoreFromCloud = async (): Promise<boolean> => {
    if (!driveAccessToken) {
      showToast(t.connectGoogleDrive);
      setIsDriveModalOpen(true);
      return false;
    }

    setIsCloudSyncing(true);
    showToast(language === 'si' ? 'Cloud Server වෙතින් දත්ත ලබාගනිමින් පවතී...' : 'Updating app from psgss91@gmail.com Cloud Server...');
    try {
      const { snapshot } = await fetchFullAppFromCloudServer(driveAccessToken);
      if (!snapshot) {
        throw new Error('No master database found on Cloud Server.');
      }

      // 1. Invoices
      if (Array.isArray(snapshot.invoices) && snapshot.invoices.length > 0) {
        setSavedInvoices(snapshot.invoices);
        try {
          localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(snapshot.invoices));
        } catch {}
      }
      if (snapshot.currentInvoice) {
        setInvoice(snapshot.currentInvoice);
        try {
          localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(snapshot.currentInvoice));
        } catch {}
      } else if (snapshot.invoices && snapshot.invoices[0]) {
        setInvoice(snapshot.invoices[0]);
      }

      // 2. Clients
      if (Array.isArray(snapshot.clients)) {
        setSavedClients(snapshot.clients);
        try {
          localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(snapshot.clients));
        } catch {}
      }

      // 3. Companies
      if (Array.isArray(snapshot.companies)) {
        setSavedCompanies(snapshot.companies);
        try {
          localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(snapshot.companies));
        } catch {}
      }

      // 4. Access Settings & User Profiles
      if (snapshot.accessSettings) {
        saveAccessSettings(snapshot.accessSettings);
      }
      if (Array.isArray(snapshot.userProfiles)) {
        try {
          localStorage.setItem('ps_invoice_user_profiles', JSON.stringify(snapshot.userProfiles));
        } catch {}
      }

      // 5. Login records
      if (Array.isArray(snapshot.loginRecords)) {
        try {
          localStorage.setItem('ps_invoice_login_records', JSON.stringify(snapshot.loginRecords));
        } catch {}
        setLoginRecords(getLoginRecords());
      }

      // 6. Language
      if (snapshot.language) {
        setLanguage(snapshot.language);
        try {
          localStorage.setItem(STORAGE_KEY_LANG, snapshot.language);
        } catch {}
      }

      setAccessRefreshCounter((c) => c + 1);
      showToast(t.cloudServerRestoredSuccess);
      return true;
    } catch (err: any) {
      console.error('Failed to restore from cloud:', err);
      showToast(err?.message || 'Failed to update app from Cloud Server');
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Save language selection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (e) {
      console.error('Failed to persist language', e);
    }
  }, [language]);

  // Auto-save current invoice to draft
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(invoice));
    } catch (e) {
      console.error('Failed to auto-save invoice', e);
    }
  }, [invoice]);

  // Sync saved invoices list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(savedInvoices));
    } catch (e) {
      console.error('Failed to persist saved invoices list', e);
    }
  }, [savedInvoices]);

  // Sync saved companies list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(savedCompanies));
    } catch (e) {
      console.error('Failed to persist saved companies list', e);
    }
  }, [savedCompanies]);

  // Sync saved clients list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(savedClients));
    } catch (e) {
      console.error('Failed to persist saved clients list', e);
    }
  }, [savedClients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Saved Company Handlers
  const handleSaveCompany = (comp: SavedCompany) => {
    setSavedCompanies((prev) => {
      const idx = prev.findIndex((c) => c.id === comp.id);
      let next: SavedCompany[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = comp;
      } else {
        next = [comp, ...prev];
      }
      if (comp.isDefault) {
        next = next.map((c) => ({ ...c, isDefault: c.id === comp.id }));
      }
      return next;
    });
    showToast(`${comp.name} - ${t.companySavedSuccess}`);
  };

  const handleDeleteCompany = (id: string) => {
    setSavedCompanies((prev) => prev.filter((c) => c.id !== id));
    showToast(t.companyDeletedSuccess);
  };

  const handleSelectCompany = (comp: SavedCompany) => {
    setInvoice((prev) => ({
      ...prev,
      sender: {
        name: comp.name,
        email: comp.email,
        phone: comp.phone,
        address: comp.address,
        city: comp.city,
        postalCode: comp.postalCode,
        country: comp.country,
        taxId: comp.taxId,
        website: comp.website,
        logoUrl: comp.logoUrl || prev.sender.logoUrl,
      },
      updatedAt: Date.now(),
    }));
    showToast(`${comp.name} - ${t.companyAppliedSuccess}`);
  };

  const handleSaveCurrentCompanyQuick = () => {
    if (!invoice.sender.name.trim()) {
      showToast(t.businessNamePlaceholder);
      return;
    }
    const newComp: SavedCompany = {
      id: 'comp_' + Date.now(),
      ...invoice.sender,
      isDefault: savedCompanies.length === 0,
    };
    setSavedCompanies((prev) => [newComp, ...prev.filter((c) => c.name.toLowerCase() !== newComp.name.toLowerCase())]);
    showToast(`${invoice.sender.name} - ${t.companySavedSuccess}`);
  };

  // Saved Client Handlers
  const handleSaveClient = (client: SavedClient) => {
    setSavedClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = client;
        return next;
      }
      return [client, ...prev];
    });
    showToast(`${client.name || client.company} - ${t.clientSavedSuccess}`);
  };

  const handleDeleteClient = (id: string) => {
    setSavedClients((prev) => prev.filter((c) => c.id !== id));
    showToast(t.clientDeletedSuccess);
  };

  const handleSelectClient = (client: SavedClient) => {
    setInvoice((prev) => ({
      ...prev,
      client: {
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        postalCode: client.postalCode,
        country: client.country,
        hasShippingAddress: client.hasShippingAddress,
        shippingAddress: client.shippingAddress,
      },
      updatedAt: Date.now(),
    }));
    showToast(`${client.name || client.company} - ${t.clientAppliedSuccess}`);
  };

  const handleSaveCurrentClientQuick = () => {
    if (!invoice.client.name.trim() && !invoice.client.company.trim()) {
      showToast(t.clientNamePlaceholder);
      return;
    }
    const newClient: SavedClient = {
      id: 'client_' + Date.now(),
      ...invoice.client,
    };
    setSavedClients((prev) => [
      newClient,
      ...prev.filter(
        (c) =>
          c.name.toLowerCase() !== newClient.name.toLowerCase() ||
          (newClient.company && c.company.toLowerCase() !== newClient.company.toLowerCase())
      ),
    ]);
    showToast(`${invoice.client.name || invoice.client.company} - ${t.clientSavedSuccess}`);
  };

  // Actions
  const handleSaveInvoice = () => {
    const existingIndex = savedInvoices.findIndex((inv) => inv.id === invoice.id);
    let updatedList: Invoice[];
    if (existingIndex >= 0) {
      updatedList = [...savedInvoices];
      updatedList[existingIndex] = { ...invoice, updatedAt: Date.now() };
    } else {
      updatedList = [{ ...invoice, updatedAt: Date.now() }, ...savedInvoices];
    }
    setSavedInvoices(updatedList);
    showToast(`${invoice.invoiceNumber || 'INV'} - ${t.toastSaved}`);

    // If connected to Google Drive and auto-save is on, sync to Drive as well
    if (driveAccessToken && isDriveAutoSaveEnabled) {
      handleManualDriveSync();
      handleSyncAllToCloud();
    }
  };

  const handleNewInvoice = () => {
    const fresh = BLANK_INVOICE();
    fresh.currency = invoice.currency;
    fresh.sender = { ...invoice.sender }; // Retain user's business info
    setInvoice(fresh);
    showToast(t.toastNewCreated);
  };

  const handleResetSample = () => {
    const sample = createDefaultInvoice();
    sample.invoiceNumber = generateInvoiceNumber();
    setInvoice(sample);
    showToast(t.toastSampleLoaded);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    showToast(t.toastGeneratingPdf);
    try {
      await exportInvoiceToPDF(invoice);
      showToast(`${invoice.invoiceNumber || 'Invoice'}.pdf ${t.toastPdfSaved}`);
    } catch (e) {
      console.error('PDF export error:', e);
      showToast(t.toastPdfFailed);
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    try {
      exportInvoiceToExcel(invoice);
      showToast(`${invoice.invoiceNumber || 'Invoice'}.xlsx ${t.toastExcelSaved}`);
    } catch (e) {
      console.error('Excel export error:', e);
      showToast(t.toastExcelFailed);
    }
  };

  const handleDownloadJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${invoice.invoiceNumber || 'invoice'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(t.toastJsonDownloaded);
  };

  const handleDeleteInvoice = (id: string) => {
    setSavedInvoices((prev) => prev.filter((inv) => inv.id !== id));
    showToast(t.toastInvoiceDeleted);
  };

  const handleBatchDeleteInvoices = (ids: string[]) => {
    setSavedInvoices((prev) => prev.filter((inv) => !ids.includes(inv.id)));
    showToast(t.toastBatchDeleted);
  };

  const handleClearAllInvoices = () => {
    setSavedInvoices([]);
    showToast(t.toastAllDeleted);
  };

  const handleDuplicateInvoice = (inv: Invoice) => {
    const duplicate: Invoice = {
      ...inv,
      id: 'inv_' + Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSavedInvoices((prev) => [duplicate, ...prev]);
    setInvoice(duplicate);
    showToast(`${t.toastDuplicated}: ${duplicate.invoiceNumber}`);
  };

  const handleImportInvoice = (imported: Invoice) => {
    setInvoice(imported);
    setSavedInvoices((prev) => [imported, ...prev]);
    showToast(`${t.toastJsonImported}: ${imported.invoiceNumber}`);
  };

  const totals = calculateInvoiceTotals(invoice);

  // User access & subscription status calculation
  const accessCheck = React.useMemo(() => {
    if (googleUser) {
      return checkUserAccessStatus(googleUser);
    }
    if (isGuestMode) {
      const guest = checkGuestAccessStatus();
      return {
        isAllowed: guest.isAllowed,
        isAdmin: false,
        daysRemaining: guest.daysRemaining,
        isExpired: guest.isExpired,
        isBlocked: false,
        profile: null,
      };
    }
    return {
      isAllowed: false,
      isAdmin: false,
      daysRemaining: 0,
      isExpired: false,
      isBlocked: false,
      profile: null,
    };
  }, [googleUser, isGuestMode, accessRefreshCounter]);

  // 0. LOGIN SCREEN GUARD: Show LoginPage if not logged in and not in guest mode
  if (!googleUser && !isGuestMode) {
    return (
      <LoginPage
        onLoginGoogle={handleLoginGoogle}
        onContinueGuest={handleContinueGuest}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />
    );
  }

  // 0.1. ACCESS EXPIRED GUARD: Auto log out / Lock out when access period finishes
  if (!accessCheck.isAllowed) {
    return (
      <AccessExpiredScreen
        userEmail={googleUser?.email || (isGuestMode ? 'Guest Session' : 'No Email')}
        userName={googleUser?.displayName || (isGuestMode ? 'Guest Trial User' : 'PS Invoice User')}
        profile={accessCheck.profile}
        onSignOut={async () => {
          if (googleUser) {
            await logOutGoogle();
            setGoogleUser(null);
            setDriveAccessToken(null);
          }
          setIsGuestMode(false);
          try {
            localStorage.removeItem('ps_invoice_guest_mode');
          } catch {
            // ignore
          }
          showToast(t.logout);
        }}
        onRefreshStatus={() => {
          setAccessRefreshCounter((c) => c + 1);
          if (googleUser) {
            const recheck = checkUserAccessStatus(googleUser);
            if (recheck.isAllowed) {
              showToast(t.userDaysUpdatedSuccess);
            } else {
              showToast('Still expired. Please contact admin (psgss91@gmail.com).');
            }
          }
        }}
        language={language}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* 1. TOP APPLICATION BAR - Fits every device screen smoothly without horizontal scrolling */}
      <header
        id="app-header"
        className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full overflow-x-hidden"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 w-full">
          {/* LOGO & TITLE: Compact 2-line brand mark on mobile for optimal horizontal space */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col leading-none shrink-0">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                PS
              </span>
              <span className="text-xs sm:text-sm font-black text-indigo-600 tracking-tight">
                Invoice
              </span>
            </div>
            <span className="hidden md:inline-flex text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 ml-1">
              {t.appBadge}
            </span>
          </div>

          {/* VIEW SWITCHER: [ Edit | Both | Preview ] */}
          <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
            <button
              type="button"
              id="header-tab-editor"
              onClick={() => setActiveTab('editor')}
              title={t.editTab}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.editTab}</span>
            </button>
            <button
              type="button"
              id="header-tab-both"
              onClick={() => setActiveTab('both')}
              title={t.bothTab}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.bothTab}</span>
            </button>
            <button
              type="button"
              id="header-tab-preview"
              onClick={() => setActiveTab('preview')}
              title={t.previewTab}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'preview' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.previewTab}</span>
            </button>
          </div>

          {/* HEADER ACTIONS: LANGUAGE SELECTOR & DESKTOP BUTTONS */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* LANGUAGE SWITCHER (සිංහල / English) */}
            <div
              id="language-switcher"
              className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 gap-0.5 shrink-0"
            >
              <button
                type="button"
                id="lang-btn-sinhala"
                onClick={() => setLanguage('si')}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'si'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="සිංහල භාෂාව තෝරන්න"
              >
                සිංහල
              </button>
              <button
                type="button"
                id="lang-btn-english"
                onClick={() => setLanguage('en')}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Select English"
              >
                English
              </button>
            </div>

            {/* GOOGLE DRIVE AUTO-SAVE BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-google-drive-header"
              onClick={() => setIsDriveModalOpen(true)}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                driveAccessToken
                  ? 'bg-blue-50/90 text-blue-700 hover:bg-blue-100 border-blue-200'
                  : 'bg-slate-50 text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border-slate-200'
              }`}
              title={driveAccessToken ? t.driveAutoSaveEnabled : t.connectGoogleDrive}
            >
              <div className="relative flex items-center">
                <Cloud className={`w-3.5 h-3.5 ${driveAccessToken ? 'text-blue-600' : 'text-slate-500'}`} />
                {driveAccessToken && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                )}
              </div>
              <span>
                {driveAccessToken ? (isDriveSyncing ? t.driveSyncing : 'Drive Auto-Save') : t.googleDrive}
              </span>
            </button>

            {/* CLOUD SERVER & APP UPDATE CENTER (DESKTOP) */}
            <button
              type="button"
              id="btn-cloud-server-header"
              onClick={() => {
                setAdminModalTab('cloud');
                setIsAdminLogsModalOpen(true);
              }}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                driveAccessToken
                  ? 'bg-indigo-50/90 text-indigo-950 hover:bg-indigo-100 border-indigo-200'
                  : 'bg-slate-50 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 border-slate-200'
              }`}
              title="Master Cloud Server & App Updates (psgss91@gmail.com)"
            >
              <div className="relative flex items-center">
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                {driveAccessToken && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white animate-pulse" />
                )}
              </div>
              <span>Cloud Server</span>
              <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-md font-bold border border-indigo-200">
                psgss91
              </span>
            </button>

            {/* SAVED COMPANIES BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-saved-companies-header"
              onClick={() => setIsCompanyModalOpen(true)}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={t.savedCompanies}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.savedCompanies}</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedCompanies.length}
              </span>
            </button>

            {/* SAVED CLIENTS BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-saved-clients-header"
              onClick={() => setIsClientModalOpen(true)}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={t.savedClients}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.savedClients}</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedClients.length}
              </span>
            </button>

            {/* INVOICE HISTORY BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-saved-invoices"
              onClick={() => {
                setSavedModalTab('history');
                setIsSavedModalOpen(true);
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={t.invoiceHistory}
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.historyTab}</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedInvoices.length}
              </span>
            </button>

            {/* PERIODIC FINANCIAL REPORTS BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-financial-reports-header"
              onClick={() => {
                setSavedModalTab('reports');
                setIsSavedModalOpen(true);
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={t.reportsAndAnalytics}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.reportsTab}</span>
            </button>

            {/* SAVE INVOICE BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-save-invoice"
              onClick={handleSaveInvoice}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={t.saveDraft}
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.saveDraft}</span>
            </button>

            {/* EXCEL EXPORT BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-export-excel"
              onClick={handleExportExcel}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>

            {/* PDF EXPORT BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-export-pdf"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="PDF"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>PDF</span>
            </button>

            {/* PRINT BUTTON (DESKTOP) */}
            <button
              type="button"
              id="btn-print"
              onClick={handlePrint}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={t.print}
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{t.print}</span>
            </button>

            {/* USER PROFILE & ADMIN SECTION (DESKTOP) */}
            {googleUser ? (
              <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                {/* ADMIN CONTROL PANEL BUTTON (Shown exclusively for psgss91@gmail.com) */}
                {accessCheck.isAdmin && (
                  <button
                    type="button"
                    id="btn-admin-control-panel"
                    onClick={() => {
                      setAdminModalTab('users');
                      setIsAdminLogsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title={t.adminPanel}
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden md:inline">{t.adminPanel}</span>
                    <span className="bg-indigo-200 text-indigo-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      Admin
                    </span>
                  </button>
                )}

                {/* TRIAL / ACCESS DAYS REMAINING BADGE (For non-admin users) */}
                {!accessCheck.isAdmin && (
                  <div
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"
                    title={accessCheck.profile ? `Trial expires on: ${accessCheck.profile.expiresAtString}` : undefined}
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{accessCheck.daysRemaining}d left</span>
                  </div>
                )}

                {/* USER PROFILE BADGE */}
                <div
                  className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                  title={`${t.loggedInAs}: ${googleUser.email}`}
                >
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-indigo-200 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {(googleUser.displayName || googleUser.email || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden lg:block text-left leading-tight max-w-[130px]">
                    <div className="text-[11px] font-bold text-slate-800 truncate">
                      {googleUser.displayName || 'Google User'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      {googleUser.email}
                    </div>
                  </div>
                </div>

                {/* SIGN OUT BUTTON */}
                <button
                  type="button"
                  id="btn-sign-out"
                  onClick={handleSignOut}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-header-google-login"
                onClick={handleLoginGoogle}
                disabled={isLoggingIn}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>
                  {language === 'si' ? 'Gmail මගින් පිවිසෙන්න' : 'Sign In'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* GUEST MODE ALERT BANNER */}
      {isGuestMode && !googleUser && (
        <div className="no-print bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] uppercase">
                {language === 'si' ? 'ආගන්තුක මාදිලිය' : 'Guest Mode'}
              </span>
              <span>
                {language === 'si'
                  ? 'Google Drive Cloud Auto-Save සහ ගිණුම් විස්තර සඳහා ඔබගේ Gmail මඟින් පිවිසෙන්න.'
                  : 'Sign in with your Gmail to enable Google Drive Cloud Auto-Save and session sync.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoginGoogle}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[11px] transition-colors cursor-pointer"
            >
              {isLoggingIn ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <LogIn className="w-3 h-3" />
              )}
              <span>{language === 'si' ? 'Gmail මගින් පිවිසෙන්න' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. SUB-BAR WITH SHORTCUTS & TOTAL SUMMARY - ZERO HORIZONTAL SCROLL & EXACT ALIGNMENT */}
      <div className="no-print bg-white/95 backdrop-blur-xs border-b border-slate-200 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 w-full">
          {/* MOBILE VIEW (Screens < 768px): Structured 4 clean rows matching exact reference layout */}
          <div className="flex flex-col gap-2.5 md:hidden w-full">
            {/* Mobile Row 1: New Invoice, Load Sample, Divider, Save PDF */}
            <div className="flex items-center justify-between gap-1.5 w-full">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-new-invoice"
                  onClick={handleNewInvoice}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.newInvoice}</span>
                </button>

                <button
                  type="button"
                  id="btn-load-sample"
                  onClick={handleResetSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.loadSample}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  id="btn-save-pdf"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  title={t.savePdf}
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{t.savePdf}</span>
                </button>
              </div>
            </div>

            {/* Mobile Row 2: Save Excel (.xlsx) and Backup JSON */}
            <div className="flex items-center justify-between gap-2 w-full">
              <button
                type="button"
                id="btn-save-excel"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                title={t.saveExcel}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                id="btn-backup-json"
                onClick={handleDownloadJSON}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title={t.backupJson}
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.backupJson}</span>
              </button>
            </div>

            {/* Mobile Row 3: Connect Google Drive */}
            <div className="flex items-center w-full">
              <button
                type="button"
                id="btn-drive-sync-subbar"
                onClick={() => {
                  if (!driveAccessToken) setIsDriveModalOpen(true);
                  else handleManualDriveSync();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                title={t.driveAutoSave}
              >
                <Cloud className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-pulse text-blue-600' : 'text-blue-500'}`} />
                <span>{driveAccessToken ? (isDriveSyncing ? t.driveSyncing : t.driveSyncNow) : t.connectGoogleDrive}</span>
              </button>
            </div>

            {/* Mobile Row 4: Total & Balance Due Summary */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/80 text-xs w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">{t.total}:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(totals.grandTotal, invoice.currency)}
                </span>
              </div>
              {totals.balanceDue > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">{t.balanceDue}:</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">
                    {formatCurrency(totals.balanceDue, invoice.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP VIEW (Screens >= 768px): Sleek horizontal single-bar */}
          <div className="hidden md:flex md:items-center md:justify-between gap-4 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-new-invoice-desktop"
                onClick={handleNewInvoice}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.newInvoice}</span>
              </button>

              <button
                type="button"
                id="btn-load-sample-desktop"
                onClick={handleResetSample}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.loadSample}</span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                id="btn-save-pdf-desktop"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title={t.savePdf}
              >
                {isExportingPDF ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{t.savePdf}</span>
              </button>

              <button
                type="button"
                id="btn-save-excel-desktop"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                title={t.saveExcel}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                id="btn-backup-json-desktop"
                onClick={handleDownloadJSON}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title={t.backupJson}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.backupJson}</span>
              </button>

              <button
                type="button"
                id="btn-drive-sync-subbar-desktop"
                onClick={() => {
                  if (!driveAccessToken) setIsDriveModalOpen(true);
                  else handleManualDriveSync();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                title={t.driveAutoSave}
              >
                <Cloud className={`w-3.5 h-3.5 ${isDriveSyncing ? 'animate-pulse text-blue-600' : 'text-blue-500'}`} />
                <span>{driveAccessToken ? (isDriveSyncing ? t.driveSyncing : t.driveSyncNow) : t.connectGoogleDrive}</span>
              </button>
            </div>

            <div className="flex items-center gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">{t.total}:</span>
                <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                  {formatCurrency(totals.grandTotal, invoice.currency)}
                </span>
              </div>
              {totals.balanceDue > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">{t.balanceDue}:</span>
                  <span className="font-mono font-bold text-amber-700 text-sm sm:text-base">
                    {formatCurrency(totals.balanceDue, invoice.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT: EDITOR PANEL */}
          <div
            id="editor-panel"
            className={`no-print ${
              activeTab === 'preview' ? 'hidden' : activeTab === 'editor' ? 'col-span-12' : 'col-span-12 lg:col-span-6'
            }`}
          >
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t.invoiceDetailsAndContent}
                </h2>
                <p className="text-xs text-slate-500">{t.editFieldsLive}</p>
              </div>
            </div>

            <InvoiceEditor
              invoice={invoice}
              onChange={setInvoice}
              savedCompanies={savedCompanies}
              savedClients={savedClients}
              onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
              onOpenClientModal={() => setIsClientModalOpen(true)}
              onSaveCurrentCompanyQuick={handleSaveCurrentCompanyQuick}
              onSaveCurrentClientQuick={handleSaveCurrentClientQuick}
              onSelectCompanyQuick={handleSelectCompany}
              onSelectClientQuick={handleSelectClient}
              t={t}
            />
          </div>

          {/* RIGHT: LIVE PREVIEW PANEL */}
          <div
            id="preview-panel"
            className={`${
              activeTab === 'editor' ? 'hidden' : activeTab === 'preview' ? 'col-span-12' : 'col-span-12 lg:col-span-6'
            }`}
          >
            {/* PREVIEW TOOLBAR WITH AUTO-FIT FOR PHONE & TABLET */}
            <div
              id="preview-toolbar"
              className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 bg-white px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.livePreview}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  ({invoice.template})
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* AUTO-FIT BUTTON (PHONE & TABLET SCALER) */}
                <button
                  type="button"
                  id="btn-preview-autofit"
                  onClick={() => setAutoFitPreview((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    autoFitPreview
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title={t.autoFitDesc}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{t.autoFit}</span>
                  {autoFitPreview && (
                    <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono">
                      {calculatedScale}%
                    </span>
                  )}
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    title={t.savePdf}
                  >
                    {isExportingPDF ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileDown className="w-3 h-3" />
                    )}
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:text-white hover:bg-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                    title={t.saveExcel}
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600 group-hover:text-white" />
                    <span>Excel</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1" />

                {/* MANUAL ZOOM CONTROLS */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoFitPreview(false);
                      setZoomLevel((z) => Math.max(50, z - 10));
                    }}
                    title={t.zoomOut}
                    className="p-1 sm:p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-medium text-slate-600 w-8 sm:w-10 text-center">
                    {autoFitPreview ? `${calculatedScale}%` : `${zoomLevel}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoFitPreview(false);
                      setZoomLevel((z) => Math.min(150, z + 10));
                    }}
                    title={t.zoomIn}
                    className="p-1 sm:p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoFitPreview(false);
                      setZoomLevel(100);
                    }}
                    title={t.resetZoom}
                    className="text-[11px] px-1.5 sm:px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer hidden xs:inline"
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="w-full flex justify-center overflow-x-auto pb-6 sm:pb-12">
              <InvoicePreview
                invoice={invoice}
                zoomLevel={zoomLevel}
                autoFit={autoFitPreview}
                onCalculatedScaleChange={setCalculatedScale}
                t={t}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 4. MOBILE / TABLET STICKY BOTTOM ACTION BAR (Visible on < lg screens) */}
      <nav
        id="mobile-bottom-navigation"
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-xl flex items-center justify-between gap-2 no-print"
      >
        {/* VIEW SWITCHER TABS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            id="mobile-tab-editor"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editTab}</span>
          </button>
          <button
            type="button"
            id="mobile-tab-both"
            onClick={() => setActiveTab('both')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'both'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{t.bothTab}</span>
          </button>
          <button
            type="button"
            id="mobile-tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.previewTab}</span>
          </button>
        </div>

        {/* CURRENT TOTAL PILL */}
        <div className="flex flex-col items-center justify-center text-center px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg min-w-[90px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
            {t.total}
          </span>
          <span className="text-xs font-bold font-mono text-slate-900 leading-tight truncate">
            {formatCurrency(totals.grandTotal, invoice.currency)}
          </span>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
            title={t.savePdf}
          >
            {isExportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title={t.mobileMenu}
          >
            <Menu className="w-4 h-4 text-slate-700" />
            <span>{t.mobileMenu}</span>
          </button>
        </div>
      </nav>

      {/* MOBILE ACTION DRAWER FOR PHONES & TABLETS */}
      <MobileActionDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        t={t}
        language={language}
        onSetLanguage={setLanguage}
        googleUser={googleUser}
        accessCheck={accessCheck}
        onLoginGoogle={handleLoginGoogle}
        onSignOut={handleSignOut}
        driveAccessToken={driveAccessToken}
        isDriveSyncing={isDriveSyncing}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenCloudServer={() => {
          setAdminModalTab('cloud');
          setIsAdminLogsModalOpen(true);
        }}
        onSaveDraft={handleSaveInvoice}
        onExportPDF={handleExportPDF}
        isExportingPDF={isExportingPDF}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        onNewInvoice={handleNewInvoice}
        onLoadSample={handleResetSample}
        onDownloadJSON={handleDownloadJSON}
        onOpenHistoryModal={() => {
          setSavedModalTab('history');
          setIsSavedModalOpen(true);
        }}
        onOpenReportsModal={() => {
          setSavedModalTab('reports');
          setIsSavedModalOpen(true);
        }}
        onOpenCompaniesModal={() => setIsCompanyModalOpen(true)}
        onOpenClientsModal={() => setIsClientModalOpen(true)}
        onOpenAdminPanel={() => {
          setAdminModalTab('users');
          setIsAdminLogsModalOpen(true);
        }}
        savedInvoicesCount={savedInvoices.length}
        savedCompaniesCount={savedCompanies.length}
        savedClientsCount={savedClients.length}
      />

      {/* GOOGLE DRIVE SYNC MODAL */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        user={googleUser}
        accessToken={driveAccessToken}
        isAutoSaveEnabled={isDriveAutoSaveEnabled}
        onToggleAutoSave={handleToggleAutoSave}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        onSyncNow={handleManualDriveSync}
        isSyncing={isDriveSyncing}
        lastSyncResult={lastDriveSyncResult}
        t={t}
      />

      {/* SAVED INVOICES & REPORTS MODAL */}
      <SavedInvoicesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedInvoices={savedInvoices}
        currentInvoiceId={invoice.id}
        onSelectInvoice={(selected) => setInvoice(selected)}
        onDeleteInvoice={handleDeleteInvoice}
        onBatchDeleteInvoices={handleBatchDeleteInvoices}
        onClearAllInvoices={handleClearAllInvoices}
        onDuplicateInvoice={handleDuplicateInvoice}
        onImportInvoice={handleImportInvoice}
        t={t}
        initialTab={savedModalTab}
      />

      {/* COMPANY / SENDER DIRECTORY MODAL */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companies={savedCompanies}
        currentCompany={invoice.sender}
        onSelectCompany={handleSelectCompany}
        onSaveCompany={handleSaveCompany}
        onDeleteCompany={handleDeleteCompany}
        t={t}
      />

      {/* CLIENT / RECIPIENT DIRECTORY MODAL */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={savedClients}
        currentClient={invoice.client}
        onSelectClient={handleSelectClient}
        onSaveClient={handleSaveClient}
        onDeleteClient={handleDeleteClient}
        t={t}
      />

      {/* ADMIN USER ACCESS & LOGIN AUDIT MODAL (Exclusively for psgss91@gmail.com) */}
      <AdminLoginLogsModal
        isOpen={isAdminLogsModalOpen}
        onClose={() => setIsAdminLogsModalOpen(false)}
        records={loginRecords}
        onRecordsUpdated={(updated) => setLoginRecords(updated)}
        t={t}
        initialTab={adminModalTab}
        user={googleUser}
        driveAccessToken={driveAccessToken}
        onSyncAllToCloud={handleSyncAllToCloud}
        onRestoreFromCloud={handleRestoreFromCloud}
        isCloudSyncing={isCloudSyncing}
        lastCloudSync={lastCloudSync}
        savedInvoicesCount={savedInvoices.length}
        savedClientsCount={savedClients.length}
        savedCompaniesCount={savedCompanies.length}
        onConnectGoogle={handleConnectGoogle}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
