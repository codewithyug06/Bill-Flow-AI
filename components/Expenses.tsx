
import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { Plus, Search } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    category: '',
    paymentMode: 'Cash'
  });

  // Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDescriptionChange = (desc: string) => {
    setNewExpense(prev => ({ ...prev, description: desc }));
  };

  const handleSave = () => {
    if (newExpense.amount && newExpense.description) {
      onAddExpense({
        id: Date.now().toString(),
        date: newExpense.date || '',
        amount: Number(newExpense.amount),
        description: newExpense.description || '',
        category: newExpense.category || 'Other',
        paymentMode: newExpense.paymentMode as any || 'Cash'
      });
      setShowAddModal(false);
      setNewExpense({ date: new Date().toISOString().split('T')[0], amount: 0, description: '', category: '', paymentMode: 'Cash' });
    }
  };

  return (
    <div className="space-y-6">
       <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-gray-500 text-sm">Track and manage business spending</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search expenses..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                 <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 text-sm text-gray-600">{expense.date}</td>
                       <td className="px-6 py-4 font-medium text-gray-800">{expense.description}</td>
                       <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                             {expense.category}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-500">{expense.paymentMode}</td>
                       <td className="px-6 py-4 text-right font-bold text-gray-800">₹ {expense.amount.toFixed(2)}</td>
                    </tr>
                 ))}
                 {expenses.length === 0 && (
                   <tr>
                     <td colSpan={5} className="text-center py-8 text-gray-400">No expenses recorded yet.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {showAddModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                  <h2 className="text-lg font-semibold text-gray-800">Add New Expense</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                     <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                     <div className="relative">
                        <input 
                           type="text" 
                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none pr-8"
                           placeholder="e.g., Shop Rent for Nov"
                           value={newExpense.description}
                           onChange={e => handleDescriptionChange(e.target.value)}
                        />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Amount</label>
                        <input 
                           type="number" 
                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                           value={newExpense.amount}
                           onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                        />
                     </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Date</label>
                        <input 
                           type="date" 
                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                           value={newExpense.date}
                           onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                           Category
                        </label>
                        <input 
                           type="text" 
                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                           value={newExpense.category}
                           onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                           placeholder="Rent, Utilities, etc."
                        />
                     </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Mode</label>
                        <select 
                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                           value={newExpense.paymentMode}
                           onChange={e => setNewExpense({...newExpense, paymentMode: e.target.value as any})}
                        >
                           <option>Cash</option>
                           <option>Online</option>
                           <option>Bank Transfer</option>
                        </select>
                     </div>
                  </div>
               </div>
               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">Save Expense</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
