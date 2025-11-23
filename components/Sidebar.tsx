
import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, Users, Package, ShoppingBag, ShoppingCart, 
  BarChart3, Wallet, Settings, ChevronDown, Plus, 
  Sparkles, FileDigit, X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  onOpenAssistant: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onOpenAssistant, isOpen, onClose }) => {
  
  const NavItem = ({ id, label, icon: Icon, hasSub = false }: { id: ViewState, label: string, icon: any, hasSub?: boolean }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 group ${
        currentView === id 
          ? 'bg-teal-900/50 text-teal-300 border-l-4 border-teal-400' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${currentView === id ? 'text-teal-400' : 'text-slate-500 group-hover:text-white'}`} />
        <span className="font-medium">{label}</span>
      </div>
      {hasSub && <ChevronDown className="w-3 h-3 opacity-50" />}
    </button>
  );

  return (
    <>
      {/* Sidebar Drawer */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-[#0f172a] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col print:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 bg-teal-950 flex justify-between items-center border-b border-slate-800">
           <div className="flex items-center gap-2 text-white">
              <span className="font-bold text-lg tracking-wide">Menu</span>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* Create Button */}
        <div className="p-5">
          <button 
            onClick={() => setCurrentView('sales')}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3 px-4 rounded-xl flex items-center justify-between font-semibold shadow-lg shadow-teal-900/20 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Create Invoice</span>
            </div>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform opacity-80" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar pb-4 space-y-1">
          <div className="px-5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">General</div>
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="parties" label="Parties" icon={Users} />
          <NavItem id="items" label="Inventory" icon={Package} hasSub />
          <NavItem id="sales" label="Sales" icon={ShoppingBag} hasSub />
          <NavItem id="purchases" label="Purchases" icon={ShoppingCart} hasSub />
          <NavItem id="reports" label="Reports" icon={BarChart3} />

          <div className="px-5 py-2 mt-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Accounting</div>
          <NavItem id="expenses" label="Expenses" icon={Wallet} />
          
          <div className="px-5 py-2 mt-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tools</div>
          <button 
            onClick={onOpenAssistant}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 border-l-4 border-transparent transition-colors bg-emerald-950/30">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4" />
              <span>AI Assistant</span>
            </div>
          </button>
        </nav>

        {/* Dummy Invoice Generator */}
        <div className="border-t border-slate-800">
          <NavItem id="dummy-invoice" label="Dummy Invoice" icon={FileDigit} />
        </div>

        {/* Bottom Settings */}
        <div className="bg-[#0b1120] border-t border-slate-800">
          <button 
            onClick={() => setCurrentView('settings')}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
