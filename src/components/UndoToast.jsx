import React, { useEffect } from 'react';
import { AlertTriangle, Undo2, X, CheckCircle2 } from 'lucide-react';

export function UndoToast({ toastMessage, onUndo, onDismiss }) {
  // Automatically disappear after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, onDismiss]);

  if (!toastMessage) return null;

  const isUndoFeedback = toastMessage.isUndoNotice && !toastMessage.isRedoNotice;
  const isRedoFeedback = toastMessage.isRedoNotice;
  const isHistoryFeedback = isUndoFeedback || isRedoFeedback;
  const isUndoWarning = isUndoFeedback && toastMessage.isUndoWarning;
  const feedbackTitle = isUndoWarning
    ? `连续撤销 ${toastMessage.undoCount} 步`
    : isRedoFeedback
    ? '已重做'
    : '已撤销';
  const FeedbackIcon = isUndoWarning ? AlertTriangle : Undo2;

  return (
    <div key={toastMessage.id} className={`absolute top-14 left-4 right-4 z-50 flex justify-center pointer-events-none ${isHistoryFeedback ? 'animate-undo-feedback' : 'animate-fadeIn'}`}>
      <div className={`bg-[#1C1C1E]/95 backdrop-blur-2xl text-white px-4 py-2.5 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.35)] border border-white/15 flex items-center justify-between gap-3 max-w-[350px] w-full pointer-events-auto transition-all ${isHistoryFeedback ? 'py-3' : ''} ${isUndoWarning ? 'border-[#FF9F0A]/50 shadow-[0_12px_36px_rgba(255,159,10,0.22)]' : ''}`}>
        {isHistoryFeedback ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUndoWarning ? 'bg-[#FF9F0A]/18 text-[#FFD60A]' : isRedoFeedback ? 'bg-[#34C759]/18 text-[#64D2FF]' : 'bg-[#007AFF]/18 text-[#64D2FF]'}`}>
              <FeedbackIcon className={`w-4 h-4 animate-undo-feedback-icon ${isRedoFeedback ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className={`text-[10px] font-bold leading-none ${isUndoWarning ? 'text-[#FFD60A]' : 'text-[#64D2FF]'}`}>{feedbackTitle}</span>
              <span className="text-xs font-medium truncate text-white/95">{toastMessage.detail || toastMessage.text}</span>
              {isUndoWarning && (
                <span className="text-[10px] text-white/60 leading-none">请核对当前账目状态</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" strokeWidth={2.5} />
            <span className="text-xs font-medium truncate text-white/95">{toastMessage.text}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {!toastMessage.isUndoNotice && (
            <button
              onClick={() => {
                onUndo();
              }}
              className="bg-[#34C759] hover:bg-[#30D158] text-[#000000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Undo2 className="w-3 h-3 stroke-[2.5]" />
              <span>撤销</span>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-5 h-5 rounded-full hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
