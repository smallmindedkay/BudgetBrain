import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, onDelete, onEdit }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate Savings (Expenses categorized as 'Savings')
    const savings = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category === 'Savings')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Expenses (Expenses NOT categorized as 'Savings')
    const expense = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category !== 'Savings')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      savings,
      balance: income - expense - savings
    };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const catMap: Record<string, number> = {};
    expenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl">
        <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
        <h2 className="text-4xl font-bold mb-6">${summary.balance.toFixed(2)}</h2>
        
        <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
          {/* Income */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-emerald-400/20 p-2 rounded-full mb-1">
              <TrendingUp className="text-emerald-300" size={18} />
            </div>
            <p className="text-[10px] text-indigo-100 uppercase tracking-wide">Income</p>
            <p className="font-semibold text-sm sm:text-base">${summary.income.toFixed(0)}</p>
          </div>
          
          {/* Expenses */}
          <div className="flex flex-col items-center justify-center text-center border-l border-r border-white/10">
            <div className="bg-rose-400/20 p-2 rounded-full mb-1">
              <TrendingDown className="text-rose-300" size={18} />
            </div>
            <p className="text-[10px] text-indigo-100 uppercase tracking-wide">Expenses</p>
            <p className="font-semibold text-sm sm:text-base">${summary.expense.toFixed(0)}</p>
          </div>

          {/* Savings */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-blue-400/20 p-2 rounded-full mb-1">
              <PiggyBank className="text-blue-300" size={18} />
            </div>
            <p className="text-[10px] text-indigo-100 uppercase tracking-wide">Savings</p>
            <p className="font-semibold text-sm sm:text-base">${summary.savings.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Spending Breakdown */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Spending & Savings</h3>
        {categoryData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 italic">
            No expenses yet
          </div>
        )}
      </div>

      {/* Recent List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Recent Activity</h3>
        <div className="space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map(t => {
              const isExpanded = expandedId === t.id;
              return (
                <div 
                  key={t.id} 
                  onClick={() => toggleExpand(t.id)}
                  className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-all cursor-pointer hover:shadow-md ${isExpanded ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3 overflow-hidden flex-1">
                      <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? <DollarSign size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-gray-800 pr-2 ${isExpanded ? 'whitespace-normal break-words' : 'truncate'}`}>
                          {t.description}
                        </p>
                        <p className={`text-xs text-gray-500 ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>
                          {t.category} • {new Date(t.date).toLocaleDateString()}
                        </p>
                        {isExpanded && t.isRecurring && (
                            <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded-lg">
                                Recurring
                            </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 pl-2">
                        <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-800'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => onEdit(t)} 
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete(t.id)} 
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="text-gray-300 ml-1">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-8">No transactions found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;