import React, { useState } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Sliders,
  Coins,
  RefreshCw,
  Check,
  Eye,
  ArrowUpDown,
  Lock,
  DatabaseBackup
} from 'lucide-react';
import {
  AVAILABLE_TABS,
  CURRENT_YEAR,
  DEFAULT_CURRENCIES,
  DEFAULT_EXCHANGE_RATES,
  formatMoney
} from '../data/defaultData';
import { exportBackupFile, importBackupFile } from '../services/backupFiles';

export function SettingsDrawer({
  isOpen,
  onClose,
  items,
  availableYears = ['总计', CURRENT_YEAR],
  preferences = { defaultTab: 'minimal', defaultYear: CURRENT_YEAR, showIncome: true, showExpense: true, showSavings: true },
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  isCustomSorting = false,
  onToggleCustomSorting,
  onResetCardOrders,
  onUpdatePreferences,
  onUpdateExchangeRate,
  onResetExchangeRates,
  onResetAppPreferences,
  onCreateBackup,
  onExportDatabase,
  onImportBackup,
  onRequestConfirm
}) {
  const [isRatesCollapsed, setIsRatesCollapsed] = useState(true);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [rateInput, setRateInput] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExportingDatabase, setIsExportingDatabase] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fontScale = Math.min(1.2, Math.max(0.9, Number(preferences.fontScale) || 1));

  const showNotice = (title, description) => {
    onRequestConfirm?.({
      title,
      description,
      confirmLabel: '知道了',
      hideCancel: true,
      onConfirm: () => {}
    });
  };

  const getBackupItemCount = (backup) => {
    const source = Array.isArray(backup) ? { items: backup } : (backup?.data || backup);
    return Array.isArray(source?.items) ? source.items.length : null;
  };

  const handleExport = async () => {
    if (isBackingUp) return;

    try {
      setIsBackingUp(true);
      const backup = onCreateBackup?.();
      if (!backup) throw new Error('账本数据尚未加载完成。');

      const result = await exportBackupFile(JSON.stringify(backup, null, 2));
      if (!result?.cancelled) {
        showNotice('备份已导出', `已通过系统文件管理器保存${result?.filename ? `「${result.filename}」` : '账本备份'}。`);
      }
    } catch (error) {
      showNotice('导出失败', error?.message || '无法保存账本备份。');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImport = async () => {
    if (isImporting) return;

    try {
      setIsImporting(true);
      const result = await importBackupFile();
      if (result?.cancelled) return;

      const backup = JSON.parse(result?.content || '');
      const itemCount = getBackupItemCount(backup);
      if (itemCount === null) {
        showNotice('导入失败', '备份文件中未找到有效的账目数据。');
        return;
      }

      onRequestConfirm?.({
        tone: 'warning',
        title: '导入账本备份',
        description: `将覆盖当前账本中的 ${items.length} 条记录，并导入备份中的 ${itemCount} 条记录。导入后可通过顶部撤销按钮恢复当前状态。`,
        confirmLabel: '导入并覆盖',
        onConfirm: () => {
          const outcome = onImportBackup?.(backup);
          if (outcome?.success) {
            onClose();
            showNotice('导入完成', `已导入 ${outcome.count} 条账目及备份中的相关设置。`);
          } else {
            showNotice('导入失败', outcome?.message || '备份文件格式不符合规范。');
          }
        }
      });
    } catch (error) {
      showNotice('导入失败', error instanceof SyntaxError ? '无法解析 JSON 备份文件。' : (error?.message || '无法读取备份文件。'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportDatabase = async () => {
    if (isBackingUp || isExportingDatabase) return;

    try {
      setIsExportingDatabase(true);
      const result = await onExportDatabase?.();
      if (!result) throw new Error('账本数据库尚未准备完成。');
      if (!result.cancelled) {
        showNotice(
          '数据库副本已导出',
          `已通过系统文件管理器保存${result.filename ? `「${result.filename}」` : 'SQLite 数据库副本'}。该 .db 文件用于完整备份与排查，请保留 JSON 备份作为日常恢复文件。`
        );
      }
    } catch (error) {
      showNotice('数据库导出失败', error?.message || '无法创建 SQLite 数据库副本。');
    } finally {
      setIsExportingDatabase(false);
    }
  };

  const handleReset = () => {
    onRequestConfirm?.({
      tone: 'warning',
      title: '恢复软件默认设置',
      description: '将恢复页面、显示、排序和参考汇率。账本记录、分类、年份及调整记录不会被修改。',
      confirmLabel: '恢复默认',
      onConfirm: () => {
        onResetAppPreferences();
        onClose();
      }
    });
  };

  const startEditRate = (code, currentRate) => {
    setEditingCurrency(code);
    setRateInput(String(currentRate));
  };

  const saveRate = (code) => {
    const num = parseFloat(rateInput);
    if (!isNaN(num) && num > 0) {
      onUpdateExchangeRate?.(code, num);
    }
    setEditingCurrency(null);
    setRateInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Container (Strictly constrained within phone area) */}
      <div className="relative ml-3 my-3 w-[calc(88%-0.75rem)] max-w-[340px] h-[calc(100%-1.5rem)] rounded-[28px] bg-[#F2F2F7] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10 flex flex-col justify-between pt-7 pb-7 px-5 transform transition-transform duration-300 animate-slideRight overflow-y-auto custom-scroll">
        <div>
          {/* Top Bar */}
          <div className="flex justify-between items-center pb-3.5 border-b border-black/[0.04]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#34C759] to-[#30D158] text-white flex items-center justify-center shadow-sm">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1E]">系统设置</h3>
                <p className="text-[10px] text-[#8E8E93]">SweetFinance 偏好与汇率</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grouped Settings List */}
          <div className="mt-4 space-y-4">
            
            {/* 1. 默认启动偏好 */}
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#8E8E93]" />
                <span>启动默认偏好</span>
              </span>
              <div className="bg-white p-3 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-3 text-xs">
                {/* 默认打开页面 */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#8E8E93] mb-1">
                    打开 App 时默认进入页面
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-[#767680]/12 p-[3px] rounded-xl">
                    {AVAILABLE_TABS.map((tab) => {
                      const isSelected = (preferences.defaultTab || 'minimal') === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => onUpdatePreferences?.({ defaultTab: tab.id })}
                          className={`py-1.5 px-1 rounded-[8px] text-[11px] transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-white text-[#1C1C1E] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.12)]'
                              : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 默认打开年份 */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#8E8E93] mb-1">
                    打开 App 时默认所属年份
                  </label>
                  <div className="flex flex-wrap gap-1 bg-[#767680]/12 p-[3px] rounded-xl font-mono">
                    {availableYears.map((y) => {
                      const isSelected = (preferences.defaultYear || CURRENT_YEAR) === y;
                      return (
                        <button
                          key={y}
                          onClick={() => onUpdatePreferences?.({ defaultYear: y })}
                          className={`flex-1 min-w-[50px] py-1.5 rounded-[7px] text-[10px] transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-[#34C759] text-white font-bold shadow-2xs'
                              : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                          }`}
                        >
                          {y === '总计' ? '总计' : `${y}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 字体显示 */}
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#8E8E93]" />
                <span>字体显示</span>
              </span>
              <div className="bg-white p-3 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1C1C1E]">字体大小</div>
                    <div className="text-[10px] text-[#8E8E93] mt-0.5">{Math.round(fontScale * 100)}%</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdatePreferences?.({ fontScale: 1 })}
                    title="恢复默认字体大小"
                    aria-label="恢复默认字体大小"
                    disabled={fontScale === 1}
                    className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] disabled:opacity-40 disabled:cursor-not-allowed text-[#6D6D72] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.3} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-[#6D6D72]" aria-hidden="true">A</span>
                  <input
                    type="range"
                    min="0.9"
                    max="1.2"
                    step="0.05"
                    value={fontScale}
                    aria-label="字体大小"
                    onChange={(e) => onUpdatePreferences?.({ fontScale: Number(e.target.value) }, { notify: false })}
                    className="flex-1 accent-[#007AFF] cursor-pointer"
                  />
                  <span className="text-base font-bold text-[#1C1C1E] leading-none" aria-hidden="true">A</span>
                </div>
              </div>
            </div>

            {/* 3. 模块显示控制 (收入 / 支出 / 存款) */}
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#8E8E93]" />
                <span>模块显示控制</span>
              </span>
              <div className="bg-white p-3 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-2.5 text-xs">
                {/* 收入显示开关 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]"></span>
                    <span className="font-semibold text-[#1C1C1E]">收入模块</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdatePreferences?.({ showIncome: !(preferences.showIncome ?? true) })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (preferences.showIncome ?? true) ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform duration-200 ${
                        (preferences.showIncome ?? true) ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 支出显示开关 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]"></span>
                    <span className="font-semibold text-[#1C1C1E]">支出模块</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdatePreferences?.({ showExpense: !(preferences.showExpense ?? true) })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (preferences.showExpense ?? true) ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform duration-200 ${
                        (preferences.showExpense ?? true) ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 存款显示开关 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]"></span>
                    <span className="font-semibold text-[#1C1C1E]">存款模块</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdatePreferences?.({ showSavings: !(preferences.showSavings ?? true) })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      (preferences.showSavings ?? true) ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-md block absolute top-0.5 transition-transform duration-200 ${
                        (preferences.showSavings ?? true) ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="text-[10px] text-[#8E8E93] pt-1.5 border-t border-black/[0.03] leading-tight">
                  控制是否在极简模式与详细模式中展示对应板块
                </div>
              </div>
            </div>

            {/* 4. 卡片自定义排序 */}
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5 px-1 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-[#8E8E93]" />
                <span>卡片自定义排序</span>
              </span>
              <div className="bg-white p-3 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-2.5 text-xs">
                <div className="text-[10px] text-[#8E8E93] leading-relaxed">
                  开启后可在「极简模式」与「详细模式」中自由拖拽或按上下按钮调整卡片顺序。排序栏中的归档按钮可将卡片移入页面底部折叠抽屉，详细页的收入、支出、存款分类及细项也支持排序，排好后锁定即可保存。
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleCustomSorting?.();
                    onClose();
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isCustomSorting
                      ? 'bg-[#34C759] text-white shadow-md ring-2 ring-[#34C759]/30 active:scale-98'
                      : 'bg-[#007AFF]/10 hover:bg-[#007AFF]/18 text-[#007AFF] border border-[#007AFF]/25 active:scale-98 shadow-2xs'
                  }`}
                >
                  {isCustomSorting ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>已在排序模式 · 点击锁定排序 🔒</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-4 h-4" />
                      <span>开启卡片自定义拖动排序</span>
                    </>
                  )}
                </button>

                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={onResetCardOrders}
                    className="text-[10px] text-[#8E8E93] hover:text-[#1C1C1E] underline cursor-pointer"
                  >
                    恢复卡片默认顺序
                  </button>
                </div>
              </div>
            </div>

            {/* 5. 多币种与汇率设置 (Multi-Currency & Exchange Rates - Collapsible) */}
            <div>
              <div
                onClick={() => setIsRatesCollapsed(!isRatesCollapsed)}
                className="flex justify-between items-center mb-1.5 px-1 cursor-pointer select-none group"
              >
                <span className="text-[11px] font-semibold text-[#8E8E93] group-hover:text-[#1C1C1E] uppercase tracking-wider flex items-center gap-1 transition-colors">
                  <Coins className="w-3 h-3 text-[#8E8E93]" />
                  <span>参考汇率管理 (10个外币)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetExchangeRates();
                    }}
                    className="text-[10px] text-[#007AFF] hover:underline cursor-pointer"
                  >
                    恢复默认
                  </button>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8E8E93] transition-transform duration-200 ${
                      !isRatesCollapsed ? 'rotate-180 text-[#1C1C1E]' : ''
                    }`}
                  />
                </div>
              </div>

              {!isRatesCollapsed && (
                <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] overflow-hidden divide-y divide-black/[0.04] animate-fadeIn">
                  {DEFAULT_CURRENCIES.filter((c) => c.code !== 'CNY').map((curr) => {
                    const currentRate = exchangeRates[curr.code] || curr.defaultRate;
                    const isEditing = editingCurrency === curr.code;

                    return (
                      <div key={curr.code} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{curr.flag}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-[#1C1C1E] text-xs flex items-center gap-1">
                              <span>{curr.code}</span>
                              <span className="text-[10px] text-[#8E8E93] font-normal font-sans">({curr.name})</span>
                            </div>
                            <div className="text-[9px] text-[#8E8E93] font-mono">1 {curr.symbol} ≈ {currentRate} CNY</div>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              autoFocus
                              value={rateInput}
                              onChange={(e) => setRateInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRate(curr.code);
                                if (e.key === 'Escape') setEditingCurrency(null);
                              }}
                              className="w-20 px-2 py-1 bg-[#F2F2F7] rounded-lg text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                            />
                            <button
                              onClick={() => saveRate(curr.code)}
                              className="p-1 bg-[#34C759] text-white rounded-lg text-xs cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditRate(curr.code, currentRate)}
                            className="px-2.5 py-1 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-mono font-bold text-xs transition-colors cursor-pointer"
                          >
                            {currentRate}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. 数据备份与管理 (iOS Inset List) */}
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5 px-1">
                数据与备份
              </span>
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] overflow-hidden divide-y divide-black/[0.04]">
                {/* 导出数据 */}
                <button
                  onClick={handleExport}
                  disabled={isBackingUp || isExportingDatabase}
                  className="w-full p-3 hover:bg-black/[0.02] disabled:opacity-50 text-[#1C1C1E] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer disabled:cursor-wait"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#34C759] text-white flex items-center justify-center">
                      {isBackingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </div>
                    <span>{isBackingUp ? '正在保存备份...' : '导出账本数据'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
                </button>

                <button
                  type="button"
                  onClick={handleExportDatabase}
                  disabled={isBackingUp || isExportingDatabase}
                  className="w-full p-3 hover:bg-black/[0.02] disabled:opacity-50 text-[#1C1C1E] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer disabled:cursor-wait"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#5856D6] text-white flex items-center justify-center">
                      {isExportingDatabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DatabaseBackup className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-left">
                      <span className="block">{isExportingDatabase ? '正在生成数据库副本...' : '导出 SQLite 数据库副本'}</span>
                      <span className="block mt-0.5 text-[9px] font-normal text-[#8E8E93]">完整灾备与排查使用，不直接导入</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
                </button>

                {/* 导入数据 */}
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting || isBackingUp || isExportingDatabase}
                  className="w-full p-3 hover:bg-black/[0.02] disabled:opacity-50 text-[#1C1C1E] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer disabled:cursor-wait"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#007AFF] text-white flex items-center justify-center">
                      {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </div>
                    <span>{isImporting ? '正在读取备份...' : '导入账本备份'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
                </button>

                {/* 恢复默认 */}
                <button
                  onClick={handleReset}
                  className="w-full p-3 hover:bg-[#FF3B30]/[0.04] text-[#FF3B30] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#FF3B30] text-white flex items-center justify-center">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                    <span>恢复软件默认设置</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#FF3B30]/40" />
                </button>
              </div>
            </div>

            {/* 4. 空间特性 */}
            <div>
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5 px-1">
                特性与状态
              </span>
              <div className="bg-white p-3 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-[#1C1C1E]">
                  <span className="flex items-center gap-2 font-medium">
                    <div className="w-6 h-6 rounded-lg bg-[#34C759]/15 text-[#34C759] flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>本地离线安全存储</span>
                  </span>
                  <span className="bg-[#34C759]/12 text-[#248A3D] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    已就绪
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#1C1C1E]">
                  <span className="flex items-center gap-2 font-medium">
                    <div className="w-6 h-6 rounded-lg bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>独立副业轨分析</span>
                  </span>
                  <span className="bg-[#F2F2F7] text-[#8E8E93] text-[10px] px-2 py-0.5 rounded-full font-medium">
                    闲鱼 / 代做
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 text-center text-[10px] text-[#8E8E93] border-t border-black/[0.04]">
          SweetFinance v2.2 · 精致私有记账系统
        </div>
      </div>
    </div>
  );
}
