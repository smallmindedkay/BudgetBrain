import React, { useState, useRef, useEffect } from 'react';
import { TransactionType, Transaction, Frequency, RecurringRule } from '../types';
import { Camera, Upload, Loader2, Check, Repeat } from 'lucide-react';
import { parseReceiptImage } from '../services/geminiService';

interface AddTransactionProps {
  categories: string[];
  initialData?: Transaction | null;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onAddRecurring: (rule: Omit<RecurringRule, 'id'>) => void;
  onClose: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ categories, initialData, onAdd, onAddRecurring, onClose }) => {
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [category, setCategory] = useState<string>(initialData ? initialData.category : categories[0]);
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : TransactionType.EXPENSE);
  const [date, setDate] = useState(initialData ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  
  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');

  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Process with Gemini
    setIsProcessing(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const data = await parseReceiptImage(base64);
      
      if (data) {
        setAmount(data.amount.toString());
        setDescription(data.merchant);
        if (data.date) setDate(data.date);
        
        // Match suggested category to existing ones or default
        const matched = categories.find(c => c.toLowerCase() === data.category.toLowerCase()) || categories[0];
        setCategory(matched);
        setType(TransactionType.EXPENSE);
      }
    } catch (error) {
      alert("Failed to analyze receipt. Please enter details manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    if (isRecurring && !initialData) {
        onAddRecurring({
            amount: parseFloat(amount),
            description,
            category,
            type,
            frequency,
            nextDueDate: date,
        });
    } else {
        onAdd({
            amount: parseFloat(amount),
            description,
            category,
            type,
            date,
        });
    }
    onClose();
  };

  return (
    <div className="pb-24 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{initialData ? 'Edit Transaction' : 'New Transaction'}</h2>
      
      {/* AI Receipt Scanner - Hide if editing */}
      {!isRecurring && !initialData && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Scan Receipt (AI Auto-fill)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors"
            >
              {isProcessing ? (
                <div className="text-center">
                  <Loader2 className="animate-spin text-indigo-600 mb-2 mx-auto" size={32} />
                  <p className="text-indigo-600 font-medium">Analyzing receipt...</p>
                </div>
              ) : preview ? (
                <div className="relative w-full h-32">
                  <img src={preview} alt="Receipt" className="w-full h-full object-cover rounded-xl opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl text-white font-medium">
                    <Check className="mr-2" /> Scanned
                  </div>
                </div>
              ) : (
                <>
                  <Camera className="text-indigo-400 mb-2" size={32} />
                  <p className="text-indigo-600 font-medium">Tap to take photo</p>
                  <p className="text-xs text-gray-500 mt-1">or upload image</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </div>
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`p-3 rounded-xl font-medium text-sm transition-all ${
              type === TransactionType.EXPENSE 
                ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500 ring-offset-1' 
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType(TransactionType.INCOME)}
            className={`p-3 rounded-xl font-medium text-sm transition-all ${
              type === TransactionType.INCOME 
                ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1' 
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            Income
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
              placeholder="0.00"
              required
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. Starbucks, Salary"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRecurring ? 'Start Date' : 'Date'}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Recurring Toggle - Hide if editing existing */}
        {!initialData && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <Repeat size={20} className="text-indigo-500" />
                        Recurring?
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                
                {isRecurring && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                        <div className="flex flex-wrap gap-2">
                            {(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] as Frequency[]).map(freq => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => setFrequency(freq)}
                                    className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                                        frequency === freq ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors mt-4"
        >
          {isRecurring ? 'Save Recurring Rule' : (initialData ? 'Update Transaction' : 'Save Transaction')}
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;