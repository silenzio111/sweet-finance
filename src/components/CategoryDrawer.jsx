import React, { useEffect, useState } from 'react';
import { X, Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconComponent,
  getCategoryIconKey
} from '../data/categoryIcons';

export function CategoryDrawer({
  isOpen,
  onClose,
  items,
  incomeCategories,
  expenseCategories,
  savingCategories = [],
  categoryIcons = {},
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onRequestConfirm
}) {
  const [activeType, setActiveType] = useState('income');
  const [newCatInput, setNewCatInput] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState('');
  const [addError, setAddError] = useState('');
  const [newIconKey, setNewIconKey] = useState(getCategoryIconKey('', 'income'));
  const [renameIconKey, setRenameIconKey] = useState('sparkles');

  useEffect(() => {
    setNewIconKey(getCategoryIconKey('', activeType));
  }, [activeType]);

  const currentCats =
    activeType === 'income' ? incomeCategories : activeType === 'expense' ? expenseCategories : savingCategories;

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      setAddError('请输入分类名称');
      return;
    }
    const success = onAddCategory?.(activeType, trimmed, newIconKey);
    if (success) {
      setNewCatInput('');
      setNewIconKey(getCategoryIconKey('', activeType));
      setAddError('');
      setIsAddOpen(false);
    } else {
      setAddError('该分类名称已存在，请换一个名称');
    }
  };

  const openAdd = () => {
    setNewCatInput('');
    setNewIconKey(getCategoryIconKey('', activeType));
    setAddError('');
    setIsAddOpen(true);
  };

  const handleRename = (oldName) => {
    setRenameTarget(oldName);
    setRenameInput(oldName);
    setRenameError('');
    setRenameIconKey(categoryIcons?.[activeType]?.[oldName] || getCategoryIconKey(oldName, activeType));
  };

  const closeRename = () => {
    setRenameTarget(null);
    setRenameInput('');
    setRenameError('');
  };

  const closeAdd = () => {
    setIsAddOpen(false);
    setNewCatInput('');
  };

  const confirmRename = (event) => {
    event?.preventDefault();
    const nextName = renameInput.trim();
    const existingIcon = categoryIcons?.[activeType]?.[renameTarget] || getCategoryIconKey(renameTarget, activeType);
    if (!renameTarget || !nextName) {
      setRenameError('请输入分类名称');
      return;
    }
    if (nextName === renameTarget && renameIconKey === existingIcon) {
      closeRename();
      return;
    }
    const success = onRenameCategory?.(activeType, renameTarget, nextName, renameIconKey);
    if (success === false) {
      setRenameError('该分类名称已存在，请换一个名称');
      return;
    }
    closeRename();
  };

  const renderIconPicker = (value, onChange) => (
    <div className="mt-2">
      <div className="text-[10px] font-semibold text-[#8E8E93] mb-1.5">分类图标</div>
      <div className="grid grid-cols-8 gap-1.5">
        {CATEGORY_ICON_OPTIONS.map(({ key, label, component: Icon }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={`选择${label}图标`}
              aria-pressed={selected}
              onClick={() => onChange(key)}
              className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                selected
                  ? 'bg-[#007AFF] text-white shadow-sm ring-2 ring-[#007AFF]/20'
                  : 'bg-[#F2F2F7] text-[#8E8E93] hover:bg-[#E5E5EA] hover:text-[#1C1C1E]'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={selected ? 2.4 : 2} />
            </button>
          );
        })}
      </div>
    </div>
  );

  const handleDelete = (name) => {
    const count = items.filter((i) => i.type === activeType && i.category === name).length;
    if (count > 0) {
      onRequestConfirm?.({
        tone: 'danger',
        title: '删除分类',
        description: `分类「${name}」下已有 ${count} 笔历史账目。删除分类后，已有账目仍会保留。`,
        confirmLabel: '删除分类',
        onConfirm: () => onDeleteCategory?.(activeType, name)
      });
      return;
    }
    onDeleteCategory?.(activeType, name);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Right Drawer Panel with iOS Inset Grouped design */}
      <div className="relative ml-auto mr-3 my-3 w-[calc(88%-0.75rem)] max-w-[340px] h-[calc(100%-1.5rem)] rounded-[28px] bg-[#F2F2F7] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10 flex flex-col justify-between pt-7 pb-7 px-5 transform transition-transform duration-300 animate-slideLeft overflow-y-auto custom-scroll">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-3.5 border-b border-black/[0.04]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white flex items-center justify-center shadow-sm">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1E]">分类管理</h3>
                <p className="text-[10px] text-[#8E8E93]">自定义收支与存款分类</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type Segmented Control */}
          <div className="mt-4">
            <div className="flex bg-[#767680]/12 p-[3px] rounded-xl text-xs font-semibold gap-0.5">
              <button
                onClick={() => setActiveType('income')}
                className={`flex-1 py-1.5 rounded-[8px] transition-all cursor-pointer text-center text-[11px] ${
                  activeType === 'income'
                    ? 'bg-white text-[#34C759] shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <span>＋ 收入</span>
              </button>
              <button
                onClick={() => setActiveType('expense')}
                className={`flex-1 py-1.5 rounded-[8px] transition-all cursor-pointer text-center text-[11px] ${
                  activeType === 'expense'
                    ? 'bg-white text-[#FF3B30] shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <span>－ 支出</span>
              </button>
              <button
                onClick={() => setActiveType('saving')}
                className={`flex-1 py-1.5 rounded-[8px] transition-all cursor-pointer text-center text-[11px] ${
                  activeType === 'saving'
                    ? 'bg-white text-[#007AFF] shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                }`}
              >
                <span>🏦 存款</span>
              </button>
            </div>

            {/* Categories List (iOS Inset List) */}
            <div className="mt-3.5 bg-white p-3 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-2">
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto custom-scroll pr-0.5">
                {currentCats.map((cat) => {
                  const count = items.filter(
                    (i) => i.type === activeType && i.category === cat
                  ).length;
                  const CategoryIcon = getCategoryIconComponent(cat, activeType, categoryIcons);
                  return (
                    <div
                      key={cat}
                      className="p-2.5 rounded-xl border border-black/[0.04] bg-[#F2F2F7]/60 flex items-center justify-between text-xs transition-all hover:bg-[#F2F2F7]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          activeType === 'income'
                            ? 'bg-[#34C759]/10 text-[#34C759]'
                            : activeType === 'expense'
                              ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                              : 'bg-[#007AFF]/10 text-[#007AFF]'
                        }`}>
                          <CategoryIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </span>
                        <span className="font-semibold text-[#1C1C1E] truncate">{cat}</span>
                        <span className="text-[10px] text-[#8E8E93] font-mono">({count}笔)</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRename(cat)}
                          title="重命名此分类"
                          className="w-6 h-6 rounded-full hover:bg-white text-[#8E8E93] hover:text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="删除此分类"
                          className="w-6 h-6 rounded-full hover:bg-white text-[#8E8E93] hover:text-[#FF3B30] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={openAdd}
                className="w-full flex items-center justify-center gap-1.5 pt-2.5 mt-1 border-t border-black/[0.04] text-xs font-semibold text-[#007AFF] hover:text-[#006FE6] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                <span>新增分类</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-black/[0.04] text-center">
          <p className="text-[10px] text-[#8E8E93]">
            修改分类名称将自动同步更新所有关联账目
          </p>
        </div>
      </div>

      {renameTarget && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 animate-fadeIn">
          <button
            type="button"
            aria-label="关闭重命名弹窗"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm cursor-default"
            onClick={closeRename}
          />
          <form
            onSubmit={confirmRename}
            className="relative w-full max-w-[320px] rounded-[24px] bg-white/95 p-5 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#007AFF]/12 text-[#007AFF] flex items-center justify-center shrink-0">
                <Pencil className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1E]">重命名分类</h3>
                <p className="text-[10px] text-[#8E8E93] mt-0.5">关联账目会同步更新</p>
              </div>
            </div>
            <label className="block text-[10px] font-semibold text-[#8E8E93] mt-4 mb-1.5" htmlFor="rename-category-input">
              分类名称
            </label>
            <input
              id="rename-category-input"
              autoFocus
              value={renameInput}
              onChange={(event) => setRenameInput(event.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent text-[#1C1C1E] transition-all"
            />
            {renameError && <p className="mt-1.5 text-[10px] text-[#D70015]">{renameError}</p>}
            {renderIconPicker(renameIconKey, setRenameIconKey)}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                type="button"
                onClick={closeRename}
                className="py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006FE6] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                确定
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 animate-fadeIn">
          <button
            type="button"
            aria-label="关闭新增分类弹窗"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm cursor-default"
            onClick={closeAdd}
          />
          <form
            onSubmit={handleAdd}
            className="relative w-full max-w-[320px] rounded-[24px] bg-white/95 p-5 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#007AFF]/12 text-[#007AFF] flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1E]">新增分类</h3>
                <p className="text-[10px] text-[#8E8E93] mt-0.5">选择图标后保存分类</p>
              </div>
            </div>
            <label className="block text-[10px] font-semibold text-[#8E8E93] mt-4 mb-1.5" htmlFor="new-category-input">
              分类名称
            </label>
            <input
              id="new-category-input"
              autoFocus
              value={newCatInput}
              onChange={(event) => setNewCatInput(event.target.value)}
              placeholder="例如：旅行计划"
              className="w-full px-3 py-2.5 text-sm bg-[#F2F2F7] focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] border border-transparent text-[#1C1C1E] placeholder:text-[#AEAEB2] transition-all"
            />
            {addError && <p className="mt-1.5 text-[10px] text-[#D70015]">{addError}</p>}
            {renderIconPicker(newIconKey, setNewIconKey)}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                type="button"
                onClick={closeAdd}
                className="py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006FE6] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                保存分类
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
