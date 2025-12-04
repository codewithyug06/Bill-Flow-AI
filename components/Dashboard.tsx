import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, TrendingUp, Filter, MoreHorizontal, Wallet, ShoppingCart, ShoppingBag } from 'lucide-react';
import { Transaction, Party, Invoice, Purchase, ViewState } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  parties: Party[];
  invoices: Invoice[];
  purchases: Purchase[];
  onNavigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, parties, invoices, purchases, onNavigate }) => {
  // Calculated Stats
  const toCollect = invoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const toPay = purchases
    .filter(pur => pur.status === 'Unpaid')
    .reduce((sum, pur) => sum + (pur.unpaidAmount || pur.amount), 0);
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Recent 5 transactions
  const recentTxns = transactions.slice(0, 5);

  // Calculate Last 7 Days Sales
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

  const MetricCard = ({ title, amount, subtitle, icon: Icon, colorClass, gradient, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group ${gradient}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <Icon className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-white/90 font-medium text-sm tracking-wide">{title}</span>
        </div>
        <div className="flex items-baseline gap-1">
           <span className="text-3xl font-bold text-white tracking-tight">₹ {amount.toLocaleString()}</span>
        </div>
        <p className="text-white/70 text-xs mt-2 font-medium flex items-center gap-1">
          {subtitle} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
           <button className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg">Today</button>
           <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">7 Days</button>
           <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">Month</button>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Receivables" 
          amount={toCollect} 
          subtitle="Pending from Customers" 
          icon={ArrowDownLeft}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => onNavigate('sales')}
        />
        <MetricCard 
          title="Total Payables" 
          amount={toPay} 
          subtitle="Due to Suppliers" 
          icon={ArrowUpRight}
          gradient="bg-gradient-to-br from-rose-500 to-orange-600"
          onClick={() => onNavigate('purchases')}
        />
        <MetricCard 
          title="Total Revenue" 
          amount={totalRevenue} 
          subtitle="Lifetime Sales" 
          icon={Wallet}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClick={() => onNavigate('reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="font-bold text-gray-900">Revenue Analytics</h3>
                 <p className="text-xs text-gray-400 mt-1">Sales performance over the last 7 days</p>
              </div>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400">
                 <MoreHorizontal className="w-5 h-5" />
              </button>
           </div>
           
           <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 500}} 
                       dy={10}
                    />
                    <Tooltip 
                       cursor={{stroke: '#0d9488', strokeWidth: 1, strokeDasharray: '4 4'}}
                       contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                       itemStyle={{color: '#0f766e', fontWeight: 600}}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Latest Transactions Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
           <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Recent Activity</h3>
              <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All</button>
           </div>
           
           <div className="overflow-y-auto custom-scrollbar flex-1">
              {recentTxns.length > 0 ? (
                 <div className="divide-y divide-gray-50">
                    {recentTxns.map((txn) => (
                      <div key={txn.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group cursor-pointer">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            txn.type.includes('Sale') ? 'bg-emerald-100 text-emerald-600' :
                            txn.type.includes('Purchase') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                         }`}>
                            {txn.type.includes('Sale') ? <ShoppingBag className="w-5 h-5" /> : 
                             txn.type.includes('Purchase') ? <ShoppingCart className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{txn.partyName || 'Unknown Party'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{txn.txnNo}</span>
                               <span className="text-xs text-gray-500">{txn.date}</span>
                            </div>
                         </div>
                         <div className={`font-bold text-sm whitespace-nowrap ${txn.type.includes('Sale') ? 'text-emerald-600' : 'text-gray-800'}`}>
                            {txn.type.includes('Sale') ? '+' : '-'} ₹ {txn.amount.toLocaleString()}
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <p className="text-sm">No recent transactions</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};