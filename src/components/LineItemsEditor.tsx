import React from 'react';
import { Currency, InvoiceItem } from '../types';
import { calculateItemTotal, formatCurrency } from '../utils/calculations';
import { Translations } from '../i18n/translations';
import { Plus, Trash2, Copy, Sparkles } from 'lucide-react';

interface LineItemsEditorProps {
  items: InvoiceItem[];
  currency: Currency;
  onChange: (items: InvoiceItem[]) => void;
  t: Translations;
}

export const LineItemsEditor: React.FC<LineItemsEditorProps> = ({ items, currency, onChange, t }) => {
  const commonPresets = [
    { description: t.presetWebDev, unitPrice: 75000, unitType: 'project' },
    { description: t.presetConsulting, unitPrice: 12000, unitType: 'hrs' },
    { description: t.presetHosting, unitPrice: 24000, unitType: 'year' },
    { description: t.presetMaintenance, unitPrice: 15000, unitType: 'months' },
    { description: t.presetGraphicDesign, unitPrice: 30000, unitType: 'package' },
  ];

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: 'item-' + Date.now(),
      description: '',
      details: '',
      quantity: 1,
      unitPrice: 0,
      unitType: 'items',
    };
    onChange([...items, newItem]);
  };

  const addPresetItem = (preset: {
    description: string;
    unitPrice: number;
    unitType: string;
  }) => {
    const newItem: InvoiceItem = {
      id: 'item-' + Date.now(),
      description: preset.description,
      details: '',
      quantity: 1,
      unitPrice: preset.unitPrice,
      unitType: preset.unitType,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const duplicateItem = (item: InvoiceItem) => {
    const clone: InvoiceItem = {
      ...item,
      id: 'item-' + Date.now(),
    };
    const index = items.findIndex((i) => i.id === item.id);
    const newItems = [...items];
    newItems.splice(index + 1, 0, clone);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          {t.lineItems} ({items.length})
        </h3>
        <button
          type="button"
          id="btn-add-item"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.addItem}
        </button>
      </div>

      {/* ITEMS LIST */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const rowTotal = calculateItemTotal(item);

          return (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                  #{index + 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateItem(item)}
                    title={t.duplicateItem}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    title={t.deleteItem}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* DESCRIPTION & DETAILS */}
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {t.itemName}
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder={t.itemNamePlaceholder}
                    className="w-full text-sm font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={item.details || ''}
                    onChange={(e) => updateItem(item.id, 'details', e.target.value)}
                    placeholder={t.itemDetailsPlaceholder}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* QTY, UNIT, PRICE & TOTAL ROW (Responsive: 2-col on phones, 4-col on tablet/desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 sm:gap-2 items-center">
                <div className="col-span-1 sm:col-span-3 min-w-0">
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">{t.qty}</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3 min-w-0">
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">{t.unit}</label>
                  <input
                    type="text"
                    value={item.unitType || ''}
                    onChange={(e) => updateItem(item.id, 'unitType', e.target.value)}
                    placeholder="hrs/pcs"
                    className="w-full text-sm px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3 min-w-0">
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    {t.price} ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="col-span-1 sm:col-span-3 min-w-0 text-right bg-slate-100/70 sm:bg-transparent p-1.5 sm:p-0 rounded-lg">
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    {t.rowTotal}
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-900 truncate">
                    {formatCurrency(rowTotal, currency)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK PRESET SUGGESTIONS */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.quickAddPresets}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {commonPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addPresetItem(preset)}
              className="text-xs px-2.5 py-1 rounded-md bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              + {preset.description} ({formatCurrency(preset.unitPrice, currency)})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
