import React, { useState, useEffect } from 'react';
import { InvoiceItem, Party, Product, User, Invoice } from '../types';
import { Plus, Trash2, FileText, Printer, Send, ChevronLeft, CheckCircle2, Search, Calendar, Eye, ArrowUpRight, ArrowDownLeft, Wallet, Filter, ChevronDown, Mail, Loader2, Clock, AlertCircle, MessageCircle, ScanBarcode, Receipt } from 'lucide-react';
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
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');

  useEffect(() => {
    if (initialData) {
       setView('edit');
       setCustomer(initialData.customerName || '');
       setItems(initialData.items || []);
       setTaxRate(initialData.taxRate || 18);
    }
  }, [initialData]);

  const totalSales = existingInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = existingInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = existingInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);
  
  const filteredInvoices = existingInvoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNo.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, price: 0, total: 0 }]);
  };

  const handleScan = (code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
       const existingIndex = items.findIndex(i => i.productId === product.id);
       if (existingIndex >= 0) {
          updateItem(existingIndex, 'quantity', items[existingIndex].quantity + 1);
          setScanMessage(`Updated ${product.name}`);
       } else {
          setItems(prev => [...prev, { productId: product.id, productName: product.name, quantity: 1, price: product.price, total: product.price }]);
          setScanMessage(`Added ${product.name}`);
       }
       setTimeout(() => setScanMessage(null), 2000);
    } else {
       setScanMessage(`Not found: ${code}`);
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
      }
    } else {
      // @ts-ignore
      newItems[index][field] = value;
    }
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleSaveAndGenerate = (shouldPrint = false) => {
    if (!customer || items.length === 0) return;
    const inv: Invoice = { id: Date.now().toString(), invoiceNo, date, customerName: customer, items, subtotal, tax, taxRate, total, status: paymentStatus };
    onSaveInvoice(inv);
    setSelectedInvoice(inv);
    setShowSaveSuccess(true);
    if (shouldPrint) setAutoPrint(true);
    setTimeout(() => { setShowSaveSuccess(false); setView('preview'); }, shouldPrint ? 500 : 1000); 
  };

  if (view === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Register</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Manage your billing history and transactions.</p>
          </div>
          <button 
            onClick={() => { setCustomer(''); setItems([]); setView('edit'); }}
            className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-bold shadow-premium hover:bg-brand-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Bill
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Total Revenue', amount: totalSales, color: 'brand', icon: Wallet },
             { label: 'Collected', amount: totalPaid, color: 'emerald', icon: CheckCircle2 },
             { label: 'Outstanding', amount: totalUnpaid, color: 'orange', icon: Clock }
           ].map(stat => (
             <div key={stat.label} className="bg-white p-6 rounded-[24px] shadow-premium border border-slate-100 flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                   <stat.icon className="w-7 h-7" />
                </div>
                <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className="text-2xl font-black text-slate-900">₹ {stat.amount.toLocaleString()}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="bg-white rounded-[24px] shadow-premium border border-slate-100 overflow-hidden">
           <div className="p-6 border-b border-slate-50 flex items-center gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input type="text" placeholder="Search by party or invoice number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-900" />
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                    <tr>
                       <th className="px-8 py-5">Invoice</th>
                       <th className="px-8 py-5">Customer</th>
                       <th className="px-8 py-5 text-right">Amount</th>
                       <th className="px-8 py-5 text-center">Status</th>
                       <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredInvoices.map(inv => (
                       <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                             <div className="text-sm font-black text-slate-900">{inv.invoiceNo}</div>
                             <div className="text-[10px] text-slate-400 font-bold">{inv.date}</div>
                          </td>
                          <td className="px-8 py-5 font-bold text-slate-800">{inv.customerName}</td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">₹ {inv.total.toLocaleString()}</td>
                          <td className="px-8 py-5 text-center">
                             <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                {inv.status}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button onClick={() => { setSelectedInvoice(inv); setView('preview'); }} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"><Eye className="w-5 h-5"/></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
           <button onClick={() => setView('list')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <h1 className="text-3xl font-black text-slate-900">{view === 'edit' ? 'Create New Bill' : 'Review Invoice'}</h1>
        </div>
        <div className="flex gap-4">
           {view === 'edit' ? (
             <button onClick={() => handleSaveAndGenerate(false)} className="bg-brand-600 text-white px-8 py-3 rounded-2xl font-black shadow-premium hover:bg-brand-700 transition-all active:scale-95">Save & Preview</button>
           ) : (
             <div className="flex gap-3">
                <button onClick={() => setPrintFormat(printFormat === 'a4' ? 'thermal' : 'a4')} className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
                   {printFormat === 'a4' ? <Receipt className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                   Switch Format
                </button>
                <button onClick={() => window.print()} className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-brand-700 transition-all flex items-center gap-2 shadow-premium">
                   <Printer className="w-5 h-5"/> Print
                </button>
             </div>
           )}
        </div>
      </div>

      {view === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 space-y-8">
              <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-100">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Billing Details</h2>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Customer Name</label>
                       <input list="cust-list" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Search or Enter Name" className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                       <datalist id="cust-list">{parties.map(p => <option key={p.id} value={p.name} />)}</datalist>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Bill Date</label>
                       <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-100">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Items</h2>
                    <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 text-xs font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-all"><ScanBarcode className="w-4 h-4"/> Scan Mode</button>
                 </div>
                 <div className="space-y-4">
                    {items.map((item, idx) => (
                       <div key={idx} className="grid grid-cols-12 gap-4 items-center animate-in fade-in zoom-in-95 duration-200">
                          <div className="col-span-5">
                             <input list="prod-list" value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="Item Description" className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-sm" />
                          </div>
                          <div className="col-span-2">
                             <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-sm text-center" />
                          </div>
                          <div className="col-span-2">
                             <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))} className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-sm text-center" />
                          </div>
                          <div className="col-span-2 text-right font-black text-slate-900">₹ {item.total.toFixed(0)}</div>
                          <div className="col-span-1 flex justify-end">
                             <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                    ))}
                    <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">+ Add Line Item</button>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-100 sticky top-10 space-y-8">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary</h2>
                 <div className="space-y-4">
                    <div className="flex justify-between text-slate-500 font-bold text-sm"><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500 font-bold text-sm"><span>Tax ({taxRate}%)</span><span className="text-red-500">+ ₹ {tax.toFixed(2)}</span></div>
                 </div>
                 <div className="flex justify-between items-baseline pt-6 border-t border-slate-50">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Payable</span>
                    <span className="text-4xl font-black text-slate-950">₹ {total.toFixed(0)}</span>
                 </div>
                 <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                       <button onClick={() => setPaymentStatus('Paid')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${paymentStatus === 'Paid' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>Paid</button>
                       <button onClick={() => setPaymentStatus('Pending')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${paymentStatus === 'Pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Pending</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* Preview with Modern Aesthetic */
        <div className="flex justify-center pb-20 print:p-0 animate-in zoom-in-95 duration-300">
           {printFormat === 'a4' ? (
             <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-16 shadow-2xl print:shadow-none relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-600 print:hidden"></div>
                <div className="flex justify-between items-start mb-16">
                   <div>
                      <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight mb-2">{user?.businessName || 'Your Business'}</h1>
                      <div className="text-sm text-slate-500 space-y-1">
                         <p className="max-w-xs">{user?.address}</p>
                         <p className="font-bold text-slate-900">GSTIN: {user?.gstin}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div className="mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
                            <p className="text-xl font-black text-slate-950">{invoiceNo}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Date</p>
                            <p className="font-bold text-slate-800">{date}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mb-12">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                   <p className="text-xl font-black text-slate-950 mb-1">{customer}</p>
                   {selectedInvoice?.customerName && parties.find(p => p.name === customer) && (
                     <div className="text-sm text-slate-500">
                        {parties.find(p => p.name === customer)?.address}
                     </div>
                   )}
                </div>

                <table className="w-full mb-12">
                   <thead>
                      <tr className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                         <th className="py-4 px-6 text-left rounded-l-2xl">Item</th>
                         <th className="py-4 px-6 text-right">Qty</th>
                         <th className="py-4 px-6 text-right">Price</th>
                         <th className="py-4 px-6 text-right rounded-r-2xl">Total</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                      {items.map((item, idx) => (
                         <tr key={idx}>
                            <td className="py-5 px-6 font-bold text-slate-800">{item.productName}</td>
                            <td className="py-5 px-6 text-right font-medium text-slate-500">{item.quantity}</td>
                            <td className="py-5 px-6 text-right font-medium text-slate-500">₹ {item.price.toFixed(2)}</td>
                            <td className="py-5 px-6 text-right font-black text-slate-950">₹ {item.total.toFixed(2)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                <div className="flex justify-end">
                   <div className="w-64 space-y-4">
                      <div className="flex justify-between text-sm font-bold text-slate-500"><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm font-bold text-slate-500"><span>GST ({taxRate}%)</span><span>₹ {tax.toFixed(2)}</span></div>
                      <div className="flex justify-between text-2xl font-black text-slate-950 border-t border-slate-100 pt-4"><span>Total</span><span>₹ {total.toFixed(0)}</span></div>
                   </div>
                </div>

                <div className="mt-32 border-t border-slate-100 pt-8 flex justify-between items-end">
                   <div className="text-[10px] text-slate-400 max-w-xs space-y-2">
                      <p className="font-bold uppercase tracking-widest text-slate-500">Terms & Conditions</p>
                      <p>Payment is due within 7 days. Late payments may incur charges. This is a computer generated invoice.</p>
                   </div>
                   <div className="text-right">
                      {user?.signatureUrl && <img src={user.signatureUrl} className="h-16 ml-auto mb-2 grayscale opacity-80" />}
                      <div className="border-t-2 border-slate-900 pt-2 w-48 ml-auto">
                         <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             /* Thermal Layout */
             <div className="bg-white w-[80mm] p-6 text-slate-900 font-mono text-[10px] shadow-xl print:shadow-none">
                <div className="text-center mb-6 space-y-1">
                   <h2 className="text-sm font-black uppercase">{user?.businessName}</h2>
                   <p>{user?.address}</p>
                   <p>Ph: {user?.phone}</p>
                </div>
                <div className="border-y border-dashed border-slate-300 py-2 mb-4 text-center font-bold">SALE VOUCHER</div>
                <div className="flex justify-between mb-4">
                   <span>#{invoiceNo}</span>
                   <span>{date}</span>
                </div>
                <div className="space-y-2 mb-4">
                   {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between gap-4">
                         <span className="flex-1 truncate uppercase">{item.productName}</span>
                         <span className="whitespace-nowrap">{item.quantity} x {item.price}</span>
                      </div>
                   ))}
                </div>
                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                   <div className="flex justify-between"><span>Sub:</span><span>{subtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 mt-1"><span>TOTAL:</span><span>{total.toFixed(2)}</span></div>
                </div>
                <div className="text-center mt-8 space-y-1 opacity-60">
                   <p>THANK YOU!</p>
                   <p>Visit Again</p>
                </div>
             </div>
           )}
        </div>
      )}
      <datalist id="prod-list">{products.map(p => <option key={p.id} value={p.name}>₹{p.price}</option>)}</datalist>
    </div>
  );
};