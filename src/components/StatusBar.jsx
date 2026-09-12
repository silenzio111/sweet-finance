import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Plus, Redo2, Undo2 } from 'lucide-react';

export function StatusBar({
  selectedYear = '2026',
  availableYears = ['总计', '2026', '2025', '2024', '2027'],
  onYearChange,
  onAddYear,
  onOpenSettings,
  canUndo = false,
  onUndo,
  undoFeedbackId = null,
  canRedo = false,
  onRedo,
  redoFeedbackId = null
}) {
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [isUndoAnimating, setIsUndoAnimating] = useState(false);
  const [isRedoAnimating, setIsRedoAnimating] = useState(false);
  const yearRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setIsYearOpen(false);
        setIsAddingYear(false);
        setNewYearInput('');
      }
    };
    if (isYearOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isYearOpen]);

  useEffect(() => {
    if (!undoFeedbackId) return undefined;

    setIsUndoAnimating(true);
    const timer = setTimeout(() => setIsUndoAnimating(false), 680);
    return () => clearTimeout(timer);
  }, [undoFeedbackId]);

  useEffect(() => {
    if (!redoFeedbackId) return undefined;

    setIsRedoAnimating(true);
    const timer = setTimeout(() => setIsRedoAnimating(false), 680);
    return () => clearTimeout(timer);
  }, [redoFeedbackId]);

  const handleSelectYear = (year) => {
    onYearChange?.(year);
    setIsYearOpen(false);
    setIsAddingYear(false);
  };

  const handleConfirmAddYear = (e) => {
    e.preventDefault();
    const trimmed = newYearInput.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      alert('请输入4位有效数字年份（如 2028）');
      return;
    }
    onAddYear?.(trimmed);
    setIsAddingYear(false);
    setNewYearInput('');
    setIsYearOpen(false);
  };

  return (
    <div className="z-20 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-black/[0.04] sticky top-0 transition-colors">
      {/* iOS Minimal Navigation Bar with Generous Breathing Room */}
      <div className="px-5 py-3 flex justify-between items-center">
        
        {/* Left: SweetFinance Brand Pill (Click to open Settings) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            title="点击进入设置与数据管理"
            className="flex items-center space-x-2 bg-white/90 hover:bg-white text-[#1C1C1E] px-3.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer group shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-black/[0.04] select-none"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#34C759] to-[#30D158] flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
            <span className="text-xs font-bold tracking-tight text-[#1C1C1E]">
              SweetFinance
            </span>
            <SlidersHorizontal className="w-3 h-3 text-[#8E8E93] group-hover:text-[#1C1C1E] transition-colors ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onUndo?.()}
            disabled={!canUndo}
            title={canUndo ? '撤销上一步操作' : '暂无可撤销操作'}
            aria-label={canUndo ? '撤销上一步操作' : '暂无可撤销操作'}
            className={`w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#1C1C1E] flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all active:scale-95 disabled:cursor-not-allowed ${
              isUndoAnimating
                ? 'animate-undo-button bg-[#007AFF] text-white border-[#007AFF]'
                : !canUndo
                ? 'opacity-40 cursor-not-allowed hover:bg-white/90'
                : 'cursor-pointer'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={() => onRedo?.()}
            disabled={!canRedo}
            title={canRedo ? '重做上一步操作' : '暂无可重做操作'}
            aria-label={canRedo ? '重做上一步操作' : '暂无可重做操作'}
            className={`w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#1C1C1E] flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all active:scale-95 disabled:cursor-not-allowed ${
              isRedoAnimating
                ? 'animate-redo-button bg-[#34C759] text-white border-[#34C759]'
                : !canRedo
                ? 'opacity-40 cursor-not-allowed hover:bg-white/90'
                : 'cursor-pointer'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" strokeWidth={2.3} />
          </button>
        </div>

        {/* Right: Year Switcher Dropdown (Dynamic years list) */}
        <div className="relative" ref={yearRef}>
          <button
            onClick={() => setIsYearOpen(!isYearOpen)}
            title="点击切换账本年份"
            className="text-xs bg-white/90 hover:bg-white text-[#1C1C1E] font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all active:scale-95 cursor-pointer select-none border border-black/[0.04]"
          >
            <span className="font-mono tracking-tight font-bold">
              {selectedYear === '总计' ? '总计' : `${selectedYear}年`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform duration-200 ${
                isYearOpen ? 'rotate-180 text-[#1C1C1E]' : ''
              }`}
              strokeWidth={2.2}
            />
          </button>

          {/* Apple iOS Context Menu Dropdown */}
          {isYearOpen && (
            <div className="absolute right-0 top-10 z-50 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.14)] border border-black/[0.06] py-1.5 w-44 animate-fadeIn divide-y divide-black/[0.04]">
              <div className="px-3.5 py-1 text-[10px] text-[#8E8E93] font-semibold flex justify-between items-center">
                <span>选择账本年度</span>
                <span className="text-[9px] font-normal font-mono">{availableYears.length - 1} 个年份</span>
              </div>

              {/* Years Options List */}
              <div className="py-1 max-h-[220px] overflow-y-auto custom-scroll">
                {availableYears.map((year) => {
                  const isSelected = selectedYear === year;
                  return (
                    <button
                      key={year}
                      onClick={() => handleSelectYear(year)}
                      className={`w-full px-3.5 py-2 text-xs text-left font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#34C759]/10 text-[#34C759] font-bold'
                          : 'text-[#1C1C1E] hover:bg-black/[0.04]'
                      }`}
                    >
                      <span className="font-mono">{year === '总计' ? '总计' : `${year} 年`}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#34C759]" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>

              {/* Add New Year Action */}
              <div className="p-1.5">
                {isAddingYear ? (
                  <form onSubmit={handleConfirmAddYear} className="flex gap-1">
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      autoFocus
                      placeholder="如 2028"
                      value={newYearInput}
                      onChange={(e) => setNewYearInput(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono font-bold bg-[#F2F2F7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#34C759] text-[#1C1C1E]"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-[#34C759] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer shadow-xs"
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingYear(false)}
                      className="px-1.5 py-1 text-[10px] text-[#8E8E93] hover:text-[#1C1C1E] rounded-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingYear(true)}
                    className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold text-[#248A3D] bg-[#34C759]/10 hover:bg-[#34C759]/20 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>添加新年份</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
