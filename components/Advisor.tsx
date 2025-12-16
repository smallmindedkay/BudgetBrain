import React, { useState, useEffect, useRef } from 'react';
import { Transaction, ChatMessage } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface AdvisorProps {
  transactions: Transaction[];
}

const Advisor: React.FC<AdvisorProps> = ({ transactions }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your SmartSpend assistant. I can analyze your spending habits, suggest budget improvements, or answer questions about your finances. How can I help today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await getFinancialAdvice(input, transactions);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const suggestions = [
    "How much did I spend on Food?",
    "Can I afford a $200 purchase?",
    "Where can I cut costs?",
    "Summarize my month."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-indigo-100 rounded-full">
            <Sparkles className="text-indigo-600" size={20} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Financial Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              className="whitespace-nowrap px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-full text-xs font-medium shadow-sm active:scale-95 transition-transform"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your finances..."
          className="w-full pl-4 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Advisor;