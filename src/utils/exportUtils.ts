import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { Invoice } from '../types';
import { calculateInvoiceTotals, calculateItemTotal, formatCurrency } from './calculations';

/**
 * Exports invoice data to an Excel (.xlsx) spreadsheet
 */
export function exportInvoiceToExcel(invoice: Invoice): void {
  const totals = calculateInvoiceTotals(invoice);
  const currencySymbol = invoice.currency.symbol.trim();

  // Create clean workbook
  const wb = XLSX.utils.book_new();

  // Prepare structured worksheet rows
  const rows: (string | number)[][] = [
    ['INVOICE', '', '', '', '', ''],
    ['Invoice Number:', invoice.invoiceNumber, '', 'Status:', invoice.status.toUpperCase(), ''],
    ['Issue Date:', invoice.issueDate, '', 'Due Date:', invoice.dueDate, ''],
    ['Currency:', `${invoice.currency.name} (${currencySymbol})`, '', '', '', ''],
    [],
    ['SENDER (FROM)', '', '', 'CLIENT (BILL TO)', '', ''],
    ['Company / Name:', invoice.sender.name || '', '', 'Client Name:', invoice.client.name || '', ''],
    ['Email:', invoice.sender.email || '', '', 'Company:', invoice.client.company || '', ''],
    ['Phone:', invoice.sender.phone || '', '', 'Email:', invoice.client.email || '', ''],
    ['Address:', invoice.sender.address || '', '', 'Phone:', invoice.client.phone || '', ''],
    [
      'City/Country:',
      [invoice.sender.city, invoice.sender.country].filter(Boolean).join(', '),
      '',
      'Billing Address:',
      [invoice.client.address, invoice.client.city, invoice.client.country].filter(Boolean).join(', '),
      '',
    ],
    ['Tax / VAT ID:', invoice.sender.taxId || '', '', '', '', ''],
    [],
    ['LINE ITEMS', '', '', '', '', ''],
    ['#', 'Description', 'Details / Notes', 'Quantity', 'Unit', `Unit Price (${currencySymbol})`, `Amount (${currencySymbol})`],
  ];

  // Add line items
  invoice.items.forEach((item, index) => {
    rows.push([
      index + 1,
      item.description || 'Item',
      item.details || '',
      item.quantity,
      item.unitType || 'pcs',
      item.unitPrice,
      calculateItemTotal(item),
    ]);
  });

  // Add Summary / Totals
  rows.push([]);
  rows.push(['', '', '', '', 'SUMMARY', '', '']);
  rows.push(['', '', '', '', 'Subtotal:', totals.subtotal]);
  if (totals.discountAmount > 0) {
    rows.push([
      '',
      '',
      '',
      '',
      `Discount (${invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'}):`,
      -totals.discountAmount,
    ]);
  }
  if (invoice.taxRate > 0) {
    rows.push(['', '', '', '', `Tax / VAT (${invoice.taxRate}%):`, totals.taxAmount]);
  }
  if (totals.shippingFee > 0) {
    rows.push(['', '', '', '', 'Shipping / Delivery:', totals.shippingFee]);
  }
  rows.push(['', '', '', '', 'GRAND TOTAL:', totals.grandTotal]);
  if (totals.amountPaid > 0) {
    rows.push(['', '', '', '', 'Amount Paid:', -totals.amountPaid]);
  }
  rows.push(['', '', '', '', 'BALANCE DUE:', totals.balanceDue]);

  // Notes & terms
  if (invoice.notes || invoice.terms) {
    rows.push([]);
    if (invoice.notes) {
      rows.push(['NOTES & PAYMENT INFO:', invoice.notes]);
    }
    if (invoice.terms) {
      rows.push(['TERMS & CONDITIONS:', invoice.terms]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readable viewing
  ws['!cols'] = [
    { wch: 18 }, // Col A
    { wch: 35 }, // Col B
    { wch: 25 }, // Col C
    { wch: 12 }, // Col D
    { wch: 22 }, // Col E
    { wch: 20 }, // Col F
    { wch: 20 }, // Col G
  ];

  const sheetName = invoice.invoiceNumber ? invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 31) : 'Invoice';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `${invoice.invoiceNumber || 'Invoice'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Safely captures the rendered invoice to a high-resolution HTML Canvas.
 * Uses an isolated sandbox clone attached to document.body to guarantee
 * full 800px layout recalculation and non-zero dimensions even when the live
 * preview tab is inactive or hidden on mobile devices.
 */
async function captureInvoiceCanvas(): Promise<HTMLCanvasElement> {
  let paperElement = document.getElementById('invoice-paper');
  if (!paperElement) {
    // Grace period in case component is currently mounting
    await new Promise((resolve) => setTimeout(resolve, 150));
    paperElement = document.getElementById('invoice-paper');
  }

  if (!paperElement) {
    throw new Error('Invoice preview element (#invoice-paper) not found in DOM.');
  }

  // Strategy 1: Isolated Sandbox Clone
  // Bypasses parent tab display:none, viewport shrinkage, zoom scaling, and scroll transforms
  const sandbox = document.createElement('div');
  sandbox.id = 'invoice-export-sandbox';
  sandbox.setAttribute('aria-hidden', 'true');
  sandbox.style.cssText = [
    'position: fixed !important;',
    'top: 0 !important;',
    'left: 0 !important;',
    'width: 800px !important;',
    'min-width: 800px !important;',
    'max-width: 800px !important;',
    'margin: 0 !important;',
    'padding: 0 !important;',
    'z-index: -99999 !important;',
    'background-color: #ffffff !important;',
    'opacity: 1 !important;',
    'pointer-events: none !important;',
    'overflow: visible !important;',
  ].join(' ');

  const clone = paperElement.cloneNode(true) as HTMLElement;
  clone.id = 'invoice-paper-export-clone';
  clone.style.cssText = [
    'transform: none !important;',
    '-webkit-transform: none !important;',
    'width: 800px !important;',
    'min-width: 800px !important;',
    'max-width: 800px !important;',
    'margin: 0 !important;',
    'box-shadow: none !important;',
    'display: flex !important;',
    'flex-direction: column !important;',
    'visibility: visible !important;',
    'opacity: 1 !important;',
    'background-color: #ffffff !important;',
  ].join(' ');

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    // Wait for any cloned images (logos, signature) to complete loading
    const images = Array.from(clone.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 800);
          });
        })
      );
    }

    // Wait for document fonts if supported
    if (document.fonts && typeof document.fonts.ready !== 'undefined') {
      await document.fonts.ready.catch(() => {});
    }

    // Small delay to allow browser layout engine to paint clone
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(clone, {
      scale: 2, // 2x resolution for sharp borders and text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 1200,
    });

    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return canvas;
    }
  } catch (cloneErr) {
    console.warn('Sandbox clone capture failed, attempting direct capture:', cloneErr);
  } finally {
    if (sandbox.parentNode) {
      sandbox.parentNode.removeChild(sandbox);
    }
  }

  // Strategy 2: Direct capture fallback if sandbox fails
  const originalTransform = paperElement.style.transform;
  paperElement.style.transform = 'none';

  try {
    const canvas = await html2canvas(paperElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      throw new Error(`Invalid canvas rendered (${canvas?.width}x${canvas?.height})`);
    }

    return canvas;
  } finally {
    paperElement.style.transform = originalTransform;
  }
}

/**
 * Exports invoice element directly into a downloadable A4 PDF document
 */
export async function exportInvoiceToPDF(invoice: Invoice): Promise<void> {
  try {
    const canvas = await captureInvoiceCanvas();
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Strictly validate dimensions as valid finite numbers
    const pdfWidth = Number(pdf.internal.pageSize.getWidth()) || 210;
    const pdfHeight = Number(pdf.internal.pageSize.getHeight()) || 297;

    const imgWidth = pdfWidth;
    const calculatedHeight = (canvas.height * pdfWidth) / (canvas.width || 1);
    const imgHeight = !isFinite(calculatedHeight) || isNaN(calculatedHeight) || calculatedHeight <= 0
      ? pdfHeight
      : Number(calculatedHeight.toFixed(2));

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, Number(position.toFixed(2)), imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, Number(position.toFixed(2)), imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    const fileName = `${invoice.invoiceNumber || 'Invoice'}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generates an in-memory PDF Blob from the rendered invoice (for Cloud / Drive sync)
 */
export async function generateInvoicePDFBlob(invoice: Invoice): Promise<Blob> {
  try {
    const canvas = await captureInvoiceCanvas();
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = Number(pdf.internal.pageSize.getWidth()) || 210;
    const pdfHeight = Number(pdf.internal.pageSize.getHeight()) || 297;

    const imgWidth = pdfWidth;
    const calculatedHeight = (canvas.height * pdfWidth) / (canvas.width || 1);
    const imgHeight = !isFinite(calculatedHeight) || isNaN(calculatedHeight) || calculatedHeight <= 0
      ? pdfHeight
      : Number(calculatedHeight.toFixed(2));

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, Number(position.toFixed(2)), imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, Number(position.toFixed(2)), imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('Error creating PDF Blob:', error);
    throw error;
  }
}

export interface ReportSummaryData {
  periodLabel: string;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  currencySymbol: string;
}

/**
 * Exports aggregated periodic report data to Excel (.xlsx)
 */
export function exportInvoiceReportToExcel(
  invoices: Invoice[],
  summary: ReportSummaryData,
  topClients: { name: string; count: number; total: number; paid: number }[]
): void {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    ['PS INVOICE - FINANCIAL & SALES REPORT', ''],
    ['Report Period:', summary.periodLabel],
    ['Generated Date:', new Date().toLocaleString()],
    ['Admin / Owner:', 'Pramesh Shaminda (psgss91@gmail.com)'],
    [],
    ['EXECUTIVE SUMMARY', ''],
    ['Total Invoiced Revenue:', `${summary.currencySymbol} ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Total Paid Received:', `${summary.currencySymbol} ${summary.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Pending / Due Amount:', `${summary.currencySymbol} ${summary.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Overdue Amount:', `${summary.currencySymbol} ${summary.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ['Total Invoices Count:', summary.totalInvoices],
    ['Average Invoice Value:', `${summary.currencySymbol} ${summary.averageInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    [],
    ['INVOICE LIST (DETAILED)', '', '', '', '', '', '', '', ''],
    [
      '#',
      'Invoice #',
      'Issue Date',
      'Due Date',
      'Client Name',
      'Company',
      'Items Count',
      'Status',
      `Total (${summary.currencySymbol})`,
      `Paid (${summary.currencySymbol})`,
      `Balance Due (${summary.currencySymbol})`,
    ],
  ];

  invoices.forEach((inv, idx) => {
    const totals = calculateInvoiceTotals(inv);
    summaryRows.push([
      idx + 1,
      inv.invoiceNumber,
      inv.issueDate,
      inv.dueDate,
      inv.client.name,
      inv.client.company || '-',
      inv.items.length,
      inv.status.toUpperCase(),
      totals.grandTotal,
      totals.amountPaid,
      totals.balanceDue,
    ]);
  });

  if (topClients.length > 0) {
    summaryRows.push([]);
    summaryRows.push(['TOP CLIENTS BREAKDOWN', '', '', '']);
    summaryRows.push([
      'Client Name',
      'Invoices Count',
      `Total Billed (${summary.currencySymbol})`,
      `Total Paid (${summary.currencySymbol})`,
    ]);
    topClients.forEach((c) => {
      summaryRows.push([c.name, c.count, c.total, c.paid]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const sanitizedPeriod = summary.periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Invoice_Report_${sanitizedPeriod}_${Date.now()}.xlsx`);
}

/**
 * Exports aggregated periodic report data to CSV (.csv)
 */
export function exportInvoiceReportToCSV(
  invoices: Invoice[],
  summary: ReportSummaryData
): void {
  const headers = [
    'Invoice Number',
    'Issue Date',
    'Due Date',
    'Client Name',
    'Company',
    'Currency',
    'Items Count',
    'Status',
    'Grand Total',
    'Amount Paid',
    'Balance Due',
  ];
  const rows = invoices.map((inv) => {
    const totals = calculateInvoiceTotals(inv);
    return [
      `"${inv.invoiceNumber}"`,
      `"${inv.issueDate}"`,
      `"${inv.dueDate}"`,
      `"${(inv.client.name || '').replace(/"/g, '""')}"`,
      `"${(inv.client.company || '').replace(/"/g, '""')}"`,
      `"${inv.currency.code}"`,
      inv.items.length,
      `"${inv.status}"`,
      totals.grandTotal,
      totals.amountPaid,
      totals.balanceDue,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitizedPeriod = summary.periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Invoice_Report_${sanitizedPeriod}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

