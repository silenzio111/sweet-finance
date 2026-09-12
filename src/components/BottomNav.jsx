import React from 'react';
import { Zap, BarChart3, SquarePen } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'minimal', label: '极简', icon: Zap },
    { id: 'detail', label: '详细', icon: BarChart3 },
    { id: 'manage', label: '修改', icon: SquarePen },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-black/[0.06] px-6 py-2 flex justify-around items-center z-20 transition-all">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all group select-none cursor-pointer ${
              isActive ? 'text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <div
              className={`w-10 h-7 rounded-full flex items-center justify-center transition-all group-active:scale-90 ${
                isActive ? 'bg-[#34C759]/12 text-[#34C759]' : 'bg-transparent text-[#8E8E93] group-hover:text-[#1C1C1E]'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 1.9} />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-[#1C1C1E]' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
