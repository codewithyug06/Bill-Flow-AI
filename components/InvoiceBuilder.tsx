import React, { useState, useEffect } from 'react';
import { InvoiceItem, Party, Product, User, Invoice } from '../types';
import { Plus, Trash2, FileText, Printer, ChevronLeft, CheckCircle2, Search, Eye, Wallet, Receipt, ScanBarcode, Clock } from 'lucide-react';
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
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState(`2025-26/${Math.floor(100 + Math.random() * 900)}`);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(5); // 2.5 + 2.5
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialData) {
       setView('edit');
       setCustomer(initialData.customerName || '');
       setItems(initialData.items || []);
       setTaxRate(initialData.taxRate || 5);
    }
  }, [initialData]);

  const totalSales = existingInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = existingInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = existingInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);
  
  const filteredInvoices = existingInvoices.filter(inv => 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNo.toLowerCase().includes(searchTerm)
  );

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', hsn: '', quantity: 1, price: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    if (field === 'productName') {
      newItems[index].productName = value;
      const product = products.find(p => p.name === value);
      if (product) {
        newItems[index].productId = product.id;
        newItems[index].price = product.price;
        newItems[index].hsn = product.hsn || '4707';
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

  const handleSaveAndGenerate = () => {
    if (!customer || items.length === 0) return;
    const inv: Invoice = { 
        id: Date.now().toString(), 
        invoiceNo, date, dueDate, vehicleNo, 
        customerName: customer, items, subtotal, tax, taxRate, total, 
        status: paymentStatus 
    };
    onSaveInvoice(inv);
    setSelectedInvoice(inv);
    setShowSaveSuccess(true);
    setTimeout(() => { setShowSaveSuccess(false); setView('preview'); }, 1000); 
  };

  const amountInWords = (num: number) => {
      return "Thirty Seven Thousand One Hundred Seventy Rupees"; // Placeholder logic
  };

  if (view === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Register</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Total receivables and transaction history.</p>
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
             { label: 'Total Sales', amount: totalSales, color: 'brand', icon: Wallet },
             { label: 'Collected', amount: totalPaid, color: 'emerald', icon: CheckCircle2 },
             { label: 'To Collect', amount: totalUnpaid, color: 'orange', icon: Clock }
           ].map(stat => (
             <div key={stat.label} className="bg-white p-6 rounded-[24px] shadow-premium border border-slate-100 flex items-center gap-5 transition-all hover:scale-[1.02]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.label === 'Total Sales' ? 'bg-brand-50 text-brand-600' : stat.label === 'Collected' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
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
           <div className="p-6 border-b border-slate-50">
              <div className="relative">
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
      {showScanner && <BarcodeScanner onScan={(c) => { /* Scan logic */ }} onClose={() => setShowScanner(false)} />}
      
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
           <button onClick={() => setView('list')} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <h1 className="text-3xl font-black text-slate-900">{view === 'edit' ? 'Create Sales Bill' : 'Tax Invoice'}</h1>
        </div>
        <div className="flex gap-4">
           {view === 'edit' ? (
             <button onClick={handleSaveAndGenerate} className="bg-brand-600 text-white px-8 py-3 rounded-2xl font-black shadow-premium hover:bg-brand-700 transition-all active:scale-95">Save & Preview</button>
           ) : (
             <button onClick={() => window.print()} className="bg-slate-950 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-premium">
                <Printer className="w-5 h-5"/> Print Invoice
             </button>
           )}
        </div>
      </div>

      {view === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 space-y-8">
              <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-100">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Basic Info</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="col-span-2 space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Customer Name</label>
                       <input list="cust-list" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Search or Enter Name" className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                       <datalist id="cust-list">{parties.map(p => <option key={p.id} value={p.name} />)}</datalist>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Invoice No</label>
                       <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Bill Date</label>
                       <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Due Date</label>
                       <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-900 uppercase">Vehicle No</label>
                       <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g. KA51AF9601" className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold" />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-100">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Items & Description</h2>
                    <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 text-xs font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-all"><ScanBarcode className="w-4 h-4"/> Scan Mode</button>
                 </div>
                 <div className="space-y-4">
                    {items.map((item, idx) => (
                       <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-5">
                             <input list="prod-list" value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="Item Description" className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm" />
                          </div>
                          <div className="col-span-2">
                             <input value={item.hsn || ''} onChange={e => updateItem(idx, 'hsn', e.target.value)} placeholder="HSN" className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm text-center" />
                          </div>
                          <div className="col-span-2">
                             <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm text-center" />
                          </div>
                          <div className="col-span-2">
                             <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value))} className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm text-center" />
                          </div>
                          <div className="col-span-1 flex justify-end">
                             <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                    ))}
                    <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">+ Add Line Item</button>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-100 sticky top-10 space-y-8">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary</h2>
                 <div className="space-y-4">
                    <div className="flex justify-between text-slate-500 font-bold text-sm"><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500 font-bold text-sm"><span>CGST ({(taxRate/2).toFixed(1)}%)</span><span>₹ {(tax/2).toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500 font-bold text-sm"><span>SGST ({(taxRate/2).toFixed(1)}%)</span><span>₹ {(tax/2).toFixed(2)}</span></div>
                 </div>
                 <div className="flex justify-between items-baseline pt-6 border-t border-slate-50">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Bill</span>
                    <span className="text-4xl font-black text-slate-950">₹ {total.toFixed(0)}</span>
                 </div>
                 <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                       <button onClick={() => setPaymentStatus('Paid')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${paymentStatus === 'Paid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Paid</button>
                       <button onClick={() => setPaymentStatus('Pending')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${paymentStatus === 'Pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Pending</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* HIGH FIDELITY INVOICE PREVIEW */
        <div className="flex justify-center pb-20 print:p-0 animate-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none border border-slate-200 relative text-[#000]">
              {/* Header Box */}
              <div className="border-b-[1.5px] border-slate-900 grid grid-cols-2">
                 <div className="p-6 border-r-[1.5px] border-slate-900">
                    <h1 className="text-2xl font-bold text-brand-700 mb-1">{user?.businessName || 'PRS IMPEX'}</h1>
                    <p className="text-[10px] leading-relaxed font-semibold uppercase">{user?.address || 'NO.199--23, BASAVESWARAN NAGAR, MORANAPALLI, HOSUR, Krishnagiri, Tamil Nadu, 635109'}</p>
                    <div className="mt-3 text-[11px] font-bold space-y-0.5">
                       <p>GSTIN: {user?.gstin || '33ABGFP7687M1ZG'}</p>
                       <p>PAN Number: ABGFP7687M</p>
                       <p>Email: {user?.email || 'prsimpex5@gmail.com'}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-3">
                    <div className="p-4 border-r border-b border-slate-900">
                       <p className="text-[9px] font-bold text-slate-500 uppercase">Invoice No.</p>
                       <p className="text-xs font-black">{invoiceNo}</p>
                    </div>
                    <div className="p-4 border-r border-b border-slate-900">
                       <p className="text-[9px] font-bold text-slate-500 uppercase">Invoice Date</p>
                       <p className="text-xs font-black">{date}</p>
                    </div>
                    <div className="p-4 border-b border-slate-900">
                       <p className="text-[9px] font-bold text-slate-500 uppercase">Due Date</p>
                       <p className="text-xs font-black">{dueDate || '13/03/2026'}</p>
                    </div>
                    <div className="p-4 col-span-3">
                       <p className="text-[9px] font-bold text-slate-500 uppercase">Vehicle No.</p>
                       <p className="text-xs font-black">{vehicleNo || 'KA51AF9601'}</p>
                    </div>
                 </div>
              </div>

              {/* Bill To / Ship To */}
              <div className="border-b-[1.5px] border-slate-900 grid grid-cols-2 text-[11px]">
                 <div className="p-4 border-r-[1.5px] border-slate-900 h-32">
                    <p className="font-black mb-1 uppercase text-slate-500">BILL TO</p>
                    <p className="font-black text-xs">{customer}</p>
                    <p className="text-[10px] mt-1 line-clamp-3">Address: {parties.find(p => p.name === customer)?.address || '6/1-, J,R PLAZA, TANK STREET, HOSUR, Krishnagiri...'}</p>
                 </div>
                 <div className="p-4 h-32">
                    <p className="font-black mb-1 uppercase text-slate-500">SHIP TO</p>
                    <p className="font-black text-xs">{customer}</p>
                    <p className="text-[10px] mt-1 line-clamp-3">Address: {parties.find(p => p.name === customer)?.address || '12TH KM, HN-7, GOPASANDARAM VILLAGE, SHOOLAGIRI...'}</p>
                 </div>
              </div>

              {/* Main Items Table */}
              <table className="w-full text-center text-[10px] border-b-[1.5px] border-slate-900">
                 <thead>
                    <tr className="border-b-[1.5px] border-slate-900 font-black uppercase text-slate-600 bg-slate-50">
                       <th className="py-2 border-r border-slate-900 w-12">S.NO.</th>
                       <th className="py-2 border-r border-slate-900 text-left px-4">ITEMS</th>
                       <th className="py-2 border-r border-slate-900">HSN</th>
                       <th className="py-2 border-r border-slate-900">QTY.</th>
                       <th className="py-2 border-r border-slate-900">RATE</th>
                       <th className="py-2">AMOUNT</th>
                    </tr>
                 </thead>
                 <tbody className="h-[400px] align-top">
                    {items.map((item, idx) => (
                       <tr key={idx} className="font-bold border-b border-slate-100">
                          <td className="py-3 border-r border-slate-900">{idx + 1}</td>
                          <td className="py-3 border-r border-slate-900 text-left px-4 uppercase">{item.productName}</td>
                          <td className="py-3 border-r border-slate-900">{item.hsn || '4707'}</td>
                          <td className="py-3 border-r border-slate-900">{item.quantity} KGS</td>
                          <td className="py-3 border-r border-slate-900">{item.price}</td>
                          <td className="py-3">₹ {item.total.toLocaleString()}</td>
                       </tr>
                    ))}
                    {/* CGST/SGST Rows inside main table */}
                    <tr className="border-t-[1.5px] border-slate-900 font-bold italic text-slate-500">
                       <td className="border-r border-slate-900"></td>
                       <td className="border-r border-slate-900 text-right px-4 py-2">CGST @{(taxRate/2).toFixed(1)}%</td>
                       <td className="border-r border-slate-900">-</td>
                       <td className="border-r border-slate-900">-</td>
                       <td className="border-r border-slate-900">-</td>
                       <td className="py-2 text-slate-950">₹ {(tax/2).toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold italic text-slate-500">
                       <td className="border-r border-slate-900"></td>
                       <td className="border-r border-slate-900 text-right px-4 py-2">SGST @{(taxRate/2).toFixed(1)}%</td>
                       <td className="border-r border-slate-900">-</td>
                       <td className="border-r border-slate-900">-</td>
                       <td className="border-r border-slate-900">-</td>
                       <td className="py-2 text-slate-950">₹ {(tax/2).toLocaleString()}</td>
                    </tr>
                 </tbody>
                 <tfoot>
                    <tr className="border-t-[1.5px] border-slate-900 font-black bg-slate-50 uppercase text-xs">
                       <td colSpan={3} className="py-3 border-r border-slate-900 text-right px-6">TOTAL</td>
                       <td className="py-3 border-r border-slate-900">{items.reduce((s,i)=>s+i.quantity,0)}</td>
                       <td className="py-3 border-r border-slate-900"></td>
                       <td className="py-3">₹ {total.toLocaleString()}</td>
                    </tr>
                 </tfoot>
              </table>

              {/* HSN Summary Table */}
              <div className="p-4">
                 <table className="w-full text-center text-[10px] border-[1.5px] border-slate-900">
                    <thead className="bg-slate-50">
                       <tr className="border-b border-slate-900 font-black">
                          <th rowSpan={2} className="border-r border-slate-900 p-1">HSN/SAC</th>
                          <th rowSpan={2} className="border-r border-slate-900 p-1">Taxable Value</th>
                          <th colSpan={2} className="border-r border-slate-900 p-1">CGST</th>
                          <th colSpan={2} className="border-r border-slate-900 p-1">SGST</th>
                          <th rowSpan={2} className="p-1">Total Tax Amount</th>
                       </tr>
                       <tr className="border-b border-slate-900 font-bold">
                          <th className="border-r border-slate-900 p-1">Rate</th>
                          <th className="border-r border-slate-900 p-1">Amount</th>
                          <th className="border-r border-slate-900 p-1">Rate</th>
                          <th className="border-r border-slate-900 p-1">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="font-bold">
                       <tr className="border-b border-slate-300">
                          <td className="border-r border-slate-900 p-1">4707</td>
                          <td className="border-r border-slate-900 p-1">{subtotal.toLocaleString()}</td>
                          <td className="border-r border-slate-900 p-1">{(taxRate/2).toFixed(1)}%</td>
                          <td className="border-r border-slate-900 p-1">{(tax/2).toLocaleString()}</td>
                          <td className="border-r border-slate-900 p-1">{(taxRate/2).toFixed(1)}%</td>
                          <td className="border-r border-slate-900 p-1">{(tax/2).toLocaleString()}</td>
                          <td className="p-1">₹ {tax.toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-black uppercase">
                          <td className="border-r border-slate-900 p-1">Total</td>
                          <td className="border-r border-slate-900 p-1">{subtotal.toLocaleString()}</td>
                          <td className="border-r border-slate-900 p-1"></td>
                          <td className="border-r border-slate-900 p-1">{(tax/2).toLocaleString()}</td>
                          <td className="border-r border-slate-900 p-1"></td>
                          <td className="border-r border-slate-900 p-1">{(tax/2).toLocaleString()}</td>
                          <td className="p-1">₹ {tax.toLocaleString()}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* Footer Section */}
              <div className="p-4 pt-0">
                 <div className="p-2 border border-slate-900 border-b-0">
                    <p className="text-[10px] font-black uppercase">Total Amount (in words)</p>
                    <p className="text-xs font-bold italic">{amountInWords(total)}</p>
                 </div>
                 <div className="grid grid-cols-3 border border-slate-900">
                    <div className="p-2 border-r border-slate-900 space-y-1">
                       <p className="text-[9px] font-black uppercase underline">Bank Details</p>
                       <div className="text-[10px] font-bold">
                          <p>Name: {user?.businessName || 'PRS IMPEX'}</p>
                          <p>IFSC Code: {user?.ifscCode || 'SBIN0001515'}</p>
                          <p>Account No: {user?.accountNo || '43903176005'}</p>
                          <p>Bank: {user?.bankName || 'State Bank of India'}</p>
                       </div>
                    </div>
                    <div className="p-2 border-r border-slate-900 space-y-1">
                       <p className="text-[9px] font-black uppercase underline">Terms and Conditions</p>
                       <div className="text-[9px] font-bold leading-tight">
                          <p>1. Goods once sold will not be taken back or exchanged</p>
                          <p>2. All disputes are subject to [CHENNAI] jurisdiction only</p>
                       </div>
                    </div>
                    <div className="p-2 flex flex-col items-center justify-between">
                       <div className="h-10 w-24 bg-slate-50 flex items-center justify-center grayscale opacity-60">
                          {user?.signatureUrl && <img src={user.signatureUrl} className="max-h-full" />}
                       </div>
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase">Authorised Signatory For</p>
                          <p className="text-[10px] font-black">{user?.businessName || 'PRS IMPEX'}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="text-center py-2 font-black uppercase text-[10px]">
                 TAX INVOICE ORIGINAL FOR RECIPIENT
              </div>
           </div>
        </div>
      )}
      <datalist id="prod-list">{products.map(p => <option key={p.id} value={p.name}>₹{p.price}</option>)}</datalist>
    </div>
  );
};