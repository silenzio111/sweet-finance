import React, { useState } from 'react';
import { ArchiveRestore, ChevronDown, ChevronUp } from 'lucide-react';

export function CollapsedCardDrawer({ items = [], onRestore, label = '已折叠卡片' }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!items.length) return null;

  return (
    <div className="mt-3 rounded-[20px] border border-[#007AFF]/15 bg-white/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left text-xs font-semibold text-[#1C1C1E] hover:bg-[#007AFF]/[0.04] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ArchiveRestore className="w-4 h-4 text-[#007AFF] shrink-0" strokeWidth={2.2} />
          <span className="truncate">{label}</span>
          <span className="text-[10px] text-[#8E8E93] font-mono shrink-0">{items.length} 个</span>
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#8E8E93] shrink-0" strokeWidth={2.2} />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8E8E93] shrink-0" strokeWidth={2.2} />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-black/[0.04] pt-2 animate-fadeIn">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl bg-[#F2F2F7]/75 px-2.5 py-2">
              <span className="text-[11px] text-[#3A3A3C] truncate min-w-0">{item.label}</span>
              <button
                type="button"
                onClick={() => onRestore?.(item.key)}
                title={`恢复${item.label}`}
                aria-label={`恢复${item.label}`}
                className="w-6 h-6 rounded-full bg-white text-[#007AFF] hover:bg-[#007AFF]/10 flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer"
              >
                <ArchiveRestore className="w-3.5 h-3.5" strokeWidth={2.3} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
