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
import { Menu, Bell, X, LogOut, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [draftInvoiceData, setDraftInvoiceData] = useState<Partial<Invoice> | null>(null);

  const activeBusinessId = user?.businessId || user?.id;

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
      }
      setIsAppLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !activeBusinessId) return;
    const unsubProducts = FirebaseService.subscribe(activeBusinessId, 'products', setProducts);
    const unsubParties = FirebaseService.subscribe(activeBusinessId, 'parties', setParties);
    const unsubInvoices = FirebaseService.subscribe(activeBusinessId, 'invoices', setInvoices);
    const unsubPurchases = FirebaseService.subscribe(activeBusinessId, 'purchases', setPurchases);
    const unsubExpenses = FirebaseService.subscribe(activeBusinessId, 'expenses', setExpenses);
    const unsubTransactions = FirebaseService.subscribe(activeBusinessId, 'transactions', setTransactions);
    const unsubEstimates = FirebaseService.subscribe(activeBusinessId, 'estimates', setEstimates);
    return () => {
      unsubProducts(); unsubParties(); unsubInvoices(); unsubPurchases(); unsubExpenses(); unsubTransactions(); unsubEstimates();
    };
  }, [user, activeBusinessId]);

  const handleNavigation = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    if (view !== 'sales') setDraftInvoiceData(null);
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-6">
        <div className="w-24 h-24 bg-brand-500 rounded-[32px] flex items-center justify-center animate-pulse shadow-glow">
           <BrandLogo className="w-14 h-14" variant="white" />
        </div>
        <div className="flex items-center gap-3 text-brand-400 font-black uppercase tracking-[0.3em] text-[10px]">
          <Loader2 className="w-3 h-3 animate-spin" /> Starting Engine
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard transactions={transactions} parties={parties} invoices={invoices} purchases={purchases} onNavigate={handleNavigation} />;
      case 'sales': return <InvoiceBuilder parties={parties} products={products} existingInvoices={invoices} onSaveInvoice={inv => FirebaseService.createSaleBatch(activeBusinessId!, inv, products, parties.find(p => p.name === inv.customerName))} onUpdateStatus={(inv, stat) => FirebaseService.updateInvoiceStatus(activeBusinessId!, inv, stat, parties)} onDeleteInvoice={id => FirebaseService.deleteInvoice(activeBusinessId!, id)} user={user} initialData={draftInvoiceData} />;
      case 'items': return <InventoryManager products={products} setProducts={(val: any) => Array.isArray(val) && FirebaseService.add(activeBusinessId!, 'products', val[val.length - 1])} />;
      case 'parties': return <Parties parties={parties} setParties={(val: any) => Array.isArray(val) && FirebaseService.add(activeBusinessId!, 'parties', val[0])} transactions={transactions} />;
      case 'reports': return <Reports invoices={invoices} purchases={purchases} />;
      case 'expenses': return <Expenses expenses={expenses} onAddExpense={exp => FirebaseService.addExpense(activeBusinessId!, exp)} />;
      case 'dummy-invoice': return <DummyInvoiceBuilder />;
      case 'purchases': return <PurchaseInvoices products={products} parties={parties} existingPurchases={purchases} onSavePurchase={p => FirebaseService.createPurchaseBatch(activeBusinessId!, p, products, parties.find(party => party.name === p.partyName))} onUpdateStatus={(p, s) => FirebaseService.updatePurchaseStatus(activeBusinessId!, p, s, parties)} user={user} />;
      case 'estimates': return <Estimates estimates={estimates} products={products} parties={parties} onSaveEstimate={est => FirebaseService.saveEstimate(activeBusinessId!, est)} onConvert={est => { setDraftInvoiceData({ customerName: est.customerName, items: est.items }); handleNavigation('sales'); }} onDelete={id => FirebaseService.deleteEstimate(activeBusinessId!, id)} />;
      case 'settings': return <Settings user={user} onUpdateUser={setUser} />;
      default: return <Dashboard transactions={transactions} parties={parties} invoices={invoices} purchases={purchases} onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      {/* Sidebar fixed left */}
      <Sidebar currentView={currentView} setCurrentView={handleNavigation} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} userRole={user.role} />
      
      {/* Main Container - Left padding on MD+ screens to accommodate fixed sidebar */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden md:pl-[280px]">
        <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-white/50 backdrop-blur-md border-b border-slate-100 z-40 print:hidden shrink-0">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 bg-slate-100 rounded-xl">
                <Menu className="w-5 h-5 text-slate-600"/>
              </button>
              
              {/* BRANDING: Clicking here navigates to Dashboard */}
              <button 
                onClick={() => handleNavigation('dashboard')}
                className="flex items-center gap-3 hover:opacity-80 transition-all group"
              >
                 <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                   <BrandLogo className="w-5 h-5 md:w-6 md:h-6" variant="white" />
                 </div>
                 <div className="text-left">
                    <h2 className="text-base md:text-xl font-black text-slate-950 uppercase tracking-tight leading-none">Bill Flux</h2>
                    <p className="text-[9px] md:text-[10px] text-brand-600 font-bold uppercase mt-1 tracking-widest">{currentView.replace('-', ' ')}</p>
                 </div>
              </button>
           </div>
           
           <div className="flex items-center gap-3 md:gap-4">
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-600 transition-all shadow-sm">
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <div className="relative border-l border-slate-200 pl-3 md:pl-4">
                 <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                       <p className="text-sm font-black text-slate-900 leading-none">{user.businessName}</p>
                       <p className="text-[10px] text-brand-600 font-bold uppercase mt-1">{user.name}</p>
                    </div>
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xs shadow-premium border border-slate-800">
                       {user.name.charAt(0).toUpperCase()}
                    </div>
                 </button>
                 {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2">
                       <div className="p-6 bg-slate-50 border-b border-slate-100">
                          <p className="font-black text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{user.role} Account</p>
                       </div>
                       <div className="p-2">
                          <button onClick={() => { handleNavigation('settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                            <SettingsIcon className="w-4 h-4"/> Settings
                          </button>
                          <button onClick={() => FirebaseService.logoutUser()} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <LogOut className="w-4 h-4"/> Sign Out
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </header>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 print:p-0">
           <div className="max-w-[1600px] mx-auto pb-20">
              {renderContent()}
           </div>
        </main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/40 z-[55] backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* Universal Popover Closer */}
      {(showNotifications || showProfileMenu) && <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfileMenu(false); }} />}
    </div>
  );
};

export default App;