
import React, { useState, useEffect } from 'react';
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
import { FirebaseService } from './services/firebase';
import { Menu, Bell, X, Check, AlertCircle, LogOut, Settings as SettingsIcon, ChevronDown, Loader2, CloudOff, Building, Users } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showAssistant, setShowAssistant] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // --- Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Derived Business ID: If Owner, it's my ID. If Staff, it's my boss's ID.
  const activeBusinessId = user?.businessId || user?.id;

  // --- Initialization ---
  useEffect(() => {
    const loadSession = async () => {
      // Load User Session from LocalStorage (to keep login persistent)
      const storedUser = PersistenceService.load(PersistenceService.KEYS.USER, null);
      if (storedUser) {
        // Ensure legacy local users have role/businessId
        const updatedUser = { 
          role: 'owner', 
          businessId: storedUser.id,
          ...storedUser 
        };
        setUser(updatedUser);
      }
      setIsAppLoading(false);
    };
    loadSession();
  }, []);

  // --- FIREBASE REAL-TIME LISTENERS ---
  useEffect(() => {
    if (!user || !activeBusinessId) return;

    // Subscribe to all collections for the active business ID
    const unsubProducts = FirebaseService.subscribe(activeBusinessId, 'products', (data) => setProducts(data));
    const unsubParties = FirebaseService.subscribe(activeBusinessId, 'parties', (data) => setParties(data));
    const unsubInvoices = FirebaseService.subscribe(activeBusinessId, 'invoices', (data) => setInvoices(data));
    const unsubPurchases = FirebaseService.subscribe(activeBusinessId, 'purchases', (data) => setPurchases(data));
    const unsubExpenses = FirebaseService.subscribe(activeBusinessId, 'expenses', (data) => setExpenses(data));
    const unsubTransactions = FirebaseService.subscribe(activeBusinessId, 'transactions', (data) => setTransactions(data));

    return () => {
      // Cleanup listeners on logout
      unsubProducts();
      unsubParties();
      unsubInvoices();
      unsubPurchases();
      unsubExpenses();
      unsubTransactions();
    };
  }, [user, activeBusinessId]);

  // --- Notification Helper ---
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

  // --- Handler Functions (Using Firebase Service) ---

  const handleCreateSale = async (invoice: Invoice) => {
    if (!user || !activeBusinessId) return;
    try {
      const party = parties.find(p => p.name === invoice.customerName);
      await FirebaseService.createSaleBatch(activeBusinessId, invoice, products, party);
      addNotification('Sale Recorded', `Invoice ${invoice.invoiceNo} saved to cloud.`, 'success');
    } catch (error) {
      console.error(error);
      addNotification('Error', 'Failed to save sale to cloud.', 'alert');
    }
  };

  const handleUpdateSaleStatus = async (invoice: Invoice, newStatus: 'Paid' | 'Pending') => {
    if (!user || !activeBusinessId) return;
    try {
      await FirebaseService.updateInvoiceStatus(activeBusinessId, invoice, newStatus, parties);
      addNotification('Status Updated', `Invoice ${invoice.invoiceNo} marked as ${newStatus}.`, 'success');
    } catch (error) {
       console.error(error);
       addNotification('Error', 'Failed to update status.', 'alert');
    }
  };

  const handleCreatePurchase = async (purchase: Purchase) => {
    if (!user || !activeBusinessId) return;
    try {
      const party = parties.find(p => p.name === purchase.partyName);
      await FirebaseService.createPurchaseBatch(activeBusinessId, purchase, products, party);
      addNotification('Purchase Recorded', `Bill ${purchase.invoiceNo} saved to cloud.`, 'info');
    } catch (error) {
      console.error(error);
      addNotification('Error', 'Failed to save purchase.', 'alert');
    }
  };

  const handleUpdatePurchaseStatus = async (purchase: Purchase, newStatus: 'Paid' | 'Unpaid') => {
    if (!user || !activeBusinessId) return;
    try {
      await FirebaseService.updatePurchaseStatus(activeBusinessId, purchase, newStatus, parties);
      addNotification('Status Updated', `Bill ${purchase.invoiceNo} marked as ${newStatus}.`, 'success');
    } catch (error) {
       console.error(error);
       addNotification('Error', 'Failed to update status.', 'alert');
    }
  };

  const handleCreateExpense = async (expense: Expense) => {
    if (!user || !activeBusinessId) return;
    try {
      await FirebaseService.addExpense(activeBusinessId, expense);
      addNotification('Expense Recorded', `Expense of ₹${expense.amount} saved.`, 'alert');
    } catch (error) {
      console.error(error);
      addNotification('Error', 'Failed to save expense.', 'alert');
    }
  };

  const handleAddProductDirect = async (product: Product) => {
     if(!user || !activeBusinessId) return;
     await FirebaseService.add(activeBusinessId, 'products', product);
  };

  const handleAddPartyDirect = async (party: Party) => {
     if(!user || !activeBusinessId) return;
     await FirebaseService.add(activeBusinessId, 'parties', party);
  };

  // Login/Logout
  const handleLogin = (u: User) => {
    const fullUser = { 
      ...u, 
      gstin: u.gstin || '', 
      address: u.address || '',
      role: u.role || 'owner',
      businessId: u.businessId || u.id 
    };
    setUser(fullUser);
    PersistenceService.save(PersistenceService.KEYS.USER, fullUser);
  };

  const handleLogout = async () => {
    await FirebaseService.logoutUser();
    PersistenceService.save(PersistenceService.KEYS.USER, null);
    setUser(null);
    setCurrentView('dashboard');
    setShowProfileMenu(false);
    // Clear data from view
    setProducts([]);
    setParties([]);
    setInvoices([]);
    setPurchases([]);
  };

  const handleNavigation = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  // Loading Screen
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-teal-900/40">
           <BrandLogo className="w-12 h-12" variant="white" />
        </div>
        <p className="text-teal-400 font-medium animate-pulse flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Connecting to Cloud...
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
          onUpdateStatus={handleUpdateSaleStatus}
          user={user}
        />;
      case 'items':
        return <InventoryManager 
           products={products} 
           setProducts={(val: any) => {
              if (Array.isArray(val)) {
                 if (val.length > products.length) {
                    handleAddProductDirect(val[val.length - 1]);
                 }
              }
           }} 
        />;
      case 'parties':
        return <Parties 
           parties={parties} 
           setParties={(val: any) => {
              if (Array.isArray(val)) {
                 if (val.length > parties.length) {
                    handleAddPartyDirect(val[0]);
                 }
              }
           }} 
           transactions={transactions} 
        />;
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
          onUpdateStatus={handleUpdatePurchaseStatus}
        />;
      case 'settings':
        return <Settings user={user} onUpdateUser={(u) => {
           setUser(u);
           PersistenceService.save(PersistenceService.KEYS.USER, u);
        }} />;
      default:
        return <Dashboard transactions={transactions} parties={parties} invoices={invoices} purchases={purchases} onNavigate={handleNavigation} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleNavigation}
        onOpenAssistant={() => setShowAssistant(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={user.role} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
                className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
              >
                 <BrandLogo className="w-8 h-8" variant="white" />
                 <div className="hidden md:block">
                   <h1 className="font-bold text-lg tracking-tight leading-none">BillFlow AI</h1>
                   {user.role === 'staff' && <span className="text-[10px] text-teal-300 font-medium tracking-wide">STAFF MODE</span>}
                 </div>
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
                       <div className="text-xs text-teal-300 flex items-center justify-end gap-1">
                          {user.name} 
                          {user.role === 'owner' ? <Building className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                       </div>
                    </div>
                    <div className="w-9 h-9 bg-teal-700 rounded-full flex items-center justify-center text-sm font-bold border-2 border-teal-600 group-hover:border-teal-400 transition-colors relative">
                       {user.name.charAt(0).toUpperCase()}
                       <div className="absolute -bottom-1 -right-1 bg-teal-900 rounded-full p-0.5 border border-teal-600">
                          <ChevronDown className="w-2 h-2 text-teal-200" />
                       </div>
                    </div>
                 </button>

                 {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in slide-in-from-top-2">
                       <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate mb-1">{user.phone}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                             {user.role}
                          </span>
                       </div>
                       <div className="p-1">
                          {user.role === 'owner' && (
                             <button 
                               onClick={() => { 
                                 setCurrentView('settings'); 
                                 setShowProfileMenu(false); 
                               }}
                               className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                             >
                                <SettingsIcon className="w-4 h-4 text-gray-500" /> Settings
                             </button>
                          )}
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

        <main className="flex-1 overflow-y-auto relative w-full scroll-smooth bg-slate-50 print:bg-white print:overflow-visible">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto pb-24 print:p-0 print:m-0">
            {renderContent()}
          </div>
        </main>
      </div>

      {showAssistant && (
        <GeminiAssistant 
           onClose={() => setShowAssistant(false)} 
           invoices={invoices}
           products={products}
           parties={parties}
           transactions={transactions}
           purchases={purchases}
        />
      )}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[55] transition-opacity duration-300 backdrop-blur-sm print:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      {(showNotifications || showProfileMenu) && (
        <div className="fixed inset-0 z-30 bg-transparent" onClick={() => { setShowNotifications(false); setShowProfileMenu(false); }} />
      )}
    </div>
  );
};

export default App;
