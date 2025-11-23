import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Sparkles, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { GeminiService } from '../services/geminiService';

const salesData = [
  { name: 'Jan', sales: 4000, purchase: 2400 },
  { name: 'Feb', sales: 3000, purchase: 1398 },
  { name: 'Mar', sales: 2000, purchase: 9800 },
  { name: 'Apr', sales: 2780, purchase: 3908 },
  { name: 'May', sales: 1890, purchase: 4800 },
  { name: 'Jun', sales: 2390, purchase: 3800 },
];

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'gst' | 'stock'>('sales');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const dataContext = activeTab === 'sales' 
      ? "Sales last 6 months: Jan 4k, Feb 3k, Mar 2k (dip due to stock), Apr 2.7k. High purchase in March (9.8k)." 
      : "GST Report: Input Tax Credit: 15,000. Output Tax Liability: 25,000. Net Payable: 10,000. All returns filed on time.";
    
    const analysis = await GeminiService.analyzeReport(dataContext, activeTab === 'sales' ? 'Sales & Purchase' : 'GST');
    setAiAnalysis(analysis);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
           <p className="text-gray-500 text-sm">Detailed financial and inventory analytics</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
             <Calendar className="w-4 h-4" /> This Year
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
             <Download className="w-4 h-4" /> Export Excel
           </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
         {['sales', 'gst', 'stock'].map((tab) => (
           <button
             key={tab}
             onClick={() => { setActiveTab(tab as any); setAiAnalysis(null); }}
             className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
               activeTab === tab 
                 ? 'border-indigo-600 text-indigo-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700'
             }`}
           >
             {tab === 'gst' ? 'GSTR Reports' : `${tab} Reports`}
           </button>
         ))}
      </div>

      {/* AI Analysis Card */}
      <div className="bg-gradient-to-r from-violet-100 to-indigo-50 p-6 rounded-xl border border-indigo-100 relative overflow-hidden">
         <div className="flex justify-between items-start relative z-10">
            <div className="flex gap-3">
               <div className="bg-white p-2 rounded-lg shadow-sm h-fit">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
               </div>
               <div>
                  <h3 className="font-semibold text-gray-800">AI Report Analysis</h3>
                  {aiAnalysis ? (
                    <p className="text-sm text-gray-700 mt-2 max-w-2xl leading-relaxed">{aiAnalysis}</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Get instant insights on your {activeTab} performance using Gemini.</p>
                  )}
               </div>
            </div>
            {!aiAnalysis && (
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
            )}
         </div>
      </div>

      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-6">Sales vs Purchase</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={salesData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                     <Legend />
                     <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Sales" />
                     <Bar dataKey="purchase" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Purchase" />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Summary</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                       <span className="text-gray-600 text-sm">Total Sales</span>
                       <span className="font-bold text-gray-900">₹ 16,060</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                       <span className="text-gray-600 text-sm">Total Purchase</span>
                       <span className="font-bold text-gray-900">₹ 21,296</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                       <span className="text-red-700 text-sm font-medium">Net Loss</span>
                       <span className="font-bold text-red-700">- ₹ 5,236</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'gst' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                 <h4 className="text-blue-700 font-semibold mb-2">GSTR-1 (Sales)</h4>
                 <div className="text-2xl font-bold text-gray-900 mb-1">Filed</div>
                 <div className="text-xs text-blue-600">Last filed: 10 Nov 2025</div>
              </div>
              <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                 <h4 className="text-green-700 font-semibold mb-2">GSTR-3B</h4>
                 <div className="text-2xl font-bold text-gray-900 mb-1">Pending</div>
                 <div className="text-xs text-green-600">Due date: 20 Nov 2025</div>
              </div>
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                 <h4 className="text-purple-700 font-semibold mb-2">Tax Liability</h4>
                 <div className="text-2xl font-bold text-gray-900 mb-1">₹ 12,450</div>
                 <div className="text-xs text-purple-600">To be paid</div>
              </div>
           </div>
           
           <h3 className="font-semibold text-gray-800 mt-8 mb-4">Tax Breakdown</h3>
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                <tr>
                   <th className="px-4 py-3">Tax Type</th>
                   <th className="px-4 py-3">Rate</th>
                   <th className="px-4 py-3 text-right">Taxable Amount</th>
                   <th className="px-4 py-3 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">IGST</td>
                    <td className="px-4 py-3 text-gray-500">18%</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹ 45,000</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">₹ 8,100</td>
                 </tr>
                 <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">CGST</td>
                    <td className="px-4 py-3 text-gray-500">9%</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹ 24,000</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">₹ 2,160</td>
                 </tr>
                 <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">SGST</td>
                    <td className="px-4 py-3 text-gray-500">9%</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹ 24,000</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">₹ 2,160</td>
                 </tr>
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'stock' && (
         <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
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