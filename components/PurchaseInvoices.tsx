
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar, Eye, FileText, ArrowUpRight, ArrowDownLeft, Trash2, ChevronLeft, CheckCircle2, Printer, Download, Save, ChevronDown, RefreshCw } from 'lucide-react';
import { Product, Party, Purchase } from '../types';

interface PurchaseInvoicesProps {
  products: Product[];
  parties?: Party[];
  existingPurchases: Purchase[];
  onSavePurchase: (purchase: Purchase) => void;
  onUpdateStatus?: (purchase: Purchase, newStatus: 'Paid' | 'Unpaid') => void;
}

export const PurchaseInvoices: React.FC<PurchaseInvoicesProps> = ({ products, parties = [], existingPurchases, onSavePurchase, onUpdateStatus }) => {
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('Last 365 Days');
  const [selectedInvoice, setSelectedInvoice] = useState<Purchase | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  
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
  const filteredPurchases = existingPurchases.filter(p => {
    const matchesSearch = p.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.invoiceNo.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
     
     const purchaseData: Purchase = {
        id: Date.now().toString(),
        date: newInvoice.date,
        invoiceNo: newInvoice.invoiceNo || `PUR-${Date.now().toString().slice(-4)}`,
        partyName: newInvoice.partyName,
        dueIn: '30 Days',
        amount: totalAmount,
        unpaidAmount: paymentStatus === 'Unpaid' ? totalAmount : 0,
        status: paymentStatus,
        items: newInvoice.items
     };

     onSavePurchase(purchaseData);
     setSelectedInvoice(purchaseData);
     setShowSuccess(true);
     
     if (shouldPrint) {
        setAutoPrint(true);
     }
     
     setTimeout(() => {
        setShowSuccess(false);
        setView('preview');
     }, shouldPrint ? 500 : 1000);
  };

  const handleRemoveItem = (index: number) => {
    setNewInvoice(prev => ({
       ...prev,
       items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewInvoice = (invoice: Purchase) => {
     setSelectedInvoice(invoice);
     setView('preview');
  };

  const toggleStatus = (inv: Purchase) => {
     if (onUpdateStatus) {
        const newStatus = inv.status === 'Paid' ? 'Unpaid' : 'Paid';
        if (confirm(`Change status of ${inv.invoiceNo} to ${newStatus}? This will adjust the vendor's balance.`)) {
           onUpdateStatus(inv, newStatus);
        }
     }
  };

  useEffect(() => {
     if (view === 'preview' && autoPrint) {
        const timer = setTimeout(() => {
           window.print();
           setAutoPrint(false);
        }, 500);
        return () => clearTimeout(timer);
     }
  }, [view, autoPrint]);

  // --- LIST VIEW ---
  if (view === 'list') {
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
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 flex flex-col justify-between h-28 relative overflow-hidden group">
               <div className="flex items-center gap-2 text-purple-700 text-sm font-medium z-10">
                  <ArrowDownLeft className="w-4 h-4" /> Total Purchases
               </div>
               <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalPurchases.toLocaleString()}</div>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex flex-col justify-between h-28 relative overflow-hidden group">
               <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium z-10">
                  <CheckCircle2 className="w-4 h-4" /> Paid
               </div>
               <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalPaid.toLocaleString()}</div>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col justify-between h-28 relative overflow-hidden group">
               <div className="flex items-center gap-2 text-red-600 text-sm font-medium z-10">
                  <ArrowUpRight className="w-4 h-4" /> Unpaid
               </div>
               <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalUnpaid.toLocaleString()}</div>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            </div>
         </div>

         {/* Filters & Actions */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 min-w-[200px] md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                     type="text" 
                     placeholder="Search Party Name or Bill No..." 
                     className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               {/* Status Filter */}
               <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select 
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value as any)}
                     className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                     <option value="All">All Status</option>
                     <option value="Paid">Paid</option>
                     <option value="Unpaid">Unpaid</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
               </div>

               <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 text-sm">
                  <Calendar className="w-4 h-4" /> {dateRange}
               </button>
            </div>
            <button 
               onClick={() => {
                  setNewInvoice({ partyName: '', invoiceNo: '', date: new Date().toISOString().split('T')[0], items: [] });
                  setView('create');
               }}
               className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
            >
               <Plus className="w-4 h-4" /> Create Purchase Invoice
            </button>
         </div>

         {/* List Table */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-4 w-32">Date</th>
                        <th className="px-6 py-4">Bill No</th>
                        <th className="px-6 py-4">Party Name</th>
                        <th className="px-6 py-4">Due In</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-4 py-4 w-10"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredPurchases.map((inv, index) => (
                        <tr key={inv.id} className={`group hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                           <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                           <td className="px-6 py-4 text-gray-500">{inv.invoiceNo}</td>
                           <td className="px-6 py-4 font-medium text-gray-800">{inv.partyName}</td>
                           <td className="px-6 py-4 text-gray-500">{inv.dueIn || '-'}</td>
                           <td className="px-6 py-4 text-right">
                              <div className="font-medium text-gray-900">₹ {inv.amount.toLocaleString()}</div>
                              {inv.unpaidAmount > 0 && <div className="text-xs text-red-500">(₹ {inv.unpaidAmount.toLocaleString()} unpaid)</div>}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => toggleStatus(inv)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 mx-auto transition-all ${
                                 inv.status === 'Paid' 
                                 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                 : 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'
                              }`}>
                                 {inv.status}
                                 <RefreshCw className="w-3 h-3 opacity-50" />
                              </button>
                           </td>
                           <td className="px-4 py-4 text-center">
                               <button 
                                  onClick={() => handleViewInvoice(inv)}
                                  className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-50 transition-colors tooltip"
                                  title="View Bill"
                               >
                                   <Eye className="w-4 h-4" />
                               </button>
                           </td>
                        </tr>
                     ))}
                     {filteredPurchases.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-12 text-gray-400">
                                No purchase invoices found matching filters.
                            </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    );
  }

  // --- CREATE VIEW ---
  if (view === 'create') {
     const totalAmount = newInvoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
     
     return (
        <div className="space-y-6">
           {showSuccess && (
              <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-5 print:hidden">
                 <CheckCircle2 className="w-5 h-5" />
                 <span className="font-medium">Purchase Invoice Saved!</span>
              </div>
           )}

           <div className="flex justify-between items-center print:hidden">
              <div className="flex items-center gap-3">
                 <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                 </button>
                 <h1 className="text-2xl font-bold text-gray-800">Create Purchase Invoice</h1>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
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
                             className="w-full border border-purple-200 bg-purple-50/50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder-purple-400 text-purple-900 font-medium"
                             placeholder="Search or add vendor"
                             value={newInvoice.partyName}
                             onChange={(e) => setNewInvoice({...newInvoice, partyName: e.target.value})}
                          />
                          <datalist id="vendor-list">
                             {parties.filter(p => p.type === 'Supplier').map(party => (
                                <option key={party.id} value={party.name}>{party.phone}</option>
                             ))}
                          </datalist>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Bill Number</label>
                          <input 
                             type="text" 
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                             value={newInvoice.invoiceNo}
                             onChange={(e) => setNewInvoice({...newInvoice, invoiceNo: e.target.value})}
                             placeholder="e.g. BILL-123"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Bill Date</label>
                          <input 
                             type="date" 
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                             value={newInvoice.date}
                             onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Items */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Items</h2>
                    <div className="space-y-4">
                       {newInvoice.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-3 items-center">
                             <div className="col-span-5">
                                <input 
                                   list={`product-list-${index}`}
                                   type="text" 
                                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                   placeholder="Product name"
                                   value={item.name}
                                   onChange={(e) => updateItem(index, 'name', e.target.value)}
                                />
                                <datalist id={`product-list-${index}`}>
                                   {products.map(p => (
                                      <option key={p.id} value={p.name}>Price: ₹{p.price}</option>
                                   ))}
                                </datalist>
                             </div>
                             <div className="col-span-2">
                                <input 
                                   type="number" 
                                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                   placeholder="Qty"
                                   value={item.qty}
                                   min="1"
                                   onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value))}
                                />
                             </div>
                             <div className="col-span-3">
                                <input 
                                   type="number" 
                                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                   placeholder="Rate"
                                   value={item.rate}
                                   onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                                />
                             </div>
                             <div className="col-span-2 flex items-center justify-between">
                                <span className="font-medium text-gray-800">₹{(item.qty * item.rate).toFixed(2)}</span>
                                <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       ))}
                       <button 
                          onClick={handleAddItem}
                          className="w-full py-3 border-2 border-dashed border-purple-200 rounded-lg text-purple-600 font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                       >
                          <Plus className="w-4 h-4" /> Add Item
                       </button>
                    </div>
                 </div>
              </div>

              {/* Total & Save */}
              <div className="lg:col-span-1">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Payment</h2>
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-6">
                       <span>Total Payable</span>
                       <span>₹ {totalAmount.toFixed(2)}</span>
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
                       className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex justify-center items-center gap-2 mb-3"
                    >
                       <Save className="w-4 h-4" /> Save Purchase
                    </button>
                    <button 
                       onClick={() => handleSaveInvoice(true)}
                       className="w-full bg-white border border-purple-600 text-purple-700 py-3 rounded-lg font-medium hover:bg-purple-50 transition-all flex justify-center items-center gap-2"
                    >
                       <Printer className="w-4 h-4" /> Save & Print
                    </button>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  // --- PREVIEW VIEW ---
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center print:hidden">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
             <ChevronLeft className="w-5 h-5" /> Back to List
          </button>
          <div className="flex gap-2">
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm"
             >
                <Printer className="w-4 h-4" /> Print Voucher
             </button>
          </div>
       </div>

       {selectedInvoice && (
         <div className="flex justify-center animate-in zoom-in-95 duration-300 print:block">
            <div className="bg-white shadow-2xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-12 print:shadow-none print:w-full print:max-w-none print:p-0">
               <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between">
                  <div>
                     <h1 className="text-3xl font-bold text-gray-900 mb-1">PURCHASE VOUCHER</h1>
                     <p className="text-sm text-gray-500">Original Copy</p>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-lg text-gray-800 uppercase">Your Business Name</p>
                  </div>
               </div>

               <div className="flex justify-between mb-8">
                  <div>
                     <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Vendor Details</h3>
                     <p className="font-bold text-lg text-gray-900">{selectedInvoice.partyName}</p>
                     <p className="text-sm text-gray-600">Ref Bill No: {selectedInvoice.invoiceNo}</p>
                  </div>
                  <div className="text-right space-y-2">
                     <div className="flex gap-8 justify-between">
                        <span className="text-gray-500 font-medium text-sm">Voucher Date:</span>
                        <span className="font-bold text-gray-900">{selectedInvoice.date}</span>
                     </div>
                     <div className="flex gap-8 justify-between">
                        <span className="text-gray-500 font-medium text-sm">Status:</span>
                        <span className={`font-bold ${selectedInvoice.status === 'Paid' ? 'text-emerald-600' : 'text-red-500'}`}>{selectedInvoice.status}</span>
                     </div>
                  </div>
               </div>

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
                     {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                           <td className="py-3 px-4">{idx + 1}</td>
                           <td className="py-3 px-4 font-medium">{item.name}</td>
                           <td className="py-3 px-4 text-right">{item.qty}</td>
                           <td className="py-3 px-4 text-right">{item.rate.toFixed(2)}</td>
                           <td className="py-3 px-4 text-right font-bold">₹ {(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>

               <div className="flex justify-end mb-12">
                  <div className="w-1/2 flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                     <span>Total Amount</span>
                     <span>₹ {selectedInvoice.amount.toFixed(2)}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 mt-auto pt-20">
                  <div className="text-center pt-8 border-t border-gray-300 w-48">
                     <p className="text-xs font-bold text-gray-500">Vendor Signature</p>
                  </div>
                  <div className="text-center pt-8 border-t border-gray-300 w-48 ml-auto">
                     <p className="text-xs font-bold text-gray-500">Authorized Signatory</p>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
