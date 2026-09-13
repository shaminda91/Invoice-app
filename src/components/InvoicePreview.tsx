import React, { useRef, useState, useEffect } from 'react';
import { Invoice } from '../types';
import { calculateInvoiceTotals, calculateItemTotal, formatCurrency } from '../utils/calculations';
import { Translations } from '../i18n/translations';
import { Building2, Calendar, FileText, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
  zoomLevel?: number;
  autoFit?: boolean;
  onCalculatedScaleChange?: (scalePercent: number) => void;
  t: Translations;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  zoomLevel = 100,
  autoFit = false,
  onCalculatedScaleChange,
  t,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [paperHeight, setPaperHeight] = useState<number>(1050);

  // Monitor container width & paper height for responsive auto-fit on phones & tablets
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      if (paperRef.current) {
        setPaperHeight(paperRef.current.offsetHeight);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (paperRef.current) resizeObserver.observe(paperRef.current);

    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [invoice]);

  const totals = calculateInvoiceTotals(invoice);
  const { currency, accentColor, template } = invoice;

  // Compute effective scale based on autoFit or manual zoom
  // Base A4 document width in CSS is 800px.
  const autoScale = containerWidth > 0
    ? Math.min(1.0, Math.max(0.32, (containerWidth - 24) / 800))
    : 1.0;

  const effectiveScale = autoFit ? autoScale : zoomLevel / 100;
  const effectivePercent = Math.round(effectiveScale * 100);

  useEffect(() => {
    if (onCalculatedScaleChange) {
      onCalculatedScaleChange(effectivePercent);
    }
  }, [effectivePercent, onCalculatedScaleChange]);

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    pending: 'bg-amber-50 text-amber-700 border-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    overdue: 'bg-rose-50 text-rose-700 border-rose-300',
  };

  const statusLabels = {
    draft: t.draft.toUpperCase(),
    pending: t.pending.toUpperCase(),
    paid: t.paid.toUpperCase(),
    overdue: t.overdue.toUpperCase(),
  };

  const scaledHeight = paperHeight > 0 ? Math.ceil(paperHeight * effectiveScale) : undefined;

  return (
    <div
      ref={containerRef}
      id="invoice-preview-container"
      className="w-full flex justify-center py-2 px-1 transition-all overflow-x-auto"
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          height: scaledHeight ? `${scaledHeight + 20}px` : 'auto',
          overflow: 'visible',
        }}
      >
        <div
          ref={paperRef}
          id="invoice-paper"
          style={{
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top center',
            width: '800px',
            minWidth: '800px',
          }}
          className={`bg-white text-slate-800 shadow-xl print:shadow-none print:m-0 print:w-full print:max-w-none print:min-h-0 print:p-8 p-10 md:p-12 flex flex-col justify-between rounded-sm border border-slate-200 print:border-none transition-transform`}
        >
        {/* TOP SECTION BASED ON TEMPLATE */}
        <div>
          {template === 'executive' ? (
            /* EXECUTIVE TEMPLATE HEADER */
            <div
              className="p-6 -mx-10 md:-mx-12 -mt-10 md:-mt-12 mb-8 text-white rounded-t-sm"
              style={{ backgroundColor: accentColor }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {invoice.sender.logoUrl ? (
                    <img
                      src={invoice.sender.logoUrl}
                      alt={invoice.sender.name || 'Logo'}
                      className="w-16 h-16 object-contain bg-white rounded-md p-1 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-white/15 flex items-center justify-center text-white border border-white/20">
                      <Building2 className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {invoice.sender.name || 'Your Business Name'}
                    </h1>
                    {invoice.sender.taxId && (
                      <p className="text-xs text-white/80 mt-0.5">{t.taxVatId}: {invoice.sender.taxId}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-extrabold tracking-tight uppercase">{t.invoice}</div>
                  <div className="text-sm font-medium tracking-wide text-white/90 mt-1">
                    #{invoice.invoiceNumber || 'INV-0001'}
                  </div>
                  <span
                    className={`inline-block mt-2 px-3 py-0.5 text-xs font-bold uppercase rounded-full border bg-white text-slate-900 shadow-sm`}
                  >
                    {statusLabels[invoice.status]}
                  </span>
                </div>
              </div>
            </div>
          ) : template === 'classic' ? (
            /* CLASSIC TEMPLATE HEADER */
            <div className="border-b-2 border-slate-900 pb-6 mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {invoice.sender.logoUrl && (
                    <img
                      src={invoice.sender.logoUrl}
                      alt="Logo"
                      className="max-h-14 object-contain mb-3"
                    />
                  )}
                  <h1 className="text-2xl font-serif font-bold text-slate-900">
                    {invoice.sender.name || 'Business Name'}
                  </h1>
                  {invoice.sender.taxId && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {t.taxVatId}: {invoice.sender.taxId}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div
                    className="text-3xl font-serif font-black tracking-wider uppercase"
                    style={{ color: accentColor }}
                  >
                    {t.invoice}
                  </div>
                  <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                    NO. {invoice.invoiceNumber || 'INV-0001'}
                  </p>
                  <div
                    className={`mt-2 inline-block px-3 py-0.5 text-xs font-semibold rounded uppercase border ${
                      statusColors[invoice.status]
                    }`}
                  >
                    {statusLabels[invoice.status]}
                  </div>
                </div>
              </div>
            </div>
          ) : template === 'minimal' ? (
            /* MINIMAL TEMPLATE HEADER */
            <div className="border-b border-slate-200 pb-6 mb-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <h1 className="text-xl font-medium tracking-tight text-slate-900">
                    {invoice.sender.name || 'Business Name'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {invoice.sender.city && `${invoice.sender.city}, `}
                    {invoice.sender.country}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs tracking-widest text-slate-400 uppercase">{t.invoice}</span>
                  <p className="text-lg font-mono font-medium text-slate-800">
                    {invoice.invoiceNumber || 'INV-0001'}
                  </p>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    {statusLabels[invoice.status]}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* MODERN TEMPLATE HEADER */
            <div className="pb-6 mb-8 border-b border-slate-100">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {invoice.sender.logoUrl ? (
                    <img
                      src={invoice.sender.logoUrl}
                      alt="Logo"
                      className="max-h-16 max-w-36 object-contain rounded"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {(invoice.sender.name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      {invoice.sender.name || 'Your Company Name'}
                    </h1>
                    {invoice.sender.taxId && (
                      <p className="text-xs text-slate-500 font-medium">
                        {t.taxVatId}: {invoice.sender.taxId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    {t.invoice}
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                    #{invoice.invoiceNumber || 'INV-0001'}
                  </div>
                  <div
                    className={`mt-2 inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                      statusColors[invoice.status]
                    }`}
                  >
                    {statusLabels[invoice.status]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SENDER, CLIENT & INVOICE META GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
            {/* SENDER FROM */}
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
                {t.from}
              </span>
              <p className="font-semibold text-slate-900">
                {invoice.sender.name || 'Business Name'}
              </p>
              {invoice.sender.address && (
                <p className="text-slate-600 leading-relaxed text-xs">{invoice.sender.address}</p>
              )}
              {(invoice.sender.city || invoice.sender.postalCode || invoice.sender.country) && (
                <p className="text-slate-600 text-xs">
                  {[invoice.sender.city, invoice.sender.postalCode, invoice.sender.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {invoice.sender.email && (
                <p className="text-slate-600 text-xs flex items-center gap-1.5 pt-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {invoice.sender.email}
                </p>
              )}
              {invoice.sender.phone && (
                <p className="text-slate-600 text-xs flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {invoice.sender.phone}
                </p>
              )}
              {invoice.sender.website && (
                <p className="text-slate-600 text-xs text-indigo-600 hover:underline">
                  {invoice.sender.website}
                </p>
              )}
            </div>

            {/* BILL TO */}
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
                {t.billedTo}
              </span>
              <p className="font-semibold text-slate-900">{invoice.client.name || 'Client Name'}</p>
              {invoice.client.company && (
                <p className="text-xs font-medium text-slate-700">{invoice.client.company}</p>
              )}
              {invoice.client.address && (
                <p className="text-slate-600 leading-relaxed text-xs">{invoice.client.address}</p>
              )}
              {(invoice.client.city || invoice.client.postalCode || invoice.client.country) && (
                <p className="text-slate-600 text-xs">
                  {[invoice.client.city, invoice.client.postalCode, invoice.client.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {invoice.client.email && (
                <p className="text-slate-600 text-xs flex items-center gap-1.5 pt-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {invoice.client.email}
                </p>
              )}
              {invoice.client.phone && (
                <p className="text-slate-600 text-xs flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {invoice.client.phone}
                </p>
              )}

              {invoice.client.hasShippingAddress && invoice.client.shippingAddress && (
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-0.5">
                    {t.shipTo}
                  </span>
                  <p className="text-slate-600 text-xs whitespace-pre-line">
                    {invoice.client.shippingAddress}
                  </p>
                </div>
              )}
            </div>

            {/* INVOICE DETAILS */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-slate-50">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
                  {t.invoiceDate}
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  {invoice.issueDate || '—'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
                  {t.paymentDueDate}
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {invoice.dueDate || '—'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
                  {t.currency}
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {currency.name} ({currency.symbol})
                </p>
              </div>
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <div className="mb-8 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr
                  className={`border-b-2 text-xs font-bold uppercase tracking-wider ${
                    template === 'classic'
                      ? 'border-slate-800 text-slate-900 bg-slate-100'
                      : 'border-slate-200 text-slate-600 bg-slate-50'
                  }`}
                >
                  <th className="py-3 px-3 w-12 text-center text-slate-600">#</th>
                  <th className="py-3 px-3">{t.itemAndDescription}</th>
                  <th className="py-3 px-3 text-right w-20">{t.qty}</th>
                  <th className="py-3 px-3 text-right w-28">{t.rate}</th>
                  <th className="py-3 px-3 text-right w-32">{t.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      {t.noItemsYet}
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 text-center text-xs font-mono text-slate-600 align-top">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <p className="font-semibold text-slate-900 text-sm">{item.description}</p>
                        {item.details && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {item.details}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700 align-top">
                        {item.quantity}{' '}
                        {item.unitType && (
                          <span className="text-xs text-slate-600">{item.unitType}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 align-top">
                        {formatCurrency(item.unitPrice, currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 align-top">
                        {formatCurrency(calculateItemTotal(item), currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY & NOTES/TERMS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
            {/* NOTES & TERMS */}
            <div className="md:col-span-7 space-y-5">
              {invoice.notes && (
                <div className="text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    {t.notes}
                  </span>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                    {invoice.notes}
                  </p>
                </div>
              )}

              {invoice.terms && (
                <div className="text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    {t.termsConditions}
                  </span>
                  <p className="text-slate-500 whitespace-pre-line leading-relaxed">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>

            {/* TOTALS CALCULATION */}
            <div className="md:col-span-5">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm space-y-2.5">
                <div className="flex justify-between text-slate-600">
                  <span>{t.subtotal}</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(totals.subtotal, currency)}
                  </span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-xs">
                    <span>
                      {t.discount}{' '}
                      {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}
                    </span>
                    <span className="font-mono font-medium">
                      -{formatCurrency(totals.discountAmount, currency)}
                    </span>
                  </div>
                )}

                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>{t.taxVat} ({invoice.taxRate}%)</span>
                    <span className="font-mono font-medium text-slate-800">
                      +{formatCurrency(totals.taxAmount, currency)}
                    </span>
                  </div>
                )}

                {totals.shippingFee > 0 && (
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>{t.shippingFee}</span>
                    <span className="font-mono font-medium text-slate-800">
                      +{formatCurrency(totals.shippingFee, currency)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-bold text-base text-slate-900">
                  <span>{t.total}</span>
                  <span className="font-mono text-lg" style={{ color: accentColor }}>
                    {formatCurrency(totals.grandTotal, currency)}
                  </span>
                </div>

                {totals.amountPaid > 0 && (
                  <div className="flex justify-between text-xs text-slate-600 pt-1">
                    <span>{t.amountPaid}</span>
                    <span className="font-mono font-medium text-emerald-600">
                      -{formatCurrency(totals.amountPaid, currency)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between items-baseline font-bold text-slate-900">
                  <span className="text-xs uppercase tracking-wider text-slate-700">
                    {t.balanceDue}
                  </span>
                  <span
                    className={`font-mono text-base ${
                      totals.balanceDue === 0 ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(totals.balanceDue, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SIGNATURE & FOOTER */}
        <div className="pt-6 border-t border-slate-200 mt-auto">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="text-xs text-slate-600">
              <p className="font-medium text-slate-700">{t.questionsOrInquiries}</p>
              <p>
                {t.contact}{' '}
                <span className="text-slate-700 font-medium">
                  {invoice.sender.email || 'billing department'}
                </span>
                {invoice.sender.phone ? ` or call ${invoice.sender.phone}` : ''}
              </p>
            </div>

            {invoice.signatureName && (
              <div className="text-right">
                {invoice.signatureImage ? (
                  <img
                    src={invoice.signatureImage}
                    alt="Authorized Signature"
                    className="max-h-12 max-w-40 object-contain ml-auto mb-1"
                  />
                ) : (
                  <div className="h-10 flex items-end justify-end mb-1">
                    <span className="font-serif italic text-base text-slate-800 border-b border-slate-400 pb-0.5 px-4">
                      {invoice.signatureName}
                    </span>
                  </div>
                )}
                <div className="w-48 border-t border-slate-300 pt-1">
                  <p className="text-xs font-semibold text-slate-800">{invoice.signatureName}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    {t.authorizedSignatory}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-600 print:text-[10px]">
            {t.thankYouForPartnership}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
