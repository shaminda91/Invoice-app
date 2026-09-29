import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculations';
import {
  exportInvoiceToExcel,
  exportInvoiceReportToExcel,
  exportInvoiceReportToCSV,
  ReportSummaryData,
} from '../utils/exportUtils';
import { Translations } from '../i18n/translations';
import {
  X,
  Search,
  FolderOpen,
  Copy,
  Trash2,
  Calendar,
  FileText,
  Upload,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  CheckSquare,
  Square,
  AlertCircle,
  Printer,
  Download,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedInvoices: Invoice[];
  currentInvoiceId: string;
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onBatchDeleteInvoices?: (ids: string[]) => void;
  onClearAllInvoices?: () => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onImportInvoice: (invoice: Invoice) => void;
  t: Translations;
  initialTab?: 'history' | 'reports';
}

type PeriodType = '7days' | 'monthly' | 'quarterly' | 'yearly' | 'all' | 'custom';

export const SavedInvoicesModal: React.FC<SavedInvoicesModalProps> = ({
  isOpen,
  onClose,
  savedInvoices,
  currentInvoiceId,
  onSelectInvoice,
  onDeleteInvoice,
  onBatchDeleteInvoices,
  onClearAllInvoices,
  onDuplicateInvoice,
  onImportInvoice,
  t,
  initialTab = 'history',
}) => {
  // Modal active tab: 'history' or 'reports'
  const [activeTab, setActiveTab] = useState<'history' | 'reports'>(initialTab);

  // History Tab State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Reports Tab State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Helper: Parse invoice date safely
  const getInvoiceDate = (inv: Invoice): Date => {
    if (inv.issueDate) {
      const d = new Date(inv.issueDate + 'T00:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    if (inv.createdAt) {
      return new Date(inv.createdAt);
    }
    return new Date();
  };

  // Filtered invoices for HISTORY tab
  const filteredHistoryInvoices = useMemo(() => {
    return savedInvoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.issueDate.includes(searchTerm);

      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [savedInvoices, searchTerm, filterStatus]);

  // Periodic Filter Calculation for REPORTS tab
  const { periodInvoices, periodLabel } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);
    let label = t.last7Days;

    if (selectedPeriod === '7days') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      label = t.last7Days;
    } else if (selectedPeriod === 'monthly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      label = t.monthly;
    } else if (selectedPeriod === 'quarterly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      label = t.quarterly;
    } else if (selectedPeriod === 'yearly') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      label = t.yearly;
    } else if (selectedPeriod === 'custom') {
      startDate = new Date(customStartDate + 'T00:00:00');
      endDate = new Date(customEndDate + 'T23:59:59');
      label = `${customStartDate} ~ ${customEndDate}`;
    } else {
      // 'all'
      startDate = new Date(0);
      label = t.allTime;
    }

    const filtered = savedInvoices.filter((inv) => {
      const invDate = getInvoiceDate(inv);
      return invDate >= startDate && invDate <= endDate;
    });

    // Sort by issue date descending
    filtered.sort((a, b) => getInvoiceDate(b).getTime() - getInvoiceDate(a).getTime());

    return { periodInvoices: filtered, periodLabel: label };
  }, [savedInvoices, selectedPeriod, customStartDate, customEndDate, t]);

  // Aggregated Report Metrics
  const reportTotals: ReportSummaryData = useMemo(() => {
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    periodInvoices.forEach((inv) => {
      const totals = calculateInvoiceTotals(inv);
      totalRevenue += totals.grandTotal;
      totalPaid += totals.amountPaid;
      totalPending += totals.balanceDue;
      if (inv.status === 'overdue') {
        totalOverdue += totals.balanceDue;
      }
    });

    const invoiceCount = periodInvoices.length;
    const averageValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
    const currencySymbol = periodInvoices[0]?.currency?.symbol || 'Rs.';

    return {
      periodLabel,
      totalRevenue,
      totalPaid,
      totalPending,
      totalOverdue,
      totalInvoices: invoiceCount,
      averageInvoiceValue: averageValue,
      currencySymbol,
    };
  }, [periodInvoices, periodLabel]);

  // Top clients in period
  const topClientsInPeriod = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number; paid: number }>();
    periodInvoices.forEach((inv) => {
      const clientName = inv.client.name.trim() || inv.client.company.trim() || 'Direct Client';
      const totals = calculateInvoiceTotals(inv);
      const existing = map.get(clientName) || { name: clientName, count: 0, total: 0, paid: 0 };
      existing.count += 1;
      existing.total += totals.grandTotal;
      existing.paid += totals.amountPaid;
      map.set(clientName, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [periodInvoices]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredHistoryInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistoryInvoices.map((inv) => inv.id));
    }
  };

  const handleConfirmSingleDelete = () => {
    if (deleteConfirmId) {
      onDeleteInvoice(deleteConfirmId);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleConfirmBatchDelete = () => {
    if (selectedIds.length > 0) {
      if (onBatchDeleteInvoices) {
        onBatchDeleteInvoices(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteInvoice(id));
      }
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
    }
  };

  const handleConfirmClearAll = () => {
    if (onClearAllInvoices) {
      onClearAllInvoices();
    } else {
      savedInvoices.forEach((inv) => onDeleteInvoice(inv.id));
    }
    setSelectedIds([]);
    setIsClearAllModalOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.invoiceNumber && parsed.items) {
            onImportInvoice({
              ...parsed,
              id: 'inv_' + Date.now(),
            });
            onClose();
          }
        } catch (err) {
          console.error('Invalid JSON invoice file', err);
        }
      };
      reader.readAsText(file);
    }
  };

  // Status helper badge
  const statusBadge = (st: string) => {
    switch (st) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'overdue':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const statusLabel = (st: string) => {
    switch (st) {
      case 'draft':
        return t.draft;
      case 'pending':
        return t.pending;
      case 'paid':
        return t.paid;
      case 'overdue':
        return t.overdue;
      default:
        return t.all;
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Report - ${reportTotals.periodLabel}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #1e293b; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
          h1 { margin: 0 0 5px 0; color: #1e1b4b; font-size: 24px; }
          .meta { color: #64748b; font-size: 13px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .kpi-value { font-size: 18px; font-weight: bold; color: #0f172a; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .paid { background: #dcfce7; color: #166534; }
          .pending { background: #fef3c7; color: #92400e; }
          .overdue { background: #ffe4e6; color: #9f1239; }
          .draft { background: #f1f5f9; color: #475569; }
          .num { text-align: right; font-family: monospace; }
          @media print {
            body { margin: 15mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PS Invoice - Financial & Sales Report</h1>
          <div class="meta">
            <strong>Period:</strong> ${reportTotals.periodLabel} | 
            <strong>Generated:</strong> ${new Date().toLocaleString()} | 
            <strong>Total Invoices:</strong> ${reportTotals.totalInvoices}
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Total Invoiced</div>
            <div class="kpi-value">${reportTotals.currencySymbol} ${reportTotals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Total Paid</div>
            <div class="kpi-value" style="color: #16a34a;">${reportTotals.currencySymbol} ${reportTotals.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Pending / Due</div>
            <div class="kpi-value" style="color: #d97706;">${reportTotals.currencySymbol} ${reportTotals.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Average Invoice</div>
            <div class="kpi-value">${reportTotals.currencySymbol} ${reportTotals.averageInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <h3>Invoices List (${periodInvoices.length})</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Client</th>
              <th>Status</th>
              <th class="num">Total (${reportTotals.currencySymbol})</th>
              <th class="num">Paid (${reportTotals.currencySymbol})</th>
              <th class="num">Balance Due (${reportTotals.currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            ${periodInvoices.map((inv, idx) => {
              const totals = calculateInvoiceTotals(inv);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${inv.invoiceNumber}</strong></td>
                  <td>${inv.issueDate}</td>
                  <td>${inv.client.name || 'Client'}${inv.client.company ? ' (' + inv.client.company + ')' : ''}</td>
                  <td><span class="badge ${inv.status}">${inv.status}</span></td>
                  <td class="num">${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td class="num">${totals.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td class="num">${totals.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const collectionRate = reportTotals.totalRevenue > 0
    ? Math.round((reportTotals.totalPaid / reportTotals.totalRevenue) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* TOP MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {t.invoiceHistoryAndReports}
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {savedInvoices.length} {t.saved}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t.storedLocally} & Google Drive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* JSON Import Button */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{t.importJson}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRIMARY TAB SWITCHER (HISTORY vs. REPORTS) */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>{t.historyTab}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
              {savedInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>{t.reportsTab}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              7d / Month / Year
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: INVOICE HISTORY & MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* TOOLBAR & SEARCH */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-2.5 items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                {['all', 'draft', 'pending', 'paid', 'overdue'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterStatus(status)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
                      filterStatus === status
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {statusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* BATCH ACTION BAR (Shown when invoices exist) */}
            {savedInvoices.length > 0 && (
              <div className="px-5 py-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {selectedIds.length === filteredHistoryInvoices.length && filteredHistoryInvoices.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {selectedIds.length === filteredHistoryInvoices.length && filteredHistoryInvoices.length > 0
                        ? t.deselectAll
                        : t.selectAll}
                    </span>
                  </button>

                  {selectedIds.length > 0 && (
                    <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
                      {selectedIds.length} {t.selectedCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Batch Delete Button */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsBatchDeleteModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs animate-in fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.batchDelete} ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Clear All Invoices Button */}
                  <button
                    type="button"
                    onClick={() => setIsClearAllModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title={t.clearAllInvoices}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.clearAllInvoices}</span>
                  </button>
                </div>
              </div>
            )}

            {/* INVOICES LIST */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 divide-y divide-slate-100">
              {filteredHistoryInvoices.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">{t.noInvoicesFound}</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchTerm ? t.trySearchingDifferent : t.invoicesWillAppearHere}
                  </p>
                </div>
              ) : (
                filteredHistoryInvoices.map((inv) => {
                  const totals = calculateInvoiceTotals(inv);
                  const isCurrent = inv.id === currentInvoiceId;
                  const isSelected = selectedIds.includes(inv.id);

                  return (
                    <div
                      key={inv.id}
                      className={`pt-2.5 first:pt-0 p-3.5 rounded-xl transition-all flex flex-wrap items-center justify-between gap-3 border ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                          : isCurrent
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      {/* Checkbox & Details */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(inv.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {inv.invoiceNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge(
                                inv.status
                              )}`}
                            >
                              {statusLabel(inv.status)}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                {t.currentlyEditing}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                            <span className="font-medium text-slate-800">
                              {inv.client.name || 'Unnamed Client'}
                            </span>
                            {inv.client.company && (
                              <span className="text-slate-400">
                                • {inv.client.company}
                              </span>
                            )}
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {inv.issueDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amounts and Actions */}
                      <div className="flex items-center gap-4 ml-auto sm:ml-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {formatCurrency(totals.grandTotal, inv.currency)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {totals.balanceDue > 0 ? (
                              <span className="text-amber-700 font-medium">
                                Due: {formatCurrency(totals.balanceDue, inv.currency)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Paid</span>
                            )}
                            <span className="text-slate-300 mx-1">|</span>
                            <span>{inv.items.length} {t.items}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Export Excel */}
                          <button
                            type="button"
                            onClick={() => exportInvoiceToExcel(inv)}
                            title="Excel (.xlsx)"
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          {/* Open / Select Invoice */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectInvoice(inv);
                              onClose();
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer"
                          >
                            {t.open}
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => onDuplicateInvoice(inv)}
                            title={t.duplicate}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Single Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(inv.id)}
                            title={t.delete}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REPORTS & ANALYTICS (7 Days, Monthly, Quarterly, Yearly) */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <div className="flex flex-col flex-1 overflow-y-auto p-5 space-y-5">
            {/* PERIOD SELECTION BAR */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  {t.reportPeriod}:
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('7days')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedPeriod === '7days'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {t.last7Days}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedPeriod === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {t.monthly}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('quarterly')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedPeriod === 'quarterly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {t.quarterly}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedPeriod === 'yearly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {t.yearly}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedPeriod === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {t.allTime}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('custom')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedPeriod === 'custom'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {t.customRange}
                </button>
              </div>

              {/* REPORT EXPORT ACTIONS */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportInvoiceReportToExcel(periodInvoices, reportTotals, topClientsInPeriod)}
                  disabled={periodInvoices.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                  title={t.exportReportExcel}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportInvoiceReportToCSV(periodInvoices, reportTotals)}
                  disabled={periodInvoices.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                  title={t.exportReportCSV}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  disabled={periodInvoices.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
                  title={t.printReport}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* CUSTOM DATE RANGE PICKER (If custom selected) */}
            {selectedPeriod === 'custom' && (
              <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{t.startDate}:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{t.endDate}:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}

            {/* FINANCIAL KPI CARDS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Total Revenue */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.totalRevenue}</span>
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 truncate">
                  {reportTotals.currencySymbol} {reportTotals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {reportTotals.totalInvoices} {t.totalInvoicesCount}
                </div>
              </div>

              {/* Total Paid */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{t.totalPaid}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 truncate">
                  {reportTotals.currencySymbol} {reportTotals.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {collectionRate}% {t.collectionRate}
                </div>
              </div>

              {/* Total Pending */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">{t.totalPending}</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-700 truncate">
                  {reportTotals.currencySymbol} {reportTotals.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Overdue: {reportTotals.currencySymbol} {reportTotals.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Average Invoice */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.averageInvoiceValue}</span>
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 truncate">
                  {reportTotals.currencySymbol} {reportTotals.averageInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {t.periodSummary}: {reportTotals.periodLabel}
                </div>
              </div>
            </div>

            {/* STATUS BREAKDOWN BAR */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{t.statusBreakdown}</span>
                <span>{collectionRate}% Paid</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${collectionRate}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Paid: ${collectionRate}%`}
                />
                <div
                  style={{ width: `${100 - collectionRate}%` }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title={`Pending: ${100 - collectionRate}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Paid: {reportTotals.currencySymbol} {reportTotals.totalPaid.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    Pending / Due: {reportTotals.currencySymbol} {reportTotals.totalPending.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* TOP CLIENTS SUMMARY */}
            {topClientsInPeriod.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  {t.topClients}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {topClientsInPeriod.map((client, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="font-bold text-slate-800 truncate">{client.name}</div>
                        <div className="text-[10px] text-slate-500">{client.count} {t.totalInvoicesCount}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900 shrink-0">
                        {reportTotals.currencySymbol} {client.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INVOICES IN PERIOD TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.invoicesInPeriod} ({periodInvoices.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {reportTotals.periodLabel}
                </span>
              </div>

              {periodInvoices.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-1">
                  <p className="text-xs font-medium">{t.noInvoicesInPeriod}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase">
                        <th className="p-3">#</th>
                        <th className="p-3">Invoice</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-right">Paid</th>
                        <th className="p-3 text-right">Due</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodInvoices.map((inv, idx) => {
                        const totals = calculateInvoiceTotals(inv);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">
                              {inv.invoiceNumber}
                            </td>
                            <td className="p-3 text-slate-600 whitespace-nowrap">
                              {inv.issueDate}
                            </td>
                            <td className="p-3 text-slate-800">
                              <div className="font-semibold truncate max-w-[160px]">
                                {inv.client.name || 'Client'}
                              </div>
                              {inv.client.company && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                  {inv.client.company}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge(
                                  inv.status
                                )}`}
                              >
                                {statusLabel(inv.status)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(totals.grandTotal, inv.currency)}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-700 whitespace-nowrap">
                              {formatCurrency(totals.amountPaid, inv.currency)}
                            </td>
                            <td className="p-3 text-right font-mono text-amber-700 whitespace-nowrap">
                              {formatCurrency(totals.balanceDue, inv.currency)}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectInvoice(inv);
                                  onClose();
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded transition-colors cursor-pointer"
                              >
                                {t.open}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'history' ? (
              <span>
                {filteredHistoryInvoices.length} {t.storedLocally}
              </span>
            ) : (
              <span>
                {periodInvoices.length} {t.totalInvoicesCount} ({reportTotals.periodLabel})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONFIRMATION DIALOG: SINGLE DELETE */}
      {/* ======================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{t.deleteInvoice}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.deleteConfirm}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION DIALOG: BATCH DELETE */}
      {/* ======================================================== */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{t.batchDelete}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.batchDeleteConfirm} ({selectedIds.length} invoices)
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {t.batchDelete} ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION DIALOG: CLEAR ALL INVOICES */}
      {/* ======================================================== */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{t.clearAllInvoices}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.clearAllConfirm}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {t.clearAllInvoices}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
