
import React, { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Sparkles, ChevronRight, TrendingUp } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Transaction, Party, Invoice, Purchase, ViewState } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  parties: Party[];
  invoices: Invoice[];
  purchases: Purchase[];
  onNavigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, parties, invoices, purchases, onNavigate }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculated Stats based on actual Invoices and Purchases status
  const toCollect = invoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const toPay = purchases
    .filter(pur => pur.status === 'Unpaid')
    .reduce((sum, pur) => sum + (pur.unpaidAmount || pur.amount), 0);
  
  // Recent 5 transactions
  const recentTxns = transactions.slice(0, 5);

  // Calculate Last 7 Days Sales
  const salesData = useMemo(() => {
    const data = [];
    const today = new Date();
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Format: "Mon", "Tue"
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const total = invoices
        .filter(inv => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.total, 0);
        
      data.push({ name: dayName, amount: total });
    }
    return data;
  }, [invoices]);

  const weeklyTotal = salesData.reduce((sum, day) => sum + day.amount, 0);

  const generateInsights = async () => {
    setLoading(true);
    const context = `
      To Collect (Pending Sales): ${toCollect}
      To Pay (Unpaid Purchases): ${toPay}
      Recent Transaction Count: ${transactions.length}
      Weekly Sales: ${weeklyTotal}
      Latest Txn: ${transactions[0]?.type} of ${transactions[0]?.amount}
    `;
    const insight = await GeminiService.analyzeBusinessData(context);
    setAiInsight(insight);
    setLoading(false);
  };

  useEffect(() => {
    if (!aiInsight && transactions.length > 0) generateInsights();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4 text-xs text-gray-500">
           <span>Last Update: {new Date().toLocaleDateString()}</span>
           <button onClick={generateInsights} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </header>

      {/* Gemini Insight Banner */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl p-4 text-white shadow-lg flex items-start gap-3 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-20">
            <Sparkles size={120} />
          </div>
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 relative z-10">
            <h3 className="font-semibold text-sm opacity-90 mb-1">AI Business Insight</h3>
            <p className="text-sm leading-relaxed opacity-95 whitespace-pre-line">{aiInsight}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Overview Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* To Collect */}
          <div 
            onClick={() => onNavigate('sales')}
            className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm relative group hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <ArrowDownLeft className="w-5 h-5" /> To Collect (Receivables)
              </div>
              <ChevronRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-3xl font-bold text-gray-800 tracking-tight">₹ {toCollect.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-green-600 mt-2 font-medium">From Pending Sales Invoices</p>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-green-200 rounded-b-xl"></div>
          </div>

          {/* To Pay */}
          <div 
            onClick={() => onNavigate('purchases')}
            className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm relative group hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                <ArrowUpRight className="w-5 h-5" /> To Pay (Payables)
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-3xl font-bold text-gray-800 tracking-tight">₹ {toPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-red-600 mt-2 font-medium">From Unpaid Purchase Bills</p>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-red-200 rounded-b-xl"></div>
          </div>
        </div>

        {/* Latest Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-semibold text-gray-800">Latest Transactions</h3>
             <button className="text-xs text-blue-600 font-medium hover:underline">See All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Txn No</th>
                  <th className="px-4 py-3">Party Name</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTxns.length > 0 ? (
                  recentTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{txn.date}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium flex items-center gap-2">
                        {txn.type.includes('Sale') 
                          ? <div className="w-2 h-2 rounded-full bg-green-500"/> 
                          : txn.type.includes('Purchase') 
                             ? <div className="w-2 h-2 rounded-full bg-red-500"/>
                             : <div className="w-2 h-2 rounded-full bg-blue-500"/>
                        }
                        {txn.type}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{txn.txnNo}</td>
                      <td className="px-4 py-3 text-gray-800">{txn.partyName}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">₹ {txn.amount.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-400">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Weekly Sales Graph */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-semibold text-gray-800">Weekly Sales</h3>
                 <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Last 7 Days
                 </span>
              </div>
              
              <div className="flex-1 w-full min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                       <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 11, fill: '#9ca3af'}} 
                          dy={10}
                       />
                       <Tooltip 
                          cursor={{fill: '#f0fdf4'}}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          itemStyle={{color: '#0f766e', fontWeight: 600}}
                          formatter={(value: number) => [`₹ ${value.toLocaleString()}`, 'Sales']}
                       />
                       <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {salesData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#0d9488' : '#e2e8f0'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                 <span className="text-gray-500">Total this week</span>
                 <span className="font-bold text-gray-800">
                    ₹ {weeklyTotal.toLocaleString()}
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
