import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Wallet, ShoppingCart, ShoppingBag, Clock } from 'lucide-react';
import { Transaction, Party, Invoice, Purchase, ViewState } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  parties: Party[];
  invoices: Invoice[];
  purchases: Purchase[];
  onNavigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, parties, invoices, purchases, onNavigate }) => {
  const toCollect = invoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const toPay = purchases
    .filter(pur => pur.status === 'Unpaid')
    .reduce((sum, pur) => sum + (pur.unpaidAmount || pur.amount), 0);
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  const recentTxns = transactions.slice(0, 8);

  const salesData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const total = invoices
        .filter(inv => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.total, 0);
      data.push({ name: dayName, amount: total });
    }
    return data;
  }, [invoices]);

  const MetricCard = ({ title, amount, subtitle, icon: Icon, gradient, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-[24px] p-6 shadow-premium transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${gradient}`}
    >
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white">
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-white/80 font-semibold text-sm tracking-wide uppercase">{title}</span>
        </div>
        <div className="text-3xl font-black text-white tracking-tight">
          ₹ {amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </div>
        <p className="text-white/60 text-xs mt-3 font-medium flex items-center gap-1 group-hover:text-white transition-colors">
          {subtitle} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Overview</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Real-time health of your business operations.</p>
        </div>
        <div className="flex bg-white/50 backdrop-blur p-1 rounded-xl border border-slate-200">
           {['Today', '7 Days', 'Month'].map(t => (
             <button key={t} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${t === '7 Days' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{t}</button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard 
          title="To Collect" 
          amount={toCollect} 
          subtitle="Customer Receivables" 
          icon={ArrowDownLeft}
          gradient="bg-gradient-to-br from-brand-500 to-teal-700"
          onClick={() => onNavigate('sales')}
        />
        <MetricCard 
          title="To Pay" 
          amount={toPay} 
          subtitle="Supplier Liabilities" 
          icon={ArrowUpRight}
          gradient="bg-gradient-to-br from-rose-500 to-red-700"
          onClick={() => onNavigate('purchases')}
        />
        <MetricCard 
          title="Total Revenue" 
          amount={totalRevenue} 
          subtitle="Lifetime Earnings" 
          icon={Wallet}
          gradient="bg-gradient-to-br from-slate-800 to-slate-950"
          onClick={() => onNavigate('reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white rounded-[24px] shadow-premium border border-slate-100 p-8">
           <div className="flex justify-between items-center mb-10">
              <div>
                 <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Revenue Analytics</h3>
                 <p className="text-xs text-slate-400 font-medium">Daily sales performance</p>
              </div>
           </div>
           
           <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 700}} 
                       dy={10}
                    />
                    <Tooltip 
                       contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}}
                       itemStyle={{color: '#0d9488', fontWeight: 800, fontSize: '14px'}}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[24px] shadow-premium border border-slate-100 flex flex-col h-full overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Recent Activity</h3>
              <button className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest">See All</button>
           </div>
           
           <div className="overflow-y-auto custom-scrollbar flex-1">
              {recentTxns.length > 0 ? (
                 <div className="divide-y divide-slate-50">
                    {recentTxns.map((txn) => (
                      <div key={txn.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                            txn.type.includes('Sale') ? 'bg-brand-50 text-brand-600' :
                            txn.type.includes('Purchase') ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                         }`}>
                            {txn.type.includes('Sale') ? <ShoppingBag className="w-6 h-6" /> : 
                             txn.type.includes('Purchase') ? <ShoppingCart className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{txn.partyName || 'Counter Sale'}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest">{txn.txnNo}</span>
                               <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> {txn.date}</span>
                            </div>
                         </div>
                         <div className={`font-black text-sm whitespace-nowrap ${txn.type.includes('Sale') ? 'text-brand-600' : 'text-slate-900'}`}>
                            {txn.type.includes('Sale') ? '+' : '-'} ₹ {txn.amount.toLocaleString()}
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                    <p className="text-sm font-bold">No activity found</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};