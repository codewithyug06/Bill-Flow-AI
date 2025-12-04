
import React, { useState, useEffect } from 'react';
import { Estimate, Product, Party, InvoiceItem } from '../types';
import { Search, Plus, FileText, ArrowRight, Trash2, Printer, Calendar, Clock, CheckCircle2, MoreVertical, X, Copy } from 'lucide-react';

interface EstimatesProps {
  estimates: Estimate[];
  products: Product[];
  parties: Party[];
  onSaveEstimate: (estimate: Estimate) => void;
  onConvert: (estimate: Estimate) => void;
  onDelete: (id: string) => void;
}

export const Estimates: React.FC<EstimatesProps> = ({ estimates, products, parties, onSaveEstimate, onConvert, onDelete }) => {
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  
  // Form State
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimateNo, setEstimateNo] = useState(`EST-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [status, setStatus] = useState<Estimate['status']>('Draft');

  // Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'create') {
           // Maybe ask for confirmation? For now just reset view if simple
           setView('list');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  const filteredEstimates = estimates.filter(est => 
    est.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    est.estimateNo.includes(searchTerm)
  );

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleAddItem = () => {
    setItems([...items, {
      productId: '',
      productName: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    if (field === 'productName') {
      newItems[index].productName = value;
      const product = products.find(p => p.name === value);
      if (product) {
        newItems[index].productId = product.id;
        newItems[index].price = product.price;
        newItems[index].total = newItems[index].quantity * product.price;
      }
    } else {
      // @ts-ignore
      newItems[index][field] = value;
    }
    
    if (field === 'quantity' || field === 'price' || field === 'productName') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setItems(newItems);
  };

  const handleSave = () => {
    if (!customer || items.length === 0) return;
    
    const newEst: Estimate = {
      id: selectedEstimate?.id || Date.now().toString(),
      estimateNo,
      date,
      customerName: customer,
      items,
      subtotal,
      tax,
      total,
      status
    };
    
    onSaveEstimate(newEst);
    setView('list');
    resetForm();
  };

  const resetForm = () => {
    setCustomer('');
    setItems([]);
    setEstimateNo(`EST-${Date.now().toString().slice(-6)}`);
    setSelectedEstimate(null);
    setStatus('Draft');
  };

  const handleConvertClick = (est: Estimate) => {
    if (confirm(`Convert Estimate ${est.estimateNo} to a Sales Invoice?`)) {
        onConvert(est);
    }
  };

  const handleEdit = (est: Estimate) => {
      setSelectedEstimate(est);
      setCustomer(est.customerName);
      setEstimateNo(est.estimateNo);
      setDate(est.date);
      setItems(est.items);
      setStatus(est.status);
      setTaxRate(18); // Default
      setView('create');
  };

  if (view === 'list') {
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Estimates & Quotes</h1>
            <p className="text-gray-500 text-sm">Create quotes and convert to invoices</p>
          </div>
          <button 
            onClick={() => { resetForm(); setView('create'); }}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Estimate
          </button>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search quotes..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Est No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEstimates.map(est => (
                <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-600">{est.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{est.estimateNo}</td>
                  <td className="px-6 py-4 text-gray-800">{est.customerName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      est.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                      est.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                      est.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {est.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">₹ {est.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => handleConvertClick(est)}
                         className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100"
                         title="Convert to Invoice"
                       >
                         <Copy className="w-3 h-3" /> Convert
                       </button>
                       <button onClick={() => handleEdit(est)} className="p-1 text-gray-400 hover:text-gray-600">
                          <FileText className="w-4 h-4" />
                       </button>
                       <button onClick={() => onDelete(est.id)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEstimates.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No estimates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // CREATE / EDIT VIEW
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{selectedEstimate ? 'Edit Estimate' : 'New Estimate'}</h1>
        <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800">Cancel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Customer</label>
                    <input 
                      list="customer-list-est"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      placeholder="Select Customer"
                    />
                    <datalist id="customer-list-est">
                       {parties.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={date} onChange={e => setDate(e.target.value)} />
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h3 className="font-bold text-gray-700 mb-4">Items</h3>
               {items.map((item, idx) => (
                 <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <div className="col-span-5">
                       <input 
                         className="w-full border rounded px-2 py-1" 
                         placeholder="Item"
                         value={item.productName}
                         onChange={e => updateItem(idx, 'productName', e.target.value)}
                       />
                    </div>
                    <div className="col-span-2">
                       <input type="number" className="w-full border rounded px-2 py-1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="col-span-3">
                       <input type="number" className="w-full border rounded px-2 py-1" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} />
                    </div>
                    <div className="col-span-2 flex justify-between">
                       <span className="font-bold">₹{item.total}</span>
                       <button onClick={() => {
                          const newItems = items.filter((_, i) => i !== idx);
                          setItems(newItems);
                       }} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                 </div>
               ))}
               <button onClick={handleAddItem} className="mt-4 text-teal-600 text-sm font-bold">+ Add Item</button>
           </div>
        </div>

        <div className="lg:col-span-1">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
              <h3 className="font-bold text-gray-700 mb-4">Summary</h3>
              <div className="space-y-2 text-sm border-b pb-4 mb-4">
                 <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between text-xl font-bold mb-6"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              
              <div className="mb-6">
                 <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                 <select 
                   className="w-full mt-1 border rounded-lg p-2"
                   value={status}
                   onChange={e => setStatus(e.target.value as any)}
                 >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                 </select>
              </div>

              <button onClick={handleSave} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700">Save Estimate</button>
           </div>
        </div>
      </div>
    </div>
  );
};
