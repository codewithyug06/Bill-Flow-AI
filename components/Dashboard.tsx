
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Transaction, Party, Invoice, Purchase, ViewState } from '../types';

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

  const generateInsights = async () => {
    setLoading(true);
    const context = `
      To Collect (Pending Sales): ${toCollect}
      To Pay (Unpaid Purchases): ${toPay}
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

        {/* Right Column: Checklist */}
        <div className="space-y-6">
           {/* Checklist */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-gray-800 font-semibold">Coming Soon...</h3>
              <p className="text-xs text-gray-500 mt-2 px-4">Smarter daily checklist for overdue and follow-ups powered by Gemini.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
