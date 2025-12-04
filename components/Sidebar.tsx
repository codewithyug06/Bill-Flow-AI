import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, Users, Package, ShoppingBag, ShoppingCart, 
  BarChart3, Wallet, Settings, ChevronDown, Plus, 
  FileText, X, ScrollText, Zap
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
  
  const NavItem = ({ id, label, icon: Icon, hasSub = false, badge = '' }: { id: ViewState, label: string, icon: any, hasSub?: boolean, badge?: string }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`w-full flex items-center justify-between px-4 py-3.5 mx-2 mb-1 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden ${
        currentView === id 
          ? 'bg-gradient-to-r from-brand-600/20 to-brand-600/5 text-white font-semibold shadow-inner' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      {currentView === id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-full"></div>}
      
      <div className="flex items-center gap-3 relative z-10">
        <Icon className={`w-5 h-5 transition-colors ${currentView === id ? 'text-brand-400' : 'text-slate-500 group-hover:text-white'}`} />
        <span className="tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
        {hasSub && <ChevronDown className="w-3 h-3 opacity-50" />}
      </div>
    </button>
  );

  return (
    <>
      {/* Sidebar Drawer */}
      <aside className={`
        fixed top-0 left-0 h-full w-[280px] bg-[#0f172a] shadow-2xl z-[60] transform transition-transform duration-300 ease-out border-r border-slate-800 flex flex-col print:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/60 bg-[#0f172a]">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                <BrandLogo className="w-6 h-6" variant="white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight block leading-none">Bill Flux</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Enterprise</span>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors md:hidden">
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* CTA Button */}
        <div className="px-4 py-6">
          <button 
            onClick={() => setCurrentView('sales')}
            className="w-full bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-brand-900/40 transition-all group hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 bg-white/20 rounded-full p-0.5" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6 pb-6">
          <div>
            <div className="px-4 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-700"></span> General
            </div>
            <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavItem id="parties" label="Parties & CRM" icon={Users} />
            <NavItem id="items" label="Inventory" icon={Package} hasSub />
          </div>
          
          <div>
            <div className="px-4 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-700"></span> Operations
            </div>
            <NavItem id="sales" label="Sales Invoices" icon={ShoppingBag} hasSub />
            <NavItem id="estimates" label="Estimates" icon={ScrollText} />
            <NavItem id="purchases" label="Purchases" icon={ShoppingCart} hasSub />
            <NavItem id="dummy-invoice" label="Rough Bill" icon={FileText} />
          </div>
          
          <div>
             <div className="px-4 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <span className="w-8 h-[1px] bg-slate-700"></span> Finance
             </div>
             {/* Reports visible to Owner only */}
             {userRole === 'owner' && <NavItem id="reports" label="Analytics" icon={BarChart3} />}
             <NavItem id="expenses" label="Expenses" icon={Wallet} />
          </div>
        </nav>

        {/* Bottom Settings - Hidden for Staff */}
        {userRole === 'owner' && (
          <div className="p-4 bg-[#0b1120] border-t border-slate-800">
            <button 
              onClick={() => setCurrentView('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                currentView === 'settings' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${currentView === 'settings' ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:text-white'}`}>
                 <Settings className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                 <span className="font-semibold block">Settings</span>
                 <span className="text-[10px] text-slate-500">Profile & Security</span>
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};