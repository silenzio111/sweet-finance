import React from 'react';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';

export function AppConfirmDialog({ dialog, onClose, onConfirm }) {
  if (!dialog) return null;

  const isDanger = dialog.tone === 'danger';
  const Icon = isDanger ? Trash2 : dialog.tone === 'warning' ? AlertTriangle : RotateCcw;
  const iconClass = isDanger
    ? 'bg-[#FF3B30]/12 text-[#D70015]'
    : dialog.tone === 'warning'
    ? 'bg-[#FF9F0A]/12 text-[#9A6500]'
    : 'bg-[#007AFF]/12 text-[#007AFF]';
  const confirmClass = isDanger
    ? 'bg-[#FF3B30] hover:bg-[#FF453A] shadow-[#FF3B30]/25'
    : dialog.tone === 'warning'
    ? 'bg-[#FF9F0A] hover:bg-[#FF9500] shadow-[#FF9F0A]/25'
    : 'bg-[#007AFF] hover:bg-[#0077ED] shadow-[#007AFF]/25';

  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center p-4 animate-fadeIn">
      <button
        type="button"
        aria-label="取消操作"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-confirm-title"
        className="relative w-full max-w-[340px] overflow-hidden rounded-[26px] bg-white/95 p-5 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.22)] animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
              <Icon className="w-4.5 h-4.5" strokeWidth={2.4} />
            </div>
            <h2 id="app-confirm-title" className="text-sm font-bold text-[#1C1C1E] break-words">
              {dialog.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="取消"
            aria-label="取消"
            className="w-7 h-7 rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-[#F2F2F7]/80 border border-black/[0.03] p-3">
          <p className="text-xs font-medium text-[#3A3A3C] leading-relaxed break-words">{dialog.description}</p>
        </div>

        <div className={`mt-5 grid gap-2.5 ${dialog.hideCancel ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!dialog.hideCancel && (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-colors cursor-pointer active:scale-[0.98]"
            >
              {dialog.cancelLabel || '取消'}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${confirmClass}`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{dialog.confirmLabel || '确认'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
