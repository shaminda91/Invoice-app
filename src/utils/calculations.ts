import { Currency, Invoice, InvoiceItem } from '../types';

export function calculateItemTotal(item: InvoiceItem): number {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unitPrice) || 0;
  return Math.round(qty * price * 100) / 100;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
}

export function calculateInvoiceTotals(invoice: Invoice): InvoiceTotals {
  const subtotal = invoice.items.reduce((acc, item) => acc + calculateItemTotal(item), 0);

  let discountAmount = 0;
  if (invoice.discountType === 'percentage') {
    discountAmount = (subtotal * (Number(invoice.discountValue) || 0)) / 100;
  } else {
    discountAmount = Number(invoice.discountValue) || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(invoice.taxRate) || 0)) / 100;
  const shippingFee = Number(invoice.shippingFee) || 0;
  const grandTotal = Math.max(0, taxableAmount + taxAmount + shippingFee);
  const amountPaid = Number(invoice.amountPaid) || 0;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingFee: Math.round(shippingFee * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    amountPaid: Math.round(amountPaid * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
  };
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency.position === 'suffix') {
    return `${formatted} ${currency.symbol.trim()}`;
  }
  return `${currency.symbol}${formatted}`;
}

export function generateInvoiceNumber(prefix = 'INV'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDueDateString(daysAhead = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}
