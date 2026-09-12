import React, { useState, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
import { StatusBar } from './components/StatusBar';
import { MinimalView } from './components/MinimalView';
import { DetailView } from './components/DetailView';
import { ManageView } from './components/ManageView';
import { BottomNav } from './components/BottomNav';
import { ItemModal } from './components/ItemModal';
import { UndoToast } from './components/UndoToast';
import { HistoryActionConfirmModal } from './components/HistoryActionConfirmModal';
import { AdjustmentHistoryModal } from './components/AdjustmentHistoryModal';
import { AppConfirmDialog } from './components/AppConfirmDialog';
import { SettingsDrawer } from './components/SettingsDrawer';
import { CategoryDrawer } from './components/CategoryDrawer';
import { Plus } from 'lucide-react';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustmentHistoryItem, setAdjustmentHistoryItem] = useState(null);
  const [pendingHistoryAction, setPendingHistoryAction] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const {
    isDataReady,
    items,
    activeItems,
    incomeItems,
    expenseItems,
    savingItems,
    activeTab,
    setActiveTab,
    selectedYear,
    setSelectedYear,
    availableYears,
    addYear,
    exchangeRates,
    updateExchangeRate,
    resetExchangeRates,
    preferences,
    updatePreferences,
    isCustomSorting,
    toggleCustomSorting,
    minimalCardOrder,
    detailCardOrder,
    setMinimalCardOrder,
    setDetailCardOrder,
    minimalCategoryCardOrder,
    detailOverviewCardOrder,
    detailIncomeCategoryOrder,
    detailIncomeItemOrder,
    detailExpenseCategoryOrder,
    detailExpenseItemOrder,
    detailMajorExpenseOrder,
    detailRegularExpenseOrder,
    detailSavingCategoryOrder,
    detailSavingItemOrder,
    setMinimalCategoryCardOrder,
    setDetailOverviewCardOrder,
    setDetailIncomeCategoryOrder,
    setDetailIncomeItemOrder,
    setDetailExpenseCategoryOrder,
    setDetailExpenseItemOrder,
    setDetailMajorExpenseOrder,
    setDetailRegularExpenseOrder,
    setDetailSavingCategoryOrder,
    setDetailSavingItemOrder,
    resetCardOrders,
    incomeCategories,
    expenseCategories,
    savingCategories,
    addCategory,
    renameCategory,
    deleteCategory,
    totalIncome,
    totalExpense,
    totalSavings,
    netBalance,
    savingsRate,
    savingDepositRate,
    expenseRate,
    categorySummary,
    hustleStats,
    largeExpenseStats,
    addItem,
    updateItem,
    updateAdjustmentNote,
    deleteItem,
    resetAppPreferences,
    createBackup,
    exportDatabase,
    importBackup,
    undo,
    redo,
    canUndo,
    canRedo,
    undoPreview,
    redoPreview,
    toastMessage,
    clearToast
  } = useFinance();

  const requestUndo = () => {
    if (!undoPreview) return;
    setPendingHistoryAction({ type: 'undo', preview: undoPreview });
  };

  const requestRedo = () => {
    if (!redoPreview) return;
    setPendingHistoryAction({ type: 'redo', preview: redoPreview });
  };

  const confirmHistoryAction = () => {
    if (!pendingHistoryAction) return;

    const didApply = pendingHistoryAction.type === 'undo' ? undo() : redo();
    if (didApply) setPendingHistoryAction(null);
  };

  const confirmPendingAction = () => {
    const confirmation = pendingConfirmation;
    setPendingConfirmation(null);
    confirmation?.onConfirm?.();
  };

  // Global keyboard shortcuts request the same explicit confirmation as the toolbar.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        requestUndo();
      } else if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        requestRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestUndo, requestRedo]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenAdjustmentHistory = (item) => {
    setAdjustmentHistoryItem(item);
  };

  const handleUpdateAdjustmentNote = (itemId, adjustmentId, note) => (
    updateAdjustmentNote(itemId, adjustmentId, note)
  );

  const handleSaveItem = (itemData) => {
    if (itemData.id) {
      updateItem(itemData.id, itemData);
    } else {
      addItem(itemData);
    }
  };

  const fontScale = Math.min(1.2, Math.max(0.9, Number(preferences.fontScale) || 1));
  const selectedAdjustmentHistoryItem = adjustmentHistoryItem
    ? items.find((item) => String(item.id) === String(adjustmentHistoryItem.id)) || adjustmentHistoryItem
    : null;

  if (!isDataReady) {
    return (
      <div className="w-full max-w-none h-[100dvh] bg-[#F2F2F7] flex items-center justify-center sm:max-w-[400px] sm:h-[850px] sm:max-h-[92vh] sm:rounded-[48px] sm:border-[5px] sm:border-[#D1D1D6]/60 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col items-center gap-3 text-[#8E8E93] text-xs font-semibold">
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#34C759] border-t-transparent animate-spin" />
          </div>
          <span>正在加载账本</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-font-scale w-full max-w-none h-[100dvh] max-h-none bg-[#F2F2F7] rounded-none border-0 shadow-none overflow-hidden flex flex-col relative select-none sm:max-w-[400px] sm:h-[850px] sm:max-h-[92vh] sm:rounded-[48px] sm:border-[5px] sm:border-[#D1D1D6]/60 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]"
      style={{ '--app-font-scale': fontScale }}
    >
      
      {/* iOS Minimal Dynamic Status Bar & Navigation Header */}
      <StatusBar
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={setSelectedYear}
        onAddYear={addYear}
        onOpenSettings={() => setIsSettingsOpen(true)}
        canUndo={canUndo}
        onUndo={requestUndo}
        undoFeedbackId={toastMessage?.isUndoNotice && !toastMessage?.isRedoNotice ? toastMessage.id : null}
        canRedo={canRedo}
        onRedo={requestRedo}
        redoFeedbackId={toastMessage?.isRedoNotice ? toastMessage.id : null}
      />

      {/* Custom Sorting Sticky Prompt Banner */}
      {isCustomSorting && (
        <div className="mx-4 mt-1 mb-1 p-2 bg-[#007AFF] text-white rounded-2xl flex items-center justify-between shadow-md text-xs font-semibold shrink-0 z-20">
          <div className="flex items-center gap-1.5">
            <span className="animate-pulse">📱 拖动卡片与内部项目调整排序中</span>
          </div>
          <button
            type="button"
            onClick={toggleCustomSorting}
            className="bg-white text-[#007AFF] hover:bg-white/90 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>🔒 锁定排序</span>
          </button>
        </div>
      )}

      {/* Main Content Area with generous bottom padding so cards never get clipped */}
      <div className="px-4 pt-2.5 pb-28 flex-1 overflow-y-auto custom-scroll">
        {activeTab === 'minimal' && (
          <MinimalView
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalSavings={totalSavings}
            netBalance={netBalance}
            savingsRate={savingsRate}
            savingDepositRate={savingDepositRate}
            expenseRate={expenseRate}
            incomeCount={incomeItems.length}
            expenseCount={expenseItems.length}
            savingCount={savingItems.length}
            categorySummary={categorySummary}
            showIncome={preferences.showIncome ?? true}
            showExpense={preferences.showExpense ?? true}
            showSavings={preferences.showSavings ?? true}
            cardOrder={minimalCardOrder}
            onReorderCards={setMinimalCardOrder}
            categoryCardOrder={minimalCategoryCardOrder}
            onReorderCategories={setMinimalCategoryCardOrder}
            collapsedCards={preferences.minimalCollapsedCards || []}
            onCollapsedCardsChange={(keys) => updatePreferences({ minimalCollapsedCards: keys }, { notify: false, recordHistory: false })}
            collapsedCategories={preferences.minimalCollapsedCategories || []}
            onCollapsedCategoriesChange={(keys) => updatePreferences({ minimalCollapsedCategories: keys }, { notify: false, recordHistory: false })}
            categoryIcons={preferences.categoryIcons || {}}
            isCustomSorting={isCustomSorting}
          />
        )}

        {activeTab === 'detail' && (
          <DetailView
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalSavings={totalSavings}
            netBalance={netBalance}
            savingsRate={savingsRate}
            incomeItems={incomeItems}
            expenseItems={expenseItems}
            savingItems={savingItems}
            hustleStats={hustleStats}
            largeExpenseStats={largeExpenseStats}
            onEditItem={handleOpenEdit}
            onViewAdjustments={handleOpenAdjustmentHistory}
            showIncome={preferences.showIncome ?? true}
            showExpense={preferences.showExpense ?? true}
            showSavings={preferences.showSavings ?? true}
            cardOrder={detailCardOrder}
            onReorderCards={setDetailCardOrder}
            overviewCardOrder={detailOverviewCardOrder}
            onReorderOverviewCards={setDetailOverviewCardOrder}
            incomeCategoryOrder={detailIncomeCategoryOrder}
            onReorderIncomeCategories={setDetailIncomeCategoryOrder}
            incomeItemOrder={detailIncomeItemOrder}
            onReorderIncomeItems={setDetailIncomeItemOrder}
            expenseCategoryOrder={detailExpenseCategoryOrder}
            onReorderExpenseCategories={setDetailExpenseCategoryOrder}
            expenseItemOrder={detailExpenseItemOrder}
            onReorderExpenseItems={setDetailExpenseItemOrder}
            majorExpenseOrder={detailMajorExpenseOrder}
            onReorderMajorExpenses={setDetailMajorExpenseOrder}
            regularExpenseOrder={detailRegularExpenseOrder}
            onReorderRegularExpenses={setDetailRegularExpenseOrder}
            savingCategoryOrder={detailSavingCategoryOrder}
            onReorderSavingCategories={setDetailSavingCategoryOrder}
            savingItemOrder={detailSavingItemOrder}
            onReorderSavingItems={setDetailSavingItemOrder}
            collapsedCards={preferences.detailCollapsedCards || []}
            onCollapsedCardsChange={(keys) => updatePreferences({ detailCollapsedCards: keys }, { notify: false, recordHistory: false })}
            collapsedIncomeCategories={preferences.detailCollapsedIncomeCategories || []}
            onCollapsedIncomeCategoriesChange={(keys) => updatePreferences({ detailCollapsedIncomeCategories: keys }, { notify: false, recordHistory: false })}
            collapsedExpenseCategories={preferences.detailCollapsedExpenseCategories || []}
            onCollapsedExpenseCategoriesChange={(keys) => updatePreferences({ detailCollapsedExpenseCategories: keys }, { notify: false, recordHistory: false })}
            collapsedSavingCategories={preferences.detailCollapsedSavingCategories || []}
            onCollapsedSavingCategoriesChange={(keys) => updatePreferences({ detailCollapsedSavingCategories: keys }, { notify: false, recordHistory: false })}
            categoryIcons={preferences.categoryIcons || {}}
            isCustomSorting={isCustomSorting}
          />
        )}

        {activeTab === 'manage' && (
          <ManageView
            items={activeItems}
            onEditItem={handleOpenEdit}
            onViewAdjustments={handleOpenAdjustmentHistory}
            onDeleteItem={deleteItem}
            onOpenCategories={() => setIsCategoryDrawerOpen(true)}
            onRequestConfirm={setPendingConfirmation}
          />
        )}
      </div>

      {/* Floating Dynamic Island Toast Notification */}
      <UndoToast
        toastMessage={toastMessage}
        onUndo={requestUndo}
        onDismiss={clearToast}
      />

      <HistoryActionConfirmModal
        action={pendingHistoryAction}
        onClose={() => setPendingHistoryAction(null)}
        onConfirm={confirmHistoryAction}
      />

      <AppConfirmDialog
        dialog={pendingConfirmation}
        onClose={() => setPendingConfirmation(null)}
        onConfirm={confirmPendingAction}
      />

      <AdjustmentHistoryModal
        item={selectedAdjustmentHistoryItem}
        onClose={() => setAdjustmentHistoryItem(null)}
        onUpdateNote={handleUpdateAdjustmentNote}
      />

      {/* Floating Apple Action Button (FAB) - Perfectly docked at bottom right */}
      <button
        onClick={handleOpenAdd}
        title="快捷记一笔"
        className="absolute right-5 bottom-20 z-30 w-12 h-12 rounded-full bg-[#1C1C1E] hover:bg-black text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all group cursor-pointer border border-white/10"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" strokeWidth={2.6} />
      </button>

      {/* Bottom iOS Translucent Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Edit / Add Modal Sheet with Dynamic Years & Multi-Currency */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        currentYear={selectedYear}
        availableYears={availableYears}
        exchangeRates={exchangeRates}
        onAddYear={addYear}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        savingCategories={savingCategories}
        onAddCategory={addCategory}
      />

      {/* Left Settings Drawer with Dynamic Years & Exchange Rates */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={items}
        availableYears={availableYears}
        preferences={preferences}
        exchangeRates={exchangeRates}
        isCustomSorting={isCustomSorting}
        onToggleCustomSorting={toggleCustomSorting}
        onResetCardOrders={resetCardOrders}
        onUpdatePreferences={updatePreferences}
        onUpdateExchangeRate={updateExchangeRate}
        onResetExchangeRates={resetExchangeRates}
        onResetAppPreferences={resetAppPreferences}
        onCreateBackup={createBackup}
        onExportDatabase={exportDatabase}
        onImportBackup={importBackup}
        onRequestConfirm={setPendingConfirmation}
      />

      {/* Right Category Management Drawer */}
      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        items={items}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        savingCategories={savingCategories}
        categoryIcons={preferences.categoryIcons || {}}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
        onRequestConfirm={setPendingConfirmation}
      />
    </div>
  );
}
