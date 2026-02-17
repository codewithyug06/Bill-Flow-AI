import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, Users, Package, ShoppingBag, ShoppingCart, 
  BarChart3, Wallet, Settings, Plus, 
  FileText, X, ScrollText
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'owner' | 'staff';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, onClose, userRole = 'owner' }) => {
  
  const NavItem = ({ id, label, icon: Icon, badge = '' }: { id: ViewState, label: string, icon: any, badge?: string }) => (
    <button
      onClick={() => {
        setCurrentView(id);
        if (window.innerWidth < 1024) onClose();
      }}
      className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-xl text-sm nav-transition group relative ${
        currentView === id 
          ? 'bg-brand-500/10 text-white font-semibold' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${currentView === id ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="tracking-wide">{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      )}
      {currentView === id && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
      )}
    </button>
  );

  return (
    <>
      <aside className={`
        fixed top-0 left-0 h-full w-[280px] bg-slate-950 shadow-2xl z-[60] transform transition-transform duration-300 ease-out border-r border-slate-900 flex flex-col print:hidden
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - Clickable Brand to Dashboard */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-900">
           <button 
             onClick={() => setCurrentView('dashboard')}
             className="flex items-center gap-3 hover:opacity-80 transition-opacity"
           >
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                <BrandLogo className="w-6 h-6" variant="white" />
              </div>
              <div className="text-left">
                <span className="font-bold text-lg text-white tracking-tight block leading-none">Bill Flux</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Intelligent</span>
              </div>
           </button>
           <button onClick={onClose} className="text-slate-500 hover:text-white p-2 lg:hidden">
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* Quick Action */}
        <div className="px-4 py-6">
          <button 
            onClick={() => setCurrentView('sales')}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-brand-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Create Invoice</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-8 pb-10">
          <div>
            <div className="px-4 mb-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Management</div>
            <NavItem id="dashboard" label="Overview" icon={LayoutDashboard} />
            <NavItem id="parties" label="Customers & Vendors" icon={Users} />
            <NavItem id="items" label="Inventory Stock" icon={Package} />
          </div>
          
          <div>
            <div className="px-4 mb-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Sales & Operations</div>
            <NavItem id="sales" label="Sales Invoices" icon={ShoppingBag} />
            <NavItem id="estimates" label="Quotations" icon={ScrollText} />
            <NavItem id="purchases" label="Purchase Bills" icon={ShoppingCart} />
            <NavItem id="dummy-invoice" label="Rough Billing" icon={FileText} />
          </div>
          
          <div>
             <div className="px-4 mb-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Financials</div>
             {userRole === 'owner' && <NavItem id="reports" label="Business Analytics" icon={BarChart3} />}
             <NavItem id="expenses" label="Expenses Tracker" icon={Wallet} />
          </div>
        </nav>

        {/* Footer Settings */}
        {userRole === 'owner' && (
          <div className="p-4 mt-auto border-t border-slate-900">
            <button 
              onClick={() => setCurrentView('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm nav-transition ${
                currentView === 'settings' 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-brand-400' : 'text-slate-600'}`} />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};