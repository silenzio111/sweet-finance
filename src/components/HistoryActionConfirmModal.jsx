import React from 'react';
import { AlertTriangle, Redo2, Undo2, X } from 'lucide-react';

export function HistoryActionConfirmModal({ action, onClose, onConfirm }) {
  if (!action) return null;

  const isUndo = action.type === 'undo';
  const Icon = isUndo ? Undo2 : Redo2;
  const title = isUndo ? '确认撤销' : '确认重做';
  const resultLabel = isUndo ? '撤销后将' : '重做后将';
  const confirmLabel = isUndo ? '确认撤销' : '确认重做';
  const accentClass = isUndo
    ? 'bg-[#007AFF] hover:bg-[#0077ED] shadow-[#007AFF]/25'
    : 'bg-[#34C759] hover:bg-[#30D158] shadow-[#34C759]/25';
  const iconClass = isUndo
    ? 'bg-[#007AFF]/12 text-[#007AFF]'
    : 'bg-[#34C759]/12 text-[#248A3D]';

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn">
      <button
        type="button"
        aria-label="取消操作"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-action-title"
        className="relative w-full max-w-[340px] rounded-[26px] bg-white/95 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5 animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
              <Icon className="w-4.5 h-4.5" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h2 id="history-action-title" className="text-sm font-bold text-[#1C1C1E]">{title}</h2>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">操作确认后将立即更新账本</p>
            </div>
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
          <span className="block text-[10px] font-bold text-[#8E8E93] mb-1">{resultLabel}</span>
          <p className="text-xs font-semibold text-[#1C1C1E] leading-relaxed break-words">{action.preview.result || action.preview.detail}</p>
        </div>

        {action.preview.isWarning && (
          <div className="mt-2.5 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0 mt-0.5" strokeWidth={2.4} />
            <p className="text-[11px] leading-relaxed text-[#9A6500] font-medium">
              这是连续第 {action.preview.undoCount} 次撤销，请确认当前账目状态符合预期。
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-colors cursor-pointer active:scale-[0.98]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 ${accentClass}`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
