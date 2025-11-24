
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
import { Menu, Bell, X, Check, AlertCircle, LogOut, Settings as SettingsIcon, ChevronDown, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true); // New loading state
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showAssistant, setShowAssistant] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
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
    const loadData = async () => {
      // Small artificial delay to ensure smooth transition logic (optional, but feels better)
      setProducts(PersistenceService.loadProducts());
      setParties(PersistenceService.loadParties());
      setInvoices(PersistenceService.loadInvoices());
      setPurchases(PersistenceService.loadPurchases());
      setExpenses(PersistenceService.loadExpenses());
      setTransactions(PersistenceService.loadTransactions());
      
      // Load User Session
      const storedUser = PersistenceService.load(PersistenceService.KEYS.USER, null);
      if (storedUser) {
        setUser(storedUser);
      }
      setIsAppLoading(false);
    };

    loadData();
  }, []);

  // --- Persistence Listeners (Save on Change) ---
  useEffect(() => { if(!isAppLoading) PersistenceService.save(PersistenceService.KEYS.PRODUCTS, products); }, [products, isAppLoading]);
  useEffect(() => { if(!isAppLoading) PersistenceService.save(PersistenceService.KEYS.PARTIES, parties); }, [parties, isAppLoading]);
  useEffect(() => { if(!isAppLoading) PersistenceService.save(PersistenceService.KEYS.INVOICES, invoices); }, [invoices, isAppLoading]);
  useEffect(() => { if(!isAppLoading) PersistenceService.save(PersistenceService.KEYS.PURCHASES, purchases); }, [purchases, isAppLoading]);
  useEffect(() => { if(!isAppLoading) PersistenceService.save(PersistenceService.KEYS.EXPENSES, expenses); }, [expenses, isAppLoading]);
  useEffect(() => { if(!isAppLoading) PersistenceService.save(PersistenceService.KEYS.TRANSACTIONS, transactions); }, [transactions, isAppLoading]);
  useEffect(() => { if(user && !isAppLoading) PersistenceService.save(PersistenceService.KEYS.USER, user); }, [user, isAppLoading]);


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

    // B. Add Stock (Handle existing and NEW products)
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];

      purchase.items.forEach(item => {
        // Check if product exists (by ID or Name match)
        const existingIndex = item.productId 
          ? updatedProducts.findIndex(p => p.id === item.productId)
          : updatedProducts.findIndex(p => p.name.toLowerCase() === item.name.toLowerCase());

        if (existingIndex >= 0) {
          // Update existing stock
          const product = updatedProducts[existingIndex];
          updatedProducts[existingIndex] = {
            ...product,
            stock: product.stock + item.qty
          };
        } else {
          // Create new product
          updatedProducts.push({
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            name: item.name,
            category: 'General',
            price: item.rate, // Use purchase rate as initial price
            stock: item.qty,
            unit: 'pcs',
            description: 'Auto-added from Purchase'
          });
        }
      });
      
      return updatedProducts;
    });

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

  // Login Handler
  const handleLogin = (u: User) => {
    // Only set default details if missing (though the Login component now provides them)
    const fullUser = {
      ...u,
      gstin: u.gstin || '',
      address: u.address || ''
    };
    setUser(fullUser);
    // Force immediate save to persistence to prevent data loss on refresh immediately after login
    PersistenceService.save(PersistenceService.KEYS.USER, fullUser);
  };

  const handleLogout = () => {
    // 1. Clear local storage
    PersistenceService.save(PersistenceService.KEYS.USER, null);
    // 2. Clear state
    setUser(null);
    setCurrentView('dashboard');
    setShowProfileMenu(false);
  };

  const handleNavigation = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on selection
  };

  // Loading Screen
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl flex items-center justify-center animate-pulse">
           <span className="text-white font-bold text-2xl">BF</span>
        </div>
        <p className="text-teal-400 font-medium animate-pulse flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          transactions={transactions} 
          parties={parties} 
          invoices={invoices}
          purchases={purchases}
          onNavigate={handleNavigation}
        />;
      case 'sales':
        return <InvoiceBuilder 
          parties={parties} 
          products={products}
          existingInvoices={invoices}
          onSaveInvoice={handleCreateSale}
          user={user}
        />;
      case 'items':
        return <InventoryManager products={products} setProducts={setProducts} />;
      case 'parties':
        return <Parties parties={parties} setParties={setParties} transactions={transactions} />;
      case 'reports':
        return <Reports invoices={invoices} purchases={purchases} />;
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
        return <Dashboard 
          transactions={transactions} 
          parties={parties} 
          invoices={invoices}
          purchases={purchases}
          onNavigate={handleNavigation}
        />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar - Controlled by isSidebarOpen */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleNavigation}
        onOpenAssistant={() => setShowAssistant(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Global Header */}
        <header className="bg-teal-900 text-white h-16 flex items-center justify-between px-4 shadow-md z-50 shrink-0 print:hidden relative">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-teal-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleNavigation('dashboard')}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none"
              >
                 <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">BF</div>
                 <h1 className="font-bold text-lg tracking-tight hidden md:block">BillFlow AI</h1>
              </button>
           </div>
           
           <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="p-2 hover:bg-teal-800 rounded-full relative transition-colors focus:outline-none"
                >
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-teal-900 animate-pulse"></span>
                   )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in slide-in-from-top-2 text-gray-800">
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

              {/* Profile Dropdown */}
              <div className="relative border-l border-teal-800 pl-4">
                 <button 
                   onClick={() => {
                     setShowProfileMenu(!showProfileMenu);
                     setShowNotifications(false);
                   }}
                   className="flex items-center gap-2 focus:outline-none group"
                 >
                    <div className="text-right hidden md:block">
                       <div className="text-sm font-semibold">{user.businessName}</div>
                       <div className="text-xs text-teal-300">{user.name}</div>
                    </div>
                    <div className="w-9 h-9 bg-teal-700 rounded-full flex items-center justify-center text-sm font-bold border-2 border-teal-600 group-hover:border-teal-400 transition-colors relative">
                       {user.name.charAt(0).toUpperCase()}
                       <div className="absolute -bottom-1 -right-1 bg-teal-900 rounded-full p-0.5 border border-teal-600">
                          <ChevronDown className="w-2 h-2 text-teal-200" />
                       </div>
                    </div>
                 </button>

                 {/* Dropdown Menu */}
                 {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in slide-in-from-top-2">
                       <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                       </div>
                       <div className="p-1">
                          <button 
                            onClick={() => { 
                              setCurrentView('settings'); 
                              setShowProfileMenu(false); 
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                          >
                             <SettingsIcon className="w-4 h-4 text-gray-500" /> Settings
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLogout();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1 cursor-pointer"
                          >
                             <LogOut className="w-4 h-4" /> Logout
                          </button>
                       </div>
                    </div>
                 )}
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
          className="fixed inset-0 bg-black/60 z-[55] transition-opacity duration-300 backdrop-blur-sm print:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Overlay for notifications/profile dropdown */}
      {(showNotifications || showProfileMenu) && (
        <div 
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
