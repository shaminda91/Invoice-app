export type AppLanguage = 'en' | 'si';

export interface Translations {
  appName: string;
  appBadge: string;
  saved: string;
  newInvoice: string;
  loadSample: string;
  savePdf: string;
  saveExcel: string;
  print: string;
  backupJson: string;
  importJson: string;
  saveDraft: string;
  editTab: string;
  previewTab: string;
  bothTab: string;
  phoneFit: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  livePreview: string;
  a4Sheet: string;
  
  // Toast notifications
  toastSaved: string;
  toastNewCreated: string;
  toastSampleLoaded: string;
  toastGeneratingPdf: string;
  toastPdfSaved: string;
  toastPdfFailed: string;
  toastExcelSaved: string;
  toastExcelFailed: string;
  toastJsonDownloaded: string;
  toastJsonImported: string;
  toastJsonError: string;
  toastInvoiceDeleted: string;
  toastDuplicated: string;

  // Template & Style
  styleAndTemplate: string;
  modernClean: string;
  modernDesc: string;
  classicCorporate: string;
  classicDesc: string;
  minimalEditorial: string;
  minimalDesc: string;
  executiveHeader: string;
  executiveDesc: string;
  accentColor: string;
  currency: string;
  paymentStatus: string;
  quickDueDate: string;
  statusDraft: string;
  statusPending: string;
  statusPaid: string;
  statusOverdue: string;
  today: string;
  net7: string;
  net14: string;
  net30: string;
  net60: string;

  // Reference & Dates
  referenceAndDates: string;
  regenerateNumber: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;

  // Sender / Business
  businessFrom: string;
  addLogo: string;
  removeLogo: string;
  businessName: string;
  businessNamePlaceholder: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxVatId: string;
  website: string;

  // Client
  clientBillTo: string;
  clientName: string;
  clientNamePlaceholder: string;
  companyName: string;
  companyPlaceholder: string;
  clientEmail: string;
  clientPhone: string;
  billingAddress: string;
  addDifferentShipping: string;
  shippingAddress: string;
  shippingPlaceholder: string;

  // Line Items
  lineItems: string;
  addItem: string;
  itemName: string;
  itemNamePlaceholder: string;
  itemDetails: string;
  itemDetailsPlaceholder: string;
  qty: string;
  unit: string;
  price: string;
  rowTotal: string;
  duplicateItem: string;
  deleteItem: string;
  quickAddPresets: string;
  presetWebDev: string;
  presetConsulting: string;
  presetHosting: string;
  presetMaintenance: string;
  presetGraphicDesign: string;

  // Financial adjustments
  financialAdjustments: string;
  discount: string;
  taxVat: string;
  shippingFee: string;
  amountPaid: string;

  // Notes, Terms & Signature
  notesTermsSignature: string;
  notesToRecipient: string;
  notesPlaceholder: string;
  termsConditions: string;
  termsPlaceholder: string;
  signatoryName: string;
  signatoryPlaceholder: string;

  // Invoice Document (Preview/Print/PDF)
  docInvoice: string;
  docFrom: string;
  docBilledTo: string;
  docShipTo: string;
  docInvoiceDate: string;
  docDueDate: string;
  docCurrency: string;
  docItemDescription: string;
  docQty: string;
  docRate: string;
  docAmount: string;
  docNoItems: string;
  docNotes: string;
  docTerms: string;
  docSubtotal: string;
  docDiscount: string;
  docTax: string;
  docShipping: string;
  docTotal: string;
  docAmountPaid: string;
  docBalanceDue: string;
  docQuestions: string;
  docContact: string;
  docOrCall: string;
  docAuthorizedSignatory: string;
  docThankYou: string;
  docPrintLanguage: string;
  docLanguageHint: string;

  // Saved Modal
  savedInvoicesTitle: string;
  savedInvoicesDesc: string;
  searchPlaceholder: string;
  filterAll: string;
  filterDraft: string;
  filterPending: string;
  filterPaid: string;
  filterOverdue: string;
  noInvoicesFound: string;
  openInvoice: string;
  duplicate: string;
  delete: string;
  currentActive: string;
  createdOn: string;
  exportExcelTooltip: string;

  // Convenience aliases and App layout
  invoice: string;
  from: string;
  billedTo: string;
  shipTo: string;
  invoiceDate: string;
  paymentDueDate: string;
  itemAndDescription: string;
  rate: string;
  amount: string;
  noItemsYet: string;
  notes: string;
  subtotal: string;
  total: string;
  balanceDue: string;
  questionsOrInquiries: string;
  contact: string;
  authorizedSignatory: string;
  thankYouForPartnership: string;
  draft: string;
  pending: string;
  paid: string;
  overdue: string;
  all: string;
  open: string;
  close: string;
  cancel: string;
  logo: string;
  items: string;
  storedLocally: string;
  invoicesWillAppearHere: string;
  trySearchingDifferent: string;
  currentlyEditing: string;
  quickAndProfessional: string;
  appSubtitle: string;
  edit: string;
  preview: string;
  excel: string;
  pdf: string;
  invoiceDetailsAndContent: string;
  editFieldsLive: string;
  switchLanguage: string;
  sinhala: string;
  english: string;

  // Google Drive
  googleDrive: string;
  driveAutoSave: string;
  driveConnected: string;
  driveNotConnected: string;
  connectGoogleDrive: string;
  disconnectDrive: string;
  drivePermissionTitle: string;
  drivePermissionDesc: string;
  driveSyncing: string;
  driveSyncedJustNow: string;
  driveLastSynced: string;
  driveSyncNow: string;
  driveOpenFolder: string;
  driveAutoSaveEnabled: string;
  driveAutoSaveDisabled: string;
  signInWithGoogle: string;
  connectingGoogle: string;
  phonePermissionNotice: string;
  driveFolderCreated: string;
  toastDriveSaved: string;
  toastDriveFailed: string;

  // Cloud Server & App Updates
  cloudServer: string;
  cloudServerAdmin: string;
  cloudServerDesc: string;
  syncAllToCloud: string;
  syncAllToCloudDesc: string;
  pullFromCloud: string;
  pullFromCloudDesc: string;
  publishAppUpdate: string;
  publishAppUpdateDesc: string;
  appUpdateCenter: string;
  cloudServerActive: string;
  cloudMasterDatabase: string;
  cloudServerSyncedSuccess: string;
  cloudServerRestoredSuccess: string;
  cloudUpdatePublishedSuccess: string;

  // Saved Companies & Clients Directory
  savedCompanies: string;
  savedClients: string;
  saveCurrentCompany: string;
  saveCurrentClient: string;
  addNewCompany: string;
  addNewClient: string;
  editCompany: string;
  editClient: string;
  selectCompany: string;
  selectClient: string;
  searchCompanies: string;
  searchClients: string;
  applyToInvoice: string;
  manageCompanies: string;
  manageClients: string;
  setDefaultCompany: string;
  defaultBadge: string;
  deleteProfileConfirm: string;
  companySavedSuccess: string;
  companyUpdatedSuccess: string;
  companyDeletedSuccess: string;
  companyAppliedSuccess: string;
  clientSavedSuccess: string;
  clientUpdatedSuccess: string;
  clientDeletedSuccess: string;
  clientAppliedSuccess: string;
  noSavedCompanies: string;
  noSavedClients: string;
  clientShippingAddress: string;
  sameAsBilling: string;

  // Login & Admin Tracking
  login: string;
  loginTitle: string;
  loginSubtitle: string;
  continueAsGuest: string;
  loginBenefit1Title: string;
  loginBenefit1Desc: string;
  loginBenefit2Title: string;
  loginBenefit2Desc: string;
  loginBenefit3Title: string;
  loginBenefit3Desc: string;
  loginBenefit4Title: string;
  loginBenefit4Desc: string;
  adminTrackingNotice: string;
  loginSuccess: string;
  logout: string;
  logoutConfirm: string;
  loggedInAs: string;
  adminBadge: string;
  loginHistory: string;
  loginHistoryTitle: string;
  loginHistorySubtitle: string;
  totalLogins: string;
  uniqueUsers: string;
  lastLogin: string;
  exportCSV: string;
  emailReportToAdmin: string;
  clearHistory: string;
  noLoginsYet: string;
  deviceAndBrowser: string;
  adminSavedToNotice: string;

  // Invoice History, Batch Delete & Periodic Reports (7 Days, Monthly, Quarterly, Yearly)
  invoiceHistory: string;
  invoiceHistoryAndReports: string;
  reportsAndAnalytics: string;
  historyTab: string;
  reportsTab: string;
  deleteInvoice: string;
  deleteConfirm: string;
  batchDelete: string;
  batchDeleteConfirm: string;
  clearAllInvoices: string;
  clearAllConfirm: string;
  selectedCount: string;
  selectAll: string;
  deselectAll: string;
  reportPeriod: string;
  last7Days: string;
  monthly: string;
  quarterly: string;
  yearly: string;
  allTime: string;
  customRange: string;
  startDate: string;
  endDate: string;
  totalRevenue: string;
  totalPaid: string;
  totalPending: string;
  totalOverdue: string;
  totalInvoicesCount: string;
  averageInvoiceValue: string;
  exportReportExcel: string;
  exportReportCSV: string;
  printReport: string;
  periodSummary: string;
  topClients: string;
  invoicesInPeriod: string;
  noInvoicesInPeriod: string;
  toastBatchDeleted: string;
  toastAllDeleted: string;
  statusBreakdown: string;
  collectionRate: string;

  // Admin & User Access Days Control
  adminPanel: string;
  userAccessControl: string;
  defaultAllowedDays: string;
  setDefaultDaysPrompt: string;
  saveDefaultDays: string;
  registeredUsers: string;
  activeUsers: string;
  expiredUsers: string;
  daysRemaining: string;
  daysAllowed: string;
  addDays: string;
  grant7Days: string;
  grant30Days: string;
  setExactDays: string;
  makeUnlimited: string;
  removeUnlimited: string;
  expireNow: string;
  blockUser: string;
  unblockUser: string;
  accessExpiredTitle: string;
  accessExpiredSubtitle: string;
  emailAdminToRenew: string;
  checkUpdatedStatus: string;
  userDaysUpdatedSuccess: string;
  settingsSavedSuccess: string;
  adminOnlyNotice: string;

  // Responsive & Auto-Fit
  autoFit: string;
  autoFitDesc: string;
  fitToScreen: string;
  mobileMenu: string;
  mobileMenuTitle: string;
  phoneTabletOptimized: string;
  allActions: string;
}

export const translations: Record<AppLanguage, Translations> = {
  en: {
    appName: 'PS Invoice',
    appBadge: 'Quick & Professional',
    saved: 'Saved',
    newInvoice: 'New Invoice',
    loadSample: 'Load Sample',
    savePdf: 'Save PDF',
    saveExcel: 'Save Excel (.xlsx)',
    print: 'Print',
    backupJson: 'Backup JSON',
    importJson: 'Import JSON',
    saveDraft: 'Save',
    editTab: 'Edit',
    previewTab: 'Preview',
    bothTab: 'Both',
    phoneFit: 'Phone Fit',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    livePreview: 'Live Preview',
    a4Sheet: 'A4 Document',

    // Toasts
    toastSaved: 'Invoice saved locally',
    toastNewCreated: 'New invoice initialized',
    toastSampleLoaded: 'Sample invoice loaded',
    toastGeneratingPdf: 'Generating PDF...',
    toastPdfSaved: 'PDF saved successfully',
    toastPdfFailed: 'PDF export failed, opening print dialog',
    toastExcelSaved: 'Excel saved successfully',
    toastExcelFailed: 'Failed to export Excel file',
    toastJsonDownloaded: 'JSON backup downloaded',
    toastJsonImported: 'Invoice imported successfully',
    toastJsonError: 'Invalid JSON invoice file',
    toastInvoiceDeleted: 'Invoice deleted',
    toastDuplicated: 'Invoice duplicated',

    // Template & Style
    styleAndTemplate: 'Invoice Style & Template',
    modernClean: 'Modern Clean',
    modernDesc: 'Contemporary layout with subtle accents',
    classicCorporate: 'Classic Corporate',
    classicDesc: 'Formal grid, serif header, authoritative',
    minimalEditorial: 'Clean Editorial',
    minimalDesc: 'High typographic contrast, refined rules',
    executiveHeader: 'Executive Header',
    executiveDesc: 'Bold colored banner with prominent badges',
    accentColor: 'Accent Color',
    currency: 'Currency',
    paymentStatus: 'Payment Status',
    quickDueDate: 'Quick Due Date',
    statusDraft: 'Draft',
    statusPending: 'Pending',
    statusPaid: 'Paid',
    statusOverdue: 'Overdue',
    today: 'Today',
    net7: 'Net 7',
    net14: 'Net 14',
    net30: 'Net 30',
    net60: 'Net 60',

    // Reference & Dates
    referenceAndDates: 'Invoice Reference & Dates',
    regenerateNumber: 'Regenerate #',
    invoiceNumber: 'Invoice Number',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',

    // Sender
    businessFrom: 'Your Business (From)',
    addLogo: '+ Add Logo',
    removeLogo: 'Remove',
    businessName: 'Company / Your Name',
    businessNamePlaceholder: 'e.g. Apex Studio Ltd',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    postalCode: 'Postal Code',
    country: 'Country',
    taxVatId: 'Tax / VAT / Business ID',
    website: 'Website',

    // Client
    clientBillTo: 'Client / Customer (Bill To)',
    clientName: 'Client Name',
    clientNamePlaceholder: 'e.g. Kasun Jayawardena',
    companyName: 'Company / Organization (Optional)',
    companyPlaceholder: 'Horizon Retailers Pvt Ltd',
    clientEmail: 'Client Email',
    clientPhone: 'Client Phone',
    billingAddress: 'Billing Address',
    addDifferentShipping: 'Add different Shipping Address',
    shippingAddress: 'Shipping Address',
    shippingPlaceholder: 'Delivery address instructions...',

    // Line Items
    lineItems: 'Line Items',
    addItem: 'Add Item',
    itemName: 'Item Name / Description',
    itemNamePlaceholder: 'e.g. Website Design & Development',
    itemDetails: 'Details / Subtext',
    itemDetailsPlaceholder: 'Optional details (e.g. 3 revisions included)',
    qty: 'Qty',
    unit: 'Unit',
    price: 'Price',
    rowTotal: 'Row Total',
    duplicateItem: 'Duplicate item',
    deleteItem: 'Delete item',
    quickAddPresets: 'Quick add sample line items:',
    presetWebDev: 'Web Development & Design',
    presetConsulting: 'Consulting & Strategy Services',
    presetHosting: 'Domain & Cloud Server Hosting (Annual)',
    presetMaintenance: 'Monthly Maintenance & Technical Support',
    presetGraphicDesign: 'Graphic Design & Brand Assets',

    // Financial adjustments
    financialAdjustments: 'Financial Adjustments & Payments',
    discount: 'Discount',
    taxVat: 'Tax / VAT (%)',
    shippingFee: 'Shipping / Delivery',
    amountPaid: 'Amount Paid',

    // Notes, Terms & Signature
    notesTermsSignature: 'Notes, Terms & Signature',
    notesToRecipient: 'Notes to Recipient',
    notesPlaceholder: 'e.g. Thank you for your business! Bank deposit: Commercial Bank Acc 800...',
    termsConditions: 'Terms & Conditions',
    termsPlaceholder: 'e.g. Payment due within 14 days. 1.5% interest on overdue balances.',
    signatoryName: 'Signatory Name / Designation',
    signatoryPlaceholder: 'e.g. Authorized Signatory / Director',

    // Invoice Document
    docInvoice: 'INVOICE',
    docFrom: 'From',
    docBilledTo: 'Billed To',
    docShipTo: 'Ship To',
    docInvoiceDate: 'Invoice Date',
    docDueDate: 'Payment Due Date',
    docCurrency: 'Currency',
    docItemDescription: 'Item & Description',
    docQty: 'Qty',
    docRate: 'Rate',
    docAmount: 'Amount',
    docNoItems: 'No items added yet',
    docNotes: 'Notes',
    docTerms: 'Terms & Conditions',
    docSubtotal: 'Subtotal',
    docDiscount: 'Discount',
    docTax: 'Tax / VAT',
    docShipping: 'Shipping / Delivery',
    docTotal: 'Total',
    docAmountPaid: 'Amount Paid',
    docBalanceDue: 'Balance Due',
    docQuestions: 'Questions or inquiries?',
    docContact: 'Contact',
    docOrCall: 'or call',
    docAuthorizedSignatory: 'Authorized Signatory',
    docThankYou: 'Thank you for your business.',
    docPrintLanguage: 'Document Language',
    docLanguageHint: 'Language used on the invoice paper',

    // Saved Modal
    savedInvoicesTitle: 'Saved Invoices',
    savedInvoicesDesc: 'invoices stored locally in browser',
    searchPlaceholder: 'Search by invoice #, client, or company...',
    filterAll: 'All',
    filterDraft: 'Draft',
    filterPending: 'Pending',
    filterPaid: 'Paid',
    filterOverdue: 'Overdue',
    noInvoicesFound: 'No invoices found matching your criteria.',
    openInvoice: 'Open',
    duplicate: 'Duplicate',
    delete: 'Delete',
    currentActive: 'Active',
    createdOn: 'Created',
    exportExcelTooltip: 'Download as Excel (.xlsx)',

    // Aliases & Header
    invoice: 'INVOICE',
    from: 'From',
    billedTo: 'Billed To',
    shipTo: 'Ship To',
    invoiceDate: 'Invoice Date',
    paymentDueDate: 'Payment Due Date',
    itemAndDescription: 'Item & Description',
    rate: 'Rate',
    amount: 'Amount',
    noItemsYet: 'No items added yet',
    notes: 'Notes',
    subtotal: 'Subtotal',
    total: 'Total',
    balanceDue: 'Balance Due',
    questionsOrInquiries: 'Questions or inquiries?',
    contact: 'Contact',
    authorizedSignatory: 'Authorized Signatory',
    thankYouForPartnership: 'Thank you for your partnership.',
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue',
    all: 'All',
    open: 'Open',
    close: 'Close',
    cancel: 'Cancel',
    logo: 'Logo',
    items: 'items',
    storedLocally: 'invoices stored locally',
    invoicesWillAppearHere: 'Invoices you create and save will appear here.',
    trySearchingDifferent: 'Try searching with a different keyword.',
    currentlyEditing: 'Currently Editing',
    quickAndProfessional: 'Quick & Professional',
    appSubtitle: 'Create, customize & print invoices in seconds',
    edit: 'Edit',
    preview: 'Preview',
    excel: 'Excel',
    pdf: 'PDF',
    invoiceDetailsAndContent: 'Invoice Details & Content',
    editFieldsLive: 'Edit fields to see live changes on right',
    switchLanguage: 'Language',
    sinhala: 'සිංහල',
    english: 'English',

    // Google Drive
    googleDrive: 'Google Drive',
    driveAutoSave: 'Google Drive Auto-Save',
    driveConnected: 'Drive Connected',
    driveNotConnected: 'Connect Google Drive',
    connectGoogleDrive: 'Connect Google Drive',
    disconnectDrive: 'Disconnect Drive',
    drivePermissionTitle: 'Google Drive Permission',
    drivePermissionDesc: 'Allow the app to automatically back up your invoices directly into your Google Drive.',
    driveSyncing: 'Syncing to Google Drive...',
    driveSyncedJustNow: 'Synced to Google Drive just now',
    driveLastSynced: 'Last synced to Drive:',
    driveSyncNow: 'Sync to Drive Now',
    driveOpenFolder: 'Open in Google Drive',
    driveAutoSaveEnabled: 'Drive Auto-Save is ON',
    driveAutoSaveDisabled: 'Drive Auto-Save is OFF',
    signInWithGoogle: 'Sign in with Google',
    connectingGoogle: 'Connecting to Google...',
    phonePermissionNotice: 'Sign in from your phone or browser to give permission to save invoices directly to your Google Drive.',
    driveFolderCreated: 'Saved to "PS Invoice - Backup" folder in your Drive',
    toastDriveSaved: 'Saved to Google Drive successfully',
    toastDriveFailed: 'Failed to sync to Google Drive',

    // Cloud Server & App Updates
    cloudServer: 'Cloud Server',
    cloudServerAdmin: 'Master Cloud Server (psgss91@gmail.com)',
    cloudServerDesc: 'All application invoices, clients, settings, and user login logs are centrally stored in psgss91@gmail.com Google Drive.',
    syncAllToCloud: 'Sync All App Data to Cloud Server',
    syncAllToCloudDesc: 'Pushes a complete master database snapshot to psgss91@gmail.com Google Drive.',
    pullFromCloud: 'Update App from Cloud Server',
    pullFromCloudDesc: 'Pulls the latest invoices, clients, and settings from psgss91@gmail.com Google Drive into this app.',
    publishAppUpdate: 'Publish App Update to Drive',
    publishAppUpdateDesc: 'Publishes a new application update manifest and release notes to Google Drive.',
    appUpdateCenter: 'App Update Center',
    cloudServerActive: 'Cloud Server Active (psgss91@gmail.com)',
    cloudMasterDatabase: 'Master Cloud Database',
    cloudServerSyncedSuccess: 'Full application data successfully backed up to psgss91@gmail.com Cloud Server',
    cloudServerRestoredSuccess: 'Application successfully updated with latest data from Cloud Server',
    cloudUpdatePublishedSuccess: 'App update manifest published to Google Drive successfully',

    // Saved Companies & Clients Directory
    savedCompanies: 'Saved Companies',
    savedClients: 'Saved Clients',
    saveCurrentCompany: 'Save Current Business',
    saveCurrentClient: 'Save Current Client',
    addNewCompany: 'Add New Company',
    addNewClient: 'Add New Client',
    editCompany: 'Edit Company Profile',
    editClient: 'Edit Client Details',
    selectCompany: 'Select Company',
    selectClient: 'Select Client',
    searchCompanies: 'Search companies...',
    searchClients: 'Search clients by name, company, email, phone...',
    applyToInvoice: 'Apply to Invoice',
    manageCompanies: 'Manage Companies',
    manageClients: 'Manage Clients',
    setDefaultCompany: 'Set as Default Company',
    defaultBadge: 'Default',
    deleteProfileConfirm: 'Are you sure you want to delete this profile?',
    companySavedSuccess: 'Company profile saved to your directory',
    companyUpdatedSuccess: 'Company profile updated',
    companyDeletedSuccess: 'Company profile removed',
    companyAppliedSuccess: 'Company details applied to invoice',
    clientSavedSuccess: 'Client profile saved to your directory',
    clientUpdatedSuccess: 'Client details updated',
    clientDeletedSuccess: 'Client removed',
    clientAppliedSuccess: 'Client details applied to invoice',
    noSavedCompanies: 'No saved companies yet. Add your first business profile to reuse anytime.',
    noSavedClients: 'No saved clients yet. Add your clients to quickly insert them into invoices.',
    clientShippingAddress: 'Shipping / Delivery Address',
    sameAsBilling: 'Same as Billing Address',

    // Login & Admin Tracking
    login: 'Login',
    loginTitle: 'Welcome to PS Invoice',
    loginSubtitle: 'Professional invoice generator with Google Drive cloud backup',
    continueAsGuest: 'Continue as Guest (No Cloud Sync)',
    loginBenefit1Title: 'Instant PDF & Excel Export',
    loginBenefit1Desc: 'Generate and download print-ready A4 invoices with one click.',
    loginBenefit2Title: 'Google Drive Auto-Save',
    loginBenefit2Desc: 'Invoices automatically back up safely to your personal Google Drive.',
    loginBenefit3Title: 'Company & Client Directory',
    loginBenefit3Desc: 'Save reusable business profiles and recipient addresses.',
    loginBenefit4Title: 'Bilingual Support (සිංහල / English)',
    loginBenefit4Desc: 'Seamlessly switch languages and create localized invoices.',
    adminTrackingNotice: 'Login activity is securely logged and monitored for administration (psgss91@gmail.com).',
    loginSuccess: 'Successfully signed in with Google!',
    logout: 'Sign Out',
    logoutConfirm: 'Are you sure you want to sign out?',
    loggedInAs: 'Signed in as',
    adminBadge: 'Admin / Owner',
    loginHistory: 'Login Activity',
    loginHistoryTitle: 'User Login Audit Records',
    loginHistorySubtitle: 'All user logins are monitored and recorded for psgss91@gmail.com',
    totalLogins: 'Total Logins',
    uniqueUsers: 'Unique Users',
    lastLogin: 'Last Login',
    exportCSV: 'Export CSV',
    emailReportToAdmin: 'Send Report to psgss91@gmail.com',
    clearHistory: 'Clear Records',
    noLoginsYet: 'No user logins recorded yet.',
    deviceAndBrowser: 'Device & Browser',
    adminSavedToNotice: 'All logins are recorded and saved for psgss91@gmail.com',

    // Invoice History, Batch Delete & Periodic Reports (7 Days, Monthly, Quarterly, Yearly)
    invoiceHistory: 'Invoice History',
    invoiceHistoryAndReports: 'Invoice History & Reports',
    reportsAndAnalytics: 'Financial Reports & Analytics',
    historyTab: 'Invoice History',
    reportsTab: 'Reports (7 Days / Monthly / Yearly)',
    deleteInvoice: 'Delete Invoice',
    deleteConfirm: 'Are you sure you want to delete this invoice?',
    batchDelete: 'Delete Selected',
    batchDeleteConfirm: 'Are you sure you want to delete the selected invoices?',
    clearAllInvoices: 'Clear All Invoices',
    clearAllConfirm: 'Are you sure you want to permanently delete all saved invoices? This action cannot be undone.',
    selectedCount: 'selected',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    reportPeriod: 'Report Period',
    last7Days: 'Last 7 Days',
    monthly: 'Monthly (30 Days)',
    quarterly: 'Quarterly (3 Months)',
    yearly: 'Yearly (1 Year)',
    allTime: 'All Time',
    customRange: 'Custom Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    totalRevenue: 'Total Invoiced Amount',
    totalPaid: 'Total Paid Received',
    totalPending: 'Pending / Due Amount',
    totalOverdue: 'Overdue Amount',
    totalInvoicesCount: 'Total Invoices',
    averageInvoiceValue: 'Average Invoice Value',
    exportReportExcel: 'Export Report (.xlsx)',
    exportReportCSV: 'Export Report (.csv)',
    printReport: 'Print / Save PDF Report',
    periodSummary: 'Period Summary',
    topClients: 'Top Clients by Revenue',
    invoicesInPeriod: 'Invoices in Selected Period',
    noInvoicesInPeriod: 'No invoices found for the selected period.',
    toastBatchDeleted: 'Selected invoices deleted successfully',
    toastAllDeleted: 'All saved invoices deleted',
    statusBreakdown: 'Payment Status Breakdown',
    collectionRate: 'Collection Rate',

    // Admin & User Access Days Control
    adminPanel: 'Admin Control Panel',
    userAccessControl: 'User Access & Allowed Days',
    defaultAllowedDays: 'Default Access Days for New Users',
    setDefaultDaysPrompt: 'Allowed days for new user registrations',
    saveDefaultDays: 'Save Default Days',
    registeredUsers: 'Registered Users',
    activeUsers: 'Active Users',
    expiredUsers: 'Expired Users',
    daysRemaining: 'Days Left',
    daysAllowed: 'Allowed Days',
    addDays: 'Add Days',
    grant7Days: '+7 Days',
    grant30Days: '+30 Days',
    setExactDays: 'Set Days',
    makeUnlimited: 'Unlimited',
    removeUnlimited: 'Revert to Days',
    expireNow: 'Expire Now',
    blockUser: 'Block',
    unblockUser: 'Unblock',
    accessExpiredTitle: 'Access Period Expired',
    accessExpiredSubtitle: 'Your trial period has concluded. Please contact the administrator to renew.',
    emailAdminToRenew: 'Email Admin (psgss91@gmail.com) to Renew',
    checkUpdatedStatus: 'Check Updated Status',
    userDaysUpdatedSuccess: 'User access period updated successfully',
    settingsSavedSuccess: 'Default access settings saved successfully',
    adminOnlyNotice: 'Only psgss91@gmail.com has Administrator access privileges.',

    // Responsive & Auto-Fit
    autoFit: 'Auto Fit',
    autoFitDesc: 'Automatically scale to fit phone or tablet screen',
    fitToScreen: 'Fit to Screen',
    mobileMenu: 'Menu',
    mobileMenuTitle: 'Menu & Quick Actions',
    phoneTabletOptimized: 'Phone & Tablet Ready',
    allActions: 'All Tools & Features',
  },

  si: {
    appName: 'PS Invoice',
    appBadge: 'පහසු සහ වෘත්තීය',
    saved: 'සුරැකි ලිපිගොනු',
    newInvoice: 'නව ඉන්වොයිසිය',
    loadSample: 'ආදර්ශ දත්ත',
    savePdf: 'PDF බාගන්න',
    saveExcel: 'Excel (.xlsx) බාගන්න',
    print: 'මුද්‍රණය',
    backupJson: 'JSON පිටපතක්',
    importJson: 'JSON ඇතුළත් කරන්න',
    saveDraft: 'සුරකින්න',
    editTab: 'සංස්කරණය',
    previewTab: 'පෙරදසුන',
    bothTab: 'දෙකම',
    phoneFit: 'දුරකථනයට ගළපන්න',
    zoomIn: 'විශාල කරන්න',
    zoomOut: 'කුඩා කරන්න',
    resetZoom: 'මුල් ප්‍රමාණය',
    livePreview: 'සජීවී පෙරදසුන',
    a4Sheet: 'A4 පත්‍රිකාව',

    // Toasts
    toastSaved: 'ඉන්වොයිසිය සාර්ථකව සුරැකිණි',
    toastNewCreated: 'නව ඉන්වොයිසියක් ආරම්භ විය',
    toastSampleLoaded: 'ආදර්ශ ඉන්වොයිසිය පූරණය විය',
    toastGeneratingPdf: 'PDF සකස් වෙමින් පවතී...',
    toastPdfSaved: 'PDF ගොනුව බාගත විය',
    toastPdfFailed: 'PDF සෑදීම අසාර්ථක විය, මුද්‍රණ කවුළුව විවෘත වේ',
    toastExcelSaved: 'Excel (.xlsx) ගොනුව සාර්ථකව බාගත විය',
    toastExcelFailed: 'Excel ගොනුව සෑදීම අසාර්ථක විය',
    toastJsonDownloaded: 'JSON ගොනුව බාගත විය',
    toastJsonImported: 'ඉන්වොයිසිය සාර්ථකව ආනයනය කරන ලදී',
    toastJsonError: 'අවලංගු JSON ගොනුවකි',
    toastInvoiceDeleted: 'ඉන්වොයිසිය ඉවත් කරන ලදී',
    toastDuplicated: 'ඉන්වොයිසියේ අනුපිටපතක් සෑදිණි',

    // Template & Style
    styleAndTemplate: 'ඉන්වොයිස් මෝස්තරය සහ ආකෘතිය',
    modernClean: 'නූතන මෝස්තරය',
    modernDesc: 'පැහැදිලි සහ ආකර්ෂණීය නවීන පෙනුම',
    classicCorporate: 'සම්භාව්‍ය ව්‍යාපාරික',
    classicDesc: 'විධිමත් ආයතනික ආකෘතියක්',
    minimalEditorial: 'සරල මෝස්තරය',
    minimalDesc: 'අවම මෝස්තර සහිත පැහැදිලි අකුරු රටා',
    executiveHeader: 'විධායක මෝස්තරය',
    executiveDesc: 'වර්ණවත් ශීර්ෂ බැනරයක් සහිත පෙනුම',
    accentColor: 'ප්‍රධාන වර්ණය (Accent)',
    currency: 'මුදල් ඒකකය (Currency)',
    paymentStatus: 'ගෙවීම් තත්ත්වය',
    quickDueDate: 'ගෙවිය යුතු දිනය පහසුවෙන් තෝරන්න',
    statusDraft: 'කෙටුම්පත',
    statusPending: 'ගෙවීමට ඇති',
    statusPaid: 'ගෙවා අවසන්',
    statusOverdue: 'කල් ඉකුත් වූ',
    today: 'අද දින',
    net7: 'දින 7 කින්',
    net14: 'දින 14 කින්',
    net30: 'දින 30 කින්',
    net60: 'දින 60 කින්',

    // Reference & Dates
    referenceAndDates: 'ඉන්වොයිස් අංකය සහ දිනයන්',
    regenerateNumber: 'නව අංකයක්',
    invoiceNumber: 'ඉන්වොයිස් අංකය',
    issueDate: 'නිකුත් කළ දිනය',
    dueDate: 'ගෙවිය යුතු දිනය',

    // Sender
    businessFrom: 'ඔබගේ ව්‍යාපාරය (නිකුත් කරන්නා)',
    addLogo: '+ ලාංඡනය (Logo)',
    removeLogo: 'ඉවත් කරන්න',
    businessName: 'ව්‍යාපාරයේ / ඔබගේ නම',
    businessNamePlaceholder: 'උදා: ඇපෙක්ස් ස්ටුඩියෝ',
    email: 'විද්‍යුත් තැපෑල (Email)',
    phone: 'දුරකථන අංකය',
    address: 'ලිපිනය',
    city: 'නගරය',
    postalCode: 'තැපැල් කේතය',
    country: 'රට',
    taxVatId: 'බදු / වැට් (VAT) අංකය',
    website: 'වෙබ් අඩවිය',

    // Client
    clientBillTo: 'ගනුදෙනුකරු (ලබන්නා / Bill To)',
    clientName: 'ගනුදෙනුකරුගේ නම',
    clientNamePlaceholder: 'උදා: කසුන් ජයවර්ධන',
    companyName: 'සමාගමේ නම (අවශ්‍ය නම්)',
    companyPlaceholder: 'උදා: හොරයිසන් ට්‍රේඩර්ස්',
    clientEmail: 'ගනුදෙනුකරුගේ විද්‍යුත් තැපෑල',
    clientPhone: 'දුරකථන අංකය',
    billingAddress: 'බිල්පත් ලිපිනය',
    addDifferentShipping: 'වෙනත් බෙදාහැරීමේ ලිපිනයක් එක් කරන්න',
    shippingAddress: 'බෙදාහැරීමේ ලිපිනය',
    shippingPlaceholder: 'බෙදාහැරිය යුතු ස්ථානයේ ලිපිනය සහ උපදෙස්...',

    // Line Items
    lineItems: 'භාණ්ඩ හා සේවා විස්තර',
    addItem: 'අයිතමයක් එක් කරන්න',
    itemName: 'අයිතමය / සේවාවේ නම',
    itemNamePlaceholder: 'උදා: වෙබ් අඩවි නිර්මාණය සහ නඩත්තුව',
    itemDetails: 'අමතර විස්තර / සටහන්',
    itemDetailsPlaceholder: 'අමතර කරුණු (උදා: සංශෝධන 3ක් ඇතුළත් වේ)',
    qty: 'ප්‍රමාණය',
    unit: 'ඒකකය',
    price: 'ඒකක මිල',
    rowTotal: 'මුළු මුදල',
    duplicateItem: 'අනුපිටපත් කරන්න',
    deleteItem: 'ඉවත් කරන්න',
    quickAddPresets: 'පහසුවෙන් එක් කළ හැකි ආදර්ශ අයිතම:',
    presetWebDev: 'වෙබ් අඩවි නිර්මාණය (Web Development)',
    presetConsulting: 'උපදේශන සේවා (Consulting)',
    presetHosting: 'ඩොමේන් සහ හෝස්ටින් (Hosting)',
    presetMaintenance: 'තාක්ෂණික නඩත්තු සේවා (Maintenance)',
    presetGraphicDesign: 'ග්‍රැෆික් මෝස්තර නිර්මාණය (Graphic Design)',

    // Financial adjustments
    financialAdjustments: 'මූල්‍ය ගැලපීම් සහ ගෙවීම්',
    discount: 'වට්ටම් (Discount)',
    taxVat: 'බදු / වැට් (VAT %)',
    shippingFee: 'ප්‍රවාහන / බෙදාහැරීමේ ගාස්තු',
    amountPaid: 'දැනට ගෙවූ මුදල',

    // Notes, Terms & Signature
    notesTermsSignature: 'සටහන්, කොන්දේසි සහ අත්සන',
    notesToRecipient: 'ගනුදෙනුකරු වෙත සටහන්',
    notesPlaceholder: 'උදා: ඔබගේ ඇණවුමට ස්තූතියි! බැංකු තැන්පතු විස්තර: කොමර්ෂල් බැංකුව ගිණුම් අංක...',
    termsConditions: 'නියමයන් සහ කොන්දේසි',
    termsPlaceholder: 'උදා: දින 14ක් ඇතුළත ගෙවීම් සිදු කළ යුතුය. ප්‍රමාද වන විට අමතර ගාස්තු අදාළ විය හැක.',
    signatoryName: 'අත්සන්කරුගේ නම / තනතුර',
    signatoryPlaceholder: 'උදා: බලයලත් කළමනාකරු / අධ්‍යක්ෂ',

    // Invoice Document (Preview/Print)
    docInvoice: 'ඉන්වොයිසිය',
    docFrom: 'නිකුත් කළේ:',
    docBilledTo: 'බිල්පත ලබන්නේ:',
    docShipTo: 'භාණ්ඩ භාරදීම:',
    docInvoiceDate: 'ඉන්වොයිස් දිනය:',
    docDueDate: 'ගෙවිය යුතු දිනය:',
    docCurrency: 'මුදල් ඒකකය:',
    docItemDescription: 'අයිතමය සහ විස්තරය',
    docQty: 'ප්‍රමාණය',
    docRate: 'මිල',
    docAmount: 'මුදල',
    docNoItems: 'තවමත් භාණ්ඩ හෝ සේවා එක් කර නොමැත',
    docNotes: 'විශේෂ සටහන්',
    docTerms: 'නියමයන් සහ කොන්දේසි',
    docSubtotal: 'අතුරු එකතුව',
    docDiscount: 'වට්ටම',
    docTax: 'බදු / වැට්',
    docShipping: 'ප්‍රවාහන ගාස්තු',
    docTotal: 'මුළු එකතුව',
    docAmountPaid: 'ගෙවූ මුදල',
    docBalanceDue: 'ගෙවිය යුතු ශේෂය',
    docQuestions: 'ගැටලු හෝ විමසීම් තිබේද?',
    docContact: 'විමසන්න:',
    docOrCall: 'හෝ අමතන්න:',
    docAuthorizedSignatory: 'බලයලත් අත්සන',
    docThankYou: 'ඔබගේ විශ්වාසය සහ සහයෝගයට බෙහෙවින් ස්තූතියි!',
    docPrintLanguage: 'ඉන්වොයිස් පත්‍රිකාවේ භාෂාව',
    docLanguageHint: 'පෙරදසුනෙහි සහ මුද්‍රණයේ පෙන්වන භාෂාව',

    // Saved Modal
    savedInvoicesTitle: 'සුරැකි ඉන්වොයිස් ලිපිගොනු',
    savedInvoicesDesc: 'ඔබගේ බ්‍රවුසරයේ සුරැකි ඉන්වොයිසි ගණන',
    searchPlaceholder: 'අංකය, ගනුදෙනුකරුගේ නම හෝ ආයතනයෙන් සොයන්න...',
    filterAll: 'සියල්ල',
    filterDraft: 'කෙටුම්පත්',
    filterPending: 'ගෙවීමට ඇති',
    filterPaid: 'ගෙවා අවසන්',
    filterOverdue: 'කල් ඉකුත් වූ',
    noInvoicesFound: 'ගැලපෙන ඉන්වොයිසි හමු නොවීය.',
    openInvoice: 'විවෘත කරන්න',
    duplicate: 'අනුපිටපත්',
    delete: 'මකන්න',
    currentActive: 'සක්‍රිය',
    createdOn: 'සාදන ලද්දේ',
    exportExcelTooltip: 'Excel (.xlsx) ලෙස බාගන්න',

    // Aliases & Header
    invoice: 'ඉන්වොයිසිය',
    from: 'නිකුත් කළේ',
    billedTo: 'බිල්පත ලබන්නේ',
    shipTo: 'භාණ්ඩ භාරදීම',
    invoiceDate: 'ඉන්වොයිස් දිනය',
    paymentDueDate: 'ගෙවිය යුතු දිනය',
    itemAndDescription: 'අයිතමය සහ විස්තරය',
    rate: 'මිල',
    amount: 'මුදල',
    noItemsYet: 'තවමත් භාණ්ඩ හෝ සේවා එක් කර නොමැත',
    notes: 'සටහන්',
    subtotal: 'අතුරු එකතුව',
    total: 'මුළු එකතුව',
    balanceDue: 'ගෙවිය යුතු ශේෂය',
    questionsOrInquiries: 'ගැටලු හෝ විමසීම් තිබේද?',
    contact: 'විමසන්න:',
    authorizedSignatory: 'බලයලත් අත්සන',
    thankYouForPartnership: 'ඔබගේ විශ්වාසය සහ සහයෝගයට බෙහෙවින් ස්තූතියි!',
    draft: 'කෙටුම්පත',
    pending: 'ගෙවීමට ඇති',
    paid: 'ගෙවා අවසන්',
    overdue: 'කල් ඉකුත් වූ',
    all: 'සියල්ල',
    open: 'විවෘත කරන්න',
    close: 'වසන්න',
    cancel: 'අවලංගු කරන්න',
    logo: 'ලාංඡනය (Logo)',
    items: 'අයිතම',
    storedLocally: 'ඉන්වොයිසි සුරැකී ඇත',
    invoicesWillAppearHere: 'ඔබ සාදන සහ සුරකින ඉන්වොයිසි මෙහි දිස්වේ.',
    trySearchingDifferent: 'වෙනත් වචනයකින් සොයා බලන්න.',
    currentlyEditing: 'සංස්කරණය වෙමින් පවතී',
    quickAndProfessional: 'පහසු සහ වෘත්තීය',
    appSubtitle: 'තත්පර කිහිපයකින් ඉන්වොයිසි සාදා මුද්‍රණය කරගන්න',
    edit: 'සංස්කරණය',
    preview: 'පෙරදසුන',
    excel: 'Excel',
    pdf: 'PDF',
    invoiceDetailsAndContent: 'ඉන්වොයිස් තොරතුරු සහ අන්තර්ගතය',
    editFieldsLive: 'දකුණු පසින් සජීවී පෙරදසුන බලන්න',
    switchLanguage: 'භාෂාව',
    sinhala: 'සිංහල',
    english: 'English',

    // Google Drive
    googleDrive: 'Google Drive',
    driveAutoSave: 'Google Drive ස්වයංක්‍රීයව සුරැකීම (Auto-Save)',
    driveConnected: 'Drive සම්බන්ධයි',
    driveNotConnected: 'Google Drive සම්බන්ධ කරන්න',
    connectGoogleDrive: 'Google Drive සම්බන්ධ කරන්න',
    disconnectDrive: 'Drive ගිණුම ඉවත් කරන්න',
    drivePermissionTitle: 'Google Drive අවසර ලබාගැනීම',
    drivePermissionDesc: 'ඔබගේ දුරකථනයෙන් හෝ බ්‍රවුසරයෙන් Google අවසරය ලබාදීමෙන් සියලු ඉන්වොයිසි ස්වයංක්‍රීයව ඔබගේ Google Drive හි සුරැකේ.',
    driveSyncing: 'Google Drive වෙත සුරැකෙමින් පවතී...',
    driveSyncedJustNow: 'දැන්ම Google Drive වෙත සුරැකිණි',
    driveLastSynced: 'අවසන් වරට Drive වෙත සුරැක්කේ:',
    driveSyncNow: 'දැන්ම Drive වෙත සුරකින්න',
    driveOpenFolder: 'Google Drive ෆෝල්ඩරය විවෘත කරන්න',
    driveAutoSaveEnabled: 'Drive Auto-Save සක්‍රියයි',
    driveAutoSaveDisabled: 'Drive Auto-Save අක්‍රියයි',
    signInWithGoogle: 'Sign in with Google (Google ගිණුමෙන් ඇතුල් වන්න)',
    connectingGoogle: 'Google වෙත සම්බන්ධ වෙමින්...',
    phonePermissionNotice: 'ඔබගේ දුරකථනයෙන් Google Drive වෙත ඉන්වොයිසි Auto Save කරගැනීමට මෙතැනින් Google ගිණුමට අවසර ලබා දෙන්න.',
    driveFolderCreated: 'ඔබගේ Drive හි "PS Invoice - Backup" ෆෝල්ඩරයේ සුරැකේ',
    toastDriveSaved: 'Google Drive වෙත සාර්ථකව සුරැකිණි',
    toastDriveFailed: 'Google Drive වෙත සුරැකීම අසාර්ථක විය',

    // Cloud Server & App Updates
    cloudServer: 'වලාකුළු සේවාදායකය (Cloud Server)',
    cloudServerAdmin: 'ප්‍රධාන Cloud Server (psgss91@gmail.com)',
    cloudServerDesc: 'මෙම යෙදුමේ සියලුම ඉන්වොයිසි, සේවාදායකයින්, සැකසුම් සහ පරිශීලක තොරතුරු psgss91@gmail.com Google Drive හි ආරක්ෂිතව සුරැකේ.',
    syncAllToCloud: 'සියලුම දත්ත Cloud Server වෙත සුරකින්න',
    syncAllToCloudDesc: 'සියලුම ඉන්වොයිසි, සේවාදායකයින් සහ සැකසුම් එකවර psgss91@gmail.com Drive වෙත සුරකියි.',
    pullFromCloud: 'Cloud Server වෙතින් දත්ත ලබාගන්න (Update App)',
    pullFromCloudDesc: 'psgss91@gmail.com Drive හි ඇති නවතම දත්ත සහ යාවත්කාලීන මෙම යෙදුමට පූරණය කරයි.',
    publishAppUpdate: 'නව යාවත්කාලීනයක් Drive වෙත නිකුත් කරන්න',
    publishAppUpdateDesc: 'නව යෙදුම් සංස්කරණය සහ විස්තර Google Drive හි සුරකියි.',
    appUpdateCenter: 'යෙදුම් යාවත්කාලීන මධ්‍යස්ථානය',
    cloudServerActive: 'Cloud Server සක්‍රියයි (psgss91@gmail.com)',
    cloudMasterDatabase: 'ප්‍රධාන දත්ත ගබඩාව (Master DB)',
    cloudServerSyncedSuccess: 'සියලුම දත්ත සාර්ථකව psgss91@gmail.com Cloud Server වෙත සුරැකිණි',
    cloudServerRestoredSuccess: 'Cloud Server හි නවතම දත්ත වලින් යෙදුම සාර්ථකව යාවත්කාලීන විය',
    cloudUpdatePublishedSuccess: 'යෙදුම් යාවත්කාලීනය Google Drive වෙත සාර්ථකව නිකුත් කරන ලදී',

    // Saved Companies & Clients Directory
    savedCompanies: 'සුරැකි ආයතන (Companies)',
    savedClients: 'සුරැකි පාරිභෝගිකයින් (Clients)',
    saveCurrentCompany: 'වත්මන් ආයතනය සුරකින්න',
    saveCurrentClient: 'වත්මන් පාරිභෝගිකයා සුරකින්න',
    addNewCompany: 'නව ආයතනයක් එක් කරන්න',
    addNewClient: 'නව පාරිභෝගිකයෙකු එක් කරන්න',
    editCompany: 'ආයතන විස්තර සංස්කරණය',
    editClient: 'පාරිභෝගික විස්තර සංස්කරණය',
    selectCompany: 'ආයතනයක් තෝරන්න',
    selectClient: 'පාරිභෝගිකයෙකු තෝරන්න',
    searchCompanies: 'ආයතන සොයන්න...',
    searchClients: 'නම, ආයතනය, දුරකථන අංකය හෝ ඊමේල් මඟින් සොයන්න...',
    applyToInvoice: 'ඉන්වොයිසියට යොදන්න',
    manageCompanies: 'ආයතන කළමනාකරණය',
    manageClients: 'පාරිභෝගිකයින් කළමනාකරණය',
    setDefaultCompany: 'ප්‍රධාන (Default) ආයතනය ලෙස තබන්න',
    defaultBadge: 'ප්‍රධාන',
    deleteProfileConfirm: 'ඔබට මෙම විස්තර ඉවත් කිරීමට අවශ්‍යද?',
    companySavedSuccess: 'ආයතන තොරතුරු සාර්ථකව සුරැකිණි',
    companyUpdatedSuccess: 'ආයතන තොරතුරු යාවත්කාලීන විය',
    companyDeletedSuccess: 'ආයතන තොරතුරු ඉවත් කරන ලදී',
    companyAppliedSuccess: 'ආයතන විස්තර ඉන්වොයිසියට යොදන ලදී',
    clientSavedSuccess: 'පාරිභෝගික තොරතුරු සාර්ථකව සුරැකිණි',
    clientUpdatedSuccess: 'පාරිභෝගික තොරතුරු යාවත්කාලීන විය',
    clientDeletedSuccess: 'පාරිභෝගිකයා ඉවත් කරන ලදී',
    clientAppliedSuccess: 'පාරිභෝගික විස්තර ඉන්වොයිසියට යොදන ලදී',
    noSavedCompanies: 'තවම සුරැකි ආයතන නොමැත. අවශ්‍ය ඕනෑම වේලාවක භාවිතයට ගැනීමට ඔබගේ ආයතන විස්තර මෙහි සුරැකිය හැක.',
    noSavedClients: 'තවම සුරැකි පාරිභෝගිකයින් නොමැත. අවශ්‍ය විටක ඉක්මනින් ඉන්වොයිසියට එක් කරගැනීමට පාරිභෝගිකයින් සුරැකිය හැක.',
    clientShippingAddress: 'බෙදාහැරීමේ ලිපිනය (Shipping Address)',
    sameAsBilling: 'බිල්පත් ලිපිනයම වේ',

    // Login & Admin Tracking
    login: 'පිවිසෙන්න',
    loginTitle: 'PS Invoice වෙත සාදරයෙන් පිළිගනිමු',
    loginSubtitle: 'Google Drive Cloud Auto-Save සහ වෘත්තීය ඉන්වොයිස් පද්ධතිය',
    continueAsGuest: 'ආගන්තුකයෙකු ලෙස ඇතුල් වන්න (Guest Mode)',
    loginBenefit1Title: 'ක්ෂණික PDF සහ Excel ලබා ගැනීම',
    loginBenefit1Desc: 'තත්පර කිහිපයකින් නිවැරදි A4 ඉන්වොයිස් සාදා බාගත කරගන්න.',
    loginBenefit2Title: 'Google Drive ස්වයංක්‍රීය සුරැකීම',
    loginBenefit2Desc: 'ඔබගේ පුද්ගලික Google Drive හි ආරක්ෂිතව ඉන්වොයිසි ගබඩා වේ.',
    loginBenefit3Title: 'ආයතන සහ පාරිභෝගික නාමාවලිය',
    loginBenefit3Desc: 'නිතර භාවිත වන ආයතන හා පාරිභෝගික තොරතුරු කලින්ම සුරැකිය හැක.',
    loginBenefit4Title: 'සිංහල සහ ඉංග්‍රීසි පූර්ණ සහය',
    loginBenefit4Desc: 'ඕනෑම වේලාවක භාෂාව මාරු කරමින් පහසුවෙන් භාවිත කරන්න.',
    adminTrackingNotice: 'පරිශීලක පිවිසුම් තොරතුරු පරිපාලනය (psgss91@gmail.com) සඳහා ආරක්ෂිතව සටහන් වේ.',
    loginSuccess: 'Google ගිණුම මගින් සාර්ථකව පිවිසුණි!',
    logout: 'ඉවත් වන්න (Sign Out)',
    logoutConfirm: 'ඔබට ගිණුමෙන් ඉවත් වීමට අවශ්‍යද?',
    loggedInAs: 'පිවිස ඇති ගිණුම:',
    adminBadge: 'පරිපාලක (Admin)',
    loginHistory: 'පිවිසුම් වාර්තා',
    loginHistoryTitle: 'පරිශීලක පිවිසුම් විස්තර ලේඛනය (User Logins)',
    loginHistorySubtitle: 'සියලුම පිවිසුම් තොරතුරු psgss91@gmail.com වෙත සුරැකී සටහන් වේ',
    totalLogins: 'මුළු පිවිසුම් ගණන',
    uniqueUsers: 'විශේෂිත පරිශීලකයින්',
    lastLogin: 'අවසන් පිවිසුම',
    exportCSV: 'CSV වාර්තාව බාගන්න',
    emailReportToAdmin: 'වාර්තාව psgss91@gmail.com වෙත ඊමේල් කරන්න',
    clearHistory: 'වාර්තා ඉවත් කරන්න',
    noLoginsYet: 'තවමත් පරිශීලක පිවිසුම් වාර්තා නොමැත.',
    deviceAndBrowser: 'උපාංගය සහ බ්‍රවුසරය',
    adminSavedToNotice: 'පිවිසුම් තොරතුරු psgss91@gmail.com වෙත ස්වයංක්‍රීයව සටහන් වේ',

    // Invoice History, Batch Delete & Periodic Reports (7 Days, Monthly, Quarterly, Yearly)
    invoiceHistory: 'ඉන්වොයිස් ඉතිහාසය',
    invoiceHistoryAndReports: 'ඉන්වොයිස් ඉතිහාසය සහ වාර්තා',
    reportsAndAnalytics: 'මූල්‍ය වාර්තා සහ විශ්ලේෂණ',
    historyTab: 'ඉන්වොයිස් ලැයිස්තුව',
    reportsTab: 'කාලසීමා වාර්තා (දින 7 / මාසික / වාර්ෂික)',
    deleteInvoice: 'ඉන්වොයිසිය මකන්න',
    deleteConfirm: 'මෙම ඉන්වොයිසිය මකා දැමීමට ඔබට විශ්වාසද?',
    batchDelete: 'තෝරාගත් ඒවා මකන්න',
    batchDeleteConfirm: 'තෝරාගත් ඉන්වොයිස් මකා දැමීමට ඔබට විශ්වාසද?',
    clearAllInvoices: 'සියලු ඉන්වොයිස් මකන්න',
    clearAllConfirm: 'සියලුම සුරකින ලද ඉන්වොයිස් ස්ථිරවම මකා දැමීමට ඔබට විශ්වාසද? මෙය නැවත ලබා ගත නොහැක.',
    selectedCount: 'තෝරාගෙන ඇත',
    selectAll: 'සියල්ල තෝරන්න',
    deselectAll: 'තේරීම් ඉවත් කරන්න',
    reportPeriod: 'වාර්තා කාලසීමාව',
    last7Days: 'පසුගිය දින 7',
    monthly: 'මාසික වාර්තාව (දින 30)',
    quarterly: 'කාර්තු වාර්තාව (මාස 3)',
    yearly: 'වාර්ෂික වාර්තාව (වසර 1)',
    allTime: 'සමස්ත කාලය',
    customRange: 'අභිරුචි කාලසීමාව',
    startDate: 'ආරම්භක දිනය',
    endDate: 'අවසාන දිනය',
    totalRevenue: 'මුළු ඉන්වොයිස් අගය',
    totalPaid: 'ලැබුණු මුදල (Paid)',
    totalPending: 'ලැබිය යුතු මුදල (Pending / Due)',
    totalOverdue: 'කල් ඉකුත් වූ මුදල (Overdue)',
    totalInvoicesCount: 'මුළු ඉන්වොයිස් ගණන',
    averageInvoiceValue: 'සාමාන්‍ය ඉන්වොයිස් අගය',
    exportReportExcel: 'වාර්තාව Excel (.xlsx) ලෙස බාගන්න',
    exportReportCSV: 'වාර්තාව CSV ලෙස බාගන්න',
    printReport: 'වාර්තාව Print / PDF කරන්න',
    periodSummary: 'කාල සීමා සාරාංශය',
    topClients: 'ප්‍රධාන ගනුදෙනුකරුවන්',
    invoicesInPeriod: 'අදාළ කාලසීමාවේ ඉන්වොයිස්',
    noInvoicesInPeriod: 'තෝරාගත් කාලසීමාව තුළ කිසිදු ඉන්වොයිසියක් නොමැත.',
    toastBatchDeleted: 'තෝරාගත් ඉන්වොයිස් සාර්ථකව මකා දමන ලදී',
    toastAllDeleted: 'සියලුම සුරකින ලද ඉන්වොයිස් මකා දමන ලදී',
    statusBreakdown: 'ගෙවීම් තත්ත්ව වර්ගීකරණය',
    collectionRate: 'මුදල් ලැබීමේ ප්‍රතිශතය',

    // Admin & User Access Days Control
    adminPanel: 'පරිපාලක පාලක පැනලය (Admin Panel)',
    userAccessControl: 'පරිශීලක ප්‍රවේශ දින කළමනාකරණය',
    defaultAllowedDays: 'නව පරිශීලකයින් සඳහා පෙරනිමි දින ගණන',
    setDefaultDaysPrompt: 'අලුතින් ලියාපදිංචි වන පරිශීලකයින්ට ලබාදෙන දින ගණන (Default)',
    saveDefaultDays: 'පෙරනිමි දින ගණන සුරකින්න',
    registeredUsers: 'ලියාපදිංචි පරිශීලකයින්',
    activeUsers: 'ක්‍රියාකාරී පරිශීලකයින්',
    expiredUsers: 'කල් ඉකුත් වූ පරිශීලකයින්',
    daysRemaining: 'ඉතිරි දින ගණන',
    daysAllowed: 'ලබාදුන් දින ගණන',
    addDays: 'දින එක්කරන්න',
    grant7Days: '+7 දින',
    grant30Days: '+30 දින',
    setExactDays: 'දින නියම කරන්න',
    makeUnlimited: 'අසීමිත (Unlimited)',
    removeUnlimited: 'නියමිත දින වලට මාරු කරන්න',
    expireNow: 'වහාම අවසන් කරන්න',
    blockUser: 'අවහිර කරන්න',
    unblockUser: 'අවහිරය ඉවත් කරන්න',
    accessExpiredTitle: 'ප්‍රවේශ කාලය අවසන් වී ඇත',
    accessExpiredSubtitle: 'ඔබගේ අත්හදා බැලීමේ කාලසීමාව අවසන් වී ඇත. කරුණාකර ඔබගේ ගිණුම යාවත්කාලීන කිරීමට පරිපාලක අමතන්න.',
    emailAdminToRenew: 'යාවත්කාලීන කිරීමට පරිපාලක වෙත ඊමේල් කරන්න',
    checkUpdatedStatus: 'යාවත්කාලීන බව පරීක්ෂා කරන්න',
    userDaysUpdatedSuccess: 'පරිශීලක ප්‍රවේශ දින සාර්ථකව යාවත්කාලීන කරන ලදී',
    settingsSavedSuccess: 'පෙරනිමි ප්‍රවේශ සැකසුම් සුරකින ලදී',
    adminOnlyNotice: 'පරිපාලක වරප්‍රසාද හිමිවන්නේ psgss91@gmail.com ගිණුමට පමණි.',

    // Responsive & Auto-Fit
    autoFit: 'ස්වයංක්‍රීය ගැළපීම',
    autoFitDesc: 'ඕනෑම දුරකථන හෝ ටැබ්ලට් තිරයකට ගැළපෙන පරිදි ප්‍රමාණය සකසන්න',
    fitToScreen: 'තිරයට ගැළපීම',
    mobileMenu: 'මෙනුව',
    mobileMenuTitle: 'මෙනුව සහ ක්ෂණික ක්‍රියා',
    phoneTabletOptimized: 'Phone & Tablet සඳහා සකසා ඇත',
    allActions: 'සියලුම මෙවලම් සහ පහසුකම්',
  },
};
