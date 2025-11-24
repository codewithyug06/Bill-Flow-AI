
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  description?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  total: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PurchaseItem {
  productId: string; // Can be empty if not linked
  name: string;
  qty: number;
  rate: number;
}

export interface Purchase {
  id: string;
  date: string;
  invoiceNo: string;
  partyName: string;
  dueIn: string;
  amount: number;
  unpaidAmount: number;
  status: 'Paid' | 'Unpaid';
  items: PurchaseItem[];
}

export interface Party {
  id: string;
  name: string;
  type: 'Customer' | 'Supplier';
  phone: string;
  balance: number; // Positive = To Collect, Negative = To Pay
  email?: string;
  gstin?: string;
  address?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Sales Invoice' | 'Purchase' | 'Expense' | 'Payment In' | 'Payment Out';
  txnNo: string;
  partyName: string;
  amount: number;
  status?: 'Paid' | 'Unpaid' | 'Pending';
  description?: string; // For expenses or details
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paymentMode: 'Cash' | 'Online' | 'Bank Transfer';
}

export interface User {
  id: string;
  name: string;
  phone: string;
  businessName: string;
  gstin?: string;
  address?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'alert' | 'info';
}

export type ViewState = 'dashboard' | 'parties' | 'items' | 'sales' | 'purchases' | 'reports' | 'expenses' | 'settings' | 'dummy-invoice';

export interface Insight {
  title: string;
  content: string;
  type: 'positive' | 'negative' | 'neutral' | 'action';
}
