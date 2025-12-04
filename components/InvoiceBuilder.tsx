import React, { useState, useEffect } from 'react';
import { InvoiceItem, Party, Product, User, Invoice } from '../types';
import { Plus, Trash2, FileText, Printer, Send, ChevronLeft, CheckCircle2, Download, Search, Calendar, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Filter, ChevronDown, Mail, Loader2, RefreshCw, Clock, AlertCircle, MessageCircle, ScanBarcode, Receipt, Settings, Edit3 } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BarcodeScanner } from './BarcodeScanner';

interface InvoiceBuilderProps {
  parties?: Party[];
  products: Product[];
  existingInvoices?: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateStatus?: (invoice: Invoice, newStatus: 'Paid' | 'Pending') => void;
  onDeleteInvoice?: (id: string) => void;
  user?: User | null;
  initialData?: Partial<Invoice> | null;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ parties = [], products = [], existingInvoices = [], onSaveInvoice, onUpdateStatus, onDeleteInvoice, user, initialData }) => {
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
  
  // Print Format State
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  
  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // List View State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
       setView('edit');
       setCustomer(initialData.customerName || '');
       setItems(initialData.items || []);
       setTaxRate(initialData.taxRate || 18);
    }
  }, [initialData]);

  // Handle Ctrl+S for Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (view === 'edit') {
           handleSaveAndGenerate(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, customer, items, paymentStatus]);

  // Find Selected Party Details
  const selectedParty = parties.find(p => p.name === customer);

  // Summary Calculations
  const totalSales = existingInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = existingInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = existingInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);
  
  const filteredInvoices = existingInvoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoiceNo.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addItem = () => {
    setItems([...items, {
      productId: '', 
      productName: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const handleScan = (code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
       // Check if item already exists
       const existingIndex = items.findIndex(i => i.productId === product.id);
       
       if (existingIndex >= 0) {
          // Increment Qty
          updateItem(existingIndex, 'quantity', items[existingIndex].quantity + 1);
          setScanMessage(`Updated qty for ${product.name}`);
       } else {
          // Add new item
          const newItem: InvoiceItem = {
             productId: product.id,
             productName: product.name,
             quantity: 1,
             price: product.price,
             total: product.price
          };
          setItems(prev => [...prev, newItem]);
          setScanMessage(`Added ${product.name}`);
       }
       // Clear message after 2s
       setTimeout(() => setScanMessage(null), 2000);
    } else {
       setScanMessage(`Product not found for code: ${code}`);
       setTimeout(() => setScanMessage(null), 3000);
    }
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

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleStartCreate = () => {
    setCustomer('');
    setDate(new Date().toISOString().split('T')[0]);
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    setItems([]);
    setPaymentStatus('Paid');
    setTaxRate(18);
    setView('edit');
    setPrintFormat('a4');
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

    let emailToUse = selectedParty?.email;
    if (!emailToUse) {
       const manualEmail = prompt(`No email found for ${customer}. Please enter email address to send invoice:`);
       if (!manualEmail) return;
       emailToUse = manualEmail;
    }

    onSaveInvoice(newInvoice);
    setSelectedInvoice(newInvoice);
    
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Invoices</h1>
            <p className="text-gray-500 text-sm mt-1">Manage all your billing and transactions</p>
          </div>
          <div className="flex gap-3">
              <button 
                onClick={handleStartCreate}
                className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 group"
              >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Create New Invoice
              </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-2xl p-5 border border-brand-100/60 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-brand-700 text-sm font-semibold z-10">
                  <ArrowUpRight className="w-4 h-4" /> Total Sales Revenue
              </div>
              <div className="text-3xl font-bold text-gray-900 z-10">₹ {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-200/40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-100/60 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold z-10">
                  <Wallet className="w-4 h-4" /> Collected (Paid)
              </div>
              <div className="text-3xl font-bold text-gray-900 z-10">₹ {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-100/60 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold z-10">
                  <ArrowDownLeft className="w-4 h-4" /> Pending / Due
              </div>
              <div className="text-3xl font-bold text-gray-900 z-10">₹ {totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-200/40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex flex-wrap items-center gap-3 w-full">
               <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search by Customer or Invoice No..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="relative min-w-[140px]">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer font-medium"
                 >
                   <option value="All">All Status</option>
                   <option value="Paid">Paid</option>
                   <option value="Pending">Pending</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
               </div>
           </div>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-200">
                    <tr>
                       <th className="px-6 py-4 w-32">Date</th>
                       <th className="px-6 py-4">Invoice No</th>
                       <th className="px-6 py-4">Customer Name</th>
                       <th className="px-6 py-4 text-right">Amount</th>
                       <th className="px-6 py-4 text-center">Status</th>
                       <th className="px-4 py-4 w-24 text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv, index) => (
                        <tr key={inv.id} className="group hover:bg-gray-50/80 transition-colors">
                           <td className="px-6 py-4 text-gray-600 font-medium">{inv.date}</td>
                           <td className="px-6 py-4">
                              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">{inv.invoiceNo}</span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{inv.customerName}</div>
                           </td>
                           <td className="px-6 py-4 text-right font-bold text-gray-900">₹ {inv.total.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => toggleStatus(inv)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center justify-center gap-1.5 mx-auto transition-all w-28 shadow-sm ${
                                  inv.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : inv.status === 'Overdue'
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                  {inv.status === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                  <span>{inv.status}</span>
                              </button>
                           </td>
                           <td className="px-4 py-4 text-center">
                               <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button 
                                      onClick={() => handleViewInvoice(inv)}
                                      className="text-gray-500 hover:text-brand-600 p-2 hover:bg-brand-50 rounded-lg transition-colors"
                                      title="View"
                                  >
                                      <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                      onClick={() => onDeleteInvoice && onDeleteInvoice(inv.id)}
                                      className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                           </td>
                        </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           {filteredInvoices.length === 0 && (
             <div className="p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No invoices found matching your criteria.</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  // --- CREATE / EDIT / PREVIEW VIEW ---
  return (
    <div className="space-y-6">
      {/* Scanner Overlay */}
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* Toast Notification */}
      {showSaveSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-top-5 print:hidden border border-emerald-500">
          <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
             <h4 className="font-bold text-sm">Success!</h4>
             <p className="text-xs text-emerald-100">Invoice saved & stock updated.</p>
          </div>
        </div>
      )}
      
      {/* Scan Feedback Toast */}
      {scanMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-in fade-in zoom-in-95 print:hidden">
          {scanMessage.includes('found') ? <AlertCircle className="w-4 h-4 text-red-400"/> : <CheckCircle2 className="w-4 h-4 text-emerald-400"/>}
          <span className="font-medium text-sm">{scanMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
           <button onClick={() => setView('list')} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all border border-transparent hover:border-gray-200">
             <ChevronLeft className="w-5 h-5 text-gray-600" />
           </button>
           <div>
             <h1 className="text-2xl font-bold text-gray-900">{view === 'edit' ? 'New Invoice' : 'Preview'}</h1>
             {view === 'preview' && <p className="text-xs text-brand-600 font-mono font-medium mt-0.5">#{invoiceNo}</p>}
           </div>
        </div>
        <div className="flex gap-3">
           {view === 'edit' ? (
             <button 
                onClick={() => setView('preview')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm"
             >
                <FileText className="w-4 h-4" /> Preview
             </button>
           ) : (
             <div className="flex gap-3 items-center">
               {/* Format Toggle Buttons */}
               <div className="bg-gray-200/50 p-1 rounded-lg flex mr-2">
                 <button 
                    onClick={() => setPrintFormat('a4')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${printFormat === 'a4' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <FileText className="w-3.5 h-3.5" /> A4
                 </button>
                 <button 
                    onClick={() => setPrintFormat('thermal')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${printFormat === 'thermal' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    <Receipt className="w-3.5 h-3.5" /> Thermal
                 </button>
               </div>

               <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 font-semibold transition-colors shadow-sm">
                  <MessageCircle className="w-4 h-4" />
               </button>
               <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold transition-colors shadow-lg shadow-brand-500/30">
                  <Printer className="w-4 h-4" /> Print
               </button>
             </div>
           )}
        </div>
      </div>

      {view === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-6 tracking-wider flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-brand-500"></div> Bill To
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-gray-700">Customer Name</label>
                   <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                     <input 
                       list="customer-list"
                       type="text" 
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 font-medium"
                       placeholder="Search or add customer..."
                       value={customer}
                       onChange={(e) => setCustomer(e.target.value)}
                     />
                   </div>
                   <datalist id="customer-list">
                      {parties.filter(p => p.type === 'Customer' || p.type === 'Supplier').map(party => (
                        <option key={party.id} value={party.name}>{party.phone}</option>
                      ))}
                   </datalist>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-gray-700">Invoice Date</label>
                   <div className="relative group">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                     <input 
                       type="date" 
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
                       value={date}
                       onChange={(e) => setDate(e.target.value)}
                     />
                   </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Items & Details
                  </h2>
                  <button 
                    onClick={() => setShowScanner(true)}
                    className="text-xs flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-colors font-semibold border border-indigo-200"
                  >
                     <ScanBarcode className="w-3.5 h-3.5" />
                     Scan
                  </button>
               </div>
               
               <div className="space-y-3">
                 <div className="grid grid-cols-12 gap-3 text-xs font-bold text-gray-400 uppercase px-2 mb-2">
                   <div className="col-span-5">Product</div>
                   <div className="col-span-2">Qty</div>
                   <div className="col-span-2">Rate</div>
                   <div className="col-span-2">Total</div>
                   <div className="col-span-1"></div>
                 </div>
                 
                 {items.map((item, index) => (
                   <div key={index} className="grid grid-cols-12 gap-3 items-center group relative">
                     <div className="col-span-5">
                       <input 
                         list={`products-list-${index}`}
                         type="text" 
                         className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm font-medium bg-gray-50/50 focus:bg-white transition-all"
                         placeholder="Item Name"
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
                         className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-gray-50/50 focus:bg-white transition-all"
                         value={item.quantity}
                         min="1"
                         onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                       />
                     </div>
                     <div className="col-span-2">
                       <input 
                         type="number" 
                         className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-gray-50/50 focus:bg-white transition-all"
                         value={item.price}
                         min="0"
                         onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                       />
                     </div>
                     <div className="col-span-2 text-gray-900 font-bold text-sm px-2">
                       ₹{item.total.toFixed(2)}
                     </div>
                     <div className="col-span-1 flex justify-center">
                       <button onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}

                 <button 
                   onClick={addItem}
                   className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all flex items-center justify-center gap-2 mt-4"
                 >
                   <Plus className="w-4 h-4" /> Add Line Item
                 </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 sticky top-6">
               <h2 className="text-sm font-bold text-gray-400 uppercase mb-6 tracking-wider">Summary</h2>
               
               <div className="space-y-4 text-sm border-b border-gray-100 pb-6 mb-6">
                 <div className="flex justify-between text-gray-600">
                   <span>Subtotal</span>
                   <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-600">
                   <div className="flex items-center gap-2">
                      <span>GST</span>
                      <div className="relative">
                        <input 
                            type="number" 
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            className="w-12 bg-gray-100 border-none rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-bold text-center"
                        />
                        <span className="absolute -right-3 top-0.5 text-xs text-gray-400">%</span>
                      </div>
                   </div>
                   <span className="font-medium text-red-500">+ ₹ {tax.toFixed(2)}</span>
                 </div>
               </div>
               
               <div className="flex justify-between items-baseline mb-8">
                 <span className="text-gray-500 font-medium">Grand Total</span>
                 <span className="text-3xl font-extrabold text-gray-900">₹ {total.toFixed(2)}</span>
               </div>
               
               <div className="mb-8">
                   <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Payment Status</label>
                   <div className="flex p-1 bg-gray-100 rounded-xl">
                      <button 
                        onClick={() => setPaymentStatus('Paid')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentStatus === 'Paid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Paid
                      </button>
                      <button 
                        onClick={() => setPaymentStatus('Pending')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentStatus === 'Pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Pending
                      </button>
                   </div>
               </div>

               <div className="space-y-3">
                 <button 
                    onClick={() => handleSaveAndGenerate(false)}
                    className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all flex justify-center items-center gap-2 group active:scale-[0.98]"
                 >
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Save Invoice
                 </button>
                 <div className="flex gap-3">
                   <button 
                      onClick={() => handleSaveAndGenerate(true)}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex justify-center items-center gap-2"
                   >
                      <Printer className="w-4 h-4" /> Print
                   </button>
                   <button 
                      onClick={handleSaveAndSend}
                      disabled={isSending}
                      className="flex-1 bg-blue-50 border border-blue-100 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-100 transition-all flex justify-center items-center gap-2"
                   >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} 
                      Email
                   </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Template (A4 or Thermal) */
        <div className="flex justify-center animate-in zoom-in-95 duration-300 print:block">
           {printFormat === 'a4' ? (
             /* STANDARD A4 LAYOUT */
             <div className="bg-white shadow-2xl rounded-none w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 print:shadow-none print:w-full print:max-w-none print:p-0 relative">
                {/* Decorative Strip */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-emerald-500 print:hidden"></div>

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                   <div>
                      <div className="flex items-center gap-3 mb-4">
                        {user?.logoUrl ? (
                            <img src={user.logoUrl} alt="Logo" className="h-16 object-contain" />
                        ) : (
                            <div className="w-12 h-12 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                                <BrandLogo className="w-8 h-8" variant="white" />
                            </div>
                        )}
                        <div>
                           <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">{user?.businessName || 'Your Business'}</h1>
                           <p className="text-gray-500 text-sm">Tax Invoice</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1 pl-1">
                         <p className="whitespace-pre-line max-w-xs leading-relaxed">{user?.address || 'Your Business Address'}</p>
                         <p className="pt-2">GSTIN: <span className="font-semibold text-gray-900">{user?.gstin || '----------------'}</span></p>
                         <p>Phone: <span className="font-semibold text-gray-900">{user?.phone}</span></p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                         <div className="mb-4">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Invoice No</span>
                            <span className="text-xl font-bold text-gray-900">{invoiceNo}</span>
                         </div>
                         <div>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Date</span>
                            <span className="font-medium text-gray-900">{date}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Bill To Details */}
                <div className="mb-10 pl-2 border-l-4 border-brand-500">
                   <h3 className="text-brand-600 font-bold uppercase text-xs mb-2 tracking-wider">Bill To</h3>
                   <p className="font-bold text-xl text-gray-900 mb-1">{customer || 'Customer Name'}</p>
                   {selectedParty && (
                     <div className="text-sm text-gray-600 space-y-1">
                       {selectedParty.address && <p className="whitespace-pre-line">{selectedParty.address}</p>}
                       {selectedParty.gstin && <p>GSTIN: <span className="font-semibold">{selectedParty.gstin}</span></p>}
                       <p>Phone: {selectedParty.phone}</p>
                     </div>
                   )}
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                   <thead>
                      <tr className="bg-gray-900 text-white text-xs uppercase tracking-wider">
                         <th className="py-3 px-4 text-left rounded-l-lg">#</th>
                         <th className="py-3 px-4 text-left">Item Description</th>
                         <th className="py-3 px-4 text-right">Qty</th>
                         <th className="py-3 px-4 text-right">Rate</th>
                         <th className="py-3 px-4 text-right rounded-r-lg">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm text-gray-700">
                      {items.map((item, idx) => (
                         <tr key={idx} className="border-b border-gray-100">
                            <td className="py-4 px-4 text-gray-400">{idx + 1}</td>
                            <td className="py-4 px-4 font-semibold text-gray-900">{item.productName}</td>
                            <td className="py-4 px-4 text-right">{item.quantity}</td>
                            <td className="py-4 px-4 text-right">{item.price.toFixed(2)}</td>
                            <td className="py-4 px-4 text-right font-bold">₹ {item.total.toFixed(2)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                   <div className="w-1/2 space-y-3">
                      <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-3">
                         <span className="font-medium">Sub Total</span>
                         <span>₹ {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-3">
                         <span>Tax ({taxRate}%)</span>
                         <span>₹ {tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-bold text-brand-700 pt-2">
                         <span>Total</span>
                         <span>₹ {total.toFixed(2)}</span>
                      </div>
                   </div>
                </div>

                {/* Footer Terms & Signature */}
                <div className="grid grid-cols-2 gap-12 mt-auto">
                   <div>
                      <h4 className="font-bold text-xs uppercase text-gray-400 mb-3 tracking-wider">Terms & Conditions</h4>
                      <ul className="text-[10px] text-gray-500 list-disc pl-3 space-y-1.5 leading-relaxed">
                         <li>Goods once sold will not be taken back or exchanged.</li>
                         <li>Payment is due within the stipulated time.</li>
                         <li>Subject to local jurisdiction.</li>
                      </ul>
                   </div>
                   <div className="text-right flex flex-col items-end justify-end">
                      <div className="h-20 flex items-end mb-2">
                         {user?.signatureUrl ? (
                             <img src={user.signatureUrl} alt="Signature" className="h-full object-contain" />
                         ) : null}
                      </div>
                      <div className="border-t-2 border-gray-200 w-48 pt-2 text-center">
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Authorized Signatory</p>
                      </div>
                   </div>
                </div>
                
                {/* Print Footer */}
                <div className="mt-12 text-center text-[10px] text-gray-300 print:text-gray-400">
                    Generated via Bill Flux
                </div>
             </div>
           ) : (
             /* THERMAL RECEIPT LAYOUT */
             <div className="bg-white shadow-2xl w-[80mm] min-h-[100mm] p-4 text-gray-900 font-mono text-xs print:shadow-none print:w-full print:max-w-none print:p-0">
                {/* Header */}
                <div className="text-center mb-4">
                   <h2 className="text-sm font-black uppercase mb-1">{user?.businessName || 'Business Name'}</h2>
                   <p className="text-[10px] leading-tight">{user?.address}</p>
                   <p className="text-[10px] mt-1">Ph: {user?.phone}</p>
                   {user?.gstin && <p className="text-[10px]">GSTIN: {user.gstin}</p>}
                </div>
                
                <div className="border-y border-dashed border-gray-800 py-1 mb-3 text-center">
                   <h3 className="font-bold">TAX INVOICE</h3>
                </div>

                <div className="mb-3 text-[10px] space-y-0.5">
                   <div className="flex justify-between">
                      <span>No: {invoiceNo}</span>
                      <span>{date}</span>
                   </div>
                   <div className="flex justify-between">
                      <span>To: {customer.substring(0, 15)}</span>
                   </div>
                </div>

                <div className="border-b border-gray-800 mb-2"></div>
                
                {/* Items */}
                <div className="mb-2">
                   <div className="flex font-bold mb-1 text-[10px]">
                      <span className="flex-1">Item</span>
                      <span className="w-6 text-right">Qty</span>
                      <span className="w-10 text-right">Rate</span>
                      <span className="w-12 text-right">Amt</span>
                   </div>
                   {items.map((item, idx) => (
                      <div key={idx} className="flex mb-1 items-start">
                         <span className="flex-1 truncate pr-1">{item.productName}</span>
                         <span className="w-6 text-right">{item.quantity}</span>
                         <span className="w-10 text-right">{item.price}</span>
                         <span className="w-12 text-right">{item.total.toFixed(0)}</span>
                      </div>
                   ))}
                </div>

                <div className="border-b border-gray-800 mb-2"></div>

                {/* Totals */}
                <div className="flex justify-between mb-1">
                   <span>Subtotal:</span>
                   <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                   <span>Tax:</span>
                   <span>{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t-2 border-gray-800 pt-1 mt-1">
                   <span>TOTAL:</span>
                   <span>{total.toFixed(2)}</span>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-[10px]">
                   <p className="font-bold">THANK YOU!</p>
                   <p>Visit Again</p>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};