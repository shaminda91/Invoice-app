import React, { useState, useRef } from 'react';
import { BusinessInfo, SavedCompany } from '../types';
import { Translations } from '../i18n/translations';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  CheckCircle2,
  Star,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: SavedCompany[];
  onSaveCompany: (company: SavedCompany) => void;
  onDeleteCompany: (id: string) => void;
  onSelectCompany: (company: SavedCompany) => void;
  currentCompany?: BusinessInfo;
  currentSender?: BusinessInfo;
  t: Translations;
}

export function CompanyModal({
  isOpen,
  onClose,
  companies,
  onSaveCompany,
  onDeleteCompany,
  onSelectCompany,
  currentCompany,
  currentSender,
  t,
}: CompanyModalProps) {
  const activeSender = currentCompany || currentSender;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: SavedCompany = {
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sri Lanka',
    taxId: '',
    website: '',
    logoUrl: '',
    isDefault: false,
  };

  const [formData, setFormData] = useState<SavedCompany>(initialFormState);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState,
      id: 'comp_' + Date.now(),
      country: activeSender?.country || 'Sri Lanka',
    });
    setIsFormOpen(true);
  };

  const handleOpenSaveCurrent = () => {
    setEditingId(null);
    if (activeSender) {
      setFormData({
        ...activeSender,
        id: 'comp_' + Date.now(),
        isDefault: companies.length === 0,
      });
    } else {
      setFormData({
        ...initialFormState,
        id: 'comp_' + Date.now(),
        isDefault: companies.length === 0,
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenEdit = (comp: SavedCompany) => {
    setEditingId(comp.id);
    setFormData({ ...comp });
    setIsFormOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSaveCompany({
      ...formData,
      id: editingId || formData.id || 'comp_' + Date.now(),
    });

    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredCompanies = companies.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  return (
    <div
      id="company-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="company-modal-content"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.savedCompanies}
              </h2>
              <p className="text-xs text-slate-500">
                {t.manageCompanies}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isFormOpen ? (
            /* ADD / EDIT COMPANY FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? t.editCompany : t.addNewCompany}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {t.cancel}
                </button>
              </div>

              {/* Logo Upload in form */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {formData.logoUrl ? (
                  <div className="relative">
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 rounded-lg object-contain bg-white border border-slate-200 p-1"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-14 h-14 rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">{t.addLogo}</span>
                  </button>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t.logo}</h4>
                  <p className="text-[11px] text-slate-500">
                    Upload PNG or JPEG logo for this company
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.businessName} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ps ebay solution / Horizon Tech"
                  className="w-full text-sm font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sales@company.com"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.phone}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="076 996 6075 / +94..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.address}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Kaduwela Road / Street address"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.city}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Malabe / Colombo"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.postalCode}
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="10115"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.country}
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Sri Lanka"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.taxVatId}
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="VAT / Tax ID"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.website}
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="www.example.com"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t.setDefaultCompany}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveDraft}</span>
                </button>
              </div>
            </form>
          ) : (
            /* COMPANY LIST VIEW */
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t.searchCompanies}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSaveCurrent}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                    title={t.saveCurrentCompany}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t.saveCurrentCompany}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addNewCompany}</span>
                  </button>
                </div>
              </div>

              {/* Companies cards */}
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t.noSavedCompanies}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenSaveCurrent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.saveCurrentCompany}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredCompanies.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-start gap-3.5">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-sm shrink-0">
                            {comp.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {comp.name}
                            </h4>
                            {comp.isDefault && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                {t.defaultBadge}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {comp.phone && <span>{comp.phone}</span>}
                            {comp.email && <span>{comp.email}</span>}
                            {comp.city && <span>{comp.city}, {comp.country}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(comp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                          title={t.editCompany}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t.deleteProfileConfirm)) {
                              onDeleteCompany(comp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectCompany(comp);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                        >
                          <span>{t.applyToInvoice}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{companies.length} {t.savedCompanies}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
