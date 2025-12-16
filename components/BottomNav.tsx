import React from 'react';
import { Home, PlusCircle, MessageSquare, Target } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  setView: (view: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'planning', icon: Target, label: 'Plan' },
    { id: 'add', icon: PlusCircle, label: 'Add' },
    { id: 'advisor', icon: MessageSquare, label: 'Ask AI' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 h-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-md mx-auto flex justify-between items-center h-full pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 w-16 transition-colors duration-200 ${
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={isActive ? 28 : 24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'block' : 'hidden'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;