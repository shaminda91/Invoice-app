import { Currency } from '../types';

export const CURRENCIES: Currency[] = [
  {
    code: 'LKR',
    symbol: 'Rs. ',
    name: 'Sri Lankan Rupee (LKR)',
    position: 'prefix',
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar (USD)',
    position: 'prefix',
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (EUR)',
    position: 'prefix',
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (GBP)',
    position: 'prefix',
  },
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee (INR)',
    position: 'prefix',
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar (AUD)',
    position: 'prefix',
  },
  {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar (CAD)',
    position: 'prefix',
  },
  {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham (AED)',
    position: 'prefix',
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar (SGD)',
    position: 'prefix',
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen (JPY)',
    position: 'prefix',
  },
];

export const ACCENT_COLORS = [
  { id: 'indigo', name: 'Royal Indigo', value: '#4f46e5', light: '#eef2ff' },
  { id: 'emerald', name: 'Emerald Green', value: '#059669', light: '#ecfdf5' },
  { id: 'sky', name: 'Ocean Blue', value: '#0284c7', light: '#f0f9ff' },
  { id: 'slate', name: 'Corporate Slate', value: '#334155', light: '#f8fafc' },
  { id: 'rose', name: 'Crimson Rose', value: '#e11d48', light: '#fff1f2' },
  { id: 'amber', name: 'Amber Gold', value: '#d97706', light: '#fffbeb' },
  { id: 'violet', name: 'Modern Violet', value: '#7c3aed', light: '#f5f3ff' },
];
