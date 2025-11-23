
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { InventoryManager } from './components/InventoryManager';
import { GeminiAssistant } from './components/GeminiAssistant';
import { Parties } from './components/Parties';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { Expenses } from './components/Expenses';
import { DummyInvoiceBuilder } from './components/DummyInvoiceBuilder';
import { PurchaseInvoices } from './components/PurchaseInvoices';
import { Settings } from './components/Settings';
import { ViewState, User, Product, Party, Invoice, Purchase, Expense, Transaction, Notification } from './types';
import { PersistenceService } from './services/persistence';
import { Menu, Bell, X, Check, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showAssistant, setShowAssistant] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // --- Centralized State (acting as Backend DB) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- Initialization (Load from LocalStorage) ---
  useEffect(() => {
    setProducts(PersistenceService.loadProducts());
    setParties(PersistenceService.loadParties());
    setInvoices(PersistenceService.loadInvoices());
    setPurchases(PersistenceService.loadPurchases());
    setExpenses(PersistenceService.loadExpenses());
    setTransactions(PersistenceService.loadTransactions());
    
    // Load User
    const storedUser = PersistenceService.load(PersistenceService.KEYS.USER, null);
    if (storedUser) setUser(storedUser);
  }, []);

  // --- Persistence Listeners (Save on Change) ---
  useEffect(() => PersistenceService.save(PersistenceService.KEYS.PRODUCTS, products), [products]);
  useEffect(() => PersistenceService.save(PersistenceService.KEYS.PARTIES, parties), [parties]);
  useEffect(() => PersistenceService.save(PersistenceService.KEYS.INVOICES, invoices), [invoices]);
  useEffect(() => PersistenceService.save(PersistenceService.KEYS.PURCHASES, purchases), [purchases]);
  useEffect(() => PersistenceService.save(PersistenceService.KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => PersistenceService.save(PersistenceService.KEYS.TRANSACTIONS, transactions), [transactions]);
  useEffect(() => { if(user) PersistenceService.save(PersistenceService.KEYS.USER, user); }, [user]);


  // Helper to add notification
  const addNotification = (title: string, message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- Backend Logic / Controller Functions ---

  // 1. Handle New Sales Invoice
  const handleCreateSale = (invoice: Invoice) => {
    // A. Add Invoice
    setInvoices(prev => [invoice, ...prev]);

    // B. Deduct Stock
    setProducts(prevProducts => prevProducts.map(p => {
      const item = invoice.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock - item.quantity } : p;
    }));

    // C. Update Party Balance (Receivable) - ONLY IF PENDING/UNPAID
    if (invoice.status === 'Pending' || invoice.status === 'Overdue') {
      setParties(prevParties => prevParties.map(p => {
        return p.name === invoice.customerName 
          ? { ...p, balance: p.balance + invoice.total } 
          : p;
      }));
    }

    // D. Add Transaction
    const newTxn: Transaction = {
      id: invoice.id,
      date: invoice.date,
      type: 'Sales Invoice',
      txnNo: invoice.invoiceNo,
      partyName: invoice.customerName,
      amount: invoice.total,
      status: invoice.status === 'Paid' ? 'Paid' : 'Unpaid'
    };
    setTransactions(prev => [newTxn, ...prev]);

    // E. Notification
    addNotification('Sale Recorded', `Invoice ${invoice.invoiceNo} for ₹${invoice.total} created.`, 'success');
  };

  // 2. Handle New Purchase
  const handleCreatePurchase = (purchase: Purchase) => {
    // A. Add Purchase
    setPurchases(prev => [purchase, ...prev]);

    // B. Add Stock
    setProducts(prevProducts => prevProducts.map(p => {
      const item = purchase.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock + item.qty } : p;
    }));

    // C. Update Party Balance (Payable -> negative balance) - ONLY IF UNPAID
    if (purchase.status === 'Unpaid') {
      setParties(prevParties => prevParties.map(p => {
        return p.name === purchase.partyName 
          ? { ...p, balance: p.balance - purchase.amount } 
          : p;
      }));
    }

    // D. Add Transaction
    const newTxn: Transaction = {
      id: purchase.id,
      date: purchase.date,
      type: 'Purchase',
      txnNo: purchase.invoiceNo,
      partyName: purchase.partyName,
      amount: purchase.amount,
      status: purchase.status
    };
    setTransactions(prev => [newTxn, ...prev]);

    // E. Notification
    addNotification('Purchase Recorded', `Bill ${purchase.invoiceNo} for ₹${purchase.amount} saved.`, 'info');
  };

  // 3. Handle Expense
  const handleCreateExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    
    // Add Transaction
    const newTxn: Transaction = {
      id: expense.id,
      date: expense.date,
      type: 'Expense',
      txnNo: `EXP-${expense.id.slice(-4)}`,
      partyName: expense.description, // Use description as party for expense list
      amount: expense.amount,
      status: 'Paid'
    };
    setTransactions(prev => [newTxn, ...prev]);
    addNotification('Expense Recorded', `Expense of ₹${expense.amount} categorized as ${expense.category}.`, 'alert');
  };

  // Calculate Cash Balance for Dashboard
  const calculateCashBalance = () => {
    const initialCash = 50000; // Starting float
    const totalSalesPaid = transactions
      .filter(t => t.type === 'Sales Invoice' && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPurchasesPaid = transactions
      .filter(t => t.type === 'Purchase' && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return initialCash + totalSalesPaid - totalPurchasesPaid - totalExpenses;
  };

  // Login Handler
  const handleLogin = (u: User) => {
    const fullUser = {
      ...u,
      gstin: u.gstin || '33ABCDE1234F1Z5',
      address: u.address || '123, Industrial Area, Phase 2\nChennai, Tamil Nadu - 600001'
    };
    setUser(fullUser);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          transactions={transactions} 
          parties={parties} 
          cashBalance={calculateCashBalance()} 
        />;
      case 'sales':
        return <InvoiceBuilder 
          parties={parties} 
          products={products}
          onSaveInvoice={handleCreateSale}
          user={user}
        />;
      case 'items':
        return <InventoryManager products={products} setProducts={setProducts} />;
      case 'parties':
        return <Parties parties={parties} setParties={setParties} transactions={transactions} />;
      case 'reports':
        return <Reports />;
      case 'expenses':
        return <Expenses expenses={expenses} onAddExpense={handleCreateExpense} />;
      case 'dummy-invoice':
        return <DummyInvoiceBuilder />;
      case 'purchases':
        return <PurchaseInvoices 
          products={products} 
          parties={parties} 
          existingPurchases={purchases}
          onSavePurchase={handleCreatePurchase}
        />;
      case 'settings':
        return <Settings user={user} onUpdateUser={setUser} />;
      default:
        return <Dashboard transactions={transactions} parties={parties} cashBalance={calculateCashBalance()} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar - Controlled by isSidebarOpen */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
           setCurrentView(view);
           setIsSidebarOpen(false); // Close sidebar on selection
        }}
        onOpenAssistant={() => setShowAssistant(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Global Header */}
        <header className="bg-teal-900 text-white h-16 flex items-center justify-between px-4 shadow-md z-30 shrink-0 print:hidden relative">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-teal-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">BF</div>
                 <h1 className="font-bold text-lg tracking-tight hidden md:block">BillFlow AI</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-teal-800 rounded-full relative transition-colors"
                >
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-teal-900 animate-pulse"></span>
                   )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3">
                             <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                             <div>
                               <p className="text-sm font-medium text-gray-800">{n.title}</p>
                               <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                               <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-400 text-sm">No new notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pl-4 border-l border-teal-800">
                 <div className="text-right hidden md:block">
                    <div className="text-sm font-semibold">{user.businessName}</div>
                    <div className="text-xs text-teal-300">{user.phone}</div>
                 </div>
                 <div className="w-9 h-9 bg-teal-700 rounded-full flex items-center justify-center text-sm font-bold border-2 border-teal-600">
                    {user.name.charAt(0)}
                 </div>
              </div>
           </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative w-full scroll-smooth bg-slate-50 print:bg-white print:overflow-visible">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto pb-24 print:p-0 print:m-0">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Gemini Assistant Panel */}
      {showAssistant && (
        <GeminiAssistant onClose={() => setShowAssistant(false)} />
      )}
      
      {/* Overlay for sidebar when open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-sm print:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Overlay for notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default App;
