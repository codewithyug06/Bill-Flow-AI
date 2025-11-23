
import { Party, Product, Transaction, Invoice, Purchase, Expense } from '../types';

const KEYS = {
  PRODUCTS: 'mbb_products',
  PARTIES: 'mbb_parties',
  INVOICES: 'mbb_invoices',
  PURCHASES: 'mbb_purchases',
  EXPENSES: 'mbb_expenses',
  TRANSACTIONS: 'mbb_transactions',
  USER: 'mbb_user'
};

const initialProducts: Product[] = [
  { id: '1', name: 'Wireless Mouse', category: 'Electronics', price: 25.00, stock: 45, unit: 'pcs', description: 'Ergonomic wireless mouse.' },
  { id: '2', name: 'Mechanical Keyboard', category: 'Electronics', price: 120.00, stock: 12, unit: 'pcs', description: 'RGB backlit keyboard.' },
  { id: '3', name: 'Office Chair', category: 'Furniture', price: 199.99, stock: 5, unit: 'pcs', description: 'Mesh office chair.' },
];

const initialParties: Party[] = [
  { id: '1', name: 'VTK INDUSTRIES PRIVATE LIMITED', type: 'Customer', phone: '9876543210', balance: 15000, gstin: '33ABCDE1234F1Z5', address: '123, Anna Salai, Chennai' },
  { id: '2', name: 'Balaji Plastics', type: 'Supplier', phone: '8877665544', balance: -5000, gstin: '33XYZDE1234F1Z5', address: '45, Industrial Estate, Ambattur' },
];

export const PersistenceService = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  },

  load: <T>(key: string, defaultValue: T): T => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error("Error loading from localStorage", e);
      return defaultValue;
    }
  },

  // Specific Loaders with Defaults
  loadProducts: () => PersistenceService.load<Product[]>(KEYS.PRODUCTS, initialProducts),
  loadParties: () => PersistenceService.load<Party[]>(KEYS.PARTIES, initialParties),
  loadInvoices: () => PersistenceService.load<Invoice[]>(KEYS.INVOICES, []),
  loadPurchases: () => PersistenceService.load<Purchase[]>(KEYS.PURCHASES, []),
  loadExpenses: () => PersistenceService.load<Expense[]>(KEYS.EXPENSES, []),
  loadTransactions: () => PersistenceService.load<Transaction[]>(KEYS.TRANSACTIONS, []),
  
  // Keys for direct access
  KEYS
};
