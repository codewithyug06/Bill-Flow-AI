import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { InventoryManager } from './components/InventoryManager';
import { Parties } from './components/Parties';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { Expenses } from './components/Expenses';
import { DummyInvoiceBuilder } from './components/DummyInvoiceBuilder';
import { PurchaseInvoices } from './components/PurchaseInvoices';
import { Estimates } from './components/Estimates';
import { Settings } from './components/Settings';
import { ViewState, User, Product, Party, Invoice, Purchase, Expense, Transaction, Notification, Estimate } from './types';
import { FirebaseService } from './services/firebase';
import { Menu, Bell, X, LogOut, Settings as SettingsIcon, ChevronDown, Loader2, Building, Users } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
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
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // State to hold estimate data when converting to invoice
  const [draftInvoiceData, setDraftInvoiceData] = useState<Partial<Invoice> | null>(null);

  // Derived Business ID: If Owner, it's my ID. If Staff, it's my boss's ID.
  const activeBusinessId = user?.businessId || user?.id;

  // --- Initialization & Auth Persistence ---
  useEffect(() => {
    const unsubscribe = FirebaseService.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        if (!user || user.id !== firebaseUser.uid) {
           const profile = await FirebaseService.getUserProfile(firebaseUser.uid);
           if (profile) {
              setUser(profile);
              FirebaseService.updateLastActive(profile.id);
           }
        }
      } else {
        setUser(null);
        setProducts([]);
        setParties([]);
        setInvoices([]);
        setPurchases([]);
      }
      setIsAppLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'n': e.preventDefault(); handleNavigation('sales'); break;
          case 'p': e.preventDefault(); handleNavigation('parties'); break;
          case 'i': e.preventDefault(); handleNavigation('items'); break;
          case 'h': e.preventDefault(); handleNavigation('dashboard'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- FIREBASE REAL-TIME LISTENERS ---
  useEffect(() => {
    if (!user || !activeBusinessId) return;

    const unsubProducts = FirebaseService.subscribe(activeBusinessId, 'products', (data) => setProducts(data));
    const unsubParties = FirebaseService.subscribe(activeBusinessId, 'parties', (data) => setParties(data));
    const unsubInvoices = FirebaseService.subscribe(activeBusinessId, 'invoices', (data) => setInvoices(data));
    const unsubPurchases = FirebaseService.subscribe(activeBusinessId, 'purchases', (data) => setPurchases(data));
    const unsubExpenses = FirebaseService.subscribe(activeBusinessId, 'expenses', (data) => setExpenses(data));
    const unsubTransactions = FirebaseService.subscribe(activeBusinessId, 'transactions', (data) => setTransactions(data));
    const unsubEstimates = FirebaseService.subscribe(activeBusinessId, 'estimates', (data) => setEstimates(data));

    return () => {
      unsubProducts(); unsubParties(); unsubInvoices(); unsubPurchases(); unsubExpenses(); unsubTransactions(); unsubEstimates();
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

  // --- Handler Functions ---
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

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!user || !activeBusinessId) return;
    if (confirm('Are you sure you want to delete this invoice? Stock will be restored.')) {
        try {
            await FirebaseService.deleteInvoice(activeBusinessId, invoiceId);
            addNotification('Invoice Deleted', 'Invoice removed and stock restored.', 'info');
        } catch (e) {
            console.error(e);
            addNotification('Error', 'Failed to delete invoice.', 'alert');
        }
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
  
  const handleCreateEstimate = async (estimate: Estimate) => {
    if (!user || !activeBusinessId) return;
    await FirebaseService.saveEstimate(activeBusinessId, estimate);
    addNotification('Estimate Saved', `Quote ${estimate.estimateNo} created.`, 'info');
  };

  const handleDeleteEstimate = async (id: string) => {
    if (!user || !activeBusinessId) return;
    if (confirm('Are you sure you want to delete this estimate?')) {
        await FirebaseService.deleteEstimate(activeBusinessId, id);
        addNotification('Deleted', 'Estimate removed.', 'info');
    }
  };

  const handleConvertEstimate = (estimate: Estimate) => {
     setDraftInvoiceData({
        customerName: estimate.customerName,
        items: estimate.items,
        taxRate: 18, 
     });
     setCurrentView('sales');
     if(user && activeBusinessId) {
        FirebaseService.saveEstimate(activeBusinessId, { ...estimate, status: 'Accepted' });
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

  const handleLogin = (u: User) => {
    const fullUser = { 
      ...u, 
      gstin: u.gstin || '', 
      address: u.address || '',
      role: u.role || 'owner',
      businessId: u.businessId || u.id 
    };
    setUser(fullUser);
  };

  const handleLogout = async () => {
    await FirebaseService.logoutUser();
    setUser(null);
    setCurrentView('dashboard');
    setShowProfileMenu(false);
  };

  const handleNavigation = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    if (view !== 'sales') setDraftInvoiceData(null);
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-emerald-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-brand-900/40">
           <BrandLogo className="w-12 h-12" variant="white" />
        </div>
        <p className="text-brand-400 font-medium animate-pulse flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Starting Bill Flux...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard transactions={transactions} parties={parties} invoices={invoices} purchases={purchases} onNavigate={handleNavigation} />;
      case 'sales': return <InvoiceBuilder parties={parties} products={products} existingInvoices={invoices} onSaveInvoice={handleCreateSale} onUpdateStatus={handleUpdateSaleStatus} onDeleteInvoice={handleDeleteInvoice} user={user} initialData={draftInvoiceData} />;
      case 'estimates': return <Estimates estimates={estimates} products={products} parties={parties} onSaveEstimate={handleCreateEstimate} onConvert={handleConvertEstimate} onDelete={handleDeleteEstimate} />;
      case 'items': return <InventoryManager products={products} setProducts={(val: any) => { if (Array.isArray(val) && val.length > products.length) handleAddProductDirect(val[val.length - 1]); }} />;
      case 'parties': return <Parties parties={parties} setParties={(val: any) => { if (Array.isArray(val) && val.length > parties.length) handleAddPartyDirect(val[0]); }} transactions={transactions} />;
      case 'reports': return <Reports invoices={invoices} purchases={purchases} />;
      case 'expenses': return <Expenses expenses={expenses} onAddExpense={handleCreateExpense} />;
      case 'dummy-invoice': return <DummyInvoiceBuilder />;
      case 'purchases': return <PurchaseInvoices products={products} parties={parties} existingPurchases={purchases} onSavePurchase={handleCreatePurchase} onUpdateStatus={handleUpdatePurchaseStatus} user={user} />;
      case 'settings': return <Settings user={user} onUpdateUser={(u) => setUser(u)} />;
      default: return <Dashboard transactions={transactions} parties={parties} invoices={invoices} purchases={purchases} onNavigate={handleNavigation} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleNavigation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={user.role} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md h-18 flex items-center justify-between px-6 border-b border-gray-200/60 sticky top-0 z-40 shrink-0 print:hidden transition-all">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="md:hidden flex items-center gap-2">
                 <BrandLogo className="w-6 h-6" />
                 <span className="font-bold text-gray-900">Bill Flux</span>
              </div>
              <div className="hidden md:flex flex-col">
                 <h2 className="text-gray-900 font-bold text-lg capitalize tracking-tight">{currentView.replace('-', ' ')}</h2>
                 <p className="text-xs text-gray-500 font-medium">
                    {user.role === 'owner' ? 'Administrator Account' : 'Staff Access'}
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-2 mr-2">
                 <div className="text-[10px] bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-500 font-mono font-medium">
                    Alt + N: New Invoice
                 </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                  className="p-2.5 hover:bg-gray-100 rounded-full relative transition-all text-gray-500 hover:text-brand-600"
                >
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && (
                     <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                   )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in slide-in-from-top-2 text-gray-800">
                    <div className="p-4 bg-white border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3">
                             <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                             <div>
                               <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                               <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                               <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative pl-6 border-l border-gray-200">
                 <button 
                   onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                   className="flex items-center gap-3 focus:outline-none group"
                 >
                    <div className="text-right hidden md:block">
                       <div className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{user.businessName}</div>
                       <div className="text-xs text-gray-500 flex items-center justify-end gap-1 font-medium">
                          {user.name} 
                       </div>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-500/20 group-hover:shadow-lg transition-all">
                       {user.name.charAt(0).toUpperCase()}
                    </div>
                 </button>

                 {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in slide-in-from-top-2">
                       <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                          <p className="text-base font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate mb-2 font-medium">{user.phone}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${user.role === 'owner' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                             {user.role} Account
                          </span>
                       </div>
                       <div className="p-2 space-y-1">
                          {user.role === 'owner' && (
                             <button 
                               onClick={() => { setCurrentView('settings'); setShowProfileMenu(false); }}
                               className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors font-medium"
                             >
                                <SettingsIcon className="w-4 h-4 text-gray-400" /> Business Settings
                             </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors font-medium"
                          >
                             <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto relative w-full scroll-smooth custom-scrollbar print:overflow-visible">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto pb-24 print:p-0 print:m-0">
            {renderContent()}
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[55] transition-opacity duration-300 backdrop-blur-sm print:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      {(showNotifications || showProfileMenu) && (
        <div className="fixed inset-0 z-30 bg-transparent" onClick={() => { setShowNotifications(false); setShowProfileMenu(false); }} />
      )}
    </div>
  );
};

export default App;