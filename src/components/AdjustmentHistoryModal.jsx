import React, { useEffect, useState } from 'react';
import { Check, History, Pencil, X } from 'lucide-react';
import { formatMoney, getCurrencyInfo } from '../data/defaultData';

function formatAdjustmentTime(value) {
  if (!value) return '历史调整';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '历史调整';

  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function AdjustmentHistoryModal({ item, onClose, onUpdateNote }) {
  const [editingAdjustmentId, setEditingAdjustmentId] = useState(null);
  const [draftNote, setDraftNote] = useState('');

  useEffect(() => {
    setEditingAdjustmentId(null);
    setDraftNote('');
  }, [item?.id]);

  if (!item) return null;

  const adjustments = Array.isArray(item.adjustments) ? [...item.adjustments].reverse() : [];

  const beginEditingNote = (adjustment) => {
    setEditingAdjustmentId(adjustment.id);
    setDraftNote(adjustment.note || '');
  };

  const cancelEditingNote = () => {
    setEditingAdjustmentId(null);
    setDraftNote('');
  };

  const saveNote = () => {
    if (!editingAdjustmentId) return;
    onUpdateNote?.(item.id, editingAdjustmentId, draftNote);
    cancelEditingNote();
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn">
      <button
        type="button"
        aria-label="关闭金额调整记录"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjustment-history-title"
        className="relative w-full max-w-[350px] max-h-[75vh] overflow-y-auto custom-scroll rounded-[26px] bg-white/95 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5 animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#007AFF]/12 text-[#007AFF] flex items-center justify-center shrink-0">
              <History className="w-4.5 h-4.5" strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <h2 id="adjustment-history-title" className="text-sm font-bold text-[#1C1C1E]">金额调整记录</h2>
              <p className="text-[11px] text-[#8E8E93] mt-0.5 truncate">{item.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="关闭"
            aria-label="关闭"
            className="w-7 h-7 rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {adjustments.length === 0 ? (
          <div className="mt-5 py-9 px-5 text-center rounded-2xl bg-[#F2F2F7]/80 border border-black/[0.03]">
            <History className="w-5 h-5 text-[#C7C7CC] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#6D6D72]">暂无金额调整记录</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {adjustments.map((adjustment, index) => {
              const isAdd = adjustment.operation === 'add';
              const currency = getCurrencyInfo(adjustment.currency || item.currency || 'CNY');
              const adjustmentId = adjustment.id || `${adjustment.createdAt || 'history'}-${index}`;
              const isEditing = editingAdjustmentId === adjustment.id;

              return (
                <div
                  key={adjustmentId}
                  className="p-3 rounded-2xl bg-[#F2F2F7]/75 border border-black/[0.03]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${isAdd ? 'text-[#248A3D]' : 'text-[#D70015]'}`}>
                      <span>{isAdd ? '+' : '-'} {currency.symbol}{formatMoney(adjustment.amount)}</span>
                    </div>
                    <span className="text-[10px] text-[#8E8E93] shrink-0">{formatAdjustmentTime(adjustment.createdAt)}</span>
                  </div>
                  {isEditing ? (
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        lang="zh-CN"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        value={draftNote}
                        onChange={(event) => setDraftNote(event.currentTarget.value)}
                        onCompositionEnd={(event) => setDraftNote(event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            saveNote();
                          }
                        }}
                        placeholder="添加本次调整备注"
                        className="min-w-0 flex-1 px-2.5 py-2 text-[11px] text-[#1C1C1E] bg-white rounded-xl border border-[#007AFF]/25 focus:outline-none focus:ring-2 focus:ring-[#007AFF] placeholder:text-[#AEAEB2]"
                      />
                      <button
                        type="button"
                        onClick={saveNote}
                        title="保存备注"
                        aria-label="保存备注"
                        className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
                      >
                        <Check className="w-4 h-4" strokeWidth={2.6} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingNote}
                        title="取消编辑"
                        aria-label="取消编辑"
                        className="w-8 h-8 rounded-xl bg-white text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center shrink-0 active:scale-95 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" strokeWidth={2.3} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-start gap-2">
                      <p className="min-w-0 flex-1 text-[11px] text-[#3A3A3C] leading-relaxed break-words">
                        {adjustment.note || '未添加备注'}
                      </p>
                      {adjustment.id && (
                        <button
                          type="button"
                          onClick={() => beginEditingNote(adjustment)}
                          title="编辑备注"
                          aria-label="编辑备注"
                          className="w-6 h-6 -mt-1 rounded-lg text-[#8E8E93] hover:text-[#007AFF] hover:bg-white flex items-center justify-center shrink-0 active:scale-95 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2.3} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
