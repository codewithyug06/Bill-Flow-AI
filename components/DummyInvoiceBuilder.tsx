
import React, { useState } from 'react';
import { InvoiceItem } from '../types';
import { Plus, Trash2, FileText, Printer, Send, ChevronLeft, CheckCircle2, Download } from 'lucide-react';

export const DummyInvoiceBuilder: React.FC = () => {
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo] = useState('EST-001');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const addItem = () => {
    setItems([...items, {
      productId: Date.now().toString(),
      productName: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  // No TAX calculation for dummy invoice
  const total = subtotal;

  const handleGenerate = () => {
    if (!customer) {
      alert("Please enter a customer name");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }
    
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setView('preview');
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-5">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Estimate Generated!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
           {view === 'preview' && (
             <button onClick={() => setView('edit')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <ChevronLeft className="w-5 h-5 text-gray-600" />
             </button>
           )}
           <h1 className="text-2xl font-bold text-gray-800">{view === 'edit' ? 'Create Dummy Bill' : 'Bill Preview'}</h1>
           <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">Non-GST</span>
        </div>
        <div className="flex gap-2">
           {view === 'edit' ? (
             <button 
                onClick={() => setView('preview')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
             >
                <FileText className="w-4 h-4" /> Preview
             </button>
           ) : (
             <div className="flex gap-2">
               <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm"
               >
                  <Download className="w-4 h-4" /> Download
               </button>
               <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm"
               >
                  <Printer className="w-4 h-4" /> Print Bill
               </button>
             </div>
           )}
        </div>
      </div>

      {view === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Bill To</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Customer Name (Manual Entry)</label>
                   <input 
                     type="text" 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 outline-none"
                     placeholder="Type customer name..."
                     value={customer}
                     onChange={(e) => setCustomer(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Date</label>
                   <input 
                     type="date" 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 outline-none"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                   />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Items</h2>
               <div className="space-y-4">
                 <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase px-2">
                   <div className="col-span-5">Item</div>
                   <div className="col-span-2">Qty</div>
                   <div className="col-span-2">Rate</div>
                   <div className="col-span-2">Amount</div>
                   <div className="col-span-1"></div>
                 </div>
                 
                 {items.map((item, index) => (
                   <div key={index} className="grid grid-cols-12 gap-4 items-center">
                     <div className="col-span-5">
                       <input 
                         type="text" 
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 outline-none"
                         placeholder="Item name"
                         value={item.productName}
                         onChange={(e) => updateItem(index, 'productName', e.target.value)}
                       />
                     </div>
                     <div className="col-span-2">
                       <input 
                         type="number" 
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 outline-none"
                         value={item.quantity}
                         min="1"
                         onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                       />
                     </div>
                     <div className="col-span-2">
                       <input 
                         type="number" 
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 outline-none"
                         value={item.price}
                         min="0"
                         onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                       />
                     </div>
                     <div className="col-span-2 text-gray-800 font-medium px-2">
                       ₹{item.total.toFixed(2)}
                     </div>
                     <div className="col-span-1 flex justify-center">
                       <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}

                 <button 
                   onClick={addItem}
                   className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                 >
                   <Plus className="w-4 h-4" /> Add Item
                 </button>
               </div>
            </div>
          </div>

          {/* Summary / Save Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
               <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Total</h2>
               <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-6">
                 <span>Grand Total</span>
                 <span>₹{total.toFixed(2)}</span>
               </div>

               <button 
                  onClick={handleGenerate}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 shadow-lg transition-all flex justify-center items-center gap-2 mb-3"
               >
                  <Send className="w-4 h-4" /> Generate
               </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview & Print Template (Simplified) */
        <div className="flex justify-center animate-in zoom-in-95 duration-300 print:block">
           <div className="bg-white shadow-2xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-12 print:shadow-none print:w-full print:max-w-none print:p-0">
              
              {/* Header */}
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">ESTIMATE</h1>
                 <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-bold text-lg text-gray-800">SREE BALAJI PLASTICS</p>
                    <p>Phone: +91 8939496031</p>
                    {/* No GSTIN here */}
                 </div>
              </div>

              {/* Bill To & Invoice Details */}
              <div className="flex justify-between mb-8">
                 <div>
                    <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Billed To</h3>
                    <p className="font-bold text-lg text-gray-900">{customer}</p>
                 </div>
                 <div className="text-right space-y-2">
                    <div className="flex gap-8 justify-between">
                       <span className="text-gray-500 font-medium text-sm">Date:</span>
                       <span className="font-bold text-gray-900">{date}</span>
                    </div>
                 </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                 <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                       <th className="py-3 px-4 text-left rounded-l-md">#</th>
                       <th className="py-3 px-4 text-left">Item</th>
                       <th className="py-3 px-4 text-right">Qty</th>
                       <th className="py-3 px-4 text-right">Rate</th>
                       <th className="py-3 px-4 text-right rounded-r-md">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm text-gray-700">
                    {items.map((item, idx) => (
                       <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-4">{idx + 1}</td>
                          <td className="py-3 px-4 font-medium">{item.productName}</td>
                          <td className="py-3 px-4 text-right">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">{item.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold">₹ {item.total.toFixed(2)}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                 <div className="w-1/2 space-y-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-800">
                       <span>Total</span>
                       <span>₹ {total.toFixed(2)}</span>
                    </div>
                 </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-20">
                 Thank you for your business.
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
