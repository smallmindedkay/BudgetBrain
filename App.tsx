import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Advisor from './components/Advisor';
import Planning from './components/Planning';
import BottomNav from './components/BottomNav';
import { Transaction, TransactionType, DEFAULT_CATEGORIES, Budget, Goal, RecurringRule } from './types';

const App: React.FC = () => {
  const [view, setView] = useState('dashboard');
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load from local storage
  useEffect(() => {
    const loadState = (key: string, setter: any, fallback: any) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setter(JSON.parse(saved));
        } catch (e) {
          console.error(`Failed to parse ${key}`, e);
          setter(fallback);
        }
      } else {
        setter(fallback);
      }
    };

    loadState('smartspend_transactions', setTransactions, [
        { id: '1', amount: 2500, description: 'Monthly Salary', category: 'Income', date: new Date().toISOString(), type: TransactionType.INCOME },
        { id: '2', amount: 45.50, description: 'Grocery Store', category: 'Food & Dining', date: new Date(Date.now() - 86400000).toISOString(), type: TransactionType.EXPENSE },
        { id: '3', amount: 12.00, description: 'Netflix Subscription', category: 'Entertainment', date: new Date(Date.now() - 172800000).toISOString(), type: TransactionType.EXPENSE },
    ]);
    loadState('smartspend_categories', setCategories, DEFAULT_CATEGORIES);
    loadState('smartspend_budgets', setBudgets, []);
    loadState('smartspend_goals', setGoals, []);
    loadState('smartspend_recurring', setRecurringRules, []);
  }, []);

  // Save to local storage
  useEffect(() => { localStorage.setItem('smartspend_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('smartspend_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('smartspend_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('smartspend_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('smartspend_recurring', JSON.stringify(recurringRules)); }, [recurringRules]);

  // Process Recurring Transactions
  useEffect(() => {
    if (recurringRules.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newTransactions: Transaction[] = [];
    let updatedRules = [...recurringRules];
    let hasChanges = false;

    updatedRules = updatedRules.map(rule => {
        let dueDate = new Date(rule.nextDueDate);
        let ruleChanged = false;

        // While the due date is today or in the past
        while (dueDate <= today) {
            hasChanges = true;
            ruleChanged = true;

            // Generate Transaction
            newTransactions.push({
                id: Date.now().toString() + Math.random().toString().slice(2),
                amount: rule.amount,
                description: rule.description,
                category: rule.category,
                type: rule.type,
                date: dueDate.toISOString(),
                isRecurring: true,
                recurringRuleId: rule.id
            });

            // Advance Date
            if (rule.frequency === 'DAILY') dueDate.setDate(dueDate.getDate() + 1);
            if (rule.frequency === 'WEEKLY') dueDate.setDate(dueDate.getDate() + 7);
            if (rule.frequency === 'BIWEEKLY') dueDate.setDate(dueDate.getDate() + 14);
            if (rule.frequency === 'MONTHLY') dueDate.setMonth(dueDate.getMonth() + 1);
            if (rule.frequency === 'YEARLY') dueDate.setFullYear(dueDate.getFullYear() + 1);
        }

        return ruleChanged ? { ...rule, nextDueDate: dueDate.toISOString().split('T')[0] } : rule;
    });

    if (hasChanges) {
        setTransactions(prev => [...newTransactions, ...prev]);
        setRecurringRules(updatedRules);
    }
  }, [recurringRules]); // Dependency on recurringRules ensures it runs when loaded

  // Handlers
  const handleNavChange = (newView: string) => {
    if (newView === 'add') {
        // If clicking 'Add' from menu, ensure we are in Create mode, not Edit mode
        setEditingTransaction(null);
    }
    setView(newView);
  };

  const handleAddTransaction = (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
        // Update existing
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...data, id: t.id } : t));
        setEditingTransaction(null);
    } else {
        // Add new
        setTransactions(prev => [{ ...data, id: Date.now().toString() }, ...prev]);
    }
    setView('dashboard');
  };

  const handleAddRecurring = (newRule: Omit<RecurringRule, 'id'>) => {
    setRecurringRules(prev => [...prev, { ...newRule, id: Date.now().toString() }]);
    setView('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
      setEditingTransaction(transaction);
      setView('add');
  };

  const handleAddCategory = (cat: string) => {
      if (!categories.includes(cat)) {
          setCategories(prev => [...prev, cat]);
      }
  };

  const handleUpdateBudget = (budget: Budget) => {
      setBudgets(prev => {
          const filtered = prev.filter(b => b.category !== budget.category);
          return [...filtered, budget];
      });
  };

  const handleAddGoal = (goal: Goal) => {
      setGoals(prev => [...prev, goal]);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      
      // Optional: Create a transaction for the allocation if money increased
      const original = goals.find(g => g.id === updatedGoal.id);
      if (original && updatedGoal.currentAmount > original.currentAmount) {
          const diff = updatedGoal.currentAmount - original.currentAmount;
          setTransactions(prev => [{
              id: Date.now().toString(),
              amount: diff,
              description: `Allocation to ${updatedGoal.name}`,
              category: 'Savings',
              date: new Date().toISOString(),
              type: TransactionType.EXPENSE
          }, ...prev]);
      }
  };

  const handleDeleteGoal = (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-2xl shadow-gray-200 overflow-hidden">
        
        {/* Header */}
        <header className="pt-12 pb-6 px-6 bg-gray-50 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {view === 'dashboard' && 'Overview'}
                        {view === 'planning' && 'Planning'}
                        {view === 'add' && (editingTransaction ? 'Edit Transaction' : 'Add Transaction')}
                        {view === 'advisor' && 'AI Advisor'}
                    </h1>
                    {view === 'dashboard' && <p className="text-sm text-gray-500">Welcome back, User</p>}
                </div>
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                    U
                </div>
            </div>
        </header>

        {/* Content Area */}
        <main className="px-6 pb-28">
          {view === 'dashboard' && (
            <Dashboard 
                transactions={transactions} 
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
            />
          )}
          
          {view === 'planning' && (
            <Planning 
                transactions={transactions}
                categories={categories}
                budgets={budgets}
                goals={goals}
                onAddCategory={handleAddCategory}
                onUpdateBudget={handleUpdateBudget}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
            />
          )}

          {view === 'add' && (
            <AddTransaction 
                categories={categories}
                initialData={editingTransaction}
                onAdd={handleAddTransaction} 
                onAddRecurring={handleAddRecurring}
                onClose={() => setView('dashboard')} 
            />
          )}

          {view === 'advisor' && <Advisor transactions={transactions} />}
        </main>

        {/* Navigation */}
        <BottomNav currentView={view} setView={handleNavChange} />
      </div>
    </div>
  );
};

export default App;