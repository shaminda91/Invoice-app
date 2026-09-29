export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue';

export type TemplateId = 'modern' | 'classic' | 'minimal' | 'executive';

export type DiscountType = 'percentage' | 'fixed';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: 'prefix' | 'suffix';
}

export interface InvoiceItem {
  id: string;
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
  unitType?: string;
}

export interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
  logoUrl?: string;
  website?: string;
}

export interface ClientInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  hasShippingAddress?: boolean;
  shippingAddress?: string;
}

export interface SavedCompany extends BusinessInfo {
  id: string;
  isDefault?: boolean;
}

export interface SavedClient extends ClientInfo {
  id: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  paymentInstructions?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: Currency;
  sender: BusinessInfo;
  client: ClientInfo;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number; // percentage, e.g. 15 for 15%
  shippingFee: number;
  amountPaid: number;
  signatureName?: string;
  signatureImage?: string;
  template: TemplateId;
  accentColor: string;
  createdAt: number;
  updatedAt: number;
}

export const SUPER_ADMIN_EMAIL = 'psgss91@gmail.com';
export const ADMIN_EMAIL = 'psgss91@gmail.com';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'client'
  | 'viewer';

export interface UserPermissions {
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canExportPDF: boolean;
  canManageClients: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

export interface UserAccessProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  parentAdminEmail: string; // Always 'psgss91@gmail.com' for registered accounts under Super Admin
  firstLoginTime: number; // timestamp
  firstLoginString: string;
  allowedDays: number; // e.g. 7 days by default
  expiresAt: number; // timestamp
  expiresAtString: string;
  status: 'pending' | 'active' | 'expired' | 'blocked' | 'unlimited';
  lastLoginTime: number;
  lastLoginString: string;
  notes?: string;
  unreadBySuperAdmin?: boolean; // Set to true when new client registers so Super Admin sees the alert
  deviceInfo?: string;
  browser?: string;
  os?: string;
  permissions?: UserPermissions;
}

export interface AccessSettings {
  defaultAllowedDays: number; // Default: 7 days
  autoNotifyAdminOnExpiry: boolean;
}

export interface UserLoginRecord {
  id: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  userId: string;
  loginTime: number;
  loginTimeString: string;
  deviceInfo: string;
  browser: string;
  os: string;
  ipOrLocation?: string;
  targetAdminEmail: string;
  syncStatus?: 'local' | 'synced_to_drive' | 'emailed';
}
