import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Bot } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface GeminiAssistantProps {
  onClose: () => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([
    { role: 'ai', text: 'Hi! I am your billing assistant powered by Gemini. Ask me about your sales, stock, or help drafting an email to a customer.' }
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

    // Mock context data - in a real app this would come from state/db
    const contextData = `
      Current Stats:
      - Monthly Revenue: $19,550
      - Top Product: Wireless Mouse (45 units sold)
      - Low Stock: Office Chair (5 left)
      - Overdue: Customer 'Acme Corp' owes $500 since last week.
    `;

    const response = await GeminiService.askAssistant(messages, input, contextData);
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Gemini Assistant</h3>
        </div>
        <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
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
                <span className="text-xs text-gray-500">Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about sales, stock..."
            className="w-full bg-gray-100 border-0 rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-1 top-1 bottom-1 bg-indigo-600 text-white rounded-full w-10 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
