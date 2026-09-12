import React from 'react';
import { Archive, ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

export function SortableCard({
  isSorting,
  isDragOver,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCollapse,
  collapseLabel = '折叠到页面底部',
  label = '拖拽调整顺序',
  className = '',
  children
}) {
  return (
    <div
      draggable={isSorting}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`${className} transition-all duration-200 ${
        isSorting
          ? `p-1.5 rounded-[22px] border-2 border-dashed ${
              isDragOver
                ? 'border-[#007AFF] bg-[#007AFF]/10 ring-2 ring-[#007AFF]/20 scale-[1.01]'
                : 'border-[#007AFF]/35 bg-white/35 hover:border-[#007AFF]/60'
            } cursor-grab active:cursor-grabbing`
          : ''
      }`}
    >
      {isSorting && (
        <div className="mb-1.5 px-2 py-1 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-lg flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1 text-[10px] font-bold text-[#007AFF]">
            <GripVertical className="w-3 h-3 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={(event) => {
                event.stopPropagation();
                onMoveUp?.();
              }}
              className="w-6 h-6 rounded-md bg-white text-[#1C1C1E] shadow-2xs flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all cursor-pointer"
              title="上移"
            >
              <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={(event) => {
                event.stopPropagation();
                onMoveDown?.();
              }}
              className="w-6 h-6 rounded-md bg-white text-[#1C1C1E] shadow-2xs flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all cursor-pointer"
              title="下移"
            >
              <ArrowDown className="w-3 h-3" strokeWidth={2.5} />
            </button>
            {onCollapse && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCollapse();
                }}
                className="w-6 h-6 rounded-md bg-white text-[#007AFF] shadow-2xs flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                title={collapseLabel}
                aria-label={collapseLabel}
              >
                <Archive className="w-3 h-3" strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
