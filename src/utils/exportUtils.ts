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
 * Exports invoice element (#invoice-paper) directly into a downloadable PDF
 */
export async function exportInvoiceToPDF(invoice: Invoice): Promise<void> {
  const paperElement = document.getElementById('invoice-paper');
  if (!paperElement) {
    // Fallback to browser print if element not found
    window.print();
    return;
  }

  // Create clone or temporarily reset zoom transform to capture pristine scale
  const originalTransform = paperElement.style.transform;
  paperElement.style.transform = 'none';

  try {
    const canvas = await html2canvas(paperElement, {
      scale: 2, // High resolution for sharp text and borders
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate proportional height
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Center or top-align on A4
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // If content spans multiple pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    const fileName = `${invoice.invoiceNumber || 'Invoice'}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    paperElement.style.transform = originalTransform;
  }
}

/**
 * Generates an in-memory PDF Blob from the rendered invoice
 */
export async function generateInvoicePDFBlob(invoice: Invoice): Promise<Blob> {
  const paperElement = document.getElementById('invoice-paper');
  if (!paperElement) {
    throw new Error('Invoice preview element not found');
  }

  const originalTransform = paperElement.style.transform;
  paperElement.style.transform = 'none';

  try {
    const canvas = await html2canvas(paperElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('Error creating PDF Blob:', error);
    throw error;
  } finally {
    paperElement.style.transform = originalTransform;
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

