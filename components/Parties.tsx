
import React, { useState } from 'react';
import { Party, Transaction } from '../types';
import { Search, Plus, Phone, ArrowDownLeft, ArrowUpRight, History, X, ChevronRight, ShoppingBag, ShoppingCart, Filter, ChevronDown, CreditCard, MapPin, User as UserIcon } from 'lucide-react';

interface PartiesProps {
  parties: Party[];
  setParties: React.Dispatch<React.SetStateAction<Party[]>>;
  transactions: Transaction[];
}

export const Parties: React.FC<PartiesProps> = ({ parties, setParties, transactions }) => {
  const [filter, setFilter] = useState<'All' | 'Customer' | 'Supplier'>('All');
  const [balanceFilter, setBalanceFilter] = useState<'All' | 'Receivable' | 'Payable' | 'Settled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trade Ask State
  const [showTradeAsk, setShowTradeAsk] = useState(false);
  const [tradeSearch, setTradeSearch] = useState('');
  const [selectedTradeParty, setSelectedTradeParty] = useState<Party | null>(null);

  // Create Party State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPartyForm, setNewPartyForm] = useState({
    name: '',
    phone: '',
    gstin: '',
    address: '',
    type: 'Customer' as 'Customer' | 'Supplier'
  });

  // Filter based on Type, Balance AND Search Query
  const filteredParties = parties.filter(p => {
    const matchesType = filter === 'All' || p.type === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery);
    
    let matchesBalance = true;
    if (balanceFilter === 'Receivable') matchesBalance = p.balance > 0;
    if (balanceFilter === 'Payable') matchesBalance = p.balance < 0;
    if (balanceFilter === 'Settled') matchesBalance = p.balance === 0;

    return matchesType && matchesSearch && matchesBalance;
  });

  // Filter for Trade Ask Modal
  const tradeAskParties = parties.filter(p => 
    p.name.toLowerCase().includes(tradeSearch.toLowerCase()) || p.phone.includes(tradeSearch)
  );

  const selectedPartyHistory = selectedTradeParty 
    ? transactions.filter(t => t.partyName === selectedTradeParty.name)
    : [];

  // Calculate Totals dynamically based on the filtered list
  const totalReceivables = filteredParties
    .filter(p => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);

  const totalPayables = filteredParties
    .filter(p => p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  const handleCreateParty = () => {
    // Validation: All fields are required
    if (!newPartyForm.name || !newPartyForm.phone || !newPartyForm.gstin || !newPartyForm.address) {
      alert("All fields (Name, Phone, GSTIN, Address) are required.");
      return;
    }

    const newParty: Party = {
      id: Date.now().toString(),
      name: newPartyForm.name,
      phone: newPartyForm.phone,
      type: newPartyForm.type,
      balance: 0, // Initial balance is 0
      gstin: newPartyForm.gstin,
      address: newPartyForm.address,
    };

    setParties([newParty, ...parties]);
    setShowCreateModal(false);
    setNewPartyForm({ name: '', phone: '', gstin: '', address: '', type: 'Customer' });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Parties</h1>
          <p className="text-gray-500 text-sm">Manage your customers and suppliers</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setShowTradeAsk(true); setSelectedTradeParty(null); setTradeSearch(''); }}
            className="flex items-center gap-2 bg-white border border-teal-200 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors shadow-sm font-medium"
          >
            <History className="w-4 h-4" /> Trade Ask
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Create New Party
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center transition-all duration-300">
            <div>
               <p className="text-emerald-700 text-sm font-medium mb-1">
                 {balanceFilter !== 'All' || searchQuery ? 'Filtered Receivables' : 'Total Receivables'}
               </p>
               <p className="text-2xl font-bold text-gray-800">₹ {totalReceivables.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-full shadow-sm">
               <ArrowDownLeft className="w-6 h-6 text-emerald-500" />
            </div>
         </div>
         <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center transition-all duration-300">
            <div>
               <p className="text-red-700 text-sm font-medium mb-1">
                 {balanceFilter !== 'All' || searchQuery ? 'Filtered Payables' : 'Total Payables'}
               </p>
               <p className="text-2xl font-bold text-gray-800">₹ {totalPayables.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-full shadow-sm">
               <ArrowUpRight className="w-6 h-6 text-red-500" />
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by Name or Phone..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
             {/* Type Filter */}
             <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['All', 'Customer', 'Supplier'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filter === type 
                        ? 'bg-white text-teal-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>

             {/* Balance Filter */}
             <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select 
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value as any)}
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer hover:bg-gray-50"
                >
                   <option value="All">All Balances</option>
                   <option value="Receivable">To Collect (+)</option>
                   <option value="Payable">To Pay (-)</option>
                   <option value="Settled">Settled (0)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
             </div>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Party Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParties.length > 0 ? (
                filteredParties.map((party) => (
                  <tr key={party.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{party.name}</div>
                      {party.gstin && <div className="text-xs text-gray-500 mt-1">GSTIN: {party.gstin}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        party.type === 'Customer' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {party.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {party.phone}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${party.balance > 0 ? 'text-emerald-600' : party.balance < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      {party.balance > 0 ? `Receive ₹ ${party.balance.toLocaleString()}` : party.balance < 0 ? `Pay ₹ ${Math.abs(party.balance).toLocaleString()}` : 'Settled'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No parties found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Ask Modal */}
      {showTradeAsk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Trade Ask</h2>
                <p className="text-xs text-gray-500">Check party details and trade history</p>
              </div>
              <button onClick={() => setShowTradeAsk(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Search & List */}
              <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${selectedTradeParty ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-3 border-b border-gray-100 bg-white">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search Party Name/Phone..." 
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-gray-50"
                        value={tradeSearch}
                        onChange={(e) => setTradeSearch(e.target.value)}
                        autoFocus
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-white">
                   {tradeAskParties.map(party => (
                      <button 
                        key={party.id}
                        onClick={() => setSelectedTradeParty(party)}
                        className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex justify-between items-center ${selectedTradeParty?.id === party.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'border-l-4 border-l-transparent'}`}
                      >
                         <div>
                            <div className="font-semibold text-sm text-gray-800 truncate max-w-[150px]">{party.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{party.phone}</div>
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                   ))}
                   {tradeAskParties.length === 0 && (
                     <div className="p-6 text-center text-xs text-gray-400">No parties found</div>
                   )}
                </div>
              </div>

              {/* Right: Details */}
              <div className={`w-full md:w-2/3 bg-gray-50/30 flex flex-col ${!selectedTradeParty ? 'hidden md:flex' : 'flex'}`}>
                 {selectedTradeParty ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                       <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                          <button onClick={() => setSelectedTradeParty(null)} className="md:hidden mr-2">
                             <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${selectedTradeParty.type === 'Customer' ? 'bg-purple-600' : 'bg-orange-500'}`}>
                             {selectedTradeParty.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                             <h3 className="font-bold text-gray-800">{selectedTradeParty.name}</h3>
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${selectedTradeParty.type === 'Customer' ? 'border-purple-200 text-purple-600 bg-purple-50' : 'border-orange-200 text-orange-600 bg-orange-50'}`}>
                                   {selectedTradeParty.type}
                                </span>
                                <span className="text-xs text-gray-500">{selectedTradeParty.phone}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                             <History className="w-3 h-3" />
                             Transaction History
                          </h4>
                          {selectedPartyHistory.length > 0 ? (
                            selectedPartyHistory.map((txn, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                                 <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <div className="flex items-center gap-2">
                                       {txn.type.includes('Sale') 
                                         ? <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg"><ShoppingBag className="w-4 h-4" /></span> 
                                         : <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg"><ShoppingCart className="w-4 h-4" /></span>
                                       }
                                       <div>
                                          <div className="font-semibold text-gray-800 text-sm">{txn.type}</div>
                                          <div className="text-[10px] text-gray-400">{txn.date}</div>
                                       </div>
                                    </div>
                                    <span className={`font-bold text-base ${txn.type.includes('Sale') ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {txn.type.includes('Sale') ? '+' : '-'} ₹ {txn.amount.toLocaleString()}
                                    </span>
                                 </div>
                                 {txn.txnNo && (
                                     <div className="text-xs text-gray-500">Ref: {txn.txnNo}</div>
                                 )}
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                               <div className="bg-gray-100 p-4 rounded-full mb-3">
                                  <History className="w-8 h-8 opacity-40" />
                               </div>
                               <p className="text-sm font-medium">No transaction history found.</p>
                               <p className="text-xs mt-1 opacity-70">New transactions will appear here.</p>
                            </div>
                          )}
                       </div>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 bg-gray-50">
                       <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                          <Search className="w-8 h-8 text-teal-300" />
                       </div>
                       <p className="text-sm font-medium text-gray-600">Select a party to view details</p>
                       <p className="text-xs text-gray-400 mt-1">Search for a customer or supplier on the left</p>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Party Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">Add New Party</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                   <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Party Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                         <input 
                            type="text" 
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Business or Person Name"
                            value={newPartyForm.name}
                            onChange={(e) => setNewPartyForm({...newPartyForm, name: e.target.value})}
                         />
                         <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Contact Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                         <input 
                            type="tel" 
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="10-digit mobile"
                            value={newPartyForm.phone}
                            onChange={(e) => setNewPartyForm({...newPartyForm, phone: e.target.value.replace(/\D/g,'').slice(0,10)})}
                         />
                         <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">GST Number <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <input 
                         type="text" 
                         className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none uppercase"
                         placeholder="e.g. 29ABCDE1234F1Z5"
                         value={newPartyForm.gstin}
                         onChange={(e) => setNewPartyForm({...newPartyForm, gstin: e.target.value.toUpperCase()})}
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Billing Address <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <textarea 
                         className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none h-24"
                         placeholder="Full Street Address, City, State, Pincode"
                         value={newPartyForm.address}
                         onChange={(e) => setNewPartyForm({...newPartyForm, address: e.target.value})}
                      ></textarea>
                      <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Party Type</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${newPartyForm.type === 'Customer' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                         <input 
                            type="radio" 
                            name="partyType" 
                            className="hidden"
                            checked={newPartyForm.type === 'Customer'}
                            onChange={() => setNewPartyForm({...newPartyForm, type: 'Customer'})}
                         />
                         <ShoppingBag className="w-4 h-4" />
                         <span className="font-medium">Customer</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${newPartyForm.type === 'Supplier' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                         <input 
                            type="radio" 
                            name="partyType" 
                            className="hidden"
                            checked={newPartyForm.type === 'Supplier'}
                            onChange={() => setNewPartyForm({...newPartyForm, type: 'Supplier'})}
                         />
                         <ShoppingCart className="w-4 h-4" />
                         <span className="font-medium">Supplier</span>
                      </label>
                   </div>
                </div>
             </div>

             <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                   onClick={() => setShowCreateModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                   Cancel
                </button>
                <button 
                   onClick={handleCreateParty}
                   className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                   Save Party
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
