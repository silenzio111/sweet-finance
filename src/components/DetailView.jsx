import React, { useState } from 'react';
import { formatMoney, getCurrencyInfo, DEFAULT_DETAIL_CARD_ORDER } from '../data/defaultData';
import { SortableCard } from './SortableCard';
import { moveOrderItem, orderBySavedKeys, reorderOrderItems } from '../utils/sortOrder';
import { Archive, ChevronDown, Lightbulb, Pencil, GripVertical } from 'lucide-react';
import { CollapsedCardDrawer } from './CollapsedCardDrawer';
import { getCategoryIconComponent } from '../data/categoryIcons';

export function DetailView({
  totalIncome,
  totalExpense,
  totalSavings = 0,
  netBalance,
  savingsRate,
  incomeItems = [],
  expenseItems = [],
  savingItems = [],
  hustleStats,
  largeExpenseStats,
  onEditItem,
  onViewAdjustments,
  showIncome = true,
  showExpense = true,
  showSavings = true,
  cardOrder = DEFAULT_DETAIL_CARD_ORDER,
  onReorderCards,
  overviewCardOrder = ['balance', 'savings'],
  onReorderOverviewCards,
  incomeCategoryOrder = [],
  onReorderIncomeCategories,
  incomeItemOrder = [],
  onReorderIncomeItems,
  expenseCategoryOrder = [],
  onReorderExpenseCategories,
  expenseItemOrder = [],
  onReorderExpenseItems,
  majorExpenseOrder = [],
  onReorderMajorExpenses,
  regularExpenseOrder = [],
  onReorderRegularExpenses,
  savingCategoryOrder = [],
  onReorderSavingCategories,
  savingItemOrder = [],
  onReorderSavingItems,
  collapsedCards = [],
  onCollapsedCardsChange,
  collapsedIncomeCategories = [],
  onCollapsedIncomeCategoriesChange,
  collapsedExpenseCategories = [],
  onCollapsedExpenseCategoriesChange,
  collapsedSavingCategories = [],
  onCollapsedSavingCategoriesChange,
  categoryIcons = {},
  isCustomSorting = false
}) {
  const [draggedKey, setDraggedKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [innerDrag, setInnerDrag] = useState({ scope: null, key: null, overKey: null });
  const [collapsedTagGroups, setCollapsedTagGroups] = useState({});

  // Collapsed state for income and saving categories
  const [collapsedCats, setCollapsedCats] = useState({
    '学业与竞赛奖金': true,
    '闲鱼&代做资料': false,
    '压岁钱与理财': true,
    '定期存款': false
  });

  const toggleCategory = (cat) => {
    setCollapsedCats((prev) => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const toggleTagGroup = (groupKey) => {
    setCollapsedTagGroups((previous) => ({
      ...previous,
      [groupKey]: !previous[groupKey]
    }));
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

  const moveInnerCard = (savedOrder, currentKeys, key, delta, onReorder) => {
    onReorder?.(moveOrderItem(savedOrder, currentKeys, key, delta));
  };

  const handleInnerDragStart = (event, scope, key) => {
    if (!isCustomSorting) return;
    event.stopPropagation();
    setInnerDrag({ scope, key, overKey: null });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', key);
  };

  const handleInnerDragOver = (event, scope, key) => {
    if (!isCustomSorting || !innerDrag.scope) return;
    event.stopPropagation();
    if (innerDrag.scope !== scope || innerDrag.key === key) return;
    event.preventDefault();
    setInnerDrag((previous) => ({ ...previous, overKey: key }));
  };

  const handleInnerDrop = (event, scope, targetKey, savedOrder, currentKeys, onReorder) => {
    if (!isCustomSorting) return;
    event.preventDefault();
    event.stopPropagation();

    if (innerDrag.scope === scope && innerDrag.key && innerDrag.key !== targetKey) {
      onReorder?.(
        reorderOrderItems(savedOrder, currentKeys, innerDrag.key, targetKey)
      );
    }

    setInnerDrag({ scope: null, key: null, overKey: null });
  };

  const handleInnerDragEnd = (event) => {
    event.stopPropagation();
    setInnerDrag({ scope: null, key: null, overKey: null });
  };

  const collapseCard = (key) => {
    onCollapsedCardsChange?.([...new Set([...collapsedCards, key])]);
  };

  const restoreCard = (key) => {
    onCollapsedCardsChange?.(collapsedCards.filter((item) => item !== key));
  };

  const collapseIncomeCategory = (key) => {
    onCollapsedIncomeCategoriesChange?.([...new Set([...collapsedIncomeCategories, key])]);
  };

  const restoreIncomeCategory = (key) => {
    onCollapsedIncomeCategoriesChange?.(collapsedIncomeCategories.filter((item) => item !== key));
  };

  const collapseExpenseCategory = (key) => {
    onCollapsedExpenseCategoriesChange?.([...new Set([...collapsedExpenseCategories, key])]);
  };

  const restoreExpenseCategory = (key) => {
    onCollapsedExpenseCategoriesChange?.(collapsedExpenseCategories.filter((item) => item !== key));
  };

  const collapseSavingCategory = (key) => {
    onCollapsedSavingCategoriesChange?.([...new Set([...collapsedSavingCategories, key])]);
  };

  const restoreSavingCategory = (key) => {
    onCollapsedSavingCategoriesChange?.(collapsedSavingCategories.filter((item) => item !== key));
  };

  const getInnerSortProps = ({
    scope,
    key,
    index,
    currentKeys,
    savedOrder,
    onReorder,
    label,
    onCollapse,
    collapseLabel
  }) => ({
    isSorting: isCustomSorting,
    isDragOver: innerDrag.scope === scope && innerDrag.overKey === key,
    canMoveUp: index > 0,
    canMoveDown: index < currentKeys.length - 1,
    onDragStart: (event) => handleInnerDragStart(event, scope, key),
    onDragOver: (event) => handleInnerDragOver(event, scope, key),
    onDragLeave: (event) => {
      event.stopPropagation();
      setInnerDrag((previous) => (
        previous.scope === scope && previous.overKey === key
          ? { ...previous, overKey: null }
          : previous
      ));
    },
    onDragEnd: handleInnerDragEnd,
    onDrop: (event) => handleInnerDrop(event, scope, key, savedOrder, currentKeys, onReorder),
    onMoveUp: () => moveInnerCard(savedOrder, currentKeys, key, -1, onReorder),
    onMoveDown: () => moveInnerCard(savedOrder, currentKeys, key, 1, onReorder),
    label,
    onCollapse,
    collapseLabel
  });

  // Group income by category
  const incomeGrouped = incomeItems.reduce((acc, it) => {
    if (!acc[it.category]) acc[it.category] = [];
    acc[it.category].push(it);
    return acc;
  }, {});

  // Group savings by category
  const savingGrouped = savingItems.reduce((acc, it) => {
    if (!acc[it.category]) acc[it.category] = [];
    acc[it.category].push(it);
    return acc;
  }, {});

  // Expenses use the same category tree as income. Keep the previous major/
  // regular item order as a migration fallback for existing preferences.
  const expenseGrouped = expenseItems.reduce((acc, it) => {
    if (!acc[it.category]) acc[it.category] = [];
    acc[it.category].push(it);
    return acc;
  }, {});

  const incomeCategories = Object.entries(incomeGrouped);
  const expenseCategories = Object.entries(expenseGrouped);
  const savingCategories = Object.entries(savingGrouped);
  const orderedIncomeCategories = orderBySavedKeys(
    incomeCategories.filter(([category]) => !collapsedIncomeCategories.includes(category)),
    ([category]) => category,
    incomeCategoryOrder
  );
  const orderedSavingCategories = orderBySavedKeys(
    savingCategories.filter(([category]) => !collapsedSavingCategories.includes(category)),
    ([category]) => category,
    savingCategoryOrder
  );
  const orderedIncomeCategoryKeys = orderedIncomeCategories.map(([category]) => category);
  const orderedExpenseCategories = orderBySavedKeys(
    expenseCategories.filter(([category]) => !collapsedExpenseCategories.includes(category)),
    ([category]) => category,
    expenseCategoryOrder
  );
  const orderedExpenseCategoryKeys = orderedExpenseCategories.map(([category]) => category);
  const orderedSavingCategoryKeys = orderedSavingCategories.map(([category]) => category);

  const effectiveExpenseItemOrder = Array.isArray(expenseItemOrder) && expenseItemOrder.length > 0
    ? expenseItemOrder
    : [...majorExpenseOrder, ...regularExpenseOrder];

  const getCategoryTags = (catItems) => Array.from(new Set(
    catItems
      .map((item) => String(item.tag || '').trim())
      .filter(Boolean)
  ));

  const getTagCounts = (items) => items.reduce((counts, item) => {
    const tag = String(item.tag || '').trim();
    if (tag) counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});

  const isGroupedTag = (tag, tagCounts) => Boolean(tag && tagCounts[tag] >= 2);

  const shouldShowTagGroupHeader = (items, index, tagCounts) => {
    const tag = String(items[index]?.tag || '').trim();
    if (!isGroupedTag(tag, tagCounts)) return false;
    const previousTag = String(items[index - 1]?.tag || '').trim();
    return previousTag !== tag || !isGroupedTag(previousTag, tagCounts);
  };

  const renderTagGroupHeader = (tag, count, groupKey, tone = 'neutral') => {
    const toneClass = tone === 'expense'
      ? 'text-[#D70015] bg-[#FF3B30]/[0.06] border-[#FF3B30]/[0.12]'
      : tone === 'saving'
        ? 'text-[#007AFF] bg-[#007AFF]/[0.05] border-[#007AFF]/[0.12]'
        : 'text-[#248A3D] bg-[#34C759]/[0.06] border-[#34C759]/[0.12]';
    const isCollapsed = collapsedTagGroups[groupKey] === true;

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleTagGroup(groupKey);
        }}
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? '展开' : '折叠'}标签${tag}下的${count}项`
        }
        className={`w-full flex items-center justify-between gap-2 px-1.5 py-1.5 mt-1 border-y text-[10px] font-semibold text-left ${toneClass} hover:brightness-95 transition-all cursor-pointer`}
      >
        <span className="truncate">标签：{tag}</span>
        <span className="flex items-center gap-1 font-mono shrink-0">
          {count}项
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} strokeWidth={2.4} />
        </span>
      </button>
    );
  };

  const formatCategorySummary = (tags, count, unit = '项') => (
    `（${tags.length > 0 ? `${tags.length}个标签，` : ''}${count}${unit}）`
  );

  const getCatIcon = (cat, type = 'income') => {
    const CategoryIcon = getCategoryIconComponent(cat, type, categoryIcons);
    const color = type === 'expense'
      ? 'text-[#FF3B30]'
      : type === 'saving'
        ? 'text-[#007AFF]'
        : 'text-[#34C759]';
    return <CategoryIcon className={`w-4 h-4 ${color}`} strokeWidth={2.2} />;
  };

  const visibleCardOrder = cardOrder.filter((key) => !collapsedCards.includes(key));
  const cardLabels = {
    overview: '年度概览',
    income_section: '收入细项',
    expense_section: '支出明细',
    saving_section: '存款与资产沉淀'
  };

  // Render individual section by key
  const renderSectionContent = (key) => {
    switch (key) {
      case 'overview':
        return (
          <div className="bg-white rounded-[26px] p-5 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
            {/* Top: 收入 & 支出 并列主显区 */}
            <div className="flex justify-between items-center px-1">
              {/* 收入 (左) */}
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs font-bold text-[#248A3D] flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#34C759] shrink-0"></span>
                  <span>总收入</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#1C1C1E] tracking-tight truncate">
                  + ¥{formatMoney(totalIncome)}
                </div>
              </div>

              {/* 竖向细腻分割线 */}
              <div className="w-[1px] h-10 bg-black/[0.06] shrink-0 mx-2"></div>

              {/* 支出 (右) */}
              <div className="min-w-0 flex-1 pl-2 text-right">
                <div className="text-xs font-bold text-[#D70015] flex items-center justify-end gap-1.5 mb-1">
                  <span>总支出</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30] shrink-0"></span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#1C1C1E] tracking-tight truncate">
                  - ¥{formatMoney(totalExpense)}
                </div>
              </div>
            </div>

            {/* 详细模式收入与支出的红绿双轨对比进度线 (用户指定保留) */}
            {(() => {
              const totalFlow = (Number(totalIncome) || 0) + (Number(totalExpense) || 0);
              const incRatio = totalFlow > 0 ? ((Number(totalIncome) || 0) / totalFlow) * 100 : 50;
              const expRatio = totalFlow > 0 ? ((Number(totalExpense) || 0) / totalFlow) * 100 : 50;

              return (
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-[#E5E5EA] h-2 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
                    <div
                      className="bg-gradient-to-r from-[#34C759] to-[#30D158] h-full rounded-l-full transition-all duration-700 shadow-sm"
                      style={{ width: `${incRatio}%` }}
                      title={`收入占比 ${incRatio.toFixed(1)}%`}
                    ></div>
                    <div
                      className="bg-gradient-to-r from-[#FF453A] to-[#FF3B30] h-full rounded-r-full transition-all duration-700 shadow-sm"
                      style={{ width: `${expRatio}%` }}
                      title={`支出占比 ${expRatio.toFixed(1)}%`}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#8E8E93] font-mono">
                    <span className="text-[#248A3D] font-medium">流入 {incRatio.toFixed(1)}%</span>
                    <span className="text-[#D70015] font-medium">流出 {expRatio.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })()}

            {/* 结余与存款 (并列横向微卡) */}
            {(() => {
              const overviewCards = [
                {
                  key: 'balance',
                  content: (
                    <div className="bg-[#F2F2F7]/70 p-2.5 rounded-xl flex items-center justify-between">
                      {showSavings ? (
                        <div>
                          <span className="text-[10px] font-semibold text-[#8E8E93] block">结余</span>
                          <span className="font-mono font-bold text-xs text-[#1C1C1E]">¥{formatMoney(netBalance)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <span className="text-xs font-semibold text-[#8E8E93] shrink-0">结余</span>
                          <span className="font-mono font-bold text-sm text-[#1C1C1E] truncate">¥{formatMoney(netBalance)}</span>
                        </div>
                      )}
                      <span className="text-[9px] bg-[#34C759]/12 text-[#248A3D] px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        留存 {savingsRate}%
                      </span>
                    </div>
                  )
                },
                ...(showSavings ? [{
                  key: 'savings',
                  content: (
                    <div className="bg-[#007AFF]/6 p-2.5 rounded-xl flex items-center justify-between border border-[#007AFF]/12">
                      <div>
                        <span className="text-[10px] font-semibold text-[#007AFF] block">累计存款</span>
                        <span className="font-mono font-bold text-xs text-[#007AFF]">🏦 ¥{formatMoney(totalSavings)}</span>
                      </div>
                      <span className="text-[9px] bg-[#007AFF]/12 text-[#007AFF] px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        {savingItems.length}笔
                      </span>
                    </div>
                  )
                }] : [])
              ];
              const orderedOverviewCards = orderBySavedKeys(overviewCards, (card) => card.key, overviewCardOrder);
              const overviewKeys = orderedOverviewCards.map((card) => card.key);

              return (
                <div className={`grid ${showSavings ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-2 border-t border-black/[0.04]`}>
                  {orderedOverviewCards.map((card, index) => (
                    <SortableCard
                      key={card.key}
                      className="min-w-0"
                      {...getInnerSortProps({
                        scope: 'overview-card',
                        key: card.key,
                        index,
                        currentKeys: overviewKeys,
                        savedOrder: overviewCardOrder,
                        onReorder: onReorderOverviewCards,
                        label: '调整概览微卡'
                      })}
                    >
                      {card.content}
                    </SortableCard>
                  ))}
                </div>
              );
            })()}
          </div>
        );

      case 'income_section':
        if (!showIncome) return null;
        return (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-6">
              <span className="text-xs font-bold text-[#1C1C1E]">
                一、收入细项
              </span>
              <span className="text-xs font-mono font-bold text-[#34C759] truncate max-w-[160px] text-right">
                + ¥{formatMoney(totalIncome)}
              </span>
            </div>

            {/* 动态收入分类树 */}
            <div className="space-y-2.5">
              {orderedIncomeCategories.map(([cat, catItems], index) => {
                const catTotal = catItems.reduce((s, i) => s + Number(i.amount || 0), 0);
                const categoryTags = getCategoryTags(catItems);
                const orderedIncomeItems = orderBySavedKeys(catItems, (item) => item.id, incomeItemOrder);
                const orderedIncomeItemKeys = orderedIncomeItems.map((item) => String(item.id));
                const incomeTagCounts = getTagCounts(orderedIncomeItems);
                const isCollapsed = collapsedCats[cat] !== false;

                return (
                  <SortableCard
                    key={cat}
                    className="bg-white rounded-[20px] border border-black/[0.04] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
                    {...getInnerSortProps({
                      scope: 'income-category',
                      key: cat,
                      index,
                      currentKeys: orderedIncomeCategoryKeys,
                      savedOrder: incomeCategoryOrder,
                      onReorder: onReorderIncomeCategories,
                      onCollapse: () => collapseIncomeCategory(cat),
                      collapseLabel: '折叠收入分类到页面底部',
                      label: '调整收入分类'
                    })}
                  >
                    <div
                      onClick={() => toggleCategory(cat)}
                      className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-black/[0.02] transition-colors select-none gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-2 flex-wrap">
                          <div className="w-6 h-6 rounded-lg bg-[#F2F2F7] flex items-center justify-center shrink-0">
                            {getCatIcon(cat, 'income')}
                          </div>
                          <span className="truncate">{cat}</span>
                          <span
                            className="text-[10px] text-[#8E8E93] font-normal shrink-0"
                            title={categoryTags.length > 0 ? `标签：${categoryTags.join('、')}` : undefined}
                          >
                            {formatCategorySummary(categoryTags, catItems.length)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 font-mono shrink-0">
                        <span className="text-xs font-bold text-[#34C759] max-w-[130px] truncate text-right">+ {formatMoney(catTotal)}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform duration-200 shrink-0 ${
                            !isCollapsed ? 'rotate-180 text-[#1C1C1E]' : ''
                          }`}
                          strokeWidth={2.2}
                        />
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-black/[0.04] bg-[#F2F2F7]/50 space-y-2 text-xs divide-y divide-black/[0.04]">
                        {orderedIncomeItems.map((item, itemIndex) => {
                          const isForeign = item.currency && item.currency !== 'CNY';
                          const curr = isForeign ? getCurrencyInfo(item.currency) : null;
                          const itemTag = String(item.tag || '').trim();
                          const groupedTag = isGroupedTag(itemTag, incomeTagCounts);
                          const tagGroupKey = `income:${cat}:${itemTag}`;
                          const tagGroupCollapsed = groupedTag && collapsedTagGroups[tagGroupKey] === true;

                          return (
                            <React.Fragment key={item.id}>
                              {shouldShowTagGroupHeader(orderedIncomeItems, itemIndex, incomeTagCounts)
                                && renderTagGroupHeader(itemTag, incomeTagCounts[itemTag], tagGroupKey)}
                              {(!groupedTag || !tagGroupCollapsed) && (
                              <SortableCard
                                className="px-1"
                                {...getInnerSortProps({
                                  scope: `income-item:${cat}`,
                                  key: String(item.id),
                                  index: itemIndex,
                                  currentKeys: orderedIncomeItemKeys,
                                  savedOrder: incomeItemOrder,
                                  onReorder: onReorderIncomeItems,
                                  label: '调整收入细项'
                                })}
                              >
                            <div className="flex justify-between items-center pt-2 first:pt-1 gap-2">
                              <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onViewAdjustments?.(item);
                                  }}
                                  title={`查看「${item.title}」的金额调整记录`}
                                  className="text-[#1C1C1E] font-medium truncate text-left hover:text-[#007AFF] hover:underline transition-colors cursor-pointer"
                                >
                                  • {item.title}
                                </button>
                                {item.tag && !groupedTag && (
                                  <span className="text-[9px] text-[#6D6D72] bg-white border border-black/[0.05] px-1.5 py-0.5 rounded-md truncate max-w-[120px] shrink-0">
                                    {item.tag}
                                  </span>
                                )}
                                {isForeign && (
                                  <span className="text-[9px] bg-black/[0.06] text-[#8E8E93] px-1 py-0.2 rounded font-mono shrink-0">
                                    {item.currency}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.note && (
                                  <span className="text-[10px] text-[#8E8E93] font-sans truncate max-w-[80px]">({item.note})</span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditItem?.(item);
                                  }}
                                  title="点击修改此条金额与信息"
                                  className="bg-[#34C759]/12 hover:bg-[#34C759]/20 text-[#248A3D] border border-[#34C759]/20 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs group/pill cursor-pointer max-w-[160px]"
                                >
                                  <span className="truncate">
                                    + {isForeign ? `${curr.symbol}${item.originalAmount || item.amount}` : `¥${formatMoney(item.amount)}`}
                                  </span>
                                  {isForeign && (
                                    <span className="text-[9px] text-[#248A3D]/70 font-normal">
                                      (≈¥${formatMoney(item.amount)})
                                    </span>
                                  )}
                                  <Pencil className="w-2.5 h-2.5 opacity-40 group-hover/pill:opacity-100 transition-opacity shrink-0" />
                                </button>
                              </div>
                            </div>
                              </SortableCard>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </SortableCard>
                );
              })}
            </div>
          </div>
        );

      case 'expense_section':
        if (!showExpense) return null;
        return (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-6">
              <span className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                <span>二、支出明细</span>
                <span className="text-[10px] bg-[#FF3B30]/12 text-[#D70015] font-mono px-2 py-0.5 rounded-full font-semibold">
                  分类开销
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-[#FF3B30] truncate max-w-[160px] text-right">
                - ¥{formatMoney(totalExpense)}
              </span>
            </div>

            {/* 支出按分类展示，与收入保持一致；大额属性保留在细项标签上。 */}
            <div className="space-y-2.5">
              {orderedExpenseCategories.length === 0 ? (
                <div className="text-xs text-[#8E8E93] text-center py-4 bg-white rounded-2xl border border-black/[0.04]">
                  本年度暂无支出记录
                </div>
              ) : orderedExpenseCategories.map(([cat, catItems], index) => {
                const catTotal = catItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const categoryTags = getCategoryTags(catItems);
                const orderedExpenseItems = orderBySavedKeys(catItems, (item) => item.id, effectiveExpenseItemOrder);
                const orderedExpenseItemKeys = orderedExpenseItems.map((item) => String(item.id));
                const expenseTagCounts = getTagCounts(orderedExpenseItems);
                const isCollapsed = collapsedCats[cat] !== false;

                return (
                  <SortableCard
                    key={cat}
                    className="bg-white rounded-[20px] border border-black/[0.04] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
                    {...getInnerSortProps({
                      scope: 'expense-category',
                      key: cat,
                      index,
                      currentKeys: orderedExpenseCategoryKeys,
                      savedOrder: expenseCategoryOrder,
                      onReorder: onReorderExpenseCategories,
                      onCollapse: () => collapseExpenseCategory(cat),
                      collapseLabel: '折叠支出分类到页面底部',
                      label: '调整支出分类'
                    })}
                  >
                    <div
                      onClick={() => toggleCategory(cat)}
                      className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-black/[0.02] transition-colors select-none gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-2 flex-wrap">
                          <div className="w-6 h-6 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30] shrink-0">
                            {getCatIcon(cat, 'expense')}
                          </div>
                          <span className="truncate">{cat}</span>
                          <span
                            className="text-[10px] text-[#8E8E93] font-normal shrink-0"
                            title={categoryTags.length > 0 ? `标签：${categoryTags.join('、')}` : undefined}
                          >
                            {formatCategorySummary(categoryTags, catItems.length)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 font-mono shrink-0">
                        <span className="text-xs font-bold text-[#FF3B30] max-w-[130px] truncate text-right">- {formatMoney(catTotal)}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform duration-200 shrink-0 ${
                            !isCollapsed ? 'rotate-180 text-[#1C1C1E]' : ''
                          }`}
                          strokeWidth={2.2}
                        />
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-black/[0.04] bg-[#F2F2F7]/50 space-y-2 text-xs divide-y divide-black/[0.04]">
                        {orderedExpenseItems.map((item, itemIndex) => {
                          const isForeign = item.currency && item.currency !== 'CNY';
                          const curr = isForeign ? getCurrencyInfo(item.currency) : null;
                          const isMajor = Number(item.amount) >= 3000 || (item.tag && item.tag.includes('大额'));
                          const itemTag = String(item.tag || '').trim();
                          const groupedTag = isGroupedTag(itemTag, expenseTagCounts);
                          const tagGroupKey = `expense:${cat}:${itemTag}`;
                          const tagGroupCollapsed = groupedTag && collapsedTagGroups[tagGroupKey] === true;

                          return (
                            <React.Fragment key={item.id}>
                              {shouldShowTagGroupHeader(orderedExpenseItems, itemIndex, expenseTagCounts)
                                && renderTagGroupHeader(itemTag, expenseTagCounts[itemTag], tagGroupKey, 'expense')}
                              {(!groupedTag || !tagGroupCollapsed) && (
                              <SortableCard
                                className="px-1"
                                {...getInnerSortProps({
                                  scope: `expense-item:${cat}`,
                                  key: String(item.id),
                                  index: itemIndex,
                                  currentKeys: orderedExpenseItemKeys,
                                  savedOrder: effectiveExpenseItemOrder,
                                  onReorder: onReorderExpenseItems,
                                  label: '调整支出细项'
                                })}
                              >
                              <div className="flex justify-between items-center pt-2 first:pt-1 gap-2">
                                <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onViewAdjustments?.(item);
                                    }}
                                    title={`查看「${item.title}」的金额调整记录`}
                                    className="text-[#1C1C1E] font-medium truncate text-left hover:text-[#007AFF] hover:underline transition-colors cursor-pointer"
                                  >
                                    • {item.title}
                                  </button>
                                  {item.tag && !groupedTag && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md truncate max-w-[120px] shrink-0 ${
                                      isMajor
                                        ? 'text-[#D70015] bg-[#FF3B30]/10 border border-[#FF3B30]/15'
                                        : 'text-[#6D6D72] bg-white border border-black/[0.05]'
                                    }`}>
                                      {item.tag}
                                    </span>
                                  )}
                                  {isForeign && (
                                    <span className="text-[9px] bg-black/[0.06] text-[#8E8E93] px-1 py-0.2 rounded font-mono shrink-0">
                                      {item.currency}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.note && (
                                    <span className="text-[10px] text-[#8E8E93] font-sans truncate max-w-[80px]">({item.note})</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onEditItem?.(item);
                                    }}
                                    title="点击修改此条金额与信息"
                                    className="bg-[#FF3B30]/12 hover:bg-[#FF3B30]/20 text-[#D70015] border border-[#FF3B30]/20 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs group/pill cursor-pointer max-w-[160px]"
                                  >
                                    <span className="truncate">
                                      - {isForeign ? `${curr.symbol}${item.originalAmount || item.amount}` : `¥${formatMoney(item.amount)}`}
                                    </span>
                                    {isForeign && (
                                      <span className="text-[9px] text-[#D70015]/70 font-normal">
                                        (≈¥{formatMoney(item.amount)})
                                      </span>
                                    )}
                                    <Pencil className="w-2.5 h-2.5 opacity-40 group-hover/pill:opacity-100 transition-opacity shrink-0" />
                                  </button>
                                </div>
                              </div>
                              </SortableCard>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </SortableCard>
                );
              })}
            </div>
          </div>
        );

      case 'saving_section':
        if (!showSavings) return null;
        return (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-6">
              <span className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
                <span>三、存款与资产沉淀</span>
                <span className="text-[10px] bg-[#007AFF]/12 text-[#007AFF] font-mono px-2 py-0.5 rounded-full font-semibold">
                  资产储备
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-[#007AFF] truncate max-w-[160px] text-right">
                🏦 ¥{formatMoney(totalSavings)}
              </span>
            </div>

            {savingItems.length === 0 ? (
              <div className="text-xs text-[#8E8E93] text-center py-4 bg-white rounded-2xl border border-black/[0.04]">
                本年度暂无存款与资产记录，可点击右下角「+」选择「存款」添加
              </div>
            ) : (
              <div className="space-y-2.5">
                {orderedSavingCategories.map(([cat, catItems], index) => {
                  const catTotal = catItems.reduce((s, i) => s + Number(i.amount || 0), 0);
                  const categoryTags = getCategoryTags(catItems);
                  const orderedSavingItems = orderBySavedKeys(catItems, (item) => item.id, savingItemOrder);
                  const orderedSavingItemKeys = orderedSavingItems.map((item) => String(item.id));
                  const savingTagCounts = getTagCounts(orderedSavingItems);
                  const isCollapsed = collapsedCats[cat] === true;

                  return (
                    <SortableCard
                      key={cat}
                      className="bg-white rounded-[20px] border border-[#007AFF]/15 overflow-hidden shadow-[0_2px_8px_rgba(0,122,255,0.03)] transition-all"
                      {...getInnerSortProps({
                        scope: 'saving-category',
                        key: cat,
                        index,
                      currentKeys: orderedSavingCategoryKeys,
                      savedOrder: savingCategoryOrder,
                      onReorder: onReorderSavingCategories,
                      onCollapse: () => collapseSavingCategory(cat),
                      collapseLabel: '折叠存款分类到页面底部',
                      label: '调整存款分类'
                      })}
                    >
                      <div
                        onClick={() => toggleCategory(cat)}
                        className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-black/[0.02] transition-colors select-none gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-2 flex-wrap">
                            <div className="w-6 h-6 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0 text-[#007AFF]">
                              {getCatIcon(cat, 'saving')}
                            </div>
                            <span className="truncate">{cat}</span>
                          <span
                            className="text-[10px] text-[#8E8E93] font-normal shrink-0"
                            title={categoryTags.length > 0 ? `标签：${categoryTags.join('、')}` : undefined}
                          >
                            {formatCategorySummary(categoryTags, catItems.length)}
                          </span>
                        </div>
                      </div>

                        <div className="flex items-center space-x-2 font-mono shrink-0">
                          <span className="text-xs font-bold text-[#007AFF] max-w-[130px] truncate text-right">🏦 {formatMoney(catTotal)}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform duration-200 shrink-0 ${
                              !isCollapsed ? 'rotate-180 text-[#1C1C1E]' : ''
                            }`}
                            strokeWidth={2.2}
                          />
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="px-3.5 pb-3 pt-1 border-t border-black/[0.04] bg-[#007AFF]/[0.02] space-y-2 text-xs divide-y divide-black/[0.04]">
                          {orderedSavingItems.map((item, itemIndex) => {
                            const isForeign = item.currency && item.currency !== 'CNY';
                            const curr = isForeign ? getCurrencyInfo(item.currency) : null;
                            const itemTag = String(item.tag || '').trim();
                            const groupedTag = isGroupedTag(itemTag, savingTagCounts);
                            const tagGroupKey = `saving:${cat}:${itemTag}`;
                            const tagGroupCollapsed = groupedTag && collapsedTagGroups[tagGroupKey] === true;

                            return (
                              <React.Fragment key={item.id}>
                                {shouldShowTagGroupHeader(orderedSavingItems, itemIndex, savingTagCounts)
                                  && renderTagGroupHeader(itemTag, savingTagCounts[itemTag], tagGroupKey, 'saving')}
                                {(!groupedTag || !tagGroupCollapsed) && (
                                <SortableCard
                                  className=""
                                  {...getInnerSortProps({
                                    scope: `saving-item:${cat}`,
                                    key: String(item.id),
                                    index: itemIndex,
                                    currentKeys: orderedSavingItemKeys,
                                    savedOrder: savingItemOrder,
                                    onReorder: onReorderSavingItems,
                                    label: '调整存款细项'
                                  })}
                                >
                              <div className="flex justify-between items-center pt-2 first:pt-1 gap-2">
                                <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onViewAdjustments?.(item);
                                    }}
                                    title={`查看「${item.title}」的金额调整记录`}
                                    className="text-[#1C1C1E] font-medium truncate text-left hover:text-[#007AFF] hover:underline transition-colors cursor-pointer"
                                  >
                                    • {item.title}
                                  </button>
                                  {item.tag && !groupedTag && (
                                    <span className="text-[9px] text-[#6D6D72] bg-white border border-[#007AFF]/[0.10] px-1.5 py-0.5 rounded-md truncate max-w-[120px] shrink-0">
                                      {item.tag}
                                    </span>
                                  )}
                                  {isForeign && (
                                    <span className="text-[9px] bg-black/[0.06] text-[#8E8E93] px-1 py-0.2 rounded font-mono shrink-0">
                                      {item.currency}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.note && (
                                    <span className="text-[10px] text-[#8E8E93] font-sans truncate max-w-[80px]">({item.note})</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditItem?.(item);
                                    }}
                                    title="点击修改此条金额与信息"
                                    className="bg-[#007AFF]/12 hover:bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/20 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs group/pill cursor-pointer max-w-[160px]"
                                  >
                                    <span className="truncate">
                                      🏦 {isForeign ? `${curr.symbol}${item.originalAmount || item.amount}` : `¥${formatMoney(item.amount)}`}
                                    </span>
                                    {isForeign && (
                                      <span className="text-[9px] text-[#007AFF]/70 font-normal">
                                        (≈¥${formatMoney(item.amount)})
                                      </span>
                                    )}
                                    <Pencil className="w-2.5 h-2.5 opacity-40 group-hover/pill:opacity-100 transition-opacity shrink-0" />
                                  </button>
                                </div>
                              </div>
                                </SortableCard>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </SortableCard>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="tab-content space-y-3.5 pb-4">
      {/* Dynamic Sections ordered by cardOrder */}
      {visibleCardOrder.map((key, index) => {
        const content = renderSectionContent(key);
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
                ? `p-1.5 rounded-[28px] border-2 border-dashed ${
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
                  <span>按住拖拽板块</span>
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

      {!showIncome && !showExpense && !showSavings && (
        <div className="p-6 bg-white rounded-[22px] border border-black/[0.04] text-center text-xs text-[#8E8E93]">
          已在设置中关闭所有细项清单显示，可在「系统设置」中随时开启
        </div>
      )}

      {/* 深度财务洞察卡 (Apple Style Health Insight Widget) */}
      <div className="bg-white rounded-[22px] p-4 space-y-2.5 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-[#FF9500]" />
          <span>财务健康速评</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-[#F2F2F7]/70 p-3 rounded-2xl border border-black/[0.02]">
            <div className="text-[10px] font-semibold text-[#8E8E93]">副业支撑比</div>
            <div className="text-xs font-bold text-[#1C1C1E] font-mono mt-0.5">
              {hustleStats.ratio}% <span className="text-[10px] text-[#8E8E93] font-normal">(¥{formatMoney(hustleStats.total)})</span>
            </div>
            <div className="text-[9px] text-[#34C759] font-medium mt-0.5">闲鱼 / 代做资料</div>
          </div>
          <div className="bg-[#F2F2F7]/70 p-3 rounded-2xl border border-black/[0.02]">
            <div className="text-[10px] font-semibold text-[#8E8E93]">高额消费占比</div>
            <div className="text-xs font-bold text-[#1C1C1E] font-mono mt-0.5">
              {largeExpenseStats.ratio}% <span className="text-[10px] text-[#8E8E93] font-normal">(¥{formatMoney(largeExpenseStats.total)})</span>
            </div>
            <div className="text-[9px] text-[#FF3B30] font-medium mt-0.5">大额购置款项</div>
          </div>
        </div>
      </div>

      <CollapsedCardDrawer
        label="详细页折叠卡片"
        items={collapsedCards
          .filter((key) => cardOrder.includes(key))
          .map((key) => ({ key, label: cardLabels[key] || key }))}
        onRestore={restoreCard}
      />

      <CollapsedCardDrawer
        label="详细页折叠收入分类"
        items={collapsedIncomeCategories
          .filter((key) => incomeCategories.some(([category]) => category === key))
          .map((key) => ({ key, label: key }))}
        onRestore={restoreIncomeCategory}
      />

      <CollapsedCardDrawer
        label="详细页折叠支出分类"
        items={collapsedExpenseCategories
          .filter((key) => expenseCategories.some(([category]) => category === key))
          .map((key) => ({ key, label: key }))}
        onRestore={restoreExpenseCategory}
      />

      <CollapsedCardDrawer
        label="详细页折叠存款分类"
        items={collapsedSavingCategories
          .filter((key) => savingCategories.some(([category]) => category === key))
          .map((key) => ({ key, label: key }))}
        onRestore={restoreSavingCategory}
      />
    </div>
  );
}
