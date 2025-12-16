import React, { useState } from 'react';
import { Transaction, Budget, Goal, TransactionType } from '../types';
import { Plus, Trash2, Target, Wallet, AlertCircle, ChevronRight, Save } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PlanningProps {
  transactions: Transaction[];
  categories: string[];
  budgets: Budget[];
  goals: Goal[];
  onAddCategory: (category: string) => void;
  onUpdateBudget: (budget: Budget) => void;
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500'];

const getColorHex = (tailwindClass: string) => {
    const map: Record<string, string> = {
      'bg-indigo-500': '#6366f1',
      'bg-emerald-500': '#10b981',
      'bg-rose-500': '#ef4444',
      'bg-amber-500': '#f59e0b',
      'bg-violet-500': '#8b5cf6',
      'bg-cyan-500': '#06b6d4'
    };
    return map[tailwindClass] || '#6366f1';
};

const Planning: React.FC<PlanningProps> = ({ 
  transactions, categories, budgets, goals, 
  onAddCategory, onUpdateBudget, onAddGoal, onUpdateGoal, onDeleteGoal 
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');
  
  // State for adding category
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // State for budget editing
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState('');

  // State for adding goal
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  // State for allocating funds
  const [allocatingGoalId, setAllocatingGoalId] = useState<string | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('');

  // --- Budgets Logic ---
  const getCategorySpending = (category: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === TransactionType.EXPENSE && 
        t.category === category &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  const saveBudget = (category: string) => {
    const limit = parseFloat(tempLimit);
    if (!isNaN(limit) && limit > 0) {
      onUpdateBudget({ category, limit });
    }
    setEditingBudget(null);
    setTempLimit('');
  };

  // --- Goals Logic ---
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget || !newGoalDate) return;

    onAddGoal({
      id: Date.now().toString(),
      name: newGoalName,
      targetAmount: parseFloat(newGoalTarget),
      currentAmount: 0,
      deadline: newGoalDate,
      color: COLORS[goals.length % COLORS.length]
    });

    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDate('');
    setIsAddingGoal(false);
  };

  const handleAllocate = (goal: Goal) => {
    const amount = parseFloat(allocationAmount);
    if (!isNaN(amount) && amount > 0) {
      onUpdateGoal({
        ...goal,
        currentAmount: goal.currentAmount + amount
      });
      setAllocatingGoalId(null);
      setAllocationAmount('');
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center space-x-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Financial Planning</h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'budgets' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Budgets
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'goals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Goals
        </button>
      </div>

      {activeTab === 'budgets' ? (
        <div className="space-y-6">
            {/* Custom Category Input */}
            {isAddingCategory ? (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex gap-2">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Category Name"
                        className="flex-1 bg-gray-50 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                    />
                    <button onClick={handleAddCategory} className="bg-indigo-600 text-white p-2 rounded-lg">
                        <Save size={20} />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                    <Plus size={18} /> Add Custom Category
                </button>
            )}

            {/* Budget List */}
            <div className="space-y-4">
                {categories.map(cat => {
                    const spent = getCategorySpending(cat);
                    const budget = budgets.find(b => b.category === cat);
                    const limit = budget?.limit || 0;
                    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                    const isOver = limit > 0 && spent > limit;

                    return (
                        <div key={cat} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800">{cat}</h3>
                                    <p className="text-xs text-gray-500">Monthly Spending</p>
                                </div>
                                {editingBudget === cat ? (
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                            <input 
                                                type="number" 
                                                autoFocus
                                                className="w-full pl-5 py-1 text-sm border rounded-lg outline-none focus:border-indigo-500"
                                                value={tempLimit}
                                                onChange={e => setTempLimit(e.target.value)}
                                            />
                                        </div>
                                        <button onClick={() => saveBudget(cat)} className="text-emerald-600 p-1"><Save size={18}/></button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => { setEditingBudget(cat); setTempLimit(limit.toString()); }}
                                        className="text-indigo-600 text-xs font-semibold px-2 py-1 bg-indigo-50 rounded-lg"
                                    >
                                        {limit > 0 ? `$${limit}` : 'Set Limit'}
                                    </button>
                                )}
                            </div>

                            {limit > 0 ? (
                                <div>
                                    <div className="flex justify-between text-sm mb-1 font-medium">
                                        <span className={isOver ? 'text-rose-500' : 'text-gray-700'}>${spent.toFixed(0)} spent</span>
                                        <span className="text-gray-400">of ${limit}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No budget set. Spent: ${spent.toFixed(2)}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      ) : (
        <div className="space-y-6">
             {/* Add Goal Button */}
            {!isAddingGoal ? (
                <button 
                    onClick={() => setIsAddingGoal(true)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} /> Create New Goal
                </button>
            ) : (
                <form onSubmit={handleAddGoal} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-slide-up">
                    <h3 className="font-bold text-gray-800">New Financial Goal</h3>
                    <input 
                        required
                        type="text" 
                        placeholder="Goal Name (e.g. Vacation)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newGoalName}
                        onChange={e => setNewGoalName(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input 
                                required
                                type="number" 
                                placeholder="Target"
                                className="w-full pl-7 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newGoalTarget}
                                onChange={e => setNewGoalTarget(e.target.value)}
                            />
                        </div>
                        <input 
                            required
                            type="date" 
                            className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newGoalDate}
                            onChange={e => setNewGoalDate(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold">Create Goal</button>
                        <button type="button" onClick={() => setIsAddingGoal(false)} className="px-4 py-3 text-gray-500 font-medium">Cancel</button>
                    </div>
                </form>
            )}

            {/* Goals List */}
            <div className="space-y-4">
                {goals.length === 0 && !isAddingGoal && (
                    <div className="text-center py-10 text-gray-400">
                        <Target size={48} className="mx-auto mb-2 opacity-20" />
                        <p>No goals set yet.</p>
                    </div>
                )}

                {goals.map(goal => {
                    const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
                    const chartData = [
                        { name: 'Saved', value: goal.currentAmount },
                        { name: 'Remaining', value: remaining }
                    ];

                    return (
                        <div key={goal.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                             <div className={`absolute top-0 left-0 w-1.5 h-full ${goal.color}`}></div>
                             
                             <div className="flex justify-between items-start pl-2 mb-4">
                                 {/* Text Info */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start pr-2">
                                        <h3 className="font-bold text-lg text-gray-800 mb-1">{goal.name}</h3>
                                         <button onClick={() => onDeleteGoal(goal.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">Target: {new Date(goal.deadline).toLocaleDateString()}</p>
                                    
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900">${goal.currentAmount.toLocaleString()}</span>
                                        <span className="text-xs text-gray-400">of ${goal.targetAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="w-20 h-20 flex-shrink-0 relative ml-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={28}
                                                outerRadius={38}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell key="saved" fill={getColorHex(goal.color)} />
                                                <Cell key="remaining" fill="#f3f4f6" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {Math.floor(percent)}%
                                    </div>
                                </div>
                             </div>

                             {allocatingGoalId === goal.id ? (
                                <div className="pl-2 flex gap-2 animate-fade-in mt-2">
                                    <input 
                                        autoFocus
                                        type="number"
                                        placeholder="Amount"
                                        className="flex-1 bg-gray-50 px-3 py-2 rounded-lg border outline-none focus:border-indigo-500"
                                        value={allocationAmount}
                                        onChange={e => setAllocationAmount(e.target.value)}
                                    />
                                    <button onClick={() => handleAllocate(goal)} className="bg-emerald-500 text-white px-3 py-2 rounded-lg font-medium text-sm">Save</button>
                                    <button onClick={() => setAllocatingGoalId(null)} className="text-gray-400 px-2">Cancel</button>
                                </div>
                             ) : (
                                <button 
                                    onClick={() => setAllocatingGoalId(goal.id)}
                                    className="ml-2 w-[calc(100%-8px)] py-2 bg-gray-50 text-indigo-600 font-semibold rounded-lg text-sm hover:bg-indigo-50 transition-colors mt-1"
                                >
                                    + Add Funds
                                </button>
                             )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default Planning;