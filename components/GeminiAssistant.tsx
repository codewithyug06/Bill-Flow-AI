import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Bot } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Invoice, Product, Party, Transaction, Purchase } from '../types';

interface GeminiAssistantProps {
  onClose: () => void;
  invoices: Invoice[];
  products: Product[];
  parties: Party[];
  transactions: Transaction[];
  purchases: Purchase[];
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ 
  onClose, 
  invoices, 
  products, 
  parties, 
  transactions,
  purchases
}) => {
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: 'ai', text: 'Hi! I am your billing assistant powered by Gemini. Ask me about your sales, stock, pending payments, or help drafting an email.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Calculate dynamic context data from props
    const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
    const pendingCollections = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.total, 0);
    const lowStockItems = products.filter(p => p.stock < 10).map(p => `${p.name} (${p.stock})`).join(', ');
    const recentTxns = transactions.slice(0, 5).map(t => `${t.date}: ${t.type} of ₹${t.amount}`).join('; ');
    const topDebtors = parties
        .filter(p => p.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 3)
        .map(p => `${p.name} (₹${p.balance})`)
        .join(', ');

    const contextData = `
      Current Business Snapshot:
      - Total Sales Revenue: ₹${totalSales}
      - Total Purchases: ₹${totalPurchases}
      - Pending Collections (Receivables): ₹${pendingCollections}
      - Top Debtors (Who owe money): ${topDebtors || 'None'}
      - Low Stock Items: ${lowStockItems || 'None'}
      - Recent Transactions: ${recentTxns}
      - Total Customer Count: ${parties.filter(p => p.type === 'Customer').length}
      - Total Product Count: ${products.length}
    `;

    const response = await GeminiService.askAssistant(messages, input, contextData);
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Gemini Assistant</h3>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Bot className="w-4 h-4 animate-bounce text-indigo-500" />
                <span className="text-xs text-gray-500 font-medium">Gemini is thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about sales, stock, or draft emails..."
            className="w-full bg-gray-100 border-0 rounded-full pl-4 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 text-white rounded-full w-10 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
