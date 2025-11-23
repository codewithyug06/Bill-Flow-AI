
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar, Eye, FileText, ArrowUpRight, ArrowDownLeft, Trash2, ChevronLeft, CheckCircle2, Printer, Download, Save } from 'lucide-react';
import { Product, Party, Purchase } from '../types';

interface PurchaseInvoicesProps {
  products: Product[];
  parties?: Party[];
  existingPurchases: Purchase[];
  onSavePurchase: (purchase: Purchase) => void;
}

export const PurchaseInvoices: React.FC<PurchaseInvoicesProps> = ({ products, parties = [], existingPurchases, onSavePurchase }) => {
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('Last 365 Days');
  const [selectedInvoice, setSelectedInvoice] = useState<Purchase | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  
  // Payment Status
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');

  // New Invoice State
  const [newInvoice, setNewInvoice] = useState({
    partyName: '',
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    items: [] as { productId: string, name: string, qty: number, rate: number }[]
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter Logic for List View
  const filteredPurchases = existingPurchases.filter(p => 
    p.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.invoiceNo.includes(searchTerm)
  );

  const totalPurchases = existingPurchases.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = existingPurchases.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = existingPurchases.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + p.unpaidAmount, 0);

  // Creation Logic
  const handleAddItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', qty: 1, rate: 0 }]
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items];
    if (field === 'name') {
       // Auto-fill logic when picking a product
       const selectedProduct = products.find(p => p.name === value);
       updatedItems[index].name = value;
       if (selectedProduct) {
          updatedItems[index].productId = selectedProduct.id;
          updatedItems[index].rate = selectedProduct.price; // Using list price as default purchase price
       } else {
          updatedItems[index].productId = ''; // Reset ID if the name doesn't match an existing product
       }
    } else {
       // @ts-ignore
       updatedItems[index][field] = value;
    }
    setNewInvoice(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSaveInvoice = (shouldPrint = false) => {
     if (!newInvoice.partyName || newInvoice.items.length === 0) {
        alert("Please fill party details and add at least one item.");
        return;
     }

     const totalAmount = newInvoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
     
     const newTxn: Purchase = {
        id: Date.now().toString(),
        date: new Date(newInvoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        invoiceNo: newInvoice.invoiceNo || `PUR-${Math.floor(Math.random() * 1000)}`,
        partyName: newInvoice.partyName,
        dueIn: '-',
        amount: totalAmount,
        unpaidAmount: paymentStatus === 'Unpaid' ? totalAmount : 0,
        status: paymentStatus,
        items: newInvoice.items.map(i => ({ productId: i.productId, name: i.name, qty: i.qty, rate: i.rate }))
     };

     onSavePurchase(newTxn);

     setShowSuccess(true);
     
     if (shouldPrint) {
       setSelectedInvoice(newTxn);
       setAutoPrint(true);
       setTimeout(() => {
          setShowSuccess(false);
          setNewInvoice({ partyName: '', invoiceNo: '', date: new Date().toISOString().split('T')[0], items: [] });
          setPaymentStatus('Unpaid');
          setView('preview');
       }, 500); // Shorter delay for printing
     } else {
       setTimeout(() => {
          setShowSuccess(false);
          setNewInvoice({ partyName: '', invoiceNo: '', date: new Date().toISOString().split('T')[0], items: [] });
          setPaymentStatus('Unpaid');
          setView('list');
       }, 1500);
     }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewInvoice = (invoice: Purchase) => {
    setSelectedInvoice(invoice);
    setView('preview');
  }

  useEffect(() => {
    if (view === 'preview' && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
        setAutoPrint(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [view, autoPrint]);

  if (view === 'preview' && selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
             <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
               <ChevronLeft className="w-5 h-5 text-gray-600" />
             </button>
             <h1 className="text-2xl font-bold text-gray-800">Purchase Bill Preview</h1>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm"
             >
                <Download className="w-4 h-4" /> Download
             </button>
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors shadow-sm"
             >
                <Printer className="w-4 h-4" /> Print Bill
             </button>
          </div>
        </div>

        <div className="flex justify-center animate-in zoom-in-95 duration-300 print:block">
           <div className="bg-white shadow-2xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 print:shadow-none print:w-full print:max-w-none print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">PURCHASE VOUCHER</h1>
                    <div className="text-sm text-gray-600">
                       <p className="font-bold text-lg text-gray-800 uppercase">{selectedInvoice.partyName}</p>
                       <p>Vendor Ref: {selectedInvoice.invoiceNo}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-sm text-gray-600">
                       <p className="font-bold text-gray-800">Bill Date</p>
                       <p>{selectedInvoice.date}</p>
                    </div>
                 </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                 <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                       <th className="py-3 px-4 text-left rounded-l-md">#</th>
                       <th className="py-3 px-4 text-left">Item Description</th>
                       <th className="py-3 px-4 text-right">Qty</th>
                       <th className="py-3 px-4 text-right">Rate</th>
                       <th className="py-3 px-4 text-right rounded-r-md">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm text-gray-700">
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                              <td className="py-3 px-4">{idx + 1}</td>
                              <td className="py-3 px-4 font-medium">{item.name}</td>
                              <td className="py-3 px-4 text-right">{item.qty}</td>
                              <td className="py-3 px-4 text-right">{item.rate.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-bold">₹ {(item.qty * item.rate).toFixed(2)}</td>
                          </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-400">Item details not available for this record</td>
                        </tr>
                    )}
                 </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                 <div className="w-1/2 space-y-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-800">
                       <span>Total Amount</span>
                       <span>₹ {selectedInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 pt-2">
                       <span>Status</span>
                       <span className={`font-bold ${selectedInvoice.status === 'Paid' ? 'text-emerald-600' : 'text-red-500'}`}>{selectedInvoice.status}</span>
                    </div>
                 </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-20 border-t border-gray-100 pt-4">
                 Internal Purchase Record generated via BillFlow AI
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
     return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           {showSuccess && (
              <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 print:hidden">
                 <CheckCircle2 className="w-5 h-5" />
                 <span className="font-medium">Purchase Invoice Saved & Stock Updated!</span>
              </div>
           )}

           <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
              <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                 <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">New Purchase Invoice</h1>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                 {/* Party Details */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Vendor Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Vendor Name</label>
                          <input 
                             list="vendor-list"
                             type="text" 
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                             placeholder="Select or type vendor..."
                             value={newInvoice.partyName}
                             onChange={(e) => setNewInvoice({...newInvoice, partyName: e.target.value})}
                          />
                          <datalist id="vendor-list">
                             {parties.map(p => (
                               <option key={p.id} value={p.name}>{p.phone} - {p.type}</option>
                             ))}
                          </datalist>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Invoice Number</label>
                          <input 
                             type="text" 
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                             placeholder="e.g. INV-2025-001"
                             value={newInvoice.invoiceNo}
                             onChange={(e) => setNewInvoice({...newInvoice, invoiceNo: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Purchase Date</label>
                          <input 
                             type="date" 
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                             value={newInvoice.date}
                             onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Items Table */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Items</h2>
                    <div className="space-y-4">
                       <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase px-2">
                          <div className="col-span-5">Product</div>
                          <div className="col-span-2">Qty</div>
                          <div className="col-span-2">Rate</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-1"></div>
                       </div>
                       
                       {newInvoice.items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                             <div className="col-span-5">
                                <input 
                                   list={`products-${idx}`}
                                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                   placeholder="Search item..."
                                   value={item.name}
                                   onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                />
                                <datalist id={`products-${idx}`}>
                                   {products.map(p => (
                                      <option key={p.id} value={p.name}>{p.name} - Current Stock: {p.stock}</option>
                                   ))}
                                </datalist>
                             </div>
                             <div className="col-span-2">
                                <input 
                                   type="number" 
                                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                   value={item.qty}
                                   min="1"
                                   onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value))}
                                />
                             </div>
                             <div className="col-span-2">
                                <input 
                                   type="number" 
                                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                   value={item.rate}
                                   onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value))}
                                />
                             </div>
                             <div className="col-span-2 text-gray-800 font-medium px-2">
                                ₹ {(item.qty * item.rate).toFixed(2)}
                             </div>
                             <div className="col-span-1 flex justify-center">
                                <button 
                                   onClick={() => setNewInvoice(prev => ({...prev, items: prev.items.filter((_, i) => i !== idx)}))} 
                                   className="text-red-400 hover:text-red-600 p-2"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       ))}

                       <button 
                          onClick={handleAddItem}
                          className="w-full py-3 border-2 border-dashed border-teal-200 rounded-lg text-teal-600 font-medium hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                       >
                          <Plus className="w-4 h-4" /> Add Item
                       </button>
                    </div>
                 </div>
              </div>

              {/* Total Summary */}
              <div className="lg:col-span-1">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Summary</h2>
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-6 border-t border-gray-100 pt-4">
                       <span>Total Payable</span>
                       <span>₹ {newInvoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0).toFixed(2)}</span>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-medium text-gray-700 block mb-2">Payment Status</label>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button 
                                onClick={() => setPaymentStatus('Paid')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentStatus === 'Paid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Paid
                            </button>
                            <button 
                                onClick={() => setPaymentStatus('Unpaid')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentStatus === 'Unpaid' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Unpaid
                            </button>
                        </div>
                    </div>

                    <button 
                       onClick={() => handleSaveInvoice(false)}
                       className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all flex justify-center items-center gap-2 mb-3"
                    >
                       <Save className="w-4 h-4" /> Save Purchase
                    </button>
                    <button 
                       onClick={() => handleSaveInvoice(true)}
                       className="w-full bg-white border border-teal-600 text-teal-700 py-3 rounded-lg font-medium hover:bg-teal-50 transition-all flex justify-center items-center gap-2"
                    >
                       <Printer className="w-4 h-4" /> Save & Print
                    </button>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  // List View
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Invoices</h1>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium shadow-sm">
                <FileText className="w-4 h-4" /> Reports
            </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-teal-50 rounded-xl p-5 border border-teal-100 flex flex-col justify-between h-28 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-teal-700 text-sm font-medium z-10">
                <FileText className="w-4 h-4" /> Total Purchases
            </div>
            <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex flex-col justify-between h-28 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium z-10">
                <ArrowDownLeft className="w-4 h-4" /> Paid
            </div>
            <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col justify-between h-28 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium z-10">
                <ArrowUpRight className="w-4 h-4" /> Unpaid
            </div>
            <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by Party Name or Invoice No..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 text-sm">
                 <Calendar className="w-4 h-4" /> {dateRange}
             </button>
         </div>
         <button 
           onClick={() => setView('create')}
           className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2"
         >
             <Plus className="w-4 h-4" /> Create Purchase Invoice
         </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                     <th className="px-6 py-4 w-32">Date</th>
                     <th className="px-6 py-4">Purchase Invoice Number</th>
                     <th className="px-6 py-4">Party Name</th>
                     <th className="px-6 py-4">Due In</th>
                     <th className="px-6 py-4">Amount</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-4 py-4 w-10"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredPurchases.map((txn, index) => (
                      <tr key={txn.id} className={`group hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                         <td className="px-6 py-4 text-gray-600">{txn.date}</td>
                         <td className="px-6 py-4 text-gray-500">{txn.invoiceNo}</td>
                         <td className="px-6 py-4 font-medium text-gray-800 uppercase">{txn.partyName}</td>
                         <td className="px-6 py-4">
                             {txn.dueIn.includes('Overdue') ? (
                                 <span className="text-red-500 text-xs font-medium bg-red-50 px-2 py-1 rounded-md">{txn.dueIn}</span>
                             ) : (
                                 <span className="text-gray-400">-</span>
                             )}
                         </td>
                         <td className="px-6 py-4">
                             <div className="text-gray-900 font-medium">₹ {txn.amount.toLocaleString()}</div>
                             {txn.status === 'Unpaid' && (
                                <div className="text-xs text-gray-500">(₹ {txn.unpaidAmount.toLocaleString()} unpaid)</div>
                             )}
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                txn.status === 'Paid' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                                {txn.status}
                            </span>
                         </td>
                         <td className="px-4 py-4 text-center">
                             <button 
                                onClick={() => handleViewInvoice(txn)}
                                className="text-teal-600 hover:text-teal-800 p-1 rounded-full hover:bg-teal-50 transition-colors tooltip"
                                title="View & Print Bill"
                             >
                                 <Eye className="w-4 h-4" />
                             </button>
                         </td>
                      </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                      <tr>
                          <td colSpan={7} className="text-center py-12 text-gray-400">
                              No purchase invoices found matching your criteria.
                          </td>
                      </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
