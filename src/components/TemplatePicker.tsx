import React from 'react';
import { Invoice, TemplateId } from '../types';
import { ACCENT_COLORS, CURRENCIES } from '../data/currencies';
import { getDueDateString, getTodayDateString } from '../utils/calculations';
import { Translations } from '../i18n/translations';
import { Palette, Layers, Calendar, CheckCircle2 } from 'lucide-react';

interface TemplatePickerProps {
  invoice: Invoice;
  onChange: (updated: Partial<Invoice>) => void;
  t: Translations;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ invoice, onChange, t }) => {
  const templates: { id: TemplateId; name: string; desc: string }[] = [
    { id: 'modern', name: t.modernClean, desc: t.modernDesc },
    { id: 'classic', name: t.classicCorporate, desc: t.classicDesc },
    { id: 'minimal', name: t.minimalEditorial, desc: t.minimalDesc },
    { id: 'executive', name: t.executiveHeader, desc: t.executiveDesc },
  ];

  const setNetDueDate = (days: number) => {
    onChange({ dueDate: getDueDateString(days) });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-xs">
      {/* TEMPLATE STYLES */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.styleAndTemplate}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {templates.map((tmpl) => {
            const isSelected = invoice.template === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onChange({ template: tmpl.id })}
                className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">{tmpl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCENT COLOR & CURRENCY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        {/* ACCENT COLOR */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t.accentColor}
            </label>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_COLORS.map((col) => {
              const isSelected = invoice.accentColor === col.value;
              return (
                <button
                  key={col.id}
                  type="button"
                  title={col.name}
                  onClick={() => onChange({ accentColor: col.value })}
                  style={{ backgroundColor: col.value }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* CURRENCY SELECTOR */}
        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
            {t.currency}
          </label>
          <select
            value={invoice.currency.code}
            onChange={(e) => {
              const found = CURRENCIES.find((c) => c.code === e.target.value);
              if (found) onChange({ currency: found });
            }}
            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {CURRENCIES.map((cur) => (
              <option key={cur.code} value={cur.code}>
                {cur.name} ({cur.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATUS & QUICK DUE DATE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        {/* PAYMENT STATUS */}
        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
            {t.paymentStatus}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['draft', 'pending', 'paid', 'overdue'] as const).map((st) => {
              const isSelected = invoice.status === st;
              const labels = {
                draft: t.statusDraft,
                pending: t.statusPending,
                paid: t.statusPaid,
                overdue: t.statusOverdue,
              };
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onChange({ status: st })}
                  className={`px-2 py-1.5 text-xs font-semibold rounded-md border capitalize text-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>
        </div>

        {/* QUICK DUE DATE PRESETS */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t.quickDueDate}
            </label>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onChange({ dueDate: getTodayDateString() })}
              className="text-xs px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              {t.today}
            </button>
            <button
              type="button"
              onClick={() => setNetDueDate(7)}
              className="text-xs px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              {t.net7}
            </button>
            <button
              type="button"
              onClick={() => setNetDueDate(14)}
              className="text-xs px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              {t.net14}
            </button>
            <button
              type="button"
              onClick={() => setNetDueDate(30)}
              className="text-xs px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              {t.net30}
            </button>
            <button
              type="button"
              onClick={() => setNetDueDate(60)}
              className="text-xs px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              {t.net60}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
