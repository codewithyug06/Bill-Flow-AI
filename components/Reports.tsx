
import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, Sparkles, TrendingUp, TrendingDown, ArrowRight, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GeminiService } from '../services/geminiService';
import { Invoice, Purchase } from '../types';

interface ReportsProps {
  invoices: Invoice[];
  purchases: Purchase[];
}

export const Reports: React.FC<ReportsProps> = ({ invoices, purchases }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'gst' | 'stock'>('sales');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showYearMenu, setShowYearMenu] = useState(false);

  // --- Dynamic Data Calculation ---
  const { chartData, totalSales, totalPurchases, netProfit } = useMemo(() => {
    const data: { name: string; sales: number; purchase: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize months
    for (let i = 0; i < 12; i++) {
      data.push({ name: monthNames[i], sales: 0, purchase: 0 });
    }

    let tSales = 0;
    let tPurchases = 0;

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      if (d.getFullYear() === year) {
        data[d.getMonth()].sales += inv.total;
        tSales += inv.total;
      }
    });

    purchases.forEach(pur => {
      const d = new Date(pur.date);
      if (d.getFullYear() === year) {
        data[d.getMonth()].purchase += pur.amount;
        tPurchases += pur.amount;
      }
    });

    // If it's the current year, filter to show only up to current month (optional, keeps chart clean)
    // If it's a past year, show all 12 months
    const isCurrentYear = year === new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const filteredData = isCurrentYear ? data.slice(0, currentMonthIndex + 1) : data;

    return { 
      chartData: filteredData, 
      totalSales: tSales, 
      totalPurchases: tPurchases,
      netProfit: tSales - tPurchases
    };
  }, [invoices, purchases, year]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    let dataContext = '';
    
    if (activeTab === 'sales') {
       dataContext = `Sales vs Purchase Summary for ${year}. 
       Total Sales: ${totalSales}. Total Purchase: ${totalPurchases}. Net Profit: ${netProfit}.
       Monthly Breakdown: ${JSON.stringify(chartData.map(d => `${d.name}: Sales ${d.sales}, Purch ${d.purchase}`))}`;
    } else {
       dataContext = "GST Report Context: Standard simplified GST analysis based on generic turnover logic.";
    }
    
    const analysis = await GeminiService.analyzeReport(dataContext, activeTab === 'sales' ? 'Financial' : 'GST');
    setAiAnalysis(analysis);
    setAnalyzing(false);
  };

  const handleExport = () => {
    // 1. Define Headers
    const headers = ['Month', 'Sales', 'Purchases', 'Net Difference'];
    
    // 2. Map Data
    const csvRows = chartData.map(row => [
       row.name,
       row.sales.toFixed(2),
       row.purchase.toFixed(2),
       (row.sales - row.purchase).toFixed(2)
    ]);
    
    // 3. Add Summary Row
    csvRows.push([]);
    csvRows.push(['TOTAL', totalSales.toFixed(2), totalPurchases.toFixed(2), netProfit.toFixed(2)]);

    // 4. Convert to CSV String
    const csvContent = [
       headers.join(','),
       ...csvRows.map(e => e.join(','))
    ].join('\n');

    // 5. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_report_${year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
           <p className="text-gray-500 text-sm">Real-time financial insights for {year}</p>
        </div>
        <div className="flex gap-2 relative">
           <div className="relative">
             <button 
               onClick={() => setShowYearMenu(!showYearMenu)}
               className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
             >
               <Calendar className="w-4 h-4" /> {year} <ChevronDown className="w-3 h-3 opacity-50" />
             </button>
             {showYearMenu && (
               <div className="absolute top-full mt-1 right-0 bg-white border border-gray-100 shadow-lg rounded-lg py-1 z-20 min-w-[120px]">
                 <button onClick={() => { setYear(new Date().getFullYear()); setShowYearMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">This Year ({new Date().getFullYear()})</button>
                 <button onClick={() => { setYear(new Date().getFullYear() - 1); setShowYearMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Last Year ({new Date().getFullYear() - 1})</button>
               </div>
             )}
           </div>

           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium shadow-sm transition-all"
           >
             <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-8">
         {['sales', 'gst', 'stock'].map((tab) => (
           <button
             key={tab}
             onClick={() => { setActiveTab(tab as any); setAiAnalysis(null); }}
             className={`pb-3 text-sm font-bold capitalize transition-all border-b-2 ${
               activeTab === tab 
                 ? 'border-teal-600 text-teal-700' 
                 : 'border-transparent text-gray-400 hover:text-gray-600'
             }`}
           >
             {tab === 'gst' ? 'GSTR Reports' : `${tab} Overview`}
           </button>
         ))}
      </div>

      {/* AI Analysis Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex gap-4">
               <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm h-fit">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
               </div>
               <div>
                  <h3 className="font-bold text-lg mb-1">AI Smart Analysis</h3>
                  {aiAnalysis ? (
                    <p className="text-indigo-100 text-sm leading-relaxed max-w-3xl">{aiAnalysis}</p>
                  ) : (
                    <p className="text-indigo-200 text-sm">Tap analyze to generate a deep-dive report on your {activeTab} performance.</p>
                  )}
               </div>
            </div>
            {!aiAnalysis && (
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-5 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 shadow-lg transition-all disabled:opacity-70 whitespace-nowrap"
              >
                {analyzing ? 'Thinking...' : 'Analyze Now'}
              </button>
            )}
         </div>
      </div>

      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Chart Section */}
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="font-bold text-gray-800 text-lg">Sales vs Purchase Trend</h3>
                    <p className="text-xs text-gray-400">Monthly comparison</p>
                 </div>
                 <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Sales
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-rose-500"></span> Purchase
                    </div>
                 </div>
              </div>
              
              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                     />
                     <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Sales" />
                     <Area type="monotone" dataKey="purchase" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchase)" name="Purchase" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Summary Cards */}
           <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-gray-800">₹ {totalSales.toLocaleString()}</div>
                    <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Expenses (Purchase)</div>
                 <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-gray-800">₹ {totalPurchases.toLocaleString()}</div>
                    <div className="bg-rose-50 p-1.5 rounded-lg text-rose-600">
                       <ArrowRight className="w-5 h-5" />
                    </div>
                 </div>
              </div>

              <div className={`p-5 rounded-2xl shadow-sm border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                 <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Net Profit / Loss
                 </div>
                 <div className="flex items-end justify-between">
                    <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                       {netProfit >= 0 ? '+' : '-'} ₹ {Math.abs(netProfit).toLocaleString()}
                    </div>
                    {netProfit >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
                 </div>
                 <div className={`text-xs mt-2 font-medium ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {netProfit >= 0 ? 'Healthy performance' : 'Action needed to reduce costs'}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'gst' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center py-20">
           <div className="inline-flex bg-teal-50 p-4 rounded-full mb-4">
              <FileTextIcon className="w-8 h-8 text-teal-600" />
           </div>
           <h3 className="text-xl font-bold text-gray-800 mb-2">GST Reporting Module</h3>
           <p className="text-gray-500 max-w-md mx-auto">Complete GSTR-1, GSTR-3B and tax liability reports will be generated here based on your invoices.</p>
        </div>
      )}

      {activeTab === 'stock' && (
         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
               <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Stock Valuation Report</h3>
            <p className="text-gray-500 text-sm mt-1">Detailed FIFO stock valuation is being generated.</p>
         </div>
      )}
    </div>
  );
};

// Helper icon
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
