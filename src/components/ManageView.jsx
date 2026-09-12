import React, { useState } from 'react';
import { formatMoney, getCurrencyInfo } from '../data/defaultData';
import { Tag, Pencil, Trash2, Folder, FileText, History } from 'lucide-react';

export function ManageView({
  items,
  onEditItem,
  onViewAdjustments,
  onDeleteItem,
  onOpenCategories,
  onRequestConfirm
}) {
  const [filter, setFilter] = useState('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'income') return item.type === 'income';
    if (filter === 'expense') return item.type === 'expense';
    if (filter === 'saving') return item.type === 'saving';
    return true;
  });

  const handleDelete = (item) => {
    const isForeign = item.currency && item.currency !== 'CNY';
    const disp = isForeign
      ? `${getCurrencyInfo(item.currency).symbol}${item.originalAmount || item.amount} (≈¥${formatMoney(item.amount)})`
      : `¥${formatMoney(item.amount)}`;
    onRequestConfirm?.({
      tone: 'danger',
      title: '删除账目',
      description: `确定删除「${item.title}」（${disp}）吗？删除后可通过顶部撤销按钮恢复。`,
      confirmLabel: '删除账目',
      onConfirm: () => onDeleteItem(item.id)
    });
  };

  return (
    <div className="tab-content space-y-3.5 pb-4">
      {/* Top Filter and Action Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* iOS Inset Segmented Control */}
        <div className="flex bg-[#767680]/12 p-[3px] rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-[8px] transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_6px_rgba(0,0,0,0.1)] font-bold'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-2.5 py-1 rounded-[8px] transition-all cursor-pointer ${
              filter === 'income'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_6px_rgba(0,0,0,0.1)] font-bold'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            收入
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-2.5 py-1 rounded-[8px] transition-all cursor-pointer ${
              filter === 'expense'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_6px_rgba(0,0,0,0.1)] font-bold'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            支出
          </button>
          <button
            onClick={() => setFilter('saving')}
            className={`px-2.5 py-1 rounded-[8px] transition-all cursor-pointer ${
              filter === 'saving'
                ? 'bg-white text-[#1C1C1E] shadow-[0_2px_6px_rgba(0,0,0,0.1)] font-bold'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            存款
          </button>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenCategories}
            title="管理收支与存款分类"
            className="bg-[#1C1C1E] hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Tag className="w-3 h-3 text-[#34C759]" />
            <span>分类管理</span>
          </button>
        </div>
      </div>

      {/* Info Subheader */}
      <div className="flex justify-between items-center px-1 text-xs text-[#8E8E93]">
        <span className="font-medium">
          共 {filteredItems.length} 笔记录 (
          {filter === 'all' ? '全部' : filter === 'income' ? '仅收入' : filter === 'expense' ? '仅支出' : '仅存款'})
        </span>
      </div>

      {/* Item List (iOS Inset Grouped Cards) */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8E8E93] bg-white rounded-[22px] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            暂无相关账目记录
          </div>
        ) : (
          filteredItems.map((item) => {
            const isInc = item.type === 'income';
            const isSav = item.type === 'saving';
            const isForeign = item.currency && item.currency !== 'CNY';
            const curr = isForeign ? getCurrencyInfo(item.currency) : null;
            const badgeClass = isInc
              ? 'bg-[#34C759]/12 text-[#248A3D] border-[#34C759]/20'
              : isSav
              ? 'bg-[#007AFF]/12 text-[#007AFF] border-[#007AFF]/20'
              : 'bg-[#FF3B30]/12 text-[#D70015] border-[#FF3B30]/20';
            const amtClass = isInc ? 'text-[#34C759]' : isSav ? 'text-[#007AFF]' : 'text-[#FF3B30]';
            const typePrefix = isInc ? '+' : isSav ? '🏦' : '-';
            const typeLabel = isInc ? '收入' : isSav ? '存款' : '支出';
            const adjustments = Array.isArray(item.adjustments) ? item.adjustments : [];
            const latestAdjustment = adjustments[adjustments.length - 1];
            const latestAdjustmentCurrency = latestAdjustment
              ? getCurrencyInfo(latestAdjustment.currency || item.currency || 'CNY')
              : null;

            return (
              <div
                key={item.id}
                className="bg-white border border-black/[0.04] rounded-[20px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex justify-between items-center hover:border-black/[0.08] transition-all"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeClass}`}>
                      {typeLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewAdjustments?.(item)}
                      title={`查看「${item.title}」的金额调整记录`}
                      className="min-w-0 text-xs font-bold text-[#1C1C1E] truncate text-left hover:text-[#007AFF] hover:underline transition-colors cursor-pointer"
                    >
                      {item.title}
                    </button>
                    <span className="text-[9px] bg-[#F2F2F7] text-[#8E8E93] px-1.5 py-0.5 rounded-md font-mono">
                      {item.year || '2026'}年
                    </span>
                    {isForeign && (
                      <span className="text-[9px] bg-black/[0.06] text-[#8E8E93] px-1.5 py-0.5 rounded-md font-mono font-bold">
                        {item.currency}
                      </span>
                    )}
                    {item.tag && (
                      <span className="text-[9px] bg-[#F2F2F7] text-[#8E8E93] px-1.5 py-0.5 rounded-md font-medium">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8E8E93] mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-0.5">
                      <Folder className="w-2.5 h-2.5" />
                      <span>{item.category}</span>
                    </span>
                    {item.note && (
                      <span className="flex items-center gap-0.5">
                        <FileText className="w-2.5 h-2.5" />
                        <span>{item.note}</span>
                      </span>
                    )}
                    {latestAdjustment && (
                      <span className="flex items-center gap-0.5 min-w-0" title="最近一次金额调整">
                        <History className="w-2.5 h-2.5 shrink-0 text-[#007AFF]" />
                        <span className="truncate">
                          调整 {latestAdjustment.operation === 'sub' ? '-' : '+'}{latestAdjustmentCurrency.symbol}{formatMoney(latestAdjustment.amount)}
                          {latestAdjustment.note ? ` · ${latestAdjustment.note}` : ''}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <div className={`font-mono font-bold text-xs ${amtClass}`}>
                      {typePrefix} {isForeign ? `${curr.symbol}${item.originalAmount || item.amount}` : `¥${formatMoney(item.amount)}`}
                    </div>
                    {isForeign && (
                      <div className="text-[9px] text-[#8E8E93] font-mono">
                        ≈ ¥{formatMoney(item.amount)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Edit button */}
                    <button
                      onClick={() => onEditItem(item)}
                      title="修改此条目"
                      className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-[#1C1C1E]" />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(item)}
                      title="删除此条目"
                      className="w-7 h-7 rounded-full bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-[#FF3B30]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
