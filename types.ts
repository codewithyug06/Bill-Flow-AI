export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  hsn?: string;
  description?: string;
  barcode?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  hsn?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate?: string;
  vehicleNo?: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  total: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Estimate {
  id: string;
  estimateNo: string;
  date: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  validUntil?: string;
}

export interface PurchaseItem {
  productId: string; 
  name: string;
  hsn?: string;
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
  balance: number; 
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
  description?: string;
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
  email?: string;
  gstin?: string;
  address?: string;
  logoUrl?: string; 
  signatureUrl?: string; 
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  role: 'owner' | 'staff';
  businessId: string;
  lastActive?: string; 
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'alert' | 'info';
}

export type ViewState = 'dashboard' | 'parties' | 'items' | 'sales' | 'estimates' | 'purchases' | 'reports' | 'expenses' | 'settings' | 'dummy-invoice';

export interface AuditLog {
  id: string;
  date: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
}