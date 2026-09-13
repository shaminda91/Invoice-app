import React, { useRef } from 'react';
import { BusinessInfo, ClientInfo, Invoice, SavedCompany, SavedClient } from '../types';
import { LineItemsEditor } from './LineItemsEditor';
import { TemplatePicker } from './TemplatePicker';
import { generateInvoiceNumber } from '../utils/calculations';
import { Translations } from '../i18n/translations';
import {
  Building2,
  User,
  Hash,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Image as ImageIcon,
  X,
  RefreshCw,
  Percent,
  Truck,
  FileCheck2,
  PenTool,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface InvoiceEditorProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  savedCompanies: SavedCompany[];
  savedClients: SavedClient[];
  onOpenCompanyModal: () => void;
  onOpenClientModal: () => void;
  onSaveCurrentCompanyQuick: () => void;
  onSaveCurrentClientQuick: () => void;
  onSelectCompanyQuick: (company: SavedCompany) => void;
  onSelectClientQuick: (client: SavedClient) => void;
  t: Translations;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  savedCompanies,
  savedClients,
  onOpenCompanyModal,
  onOpenClientModal,
  onSaveCurrentCompanyQuick,
  onSaveCurrentClientQuick,
  onSelectCompanyQuick,
  onSelectClientQuick,
  t,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    onChange({
      ...invoice,
      [field]: value,
      updatedAt: Date.now(),
    });
  };

  const updateSender = (field: keyof BusinessInfo, value: string) => {
    onChange({
      ...invoice,
      sender: { ...invoice.sender, [field]: value },
      updatedAt: Date.now(),
    });
  };

  const updateClient = (field: keyof ClientInfo, value: any) => {
    onChange({
      ...invoice,
      client: { ...invoice.client, [field]: value },
      updatedAt: Date.now(),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateSender('logoUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    updateSender('logoUrl', '');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* 1. TEMPLATE, ACCENT, CURRENCY & STATUS */}
      <TemplatePicker
        invoice={invoice}
        onChange={(partial) => onChange({ ...invoice, ...partial })}
        t={t}
      />

      {/* 2. INVOICE META & NUMBER */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t.referenceAndDates}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => updateField('invoiceNumber', generateInvoiceNumber())}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            {t.regenerateNumber}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t.invoiceNumber}</label>
            <input
              type="text"
              value={invoice.invoiceNumber}
              onChange={(e) => updateField('invoiceNumber', e.target.value)}
              className="w-full text-sm font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t.issueDate}</label>
            <input
              type="date"
              value={invoice.issueDate}
              onChange={(e) => updateField('issueDate', e.target.value)}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t.dueDate}</label>
            <input
              type="date"
              value={invoice.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. SENDER (YOUR BUSINESS) & CLIENT (RECIPIENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SENDER DETAILS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t.businessFrom}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* SAVED COMPANIES BUTTON */}
              <button
                type="button"
                onClick={onOpenCompanyModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                title={t.savedCompanies}
              >
                <Building2 className="w-3 h-3 text-indigo-600" />
                <span>{t.savedCompanies}</span>
                <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-200 text-indigo-800 rounded-full text-[10px]">
                  {savedCompanies.length}
                </span>
              </button>

              {/* SAVE CURRENT COMPANY QUICK */}
              <button
                type="button"
                onClick={onSaveCurrentCompanyQuick}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title={t.saveCurrentCompany}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">{t.saveDraft}</span>
              </button>

              {/* LOGO UPLOAD */}
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {invoice.sender.logoUrl ? (
                  <div className="flex items-center gap-1.5 ml-1">
                    <img
                      src={invoice.sender.logoUrl}
                      alt="Logo"
                      className="w-7 h-7 rounded object-contain border border-slate-200 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                      title={t.removeLogo}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer ml-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.addLogo}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* QUICK SELECT SAVED COMPANY */}
          {savedCompanies.length > 0 && (
            <div className="bg-slate-50/90 rounded-lg p-2 border border-slate-200/80 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                {t.selectCompany}:
              </span>
              <select
                aria-label={t.selectCompany}
                value=""
                onChange={(e) => {
                  const comp = savedCompanies.find((c) => c.id === e.target.value);
                  if (comp) onSelectCompanyQuick(comp);
                }}
                className="flex-1 text-xs font-medium bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-800"
              >
                <option value="">-- {t.selectCompany} ({savedCompanies.length}) --</option>
                {savedCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''} {c.isDefault ? `[${t.defaultBadge}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t.businessName}</label>
            <input
              type="text"
              value={invoice.sender.name}
              onChange={(e) => updateSender('name', e.target.value)}
              placeholder={t.businessNamePlaceholder}
              className="w-full text-sm font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.email}</label>
              <input
                type="email"
                value={invoice.sender.email}
                onChange={(e) => updateSender('email', e.target.value)}
                placeholder="billing@company.com"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.phone}</label>
              <input
                type="text"
                value={invoice.sender.phone}
                onChange={(e) => updateSender('phone', e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.address}</label>
            <input
              type="text"
              value={invoice.sender.address}
              onChange={(e) => updateSender('address', e.target.value)}
              placeholder="Street address"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.city}</label>
              <input
                type="text"
                value={invoice.sender.city}
                onChange={(e) => updateSender('city', e.target.value)}
                placeholder="Colombo"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.postalCode}</label>
              <input
                type="text"
                value={invoice.sender.postalCode}
                onChange={(e) => updateSender('postalCode', e.target.value)}
                placeholder="00400"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.country}</label>
              <input
                type="text"
                value={invoice.sender.country}
                onChange={(e) => updateSender('country', e.target.value)}
                placeholder="Sri Lanka"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                {t.taxVatId}
              </label>
              <input
                type="text"
                value={invoice.sender.taxId}
                onChange={(e) => updateSender('taxId', e.target.value)}
                placeholder="VAT-12345"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.website}</label>
              <input
                type="text"
                value={invoice.sender.website || ''}
                onChange={(e) => updateSender('website', e.target.value)}
                placeholder="www.company.lk"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* CLIENT DETAILS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t.clientBillTo}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* SAVED CLIENTS BUTTON */}
              <button
                type="button"
                onClick={onOpenClientModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                title={t.savedClients}
              >
                <User className="w-3 h-3 text-blue-600" />
                <span>{t.savedClients}</span>
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded-full text-[10px]">
                  {savedClients.length}
                </span>
              </button>

              {/* SAVE CURRENT CLIENT QUICK */}
              <button
                type="button"
                onClick={onSaveCurrentClientQuick}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title={t.saveCurrentClient}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">{t.saveDraft}</span>
              </button>
            </div>
          </div>

          {/* QUICK SELECT SAVED CLIENT */}
          {savedClients.length > 0 && (
            <div className="bg-slate-50/90 rounded-lg p-2 border border-slate-200/80 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                {t.selectClient}:
              </span>
              <select
                aria-label={t.selectClient}
                value=""
                onChange={(e) => {
                  const client = savedClients.find((c) => c.id === e.target.value);
                  if (client) onSelectClientQuick(client);
                }}
                className="flex-1 text-xs font-medium bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-800"
              >
                <option value="">-- {t.selectClient} ({savedClients.length}) --</option>
                {savedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} {c.phone ? `- ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t.clientName}</label>
            <input
              type="text"
              value={invoice.client.name}
              onChange={(e) => updateClient('name', e.target.value)}
              placeholder={t.clientNamePlaceholder}
              className="w-full text-sm font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              {t.companyName}
            </label>
            <input
              type="text"
              value={invoice.client.company}
              onChange={(e) => updateClient('company', e.target.value)}
              placeholder={t.companyPlaceholder}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.clientEmail}</label>
              <input
                type="email"
                value={invoice.client.email}
                onChange={(e) => updateClient('email', e.target.value)}
                placeholder="client@horizon.com"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.clientPhone}</label>
              <input
                type="text"
                value={invoice.client.phone}
                onChange={(e) => updateClient('phone', e.target.value)}
                placeholder="+94 71 987 6543"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.billingAddress}</label>
            <input
              type="text"
              value={invoice.client.address}
              onChange={(e) => updateClient('address', e.target.value)}
              placeholder="128 Kandy Road"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.city}</label>
              <input
                type="text"
                value={invoice.client.city}
                onChange={(e) => updateClient('city', e.target.value)}
                placeholder="Kadawatha"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.postalCode}</label>
              <input
                type="text"
                value={invoice.client.postalCode}
                onChange={(e) => updateClient('postalCode', e.target.value)}
                placeholder="11850"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">{t.country}</label>
              <input
                type="text"
                value={invoice.client.country}
                onChange={(e) => updateClient('country', e.target.value)}
                placeholder="Sri Lanka"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* SHIPPING ADDRESS TOGGLE */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={invoice.client.hasShippingAddress || false}
                onChange={(e) => updateClient('hasShippingAddress', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">
                {t.addDifferentShipping}
              </span>
            </label>

            {invoice.client.hasShippingAddress && (
              <div className="mt-2.5">
                <textarea
                  rows={2}
                  value={invoice.client.shippingAddress || ''}
                  onChange={(e) => updateClient('shippingAddress', e.target.value)}
                  placeholder={t.shippingPlaceholder}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. LINE ITEMS SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <LineItemsEditor
          items={invoice.items}
          currency={invoice.currency}
          onChange={(newItems) => updateField('items', newItems)}
          t={t}
        />
      </div>

      {/* 5. TAX, DISCOUNT, SHIPPING & PAYMENTS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.financialAdjustments}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DISCOUNT */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-500" />
                {t.discount}
              </label>
              <div className="flex text-[11px] rounded bg-white border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => updateField('discountType', 'percentage')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    invoice.discountType === 'percentage'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => updateField('discountType', 'fixed')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    invoice.discountType === 'fixed'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  {invoice.currency.symbol.trim()}
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={invoice.discountValue}
              onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* TAX RATE */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">{t.taxVat}</label>
              <div className="flex gap-1">
                {[0, 8, 15, 18].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => updateField('taxRate', rate)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border cursor-pointer ${
                      invoice.taxRate === rate
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={invoice.taxRate}
              onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SHIPPING */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Truck className="w-3 h-3 text-slate-500" />
              {t.shippingFee} ({invoice.currency.symbol.trim()})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={invoice.shippingFee}
              onChange={(e) => updateField('shippingFee', parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* AMOUNT PAID */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <FileCheck2 className="w-3 h-3 text-slate-500" />
              {t.amountPaid} ({invoice.currency.symbol.trim()})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={invoice.amountPaid}
              onChange={(e) => updateField('amountPaid', parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 6. NOTES, TERMS & SIGNATURE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.notesTermsSignature}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.notesToRecipient}
            </label>
            <textarea
              rows={3}
              value={invoice.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.termsConditions}
            </label>
            <textarea
              rows={3}
              value={invoice.terms}
              onChange={(e) => updateField('terms', e.target.value)}
              placeholder={t.termsPlaceholder}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            {t.signatoryName}
          </label>
          <input
            type="text"
            value={invoice.signatureName || ''}
            onChange={(e) => updateField('signatureName', e.target.value)}
            placeholder={t.signatoryPlaceholder}
            className="w-full sm:w-80 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
