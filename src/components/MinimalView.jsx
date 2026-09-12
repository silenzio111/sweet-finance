import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { SortableCard } from './SortableCard';
import { formatMoney, DEFAULT_MINIMAL_CARD_ORDER } from '../data/defaultData';
import { moveOrderItem, orderBySavedKeys, reorderOrderItems } from '../utils/sortOrder';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  PiggyBank,
  Scale,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Archive,
  GripVertical
} from 'lucide-react';
import { CollapsedCardDrawer } from './CollapsedCardDrawer';
import { getCategoryIconComponent } from '../data/categoryIcons';

export function MinimalView({
  totalIncome,
  totalExpense,
  totalSavings = 0,
  netBalance,
  savingsRate,
  savingDepositRate = '0.0',
  expenseRate,
  incomeCount = 0,
  expenseCount = 0,
  savingCount = 0,
  categorySummary = [],
  showIncome = true,
  showExpense = true,
  showSavings = true,
  cardOrder = DEFAULT_MINIMAL_CARD_ORDER,
  onReorderCards,
  categoryCardOrder = [],
  onReorderCategories,
  collapsedCards = [],
  onCollapsedCardsChange,
  collapsedCategories = [],
  onCollapsedCategoriesChange,
  categoryIcons = {},
  isCustomSorting = false
}) {
  const [draggedKey, setDraggedKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [draggedCategoryKey, setDraggedCategoryKey] = useState(null);
  const [dragOverCategoryKey, setDragOverCategoryKey] = useState(null);

  const topCategories = categorySummary
    .filter((item) => {
      if (item.type === 'income' && !showIncome) return false;
      if (item.type === 'expense' && !showExpense) return false;
      if (item.type === 'saving' && !showSavings) return false;
      return true;
    })
    .slice(0, 5);

  const hasAnyModule = showIncome || showExpense || showSavings;
  const categoryCardKey = (item) => `${item.type}:${item.category}`;
  const orderedTopCategories = orderBySavedKeys(
    topCategories.filter((item) => !collapsedCategories.includes(categoryCardKey(item))),
    categoryCardKey,
    categoryCardOrder
  );
  const orderedCategoryKeys = orderedTopCategories.map(categoryCardKey);
  const visibleCardOrder = cardOrder.filter((key) => !collapsedCards.includes(key));
  const cardLabels = {
    balance: '结余卡片',
    income: '年度总收入',
    expense: '年度总支出',
    savings: '累计存款储备',
    distribution: '收支与存款分布',
    category_ranking: '核心板块资金分布'
  };

  // Move card up or down
  const moveCard = (key, delta) => {
    const idx = cardOrder.indexOf(key);
    if (idx === -1) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= cardOrder.length) return;
    const newArr = [...cardOrder];
    const [removed] = newArr.splice(idx, 1);
    newArr.splice(newIdx, 0, removed);
    onReorderCards?.(newArr);
  };

  // Drag and drop handlers
  const handleDragStart = (e, key) => {
    if (!isCustomSorting) return;
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragOver = (e, key) => {
    if (!isCustomSorting || draggedKey === key) return;
    e.preventDefault();
    setDragOverKey(key);
  };

  const handleDrop = (e, targetKey) => {
    if (!isCustomSorting) return;
    e.preventDefault();
    const sourceKey = draggedKey || e.dataTransfer.getData('text/plain');
    if (!sourceKey || sourceKey === targetKey) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }
    const currentList = [...cardOrder];
    const sourceIndex = currentList.indexOf(sourceKey);
    const targetIndex = currentList.indexOf(targetKey);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [movedItem] = currentList.splice(sourceIndex, 1);
      currentList.splice(targetIndex, 0, movedItem);
      onReorderCards?.(currentList);
    }
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const moveCategoryCard = (key, delta) => {
    onReorderCategories?.(moveOrderItem(categoryCardOrder, orderedCategoryKeys, key, delta));
  };

  const collapseCard = (key) => {
    onCollapsedCardsChange?.([...new Set([...collapsedCards, key])]);
  };

  const restoreCard = (key) => {
    onCollapsedCardsChange?.(collapsedCards.filter((item) => item !== key));
  };

  const collapseCategory = (key) => {
    onCollapsedCategoriesChange?.([...new Set([...collapsedCategories, key])]);
  };

  const restoreCategory = (key) => {
    onCollapsedCategoriesChange?.(collapsedCategories.filter((item) => item !== key));
  };

  const handleCategoryDragStart = (event, key) => {
    if (!isCustomSorting) return;
    event.stopPropagation();
    setDraggedCategoryKey(key);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', key);
  };

  const handleCategoryDragOver = (event, key) => {
    if (!isCustomSorting || draggedCategoryKey === key) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOverCategoryKey(key);
  };

  const handleCategoryDrop = (event, targetKey) => {
    if (!isCustomSorting) return;
    event.preventDefault();
    event.stopPropagation();
    const sourceKey = draggedCategoryKey || event.dataTransfer.getData('text/plain');

    if (sourceKey && sourceKey !== targetKey) {
      onReorderCategories?.(
        reorderOrderItems(categoryCardOrder, orderedCategoryKeys, sourceKey, targetKey)
      );
    }

    setDraggedCategoryKey(null);
    setDragOverCategoryKey(null);
  };

  const handleCategoryDragEnd = (event) => {
    event.stopPropagation();
    setDraggedCategoryKey(null);
    setDragOverCategoryKey(null);
  };

  // Render individual card content based on key
  const renderCardContent = (key) => {
    switch (key) {
      case 'balance':
        return (
          <div className="bg-white/95 rounded-[18px] px-6 py-3.5 flex justify-between items-center transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04]">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E] shadow-2xs shrink-0">
                <Wallet className="w-4.5 h-4.5 text-[#1C1C1E]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#8E8E93] block leading-tight mb-0.5">结余</span>
                <span className="text-lg sm:text-xl font-mono font-bold text-[#1C1C1E] flex items-center gap-1 truncate tracking-tight">
                  <span className="text-xs text-[#8E8E93]">¥</span>
                  <AnimatedNumber value={netBalance} duration={600} />
                </span>
              </div>
            </div>

            <div className="flex items-center shrink-0">
              <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/12 px-2.5 py-1 rounded-full border border-[#34C759]/15 font-mono shrink-0">
                留存率 {savingsRate}%
              </span>
            </div>
          </div>
        );

      case 'income':
        if (!showIncome) return null;
        return (
          <div className="relative group rounded-[24px] p-5 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(52,199,89,0.12)] active:scale-[0.99] border border-[#34C759]/25 bg-gradient-to-br from-[#34C759]/12 via-[#34C759]/5 to-white backdrop-blur-xl shadow-[0_4px_20px_rgba(52,199,89,0.06)]">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#34C759]/20 rounded-full blur-2xl animate-glow-emerald pointer-events-none"></div>
            <div className="shimmer-layer"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#34C759] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(52,199,89,0.35)] group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                      <span>年度总收入</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#34C759]/12 text-[#248A3D] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#34C759]/20 flex items-center gap-1 shadow-2xs font-mono">
                  <span>{incomeCount} 笔入账</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold font-mono text-[#1C1C1E] tracking-tight flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#34C759]">+ ¥</span>
                  <AnimatedNumber value={totalIncome} duration={900} />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-[#34C759]/15 flex items-center justify-between text-[11px] text-[#8E8E93]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
                  学业竞赛 · 闲鱼副业 · 压岁理财
                </span>
              </div>
            </div>
          </div>
        );

      case 'expense':
        if (!showExpense) return null;
        return (
          <div className="relative group rounded-[24px] p-5 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,59,48,0.12)] active:scale-[0.99] border border-[#FF3B30]/25 bg-gradient-to-br from-[#FF3B30]/12 via-[#FF3B30]/5 to-white backdrop-blur-xl shadow-[0_4px_20px_rgba(255,59,48,0.06)]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#FF3B30]/20 rounded-full blur-2xl animate-glow-rose pointer-events-none"></div>
            <div className="shimmer-layer"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FF3B30] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(255,59,48,0.35)] group-hover:scale-105 transition-transform">
                    <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                      <span>年度总支出</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"></span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FF3B30]/12 text-[#D70015] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#FF3B30]/20 flex items-center gap-1 shadow-2xs font-mono">
                  <span>{expenseCount} 笔开销</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold font-mono text-[#1C1C1E] tracking-tight flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#FF3B30]">- ¥</span>
                  <AnimatedNumber value={totalExpense} duration={900} />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
                  <ArrowDownRight className="w-4 h-4" strokeWidth={2.2} />
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-[#FF3B30]/15 flex items-center justify-between text-[11px] text-[#8E8E93]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"></span>
                  商场服饰 · 数码好物 · 休闲娱乐
                </span>
                <span className="font-mono font-semibold text-[#FF3B30]">支出占比 {expenseRate}%</span>
              </div>
            </div>
          </div>
        );

      case 'savings':
        if (!showSavings) return null;
        return (
          <div className="relative group rounded-[24px] p-5 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,122,255,0.12)] active:scale-[0.99] border border-[#007AFF]/25 bg-gradient-to-br from-[#007AFF]/12 via-[#007AFF]/5 to-white backdrop-blur-xl shadow-[0_4px_20px_rgba(0,122,255,0.06)]">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-2xl animate-glow pointer-events-none"></div>
            <div className="shimmer-layer"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,122,255,0.35)] group-hover:scale-105 transition-transform">
                    <PiggyBank className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                      <span>累计存款储备</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></span>
                    </div>
                    <span className="text-[10px] text-[#007AFF] font-medium">稳健财富沉淀</span>
                  </div>
                </div>

                <div className="bg-[#007AFF]/12 text-[#007AFF] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#007AFF]/20 flex items-center gap-1 shadow-2xs font-mono">
                  <span>{savingCount} 笔存款</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold font-mono text-[#1C1C1E] tracking-tight flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#007AFF]">🏦 ¥</span>
                  <AnimatedNumber value={totalSavings} duration={900} />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PiggyBank className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-[#007AFF]/15 flex items-center justify-between text-[11px] text-[#8E8E93]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></span>
                  定期存款 · 基金理财 · 备用金
                </span>
                <span className="font-mono font-semibold text-[#007AFF]">储蓄沉淀率 {savingDepositRate}%</span>
              </div>
            </div>
          </div>
        );

      case 'distribution':
        if (!hasAnyModule) return null;
        const visibleIncome = showIncome ? (Number(totalIncome) || 0) : 0;
        const visibleExpense = showExpense ? (Number(totalExpense) || 0) : 0;
        const visibleSavings = showSavings ? (Number(totalSavings) || 0) : 0;
        const totalFlow = visibleIncome + visibleExpense + visibleSavings;

        const incomeRatio = totalFlow > 0 && showIncome ? (visibleIncome / totalFlow) * 100 : 0;
        const expenseRatio = totalFlow > 0 && showExpense ? (visibleExpense / totalFlow) * 100 : 0;
        const savingRatio = totalFlow > 0 && showSavings ? (visibleSavings / totalFlow) * 100 : 0;

        const ratioTexts = [];
        if (showIncome) ratioTexts.push(`流入 ${incomeRatio.toFixed(0)}%`);
        if (showExpense) ratioTexts.push(`支出 ${expenseRatio.toFixed(0)}%`);
        if (showSavings) ratioTexts.push(`存款 ${savingRatio.toFixed(0)}%`);

        return (
          <div className="bg-white/95 rounded-[22px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04]">
            <div className="flex justify-between items-center text-xs font-semibold text-[#1C1C1E] mb-2.5">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#007AFF]" strokeWidth={2.2} />
                <span>收支与存款分布</span>
              </span>
              <span className="font-mono text-[11px] text-[#8E8E93]">
                {ratioTexts.join(' · ')}
              </span>
            </div>

            {/* Apple Dynamic Multi-Segment Progress Bar */}
            <div className="w-full bg-[#E5E5EA] h-2.5 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
              {showIncome && incomeRatio > 0 && (
                <div
                  className="bg-gradient-to-r from-[#34C759] to-[#30D158] h-full rounded-l-full transition-all duration-700 shadow-sm"
                  style={{ width: `${incomeRatio}%` }}
                  title={`收入 ${incomeRatio.toFixed(1)}%`}
                ></div>
              )}
              {showExpense && expenseRatio > 0 && (
                <div
                  className={`bg-gradient-to-r from-[#FF453A] to-[#FF3B30] h-full transition-all duration-700 shadow-sm ${
                    !showIncome ? 'rounded-l-full' : ''
                  } ${!showSavings ? 'rounded-r-full' : ''}`}
                  style={{ width: `${expenseRatio}%` }}
                  title={`支出 ${expenseRatio.toFixed(1)}%`}
                ></div>
              )}
              {showSavings && savingRatio > 0 && (
                <div
                  className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] h-full rounded-r-full transition-all duration-700 shadow-sm"
                  style={{ width: `${savingRatio}%` }}
                  title={`存款 ${savingRatio.toFixed(1)}%`}
                ></div>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#8E8E93] mt-2.5 font-medium">
              {showIncome && (
                <span className="flex items-center gap-1 text-[#34C759]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span> 收入
                </span>
              )}
              {showExpense && (
                <span className="flex items-center gap-1 text-[#FF3B30]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"></span> 支出
                </span>
              )}
              {showSavings && (
                <span className="flex items-center gap-1 text-[#007AFF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></span> 存款
                </span>
              )}
            </div>
          </div>
        );

      case 'category_ranking':
        if (topCategories.length === 0) return null;
        return (
          <div className="bg-white/95 rounded-[22px] p-4 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04]">
            <div className="text-xs font-bold text-[#1C1C1E] flex items-center justify-between">
              <span>📌 核心板块资金分布</span>
              <span className="text-[10px] text-[#8E8E93] font-normal">完整明细在「详细」栏</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {orderedTopCategories.map((item, index) => {
                const isInc = item.type === 'income';
                const isSav = item.type === 'saving';
                const baseTotal = isInc ? totalIncome : isSav ? totalSavings : totalExpense;
                const percent = baseTotal > 0
                  ? Math.min(100, Math.round((item.total / baseTotal) * 100))
                  : 0;

                const badgeBg = isInc ? 'bg-[#34C759]' : isSav ? 'bg-[#007AFF]' : 'bg-[#FF3B30]';
                const textAmtColor = isInc ? 'text-[#34C759]' : isSav ? 'text-[#007AFF]' : 'text-[#FF3B30]';
                const prefix = isInc ? '+' : isSav ? '🏦' : '-';
                const categoryKey = categoryCardKey(item);
                const CategoryIcon = getCategoryIconComponent(item.category, item.type, categoryIcons);

                return (
                  <SortableCard
                    key={categoryKey}
                    isSorting={isCustomSorting}
                    isDragOver={dragOverCategoryKey === categoryKey}
                    canMoveUp={index > 0}
                    canMoveDown={index < orderedTopCategories.length - 1}
                    onDragStart={(event) => handleCategoryDragStart(event, categoryKey)}
                    onDragOver={(event) => handleCategoryDragOver(event, categoryKey)}
                    onDragLeave={(event) => {
                      event.stopPropagation();
                      setDragOverCategoryKey(null);
                    }}
                    onDragEnd={handleCategoryDragEnd}
                    onDrop={(event) => handleCategoryDrop(event, categoryKey)}
                    onMoveUp={() => moveCategoryCard(categoryKey, -1)}
                    onMoveDown={() => moveCategoryCard(categoryKey, 1)}
                    onCollapse={() => collapseCategory(categoryKey)}
                    collapseLabel="折叠分类卡片到页面底部"
                    label="调整分类卡片"
                  >
                    <div className="p-3 rounded-2xl border transition-all bg-[#F2F2F7]/70 border-black/[0.03]">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold flex items-center gap-1.5 text-xs text-[#1C1C1E]">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isInc ? 'bg-[#34C759]/10 text-[#34C759]' : isSav ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                          }`}>
                            <CategoryIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                          </span>
                          <span>{item.category}</span>
                          <span
                            className="text-[10px] text-[#8E8E93] font-normal"
                            title={item.tags?.length > 0 ? `标签：${item.tags.join('、')}` : undefined}
                          >
                            （{item.tags?.length > 0 ? `${item.tags.length}个标签，` : ''}{item.count}笔）
                          </span>
                        </span>
                        <span className={`font-mono font-bold text-xs ${textAmtColor}`}>
                          {prefix} ¥{formatMoney(item.total)}
                        </span>
                      </div>

                      {/* Mini category ratio bar */}
                      <div className="w-full bg-black/[0.04] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${badgeBg}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </SortableCard>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="tab-content space-y-3 pb-2">
      {/* Render Cards in Dynamic Order */}
      {visibleCardOrder.map((key, index) => {
        const content = renderCardContent(key);
        if (!content) return null;

        return (
          <div
            key={key}
            draggable={isCustomSorting}
            onDragStart={(e) => handleDragStart(e, key)}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={() => setDragOverKey(null)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, key)}
            className={`transition-all duration-200 ${
              isCustomSorting
                ? `p-1.5 rounded-[26px] border-2 border-dashed ${
                    dragOverKey === key
                      ? 'border-[#007AFF] bg-[#007AFF]/10 ring-4 ring-[#007AFF]/20 scale-[1.02]'
                      : 'border-[#007AFF]/35 bg-white/40 hover:border-[#007AFF]/60'
                  } shadow-sm cursor-grab active:cursor-grabbing`
                : ''
            }`}
          >
            {/* Reorder Handle Bar (Shown only during Custom Sorting) */}
            {isCustomSorting && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007AFF]">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span>按住拖拽卡片</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCard(key, -1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white text-[#1C1C1E] shadow-2xs flex items-center justify-center text-xs font-bold disabled:opacity-30 active:scale-90 transition-all cursor-pointer"
                    title="上移"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={cardOrder.indexOf(key) === cardOrder.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCard(key, 1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white text-[#1C1C1E] shadow-2xs flex items-center justify-center text-xs font-bold disabled:opacity-30 active:scale-90 transition-all cursor-pointer"
                    title="下移"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      collapseCard(key);
                    }}
                    className="w-6 h-6 rounded-lg bg-white text-[#007AFF] shadow-2xs flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    title="折叠到页面底部"
                    aria-label={`折叠${cardLabels[key] || '卡片'}到页面底部`}
                  >
                    <Archive className="w-3 h-3" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            )}

            {content}
          </div>
        );
      })}

      <CollapsedCardDrawer
        label="极简页折叠卡片"
        items={collapsedCards
          .filter((key) => cardOrder.includes(key))
          .map((key) => ({ key, label: cardLabels[key] || key }))}
        onRestore={restoreCard}
      />

      <CollapsedCardDrawer
        label="极简页折叠分类"
        items={collapsedCategories
          .filter((key) => topCategories.some((item) => categoryCardKey(item) === key))
          .map((key) => ({
            key,
            label: topCategories.find((item) => categoryCardKey(item) === key)?.category || key
          }))}
        onRestore={restoreCategory}
      />

      {!hasAnyModule && (
        <div className="p-6 bg-white rounded-[22px] border border-black/[0.04] text-center text-xs text-[#8E8E93]">
          已在设置中关闭所有模块显示，点击左上角齿轮可随时开启
        </div>
      )}

      {/* Apple Slogan Caption */}
      <div className="pt-2 pb-1 text-center text-[11px] text-[#8E8E93] flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-[#FF9500]" />
        <span>看清收支流动与财富沉淀，掌控属于自己的财务节奏。</span>
      </div>
    </div>
  );
}
