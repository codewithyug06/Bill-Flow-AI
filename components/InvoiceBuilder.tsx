
import React, { useState, useEffect } from 'react';
import { InvoiceItem, Party, Product, User, Invoice } from '../types';
import { Plus, Trash2, FileText, Printer, Send, ChevronLeft, CheckCircle2, Download, Search, Calendar, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Filter, ChevronDown, Mail, Loader2, RefreshCw, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface InvoiceBuilderProps {
  parties?: Party[];
  products: Product[];
  existingInvoices?: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateStatus?: (invoice: Invoice, newStatus: 'Paid' | 'Pending') => void;
  user?: User | null;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ parties = [], products = [], existingInvoices = [], onSaveInvoice, onUpdateStatus, user }) => {
  const [view, setView] = useState<'list' | 'edit' | 'preview'>('list');
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // List View State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');

  // Find Selected Party Details
  const selectedParty = parties.find(p => p.name === customer);

  // Summary Calculations
  const totalSales = existingInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = existingInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = existingInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);
  
  const filteredInvoices = existingInvoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addItem = () => {
    setItems([...items, {
      productId: '', // Empty initially, will be filled when product is selected
      productName: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    
    if (field === 'productName') {
      // Auto-fill details if product exists
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

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleStartCreate = () => {
    // Reset form
    setCustomer('');
    setDate(new Date().toISOString().split('T')[0]);
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setItems([]);
    setPaymentStatus('Paid');
    setTaxRate(18);
    setView('edit');
  };

  const constructInvoice = (): Invoice | null => {
    if (!customer) {
      alert("Please enter a customer name");
      return null;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return null;
    }
    return {
      id: Date.now().toString(),
      invoiceNo,
      date,
      customerName: customer,
      items,
      subtotal,
      tax,
      taxRate,
      total,
      status: paymentStatus
    };
  };

  const handleSaveAndGenerate = (shouldPrint = false) => {
    const newInvoice = constructInvoice();
    if (!newInvoice) return;

    onSaveInvoice(newInvoice);
    setSelectedInvoice(newInvoice);

    setShowSaveSuccess(true);
    if (shouldPrint) {
      setAutoPrint(true);
    }

    setTimeout(() => {
      setShowSaveSuccess(false);
      setView('preview');
    }, shouldPrint ? 500 : 1000); 
  };

  const handleSaveAndSend = () => {
    const newInvoice = constructInvoice();
    if (!newInvoice) return;

    // Determine Email
    let emailToUse = selectedParty?.email;
    if (!emailToUse) {
       const manualEmail = prompt(`No email found for ${customer}. Please enter email address to send invoice:`);
       if (!manualEmail) return; // User cancelled
       emailToUse = manualEmail;
    }

    // 1. Save
    onSaveInvoice(newInvoice);
    setSelectedInvoice(newInvoice);
    
    // 2. Simulate Sending
    setIsSending(true);
    setTimeout(() => {
       setIsSending(false);
       setSendSuccess(true);
       alert(`Invoice ${newInvoice.invoiceNo} successfully sent to ${emailToUse}`);
       setView('preview');
       setTimeout(() => setSendSuccess(false), 3000);
    }, 1500);
  };

  const handleWhatsAppShare = () => {
    const inv = selectedInvoice;
    if (!inv) return;

    let phone = selectedParty?.phone;
    if (!phone) {
        const manual = prompt("Enter customer WhatsApp number (e.g. 9876543210):");
        if (!manual) return;
        phone = manual;
    }

    // Format phone: remove non-digits, default to 91 if 10 digits
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const businessName = user?.businessName || 'Our Business';
    const message = `*INVOICE: ${inv.invoiceNo}*\n\n` +
      `Hello ${inv.customerName},\n` +
      `Please find your invoice details below:\n\n` +
      `📅 Date: ${inv.date}\n` +
      `📦 Items: ${inv.items.length}\n` +
      `💰 *Total Amount: ₹ ${inv.total.toFixed(2)}*\n` +
      `Status: ${inv.status}\n\n` +
      `Regards,\n${businessName}`;

    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // Reconstruct state for preview (optional if reusing preview component differently)
    setCustomer(invoice.customerName);
    setInvoiceNo(invoice.invoiceNo);
    setDate(invoice.date);
    setItems(invoice.items);
    setPaymentStatus(invoice.status as 'Paid' | 'Pending');
    setTaxRate(invoice.taxRate ?? 18);
    setView('preview');
  };

  const toggleStatus = (inv: Invoice) => {
     if (onUpdateStatus) {
        const newStatus = inv.status === 'Paid' ? 'Pending' : 'Paid';
        if (confirm(`Change status of ${inv.invoiceNo} to ${newStatus}? This will adjust the customer's balance.`)) {
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
          <h1 className="text-2xl font-bold text-gray-800">Sales Invoices</h1>
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
                  <ArrowUpRight className="w-4 h-4" /> Total Sales
              </div>
              <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex flex-col justify-between h-28 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium z-10">
                  <Wallet className="w-4 h-4" /> Paid Sales
              </div>
              <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          </div>

          <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 flex flex-col justify-between h-28 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-orange-600 text-sm font-medium z-10">
                  <ArrowDownLeft className="w-4 h-4" /> Unpaid / Pending
              </div>
              <div className="text-2xl font-bold text-gray-800 z-10">₹ {totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 min-w-[200px] md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search by Customer or Invoice No..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               {/* Status Filter */}
               <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                 >
                   <option value="All">All Status</option>
                   <option value="Paid">Paid</option>
                   <option value="Pending">Pending</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
               </div>

               <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 text-sm">
                   <Calendar className="w-4 h-4" /> All Time
               </button>
           </div>
           <button 
             onClick={handleStartCreate}
             className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2"
           >
               <Plus className="w-4 h-4" /> Create Sales Invoice
           </button>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                    <tr>
                       <th className="px-6 py-4 w-32">Date</th>
                       <th className="px-6 py-4">Invoice No</th>
                       <th className="px-6 py-4">Customer Name</th>
                       <th className="px-6 py-4 text-right">Amount</th>
                       <th className="px-6 py-4 text-center">Status</th>
                       <th className="px-4 py-4 w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv, index) => (
                        <tr key={inv.id} className={`group hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                           <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                           <td className="px-6 py-4 text-gray-500">{inv.invoiceNo}</td>
                           <td className="px-6 py-4 font-medium text-gray-800">{inv.customerName}</td>
                           <td className="px-6 py-4 text-right font-medium">₹ {inv.total.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => toggleStatus(inv)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center justify-center gap-1.5 mx-auto transition-all w-28 shadow-sm ${
                                  inv.status === 'Paid' 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 hover:border-emerald-300' 
                                  : inv.status === 'Overdue'
                                    ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 hover:border-red-300'
                                    : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 hover:border-amber-300'
                                }`}
                                title="Click to toggle status"
                              >
                                  {inv.status === 'Paid' ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Paid</span>
                                    </>
                                  ) : inv.status === 'Overdue' ? (
                                    <>
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Overdue</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Pending</span>
                                    </>
                                  )}
                              </button>
                           </td>
                           <td className="px-4 py-4 text-center">
                               <button 
                                  onClick={() => handleViewInvoice(inv)}
                                  className="text-teal-600 hover:text-teal-800 p-1 rounded-full hover:bg-teal-50 transition-colors tooltip"
                                  title="View & Print Bill"
                               >
                                   <Eye className="w-4 h-4" />
                               </button>
                           </td>
                        </tr>
                    ))}
                    {filteredInvoices.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-12 text-gray-400">
                                No sales invoices found matching filters.
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

  // --- CREATE / EDIT / PREVIEW VIEW ---
  return (
    <div className="space-y-6">
      {/* Toast Notification - Hidden in Print */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-5 print:hidden">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Invoice Saved & Stock Updated!</span>
        </div>
      )}
      
      {sendSuccess && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-5 print:hidden">
          <Mail className="w-5 h-5" />
          <span className="font-medium">Invoice Sent Successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
           <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
             <ChevronLeft className="w-5 h-5 text-gray-600" />
           </button>
           <h1 className="text-2xl font-bold text-gray-800">{view === 'edit' ? 'Create Sales Invoice' : 'Invoice Preview'}</h1>
           {view === 'preview' && (
             <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-100">INV #{invoiceNo}</span>
           )}
        </div>
        <div className="flex gap-2">
           {view === 'edit' ? (
             <button 
                onClick={() => setView('preview')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm"
             >
                <FileText className="w-4 h-4" /> Preview
             </button>
           ) : (
             <div className="flex gap-2">
               <button 
                  onClick={handleWhatsAppShare}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium transition-colors shadow-sm"
                  title="Share on WhatsApp"
               >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
               </button>
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
                  <Printer className="w-4 h-4" /> Print Invoice
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
                   <label className="text-sm font-medium text-gray-700">Customer Name</label>
                   <input 
                     list="customer-list"
                     type="text" 
                     className="w-full border border-teal-200 bg-teal-50/50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder-teal-400 text-teal-900 font-medium"
                     placeholder="Search or add customer"
                     value={customer}
                     onChange={(e) => setCustomer(e.target.value)}
                   />
                   <datalist id="customer-list">
                      {parties.filter(p => p.type === 'Customer' || p.type === 'Supplier').map(party => (
                        <option key={party.id} value={party.name}>{party.phone}</option>
                      ))}
                   </datalist>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Invoice Date</label>
                   <input 
                     type="date" 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                   />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Items & Description</h2>
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
                         list={`products-list-${index}`}
                         type="text" 
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                         placeholder="Product name"
                         value={item.productName}
                         onChange={(e) => updateItem(index, 'productName', e.target.value)}
                       />
                       <datalist id={`products-list-${index}`}>
                          {products.map(p => (
                             <option key={p.id} value={p.name}>Stock: {p.stock} | ₹{p.price}</option>
                          ))}
                       </datalist>
                     </div>
                     <div className="col-span-2">
                       <input 
                         type="number" 
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                         value={item.quantity}
                         min="1"
                         onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                       />
                     </div>
                     <div className="col-span-2">
                       <input 
                         type="number" 
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
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
                   className="w-full py-3 border-2 border-dashed border-teal-200 rounded-lg text-teal-600 font-medium hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                 >
                   <Plus className="w-4 h-4" /> Add Item
                 </button>
               </div>
            </div>
          </div>

          {/* Summary / Save Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
               <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Payment Details</h2>
               <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                 <div className="flex justify-between text-gray-600">
                   <span>Subtotal</span>
                   <span>₹{subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-600">
                   <div className="flex items-center gap-2">
                      <span>GST (%)</span>
                      <input 
                        type="number" 
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-12 border border-gray-300 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                   </div>
                   <span>₹{tax.toFixed(2)}</span>
                 </div>
               </div>
               <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-6">
                 <span>Total Amount</span>
                 <span>₹{total.toFixed(2)}</span>
               </div>
               
               <div className="mb-6">
                   <label className="text-sm font-medium text-gray-700 block mb-2">Payment Status</label>
                   <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setPaymentStatus('Paid')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentStatus === 'Paid' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Paid
                      </button>
                      <button 
                        onClick={() => setPaymentStatus('Pending')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentStatus === 'Pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Pending
                      </button>
                   </div>
               </div>

               <div className="space-y-2">
                 <button 
                    onClick={() => handleSaveAndGenerate(false)}
                    className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all flex justify-center items-center gap-2"
                 >
                    <Send className="w-4 h-4" /> Save & Generate
                 </button>
                 <div className="flex gap-2">
                   <button 
                      onClick={() => handleSaveAndGenerate(true)}
                      className="flex-1 bg-white border border-teal-600 text-teal-700 py-3 rounded-lg font-medium hover:bg-teal-50 transition-all flex justify-center items-center gap-2"
                   >
                      <Printer className="w-4 h-4" /> Save & Print
                   </button>
                   <button 
                      onClick={handleSaveAndSend}
                      disabled={isSending}
                      className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-100 transition-all flex justify-center items-center gap-2"
                   >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} 
                      {isSending ? 'Sending' : 'Send'}
                   </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview & Print Template */
        <div className="flex justify-center animate-in zoom-in-95 duration-300 print:block">
           <div className="bg-white shadow-2xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 print:shadow-none print:w-full print:max-w-none print:p-0">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">TAX INVOICE</h1>
                    <div className="text-sm text-gray-600 space-y-1">
                       <p className="font-bold text-lg text-gray-800 uppercase">{user?.businessName || 'Your Business Name'}</p>
                       <p className="font-medium">Owner: {user?.name}</p>
                       <p className="whitespace-pre-line">{user?.address || 'Your Business Address'}</p>
                       <p>GSTIN: <span className="font-semibold">{user?.gstin || '----------------'}</span></p>
                       <p>Phone: {user?.phone}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200 mb-4 ml-auto">
                       <BrandLogo className="w-16 h-16" variant="color" />
                    </div>
                 </div>
              </div>

              {/* Bill To & Invoice Details */}
              <div className="flex justify-between mb-8">
                 <div className="w-1/2">
                    <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">Bill To</h3>
                    <p className="font-bold text-lg text-gray-900">{customer || 'Customer Name'}</p>
                    {selectedParty && (
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        {selectedParty.address && <p className="whitespace-pre-line">{selectedParty.address}</p>}
                        {selectedParty.gstin && <p>GSTIN: <span className="font-semibold">{selectedParty.gstin}</span></p>}
                        <p>Phone: {selectedParty.phone}</p>
                      </div>
                    )}
                 </div>
                 <div className="text-right space-y-2">
                    <div className="flex gap-8 justify-between">
                       <span className="text-gray-500 font-medium text-sm">Invoice No:</span>
                       <span className="font-bold text-gray-900">{invoiceNo}</span>
                    </div>
                    <div className="flex gap-8 justify-between">
                       <span className="text-gray-500 font-medium text-sm">Date:</span>
                       <span className="font-bold text-gray-900">{date}</span>
                    </div>
                    <div className="flex gap-8 justify-between">
                       <span className="text-gray-500 font-medium text-sm">Due Date:</span>
                       <span className="font-bold text-gray-900">{date}</span>
                    </div>
                    <div className="flex gap-8 justify-between">
                       <span className="text-gray-500 font-medium text-sm">Status:</span>
                       <span className={`font-bold ${paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-500'}`}>{paymentStatus}</span>
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
                    <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                       <span>Sub Total</span>
                       <span>₹ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                       <span>CGST ({(taxRate / 2).toFixed(1)}%)</span>
                       <span>₹ {(tax/2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2">
                       <span>SGST ({(taxRate / 2).toFixed(1)}%)</span>
                       <span>₹ {(tax/2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                       <span>Grand Total</span>
                       <span>₹ {total.toFixed(2)}</span>
                    </div>
                 </div>
              </div>

              {/* Terms & Signature */}
              <div className="grid grid-cols-2 gap-8 mt-auto">
                 <div>
                    <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Terms & Conditions</h4>
                    <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                       <li>Goods once sold will not be taken back.</li>
                       <li>Interest @18% p.a. will be charged if bill is not paid within due date.</li>
                       <li>Subject to Chennai Jurisdiction only.</li>
                    </ul>
                 </div>
                 <div className="text-right flex flex-col items-end justify-end">
                    <div className="h-16"></div>
                    <div className="border-t border-gray-400 w-48 pt-2 text-center text-xs font-bold text-gray-700">
                       Authorized Signatory
                    </div>
                 </div>
              </div>
              
              <div className="text-center text-xs text-gray-400 mt-12 pt-6 border-t border-gray-100">
                 Generated via BillFlow AI
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
