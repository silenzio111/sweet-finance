import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Minus, PiggyBank, Tag, Check, RefreshCw, ChevronDown } from 'lucide-react';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  SAVING_CATEGORIES,
  CURRENT_YEAR,
  DEFAULT_CURRENCIES,
  DEFAULT_EXCHANGE_RATES,
  getCurrencyInfo,
  formatMoney
} from '../data/defaultData';

export function ItemModal({
  isOpen,
  onClose,
  onSave,
  initialItem = null,
  currentYear = CURRENT_YEAR,
  availableYears = ['总计', CURRENT_YEAR],
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  incomeCategories = INCOME_CATEGORIES,
  expenseCategories = EXPENSE_CATEGORIES,
  savingCategories = SAVING_CATEGORIES,
  onAddCategory,
  onAddYear
}) {
  const [type, setType] = useState('income');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CNY');
  const [customRate, setCustomRate] = useState('');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [itemYear, setItemYear] = useState(CURRENT_YEAR);
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');

  // Quick math states
  const [customDelta, setCustomDelta] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const adjustmentNoteRef = useRef('');
  const [pendingAdjustments, setPendingAdjustments] = useState([]);
  const [activePendingAdjustmentId, setActivePendingAdjustmentId] = useState(null);
  const [isAdjustmentHistoryExpanded, setIsAdjustmentHistoryExpanded] = useState(false);
  const [unappliedDeltaAction, setUnappliedDeltaAction] = useState(null); // 'save' | 'close' | null
  const [isApplyingUnappliedDelta, setIsApplyingUnappliedDelta] = useState(false);
  const [activeMathOp, setActiveMathOp] = useState(null); // 'add' | 'sub' | null
  const [mathAnim, setMathAnim] = useState(null); // { formula, op, prev, delta, result }
  const animTimerRef = useRef(null);

  // Inline category creation state
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Custom year input mode
  const [isCustomYear, setIsCustomYear] = useState(false);
  const [customYearInput, setCustomYearInput] = useState('');

  const currentCategories =
    type === 'income' ? incomeCategories : type === 'expense' ? expenseCategories : savingCategories;
  const persistedAdjustments = Array.isArray(initialItem?.adjustments) ? initialItem.adjustments : [];
  const adjustmentHistory = [...persistedAdjustments, ...pendingAdjustments];
  const activePendingAdjustment = activePendingAdjustmentId
    ? pendingAdjustments.find((adjustment) => adjustment.id === activePendingAdjustmentId) || null
    : null;

  // Dynamic Year Options
  const yearOptions = useMemo(() => {
    const years = availableYears.filter((y) => y !== '总计');
    const set = new Set(years);
    set.add(CURRENT_YEAR);
    if (itemYear && itemYear !== '总计') set.add(itemYear);
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [availableYears, itemYear]);

  // Current currency info and effective exchange rate
  const currInfo = useMemo(() => getCurrencyInfo(currency), [currency]);
  const defaultRateForCurrency = exchangeRates[currency] || currInfo.defaultRate || 1.0;
  const effectiveRate = customRate ? parseFloat(customRate) || defaultRateForCurrency : defaultRateForCurrency;

  // Parse amount even if user enters math expression like 100+50
  const parseAmountNumber = (val) => {
    if (!val) return 0;
    const str = String(val).trim();
    if (/[+-]/.test(str)) {
      try {
        const tokens = str.match(/([+-]?\s*[\d.]+)/g);
        if (tokens) {
          const sum = tokens.reduce((acc, t) => acc + (parseFloat(t.replace(/\s+/g, '')) || 0), 0);
          if (!isNaN(sum)) return Math.max(0, sum);
        }
      } catch (e) {}
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  // Real-time converted amount in CNY
  const convertedCNY = useMemo(() => {
    const num = parseAmountNumber(amount);
    if (num <= 0) return 0;
    return currency === 'CNY' ? num : Math.round(num * effectiveRate * 100) / 100;
  }, [amount, currency, effectiveRate]);

  const setAdjustmentNoteValue = (value) => {
    const nextValue = String(value ?? '');
    adjustmentNoteRef.current = nextValue;
    setAdjustmentNote(nextValue);
  };

  const handleAdjustmentNoteChange = (value) => {
    const nextValue = String(value ?? '');
    setAdjustmentNoteValue(nextValue);

    if (!activePendingAdjustmentId) return;

    setPendingAdjustments((previous) => previous.map((adjustment) => (
      adjustment.id === activePendingAdjustmentId
        ? { ...adjustment, note: nextValue }
        : adjustment
    )));
  };

  const selectPendingAdjustment = (adjustment) => {
    if (!adjustment) return;
    setActivePendingAdjustmentId(adjustment.id);
    setAdjustmentNoteValue(adjustment.note || '');
  };

  const prepareNextAdjustment = () => {
    if (!activePendingAdjustmentId) return;
    setActivePendingAdjustmentId(null);
    setAdjustmentNoteValue('');
  };

  const createAdjustment = (operation, delta, noteValue = adjustmentNoteRef.current) => ({
    id: `adjustment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    operation,
    amount: delta,
    currency,
    note: String(noteValue || '').trim(),
    createdAt: new Date().toISOString()
  });

  // Quick addition and subtraction with animation: e.g. "100 + 10 = 110"
  const handleApplyCustomDelta = (isAdd) => {
    if (isApplyingUnappliedDelta) return;

    const d = parseFloat(customDelta);
    if (isNaN(d) || d <= 0) return;

    const current = parseAmountNumber(amount);
    const op = isAdd ? 'add' : 'sub';
    const next = isAdd ? current + d : Math.max(0, current - d);
    const cleanNext = Math.round(next * 100) / 100;
    const opSymbol = isAdd ? '+' : '-';
    const formula = `${current} ${opSymbol} ${d} = ${cleanNext}`;

    // Highlight the button
    setActiveMathOp(op);

    // Trigger calculation animation in amount input
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setMathAnim({
      formula,
      op,
      prev: current,
      delta: d,
      result: cleanNext
    });
    setAmount(formula);

    if (initialItem) {
      const noteForAdjustment = adjustmentNoteRef.current.trim();
      const adjustment = createAdjustment(op, d, noteForAdjustment);
      setPendingAdjustments((prev) => [
        ...prev,
        adjustment
      ]);
      setActivePendingAdjustmentId(adjustment.id);
      setAdjustmentNoteValue(noteForAdjustment);
    }

    // Transition to final result after animation
    animTimerRef.current = setTimeout(() => {
      setAmount(cleanNext === 0 ? '0' : String(cleanNext));
      setMathAnim(null);
      setActiveMathOp(null);
    }, 1100);

    setCustomDelta('');
  };

  const handleAmountBlur = () => {
    if (!amount) return;
    const str = String(amount).trim();
    if (/[+-]/.test(str)) {
      const parsed = parseAmountNumber(str);
      setAmount(String(Math.round(parsed * 100) / 100));
    }
  };

  useEffect(() => {
    setIsCreatingCat(false);
    setNewCatInput('');
    setIsCustomYear(false);
    setCustomYearInput('');
    setIsEditingRate(false);
    setCustomDelta('');
    setActivePendingAdjustmentId(null);
    setAdjustmentNoteValue('');
    setPendingAdjustments([]);
    setIsAdjustmentHistoryExpanded(false);
    setUnappliedDeltaAction(null);
    setIsApplyingUnappliedDelta(false);
    setActiveMathOp(null);
    setMathAnim(null);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);

    if (initialItem) {
      setType(initialItem.type || 'income');
      setTitle(initialItem.title || '');
      const itemCurr = initialItem.currency || 'CNY';
      setCurrency(itemCurr);
      setAmount(initialItem.originalAmount !== undefined ? String(initialItem.originalAmount) : String(initialItem.amount || ''));
      setCustomRate(initialItem.exchangeRate && itemCurr !== 'CNY' ? String(initialItem.exchangeRate) : '');
      setItemYear(initialItem.year || (currentYear === '总计' ? CURRENT_YEAR : currentYear));
      setCategory(initialItem.category || (initialItem.type === 'expense' ? expenseCategories[0] : incomeCategories[0]));
      setTag(initialItem.tag || '');
      setNote(initialItem.note || '');
    } else {
      setType('income');
      setTitle('');
      setAmount('');
      setCurrency('CNY');
      setCustomRate('');
      setItemYear(currentYear === '总计' ? CURRENT_YEAR : currentYear);
      setCategory(incomeCategories[0] || '其他收入');
      setTag('');
      setNote('');
    }
  }, [initialItem, isOpen, currentYear, incomeCategories, expenseCategories]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setIsCreatingCat(false);
    const availableCats = newType === 'income' ? incomeCategories : expenseCategories;
    if (!availableCats.includes(category)) {
      setCategory(availableCats[0] || (newType === 'income' ? '其他收入' : '其他支出'));
    }
  };

  const handleCreateNewCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;

    onAddCategory?.(type, trimmed);
    setCategory(trimmed);
    setIsCreatingCat(false);
    setNewCatInput('');
  };

  const handleConfirmCustomYear = (e) => {
    e.preventDefault();
    const trimmed = customYearInput.trim();
    if (/^\d{4}$/.test(trimmed)) {
      setItemYear(trimmed);
      onAddYear?.(trimmed);
      setIsCustomYear(false);
      setCustomYearInput('');
    } else {
      alert('请输入合法的4位数字年份，如 2028');
    }
  };

  const saveItem = ({ amountValue = amount, additionalAdjustments = [] } = {}) => {
    const numAmount = parseAmountNumber(amountValue);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('请输入有效的账目名称和金额');
      return false;
    }

    if (numAmount > 999999999999) {
      alert('单笔金额不能超过 9999 亿');
      return false;
    }

    let finalYear = itemYear || CURRENT_YEAR;
    if (isCustomYear && customYearInput.trim()) {
      const trimmedYear = customYearInput.trim();
      if (/^\d{4}$/.test(trimmedYear)) {
        finalYear = trimmedYear;
        onAddYear?.(trimmedYear);
      }
    }

    const finalRate = currency === 'CNY' ? 1.0 : effectiveRate;
    const finalBaseAmount = currency === 'CNY' ? numAmount : Math.round(numAmount * finalRate * 100) / 100;

    onSave({
      id: initialItem?.id,
      year: finalYear,
      type,
      title: title.trim(),
      currency,
      originalAmount: numAmount,
      exchangeRate: finalRate,
      amount: finalBaseAmount,
      category: category || (type === 'income' ? '其他收入' : '其他支出'),
      tag: tag.trim(),
      note: note.trim(),
      adjustments: initialItem ? [...adjustmentHistory, ...additionalAdjustments] : [],
    });

    onClose();
    return true;
  };

  const hasUnappliedDelta = initialItem && Number.parseFloat(customDelta) > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isApplyingUnappliedDelta) return;

    if (hasUnappliedDelta) {
      setUnappliedDeltaAction('save');
      return;
    }

    saveItem();
  };

  const handleSaveWithUnappliedDelta = (isAdd) => {
    if (isApplyingUnappliedDelta) return;

    const delta = Number.parseFloat(customDelta);
    if (!Number.isFinite(delta) || delta <= 0) {
      setUnappliedDeltaAction(null);
      return;
    }

    const current = parseAmountNumber(amount);
    const nextAmount = isAdd ? current + delta : Math.max(0, current - delta);
    const cleanNextAmount = Math.round(nextAmount * 100) / 100;
    const op = isAdd ? 'add' : 'sub';
    const opSymbol = isAdd ? '+' : '-';
    const adjustment = createAdjustment(op, delta, adjustmentNoteRef.current.trim());
    const formula = `${current} ${opSymbol} ${delta} = ${cleanNextAmount}`;

    setIsApplyingUnappliedDelta(true);
    setUnappliedDeltaAction(null);
    setActiveMathOp(op);
    setMathAnim({
      formula,
      op,
      prev: current,
      delta,
      result: cleanNextAmount
    });
    setAmount(formula);
    setCustomDelta('');

    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      setAmount(cleanNextAmount === 0 ? '0' : String(cleanNextAmount));
      setMathAnim(null);
      setActiveMathOp(null);
      setIsApplyingUnappliedDelta(false);

      const didSave = saveItem({
        amountValue: cleanNextAmount,
        additionalAdjustments: [adjustment]
      });

      if (!didSave) {
        setCustomDelta(String(delta));
        setUnappliedDeltaAction('save');
      }
    }, 1100);
  };

  const requestClose = () => {
    if (isApplyingUnappliedDelta) return;

    if (hasUnappliedDelta) {
      setUnappliedDeltaAction('close');
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] w-full max-w-[360px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-black/[0.06] transform transition-all max-h-[85vh] overflow-y-auto custom-scroll">
        
        {/* iOS Modal Grabber Bar */}
        <div className="w-10 h-1.2 bg-[#C7C7CC] rounded-full mx-auto mb-3"></div>

        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-black/[0.04]">
          <h3 className="text-base font-bold text-[#1C1C1E]">
            {initialItem ? '修改账目条目' : '新增账目记录'}
          </h3>
          <button
            onClick={requestClose}
            className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          aria-busy={isApplyingUnappliedDelta}
          className={`space-y-3 pt-3 ${isApplyingUnappliedDelta ? 'pointer-events-none' : ''}`}
        >
          
          {/* Type Segmented Control & Year Picker */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="col-span-2 grid grid-cols-3 gap-1 bg-[#767680]/12 p-[3px] rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-[#34C759] shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                <span>收入</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-[#FF3B30] shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <Minus className="w-3 h-3" strokeWidth={2.5} />
                <span>支出</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('saving')}
                className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                  type === 'saving'
                    ? 'bg-white text-[#007AFF] shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <PiggyBank className="w-3 h-3" strokeWidth={2.2} />
                <span>存款</span>
              </button>
            </div>

            {/* Year Selector */}
            <div>
              {isCustomYear ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    autoFocus
                    placeholder="年份"
                    value={customYearInput}
                    onChange={(e) => setCustomYearInput(e.target.value)}
                    className="w-full py-2 px-1 text-xs font-mono font-bold bg-[#F2F2F7] rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-[#1C1C1E]"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmCustomYear}
                    className="p-1.5 bg-[#34C759] text-white rounded-lg text-xs"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <select
                  value={itemYear}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomYear(true);
                    } else {
                      setItemYear(e.target.value);
                    }
                  }}
                  className="w-full py-2 px-2 text-xs font-mono font-bold bg-[#F2F2F7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-[#1C1C1E] transition-all cursor-pointer border border-transparent"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                  <option value="custom">＋ 自定义年份...</option>
                </select>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">条目名称</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：二手闲置、万象城 shopping"
              className="w-full px-3.5 py-2.5 text-xs bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent transition-all text-[#1C1C1E] placeholder:text-[#AEAEB2]"
            />
          </div>

          {/* Amount & Multi-Currency Selector */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <label className="block text-[11px] font-semibold text-[#8E8E93]">金额与币种</label>
                {mathAnim && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md animate-pulse ${
                    mathAnim.op === 'add' ? 'bg-[#34C759]/15 text-[#248A3D]' : 'bg-[#FF3B30]/15 text-[#D70015]'
                  }`}>
                    ✨ 运算中: {mathAnim.formula}
                  </span>
                )}
              </div>
              {currency !== 'CNY' && (
                <span className="text-[10px] text-[#248A3D] font-mono font-semibold">
                  折合 ≈ ¥{formatMoney(convertedCNY)}
                </span>
              )}
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Compact Currency Picker Select */}
              <div className="relative shrink-0">
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setCustomRate('');
                    setIsEditingRate(false);
                  }}
                  className="py-2.5 pl-2.5 pr-5 text-xs font-mono font-bold bg-[#F2F2F7] hover:bg-[#E5E5EA] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent transition-all text-[#1C1C1E] cursor-pointer appearance-none shadow-2xs"
                >
                  {DEFAULT_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-1.5 top-3 text-[9px] text-[#8E8E93]">
                  ▾
                </div>
              </div>

              {/* Amount Input with Calculation Animation Glow */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 font-mono text-xs font-bold text-[#8E8E93]">
                  {currInfo.symbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amount}
                  onBlur={handleAmountBlur}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00 (支持 100+50)"
                  className={`w-full pl-7 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border transition-all placeholder:text-[#AEAEB2] ${
                    mathAnim
                      ? mathAnim.op === 'add'
                        ? 'bg-[#34C759]/10 text-[#248A3D] border-[#34C759] shadow-[0_0_12px_rgba(52,199,89,0.35)] ring-2 ring-[#34C759]/20'
                        : 'bg-[#FF3B30]/10 text-[#D70015] border-[#FF3B30] shadow-[0_0_12px_rgba(255,59,48,0.35)] ring-2 ring-[#FF3B30]/20'
                      : 'bg-[#F2F2F7] focus:bg-white text-[#1C1C1E] border-transparent'
                  }`}
                />
              </div>
            </div>

            {/* Quick Math Modifier Input Bar (快捷加减：输入框 + 高亮加减按钮) */}
            <div className="mt-2 flex items-center gap-1.5 animate-fadeIn">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="输入加减数，如 250"
                value={customDelta}
                onFocus={prepareNextAdjustment}
                onChange={(e) => setCustomDelta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCustomDelta(true);
                  }
                }}
                className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-[#F2F2F7] focus:bg-white rounded-xl border border-transparent focus:border-black/[0.08] focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-[#1C1C1E] placeholder:text-[#AEAEB2] transition-all"
              />
              <button
                type="button"
                onClick={() => handleApplyCustomDelta(false)}
                className={`px-3 py-2 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shrink-0 border ${
                  activeMathOp === 'sub'
                    ? 'bg-[#FF3B30] text-white border-[#FF3B30] shadow-sm ring-2 ring-[#FF3B30]/30'
                    : 'bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#D70015] border-[#FF3B30]/20'
                }`}
                title="减去该数值"
              >
                - 减
              </button>
              <button
                type="button"
                onClick={() => handleApplyCustomDelta(true)}
                className={`px-3 py-2 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shrink-0 border ${
                  activeMathOp === 'add'
                    ? 'bg-[#34C759] text-white border-[#34C759] shadow-sm ring-2 ring-[#34C759]/30'
                    : 'bg-[#34C759]/12 hover:bg-[#34C759]/22 text-[#248A3D] border-[#34C759]/25'
                }`}
                title="加上该数值"
              >
                + 加
              </button>
            </div>

            {initialItem && (
              <div className="mt-2 animate-fadeIn">
                <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                  {activePendingAdjustment ? '最近一次调整备注' : '本次加减备注'} <span className="font-normal">(可选)</span>
                </label>
                <input
                  type="text"
                  name="adjustment-note"
                  lang="zh-CN"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={adjustmentNote}
                  onChange={(e) => handleAdjustmentNoteChange(e.currentTarget.value)}
                  onCompositionEnd={(e) => handleAdjustmentNoteChange(e.currentTarget.value)}
                  placeholder="如：补差价、退款回补、追加投入"
                  className="w-full px-3 py-2 text-xs bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent transition-all text-[#1C1C1E] placeholder:text-[#AEAEB2]"
                />
              </div>
            )}

            {initialItem && adjustmentHistory.length > 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-[#F2F2F7]/75 border border-black/[0.04] animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentHistoryExpanded((expanded) => !expanded)}
                  aria-expanded={isAdjustmentHistoryExpanded}
                  className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-[#8E8E93]">金额调整记录</span>
                  <span className="flex items-center gap-1 text-[9px] text-[#8E8E93]">
                    共 {adjustmentHistory.length} 次
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isAdjustmentHistoryExpanded ? 'rotate-180' : ''}`}
                      strokeWidth={2.4}
                    />
                  </span>
                </button>

                {isAdjustmentHistoryExpanded && (
                  <div className="mt-1.5 space-y-1.5 max-h-24 overflow-y-auto custom-scroll animate-fadeIn">
                    {[...adjustmentHistory].reverse().map((adjustment) => {
                      const isAdd = adjustment.operation === 'add';
                      const adjustmentCurrency = getCurrencyInfo(adjustment.currency || currency);
                      const isPending = pendingAdjustments.some((item) => item.id === adjustment.id);

                      const rowContent = (
                        <>
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className={`font-mono font-bold shrink-0 ${isAdd ? 'text-[#248A3D]' : 'text-[#D70015]'}`}>
                              {isAdd ? '+' : '-'} {adjustmentCurrency.symbol}{formatMoney(adjustment.amount)}
                            </span>
                            <span className="truncate text-[#6D6D72]">{adjustment.note || '未添加备注'}</span>
                          </div>
                          <span className={`text-[9px] shrink-0 ${isPending ? 'text-[#007AFF] font-semibold' : 'text-[#8E8E93]'}`}>
                            {isPending ? '待保存' : '已记录'}
                          </span>
                        </>
                      );

                      return isPending ? (
                        <button
                          key={adjustment.id}
                          type="button"
                          onClick={() => selectPendingAdjustment(adjustment)}
                          title="编辑这次调整的备注"
                          className={`w-full flex items-center justify-between gap-2 text-[10px] text-left rounded-lg px-1.5 py-1 transition-colors cursor-pointer ${
                            activePendingAdjustmentId === adjustment.id
                              ? 'bg-[#007AFF]/10 ring-1 ring-[#007AFF]/20'
                              : 'hover:bg-white/80'
                          }`}
                        >
                          {rowContent}
                        </button>
                      ) : (
                        <div key={adjustment.id} className="flex items-center justify-between gap-2 text-[10px] px-1.5 py-1">
                          {rowContent}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Foreign Currency Real-time Rate Card */}
            {currency !== 'CNY' && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#34C759]/8 border border-[#34C759]/15 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#248A3D] font-mono flex items-center gap-1">
                    <span>1 {currency} = {effectiveRate} CNY</span>
                    {customRate && <span className="text-[9px] bg-[#34C759] text-white px-1 rounded">自定义</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingRate(!isEditingRate)}
                    className="text-[10px] font-semibold text-[#007AFF] hover:underline cursor-pointer"
                  >
                    {isEditingRate ? '收起微调' : '微调汇率'}
                  </button>
                </div>

                {isEditingRate && (
                  <div className="mt-2 pt-2 border-t border-[#34C759]/15 flex items-center gap-2">
                    <label className="text-[10px] text-[#8E8E93] shrink-0">交易实际汇率:</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder={String(defaultRateForCurrency)}
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono font-bold bg-white rounded-lg border border-[#34C759]/30 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-[#1C1C1E]"
                    />
                    {customRate && (
                      <button
                        type="button"
                        onClick={() => setCustomRate('')}
                        className="text-[10px] text-[#8E8E93] hover:text-[#FF3B30] shrink-0"
                      >
                        重置
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selection with Capsule Add Button */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-semibold text-[#8E8E93]">所属分类</label>
              {!isCreatingCat && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(true)}
                  className="text-[10px] bg-[#34C759]/12 hover:bg-[#34C759]/20 text-[#248A3D] border border-[#34C759]/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-[#34C759]" strokeWidth={2.5} />
                  <span>新增分类</span>
                </button>
              )}
            </div>

            {isCreatingCat ? (
              <div className="flex gap-1.5 animate-fadeIn">
                <input
                  type="text"
                  autoFocus
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNewCategory(e);
                    }
                  }}
                  placeholder="输入新分类名称..."
                  className="flex-1 px-3 py-2 text-xs bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#34C759] border border-transparent text-[#1C1C1E]"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-3 py-2 bg-[#34C759] text-white rounded-xl text-xs font-semibold hover:bg-[#2FB34F] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>确定</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(false)}
                  className="px-2.5 py-2 bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E] rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-[#1C1C1E] border border-transparent transition-all cursor-pointer"
              >
                {currentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tag & Note Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">打标 (可选)</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="如：独立副业"
                className="w-full px-3 py-2 text-xs bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent transition-all text-[#1C1C1E] placeholder:text-[#AEAEB2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">备注说明 (可选)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="如：专款专用"
                className="w-full px-3 py-2 text-xs bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent transition-all text-[#1C1C1E] placeholder:text-[#AEAEB2]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 py-2.5 text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#1C1C1E] hover:bg-black rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all active:scale-98 cursor-pointer"
            >
              保存条目
            </button>
          </div>
        </form>

      </div>

      {unappliedDeltaAction && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-[330px] overflow-hidden rounded-[24px] bg-white/95 p-5 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
            <div className="text-sm font-bold text-[#1C1C1E]">未应用金额调整</div>
            <p className="text-xs leading-relaxed text-[#6D6D72] mt-2">
              {currInfo.symbol}{formatMoney(customDelta)} 尚未选择增加或减少。
              {adjustmentNote.trim() ? ` 本次备注为「${adjustmentNote.trim()}」。` : ''}
            </p>

            {unappliedDeltaAction === 'save' ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUnappliedDeltaAction(null)}
                  className="py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#6D6D72] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveWithUnappliedDelta(false)}
                  className="py-2.5 rounded-xl bg-[#FF3B30]/12 hover:bg-[#FF3B30]/20 text-[#D70015] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  减少并保存
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveWithUnappliedDelta(true)}
                  className="py-2.5 rounded-xl bg-[#34C759] hover:bg-[#30D158] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-sm"
                >
                  增加并保存
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUnappliedDeltaAction(null)}
                  className="py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-colors cursor-pointer"
                >
                  返回编辑
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 rounded-xl bg-[#FF3B30] hover:bg-[#FF453A] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  放弃并退出
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
