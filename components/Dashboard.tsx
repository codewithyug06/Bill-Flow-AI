
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Transaction, Party } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  parties: Party[];
  cashBalance?: number;
}

const chartData = [
  { name: '17 Nov', sales: 0 },
  { name: '18 Nov', sales: 3894 },
  { name: '19 Nov', sales: 1200 },
  { name: '20 Nov', sales: 3894 },
  { name: '21 Nov', sales: 2500 },
  { name: '22 Nov', sales: 3894 },
  { name: '23 Nov', sales: 1000 },
];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, parties, cashBalance = 0 }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculated Stats
  const toCollect = parties.reduce((sum, p) => p.balance > 0 ? sum + p.balance : sum, 0);
  const toPay = parties.reduce((sum, p) => p.balance < 0 ? sum + Math.abs(p.balance) : sum, 0);
  
  // Recent 5 transactions
  const recentTxns = transactions.slice(0, 5);

  const generateInsights = async () => {
    setLoading(true);
    const context = `
      To Collect: ${toCollect}
      To Pay: ${toPay}
      Cash Balance: ${cashBalance}
      Recent Transaction Count: ${transactions.length}
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
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Collect */}
          <div className="bg-green-50 p-5 rounded-xl border border-green-100 shadow-sm relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <ArrowDownLeft className="w-4 h-4" /> To Collect
              </div>
              <ChevronRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-gray-800">₹ {toCollect.toLocaleString()}</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-200 rounded-b-xl"></div>
          </div>

          {/* To Pay */}
          <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" /> To Pay
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-gray-800">₹ {toPay.toLocaleString()}</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-red-200 rounded-b-xl"></div>
          </div>

          {/* Cash Balance */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                <WalletIcon /> Cash + Bank Balance
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-gray-800">₹ {cashBalance.toLocaleString()}</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-200 rounded-b-xl"></div>
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

        {/* Right Column: Checklist & Graph */}
        <div className="space-y-6">
           {/* Checklist */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-gray-800 font-semibold">Coming Soon...</h3>
              <p className="text-xs text-gray-500 mt-2 px-4">Smarter daily checklist for overdue and follow-ups powered by Gemini.</p>
           </div>

           {/* Sales Report */}
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-gray-800">Sales Report</h3>
                 <select className="text-xs border rounded px-2 py-1 text-gray-600 bg-gray-50 outline-none">
                    <option>Daily</option>
                    <option>Weekly</option>
                 </select>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="sales" stroke="#22c55e" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
    <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
  </svg>
);
