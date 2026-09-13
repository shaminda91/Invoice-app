import React, { useState } from 'react';
import { ClientInfo, SavedClient } from '../types';
import { Translations } from '../i18n/translations';
import {
  User,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building,
} from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: SavedClient[];
  onSaveClient: (client: SavedClient) => void;
  onDeleteClient: (id: string) => void;
  onSelectClient: (client: SavedClient) => void;
  currentClient: ClientInfo;
  t: Translations;
}

export function ClientModal({
  isOpen,
  onClose,
  clients,
  onSaveClient,
  onDeleteClient,
  onSelectClient,
  currentClient,
  t,
}: ClientModalProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormState: SavedClient = {
    id: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sri Lanka',
    hasShippingAddress: false,
    shippingAddress: '',
  };

  const [formData, setFormData] = useState<SavedClient>(initialFormState);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState,
      id: 'client_' + Date.now(),
      country: currentClient.country || 'Sri Lanka',
    });
    setIsFormOpen(true);
  };

  const handleOpenSaveCurrent = () => {
    setEditingId(null);
    setFormData({
      ...currentClient,
      id: 'client_' + Date.now(),
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: SavedClient) => {
    setEditingId(client.id);
    setFormData({ ...client });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() && !formData.company.trim()) return;

    onSaveClient({
      ...formData,
      id: editingId || formData.id || 'client_' + Date.now(),
    });

    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.company.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  return (
    <div
      id="client-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="client-modal-content"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.savedClients}
              </h2>
              <p className="text-xs text-slate-500">
                {t.manageClients}
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
            /* ADD / EDIT CLIENT FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? t.editClient : t.addNewClient}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {t.cancel}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.clientName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kasun Jayawardena"
                    className="w-full text-sm font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.companyName}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Horizon Retailers Pvt Ltd"
                    className="w-full text-sm font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.clientEmail}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@horizon.com"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.clientPhone}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+94 71 987 6543"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Street address / Building"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="Kadawatha / Colombo"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="11850"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.hasShippingAddress || false}
                    onChange={(e) => setFormData({ ...formData, hasShippingAddress: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold">{t.clientShippingAddress}</span>
                </label>

                {formData.hasShippingAddress && (
                  <div>
                    <textarea
                      rows={2}
                      value={formData.shippingAddress || ''}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      placeholder="Delivery warehouse or alternative shipping address..."
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveDraft}</span>
                </button>
              </div>
            </form>
          ) : (
            /* CLIENT LIST VIEW */
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t.searchClients}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSaveCurrent}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    title={t.saveCurrentClient}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.saveCurrentClient}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addNewClient}</span>
                  </button>
                </div>
              </div>

              {/* Clients list */}
              {filteredClients.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <User className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t.noSavedClients}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenSaveCurrent}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.saveCurrentClient}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-200 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                          {(client.name || client.company || 'C').charAt(0).toUpperCase()}
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {client.name || client.company}
                          </h4>
                          {client.company && client.name && (
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{client.company}</span>
                            </p>
                          )}

                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {client.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{client.phone}</span>
                              </span>
                            )}
                            {client.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5 text-slate-400" />
                                <span>{client.email}</span>
                              </span>
                            )}
                            {client.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                <span>{client.city}, {client.country}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                          title={t.editClient}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t.deleteProfileConfirm)) {
                              onDeleteClient(client.id);
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
                            onSelectClient(client);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
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
          <span>{clients.length} {t.savedClients}</span>
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
