import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DEFAULT_ITEMS,
  CURRENT_YEAR,
  getAvailableYears,
  DEFAULT_CURRENCIES,
  DEFAULT_EXCHANGE_RATES,
  getCurrencyInfo,
  INCOME_CATEGORIES as DEFAULT_INCOME_CATEGORIES,
  EXPENSE_CATEGORIES as DEFAULT_EXPENSE_CATEGORIES,
  SAVING_CATEGORIES as DEFAULT_SAVING_CATEGORIES,
  DEFAULT_MINIMAL_CARD_ORDER,
  DEFAULT_DETAIL_CARD_ORDER,
  DEFAULT_MINIMAL_CATEGORY_CARD_ORDER,
  DEFAULT_DETAIL_OVERVIEW_CARD_ORDER,
  DEFAULT_DETAIL_INCOME_CATEGORY_ORDER,
  DEFAULT_DETAIL_MAJOR_EXPENSE_ORDER,
  DEFAULT_DETAIL_REGULAR_EXPENSE_ORDER,
  DEFAULT_DETAIL_SAVING_CATEGORY_ORDER
} from '../data/defaultData';
import { exportSQLiteDatabaseSnapshot, loadFinanceState, saveFinanceSnapshot } from '../services/financeStorage';
const MAX_HISTORY = 10;
const CONTINUOUS_UNDO_WARNING_STEP = 10;

function getUndoDetail(actionDesc = '') {
  const addedMatch = actionDesc.match(/^已新增账目「(.+)」$/);
  if (addedMatch) return `已撤回新增的账目「${addedMatch[1]}」`;

  const updatedMatch = actionDesc.match(/^已修改账目「(.+)」$/);
  if (updatedMatch) return `已恢复账目「${updatedMatch[1]}」的修改`;

  const deletedMatch = actionDesc.match(/^已删除账目「(.+)」$/);
  if (deletedMatch) return `已恢复已删除的账目「${deletedMatch[1]}」`;

  const categoryMatch = actionDesc.match(/^已将分类「(.+)」修改为「(.+)」$/);
  if (categoryMatch) return `已恢复分类「${categoryMatch[1]}」`;

  if (actionDesc === '已恢复默认账目数据') return '已恢复重置前的账本数据';
  if (/^已导入 (\d+) 条账目备份$/.test(actionDesc)) return `已恢复导入前的账本数据`;

  return actionDesc ? `已撤销：${actionDesc.replace(/^已/, '')}` : '已恢复上一步的账本状态';
}

function getRedoDetail(actionDesc = '') {
  return actionDesc ? `已重新执行：${actionDesc.replace(/^已/, '')}` : '已重新执行上一步操作';
}

function normalizeHistoryEntry(entry) {
  if (Array.isArray(entry)) return { state: { items: entry }, actionDesc: '' };
  return {
    ...entry,
    state: entry?.state || { items: entry?.items || [] }
  };
}

function getHistoryState(entry) {
  return entry?.state || { items: entry?.items || [] };
}

function cloneFinanceSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function createDefaultPreferences() {
  return {
    defaultTab: 'minimal',
    defaultYear: CURRENT_YEAR,
    fontScale: 1,
    showIncome: true,
    showExpense: true,
    showSavings: true,
    minimalCardOrder: [...DEFAULT_MINIMAL_CARD_ORDER],
    detailCardOrder: [...DEFAULT_DETAIL_CARD_ORDER],
    minimalCategoryCardOrder: [...DEFAULT_MINIMAL_CATEGORY_CARD_ORDER],
    detailOverviewCardOrder: [...DEFAULT_DETAIL_OVERVIEW_CARD_ORDER],
    detailIncomeCategoryOrder: [...DEFAULT_DETAIL_INCOME_CATEGORY_ORDER],
    detailIncomeItemOrder: [],
    detailExpenseCategoryOrder: [],
    detailExpenseItemOrder: [],
    detailMajorExpenseOrder: [...DEFAULT_DETAIL_MAJOR_EXPENSE_ORDER],
    detailRegularExpenseOrder: [...DEFAULT_DETAIL_REGULAR_EXPENSE_ORDER],
    detailSavingCategoryOrder: [...DEFAULT_DETAIL_SAVING_CATEGORY_ORDER],
    detailSavingItemOrder: [],
    minimalCollapsedCards: [],
    minimalCollapsedCategories: [],
    detailCollapsedCards: [],
    detailCollapsedIncomeCategories: [],
    detailCollapsedExpenseCategories: [],
    detailCollapsedSavingCategories: [],
    categoryIcons: {
      income: {},
      expense: {},
      saving: {}
    }
  };
}

function normalizeCategoryIcons(categoryIcons) {
  const source = categoryIcons && typeof categoryIcons === 'object' && !Array.isArray(categoryIcons)
    ? categoryIcons
    : {};
  return {
    income: source.income && typeof source.income === 'object' && !Array.isArray(source.income)
      ? { ...source.income }
      : {},
    expense: source.expense && typeof source.expense === 'object' && !Array.isArray(source.expense)
      ? { ...source.expense }
      : {},
    saving: source.saving && typeof source.saving === 'object' && !Array.isArray(source.saving)
      ? { ...source.saving }
      : {}
  };
}

function mergePreferences(preferences) {
  const defaults = createDefaultPreferences();
  return {
    ...defaults,
    ...(preferences && typeof preferences === 'object' && !Array.isArray(preferences) ? preferences : {}),
    categoryIcons: normalizeCategoryIcons(preferences?.categoryIcons)
  };
}

function createDefaultCategories() {
  return {
    income: [...DEFAULT_INCOME_CATEGORIES],
    expense: [...DEFAULT_EXPENSE_CATEGORIES],
    saving: [...DEFAULT_SAVING_CATEGORIES]
  };
}

function normalizeCategories(categories) {
  if (!categories || typeof categories !== 'object' || Array.isArray(categories)) {
    return createDefaultCategories();
  }

  return {
    income: Array.isArray(categories.income) ? categories.income : [...DEFAULT_INCOME_CATEGORIES],
    expense: Array.isArray(categories.expense) ? categories.expense : [...DEFAULT_EXPENSE_CATEGORIES],
    saving: Array.isArray(categories.saving) ? categories.saving : [...DEFAULT_SAVING_CATEGORIES]
  };
}

function removeRetiredItemTags(items) {
  if (!Array.isArray(items)) return items;

  return items.map((item) => (
    item?.tag === '长辈祝福' ? { ...item, tag: '' } : item
  ));
}

function normalizeBackupPayload(payload) {
  const source = Array.isArray(payload) ? { items: payload } : (payload?.data || payload);

  if (!source || typeof source !== 'object' || !Array.isArray(source.items)) {
    return { success: false, message: '备份文件中未找到有效的账目数据。' };
  }

  return {
    success: true,
    items: removeRetiredItemTags(source.items),
    categories: source.categories ? normalizeCategories(source.categories) : null,
    customYears: Array.isArray(source.customYears)
      ? source.customYears
      : (Array.isArray(source.years) ? source.years : null),
    exchangeRates: source.exchangeRates && typeof source.exchangeRates === 'object' && !Array.isArray(source.exchangeRates)
      ? { ...DEFAULT_EXCHANGE_RATES, ...source.exchangeRates }
      : null,
    preferences: source.preferences && typeof source.preferences === 'object' && !Array.isArray(source.preferences)
      ? mergePreferences(source.preferences)
      : null
  };
}

export function useFinance() {
  // Custom sorting edit mode state (toggled in settings or floating banner)
  const [isCustomSorting, setIsCustomSorting] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  // User Preferences (Default launch tab, year, and module display toggles, card orders)
  const [preferences, setPreferences] = useState(createDefaultPreferences);

  const [activeTab, setActiveTab] = useState(preferences.defaultTab || 'minimal');
  const [selectedYear, setSelectedYear] = useState(preferences.defaultYear || CURRENT_YEAR);

  // Exchange rates table
  const [exchangeRates, setExchangeRates] = useState(() => ({ ...DEFAULT_EXCHANGE_RATES }));

  // Custom added years (persists added years even with 0 items)
  const [customYears, setCustomYears] = useState([]);

  // Items storage
  const [items, setItems] = useState(() => removeRetiredItemTags(DEFAULT_ITEMS));

  // Dynamic Categories state (Income, Expense & Saving)
  const [categories, setCategories] = useState(createDefaultCategories);

  // History stack for Undo and Redo
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [consecutiveUndoCount, setConsecutiveUndoCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const currentPersistentSnapshot = useMemo(() => ({
    items,
    categories,
    customYears,
    exchangeRates,
    preferences
  }), [items, categories, customYears, exchangeRates, preferences]);

  const getCurrentSnapshot = useCallback(
    () => cloneFinanceSnapshot(currentPersistentSnapshot),
    [currentPersistentSnapshot]
  );

  const applyPersistentSnapshot = useCallback((snapshot) => {
    setItems(removeRetiredItemTags(Array.isArray(snapshot?.items) ? snapshot.items : []));
    setCategories(normalizeCategories(snapshot?.categories));
    setCustomYears(Array.isArray(snapshot?.customYears) ? snapshot.customYears : []);
    setExchangeRates({ ...DEFAULT_EXCHANGE_RATES, ...(snapshot?.exchangeRates || {}) });
    setPreferences(mergePreferences(snapshot?.preferences));
  }, []);

  // Load existing WebView data once, then migrate and persist through SQLite on native builds.
  useEffect(() => {
    let isMounted = true;

    const loadStoredState = async () => {
      try {
        const stored = await loadFinanceState();
        if (!isMounted) return;

        const storedPreferences = stored.preferences && typeof stored.preferences === 'object'
          ? mergePreferences(stored.preferences)
          : createDefaultPreferences();

        if (Array.isArray(stored.items)) setItems(removeRetiredItemTags(stored.items));
        if (stored.categories) setCategories(normalizeCategories(stored.categories));
        if (Array.isArray(stored.customYears)) setCustomYears(stored.customYears);
        if (stored.exchangeRates && typeof stored.exchangeRates === 'object') {
          setExchangeRates({ ...DEFAULT_EXCHANGE_RATES, ...stored.exchangeRates });
        }
        setPreferences(storedPreferences);
        setActiveTab(storedPreferences.defaultTab || 'minimal');
        setSelectedYear(storedPreferences.defaultYear || CURRENT_YEAR);
      } catch (error) {
        console.error('Failed to initialize persisted finance data:', error);
      } finally {
        if (isMounted) setIsDataReady(true);
      }
    };

    loadStoredState();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isDataReady) void saveFinanceSnapshot(currentPersistentSnapshot);
  }, [currentPersistentSnapshot, isDataReady]);

  const pushHistory = useCallback((stateSnapshot, actionDesc) => {
    setPast((prevPast) => {
      const entry = { state: cloneFinanceSnapshot(stateSnapshot), actionDesc };
      const updated = [...prevPast, entry];
      return updated.length > MAX_HISTORY ? updated.slice(updated.length - MAX_HISTORY) : updated;
    });
    setFuture([]);
    setConsecutiveUndoCount(0);
    if (actionDesc) {
      setToastMessage({
        id: Date.now(),
        text: actionDesc
      });
    }
  }, []);

  // Update exchange rate for a currency
  const updateExchangeRate = useCallback((currencyCode, rate) => {
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate <= 0) return;
    if (exchangeRates[currencyCode] === numRate) return;

    pushHistory(getCurrentSnapshot(), `已更新 ${currencyCode} 参考汇率至 ${numRate}`);
    setExchangeRates({ ...exchangeRates, [currencyCode]: numRate });
  }, [exchangeRates, getCurrentSnapshot, pushHistory]);

  const resetExchangeRates = useCallback(() => {
    pushHistory(getCurrentSnapshot(), '已恢复默认参考汇率表');
    setExchangeRates({ ...DEFAULT_EXCHANGE_RATES });
  }, [getCurrentSnapshot, pushHistory]);

  // Dynamic Available Years computed from current date, items list, and customYears
  const availableYears = useMemo(() => {
    const currentYearNum = new Date().getFullYear();
    const yearsSet = new Set();

    yearsSet.add(String(currentYearNum));
    yearsSet.add(String(currentYearNum - 1));
    yearsSet.add(String(currentYearNum - 2));
    yearsSet.add(String(currentYearNum + 1));

    // Extract from items
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item && item.year) yearsSet.add(String(item.year));
      });
    }

    // Extract from customYears
    if (Array.isArray(customYears)) {
      customYears.forEach((y) => {
        if (y) yearsSet.add(String(y));
      });
    }

    const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    return ['总计', ...sortedYears];
  }, [items, customYears]);

  // Explicit method to add a new year
  const addYear = useCallback((newYear) => {
    const trimmed = String(newYear).trim();
    if (!/^\d{4}$/.test(trimmed)) {
      return { success: false, message: '请输入合法的4位数字年份（如 2028）' };
    }
    if (!customYears.includes(trimmed)) {
      pushHistory(getCurrentSnapshot(), `已添加 ${trimmed} 年度`);
      setCustomYears([...customYears, trimmed]);
    }
    setSelectedYear(trimmed);
    setToastMessage({
      id: Date.now(),
      text: `已添加并切换至 ${trimmed} 年度`
    });
    return { success: true, year: trimmed };
  }, [customYears, getCurrentSnapshot, pushHistory]);

  const updatePreferences = useCallback((newPrefs, { notify = true, recordHistory = notify, actionDesc = '已保存软件偏好设置' } = {}) => {
    const updated = { ...preferences, ...newPrefs };
    const hasChange = Object.keys(newPrefs).some((key) => preferences[key] !== updated[key]);
    if (!hasChange) return;

    if (recordHistory) pushHistory(getCurrentSnapshot(), actionDesc);
    setPreferences(updated);
    if (notify) {
      setToastMessage({
        id: Date.now(),
        text: actionDesc
      });
    }
  }, [preferences, getCurrentSnapshot, pushHistory]);

  const addItem = useCallback((item) => {
    const assignedYear = item.year || (selectedYear === '总计' ? CURRENT_YEAR : selectedYear);
    const currency = item.currency || 'CNY';
    const exchangeRate = Number(item.exchangeRate) || exchangeRates[currency] || 1.0;
    const originalAmount = Number(item.originalAmount || item.amount) || 0;
    const baseAmount = currency === 'CNY' ? originalAmount : Math.round(originalAmount * exchangeRate * 100) / 100;
    const newItem = {
      ...item,
      id: item.id || Date.now().toString(),
      year: assignedYear,
      currency,
      originalAmount,
      exchangeRate,
      amount: baseAmount
    };

    pushHistory(getCurrentSnapshot(), `已新增账目「${item.title || '新账目'}」`);
    setItems([newItem, ...items]);
    if (assignedYear && /^\d{4}$/.test(assignedYear) && !customYears.includes(assignedYear)) {
      setCustomYears([...customYears, assignedYear]);
    }
  }, [items, customYears, getCurrentSnapshot, pushHistory, selectedYear, exchangeRates]);

  const updateItem = useCallback((id, updatedFields) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const merged = { ...target, ...updatedFields };
    const currency = merged.currency || 'CNY';
    const exchangeRate = Number(merged.exchangeRate) || exchangeRates[currency] || 1.0;
    const originalAmount = Number(merged.originalAmount !== undefined ? merged.originalAmount : merged.amount) || 0;
    const baseAmount = currency === 'CNY' ? originalAmount : Math.round(originalAmount * exchangeRate * 100) / 100;
    const nextItem = { ...merged, currency, originalAmount, exchangeRate, amount: baseAmount };

    pushHistory(getCurrentSnapshot(), `已修改账目「${target.title || updatedFields.title || '账目'}」`);
    setItems(items.map((item) => (item.id === id ? nextItem : item)));
    if (nextItem.year && /^\d{4}$/.test(nextItem.year) && !customYears.includes(nextItem.year)) {
      setCustomYears([...customYears, nextItem.year]);
    }
  }, [items, customYears, getCurrentSnapshot, pushHistory, exchangeRates]);

  const updateAdjustmentNote = useCallback((itemId, adjustmentId, note) => {
    const target = items.find((item) => String(item.id) === String(itemId));
    if (!target) return false;

    const adjustments = Array.isArray(target.adjustments) ? target.adjustments : [];
    const targetAdjustment = adjustments.find((adjustment) => String(adjustment.id) === String(adjustmentId));
    if (!targetAdjustment) return false;

    const nextNote = String(note ?? '').trim();
    if (String(targetAdjustment.note ?? '') === nextNote) return false;

    pushHistory(getCurrentSnapshot(), `已修改账目「${target.title || '账目'}」的金额调整备注`);
    setItems((previous) => previous.map((item) => {
      if (String(item.id) !== String(itemId)) return item;

      return {
        ...item,
        adjustments: (Array.isArray(item.adjustments) ? item.adjustments : []).map((adjustment) => (
          String(adjustment.id) === String(adjustmentId)
            ? { ...adjustment, note: nextNote }
            : adjustment
        ))
      };
    }));
    return true;
  }, [items, getCurrentSnapshot, pushHistory]);

  const deleteItem = useCallback((id) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    pushHistory(getCurrentSnapshot(), `已删除账目「${target.title || '账目'}」`);
    setItems(items.filter((item) => item.id !== id));
  }, [items, getCurrentSnapshot, pushHistory]);

  const resetAppPreferences = useCallback(() => {
    const defaultPreferences = createDefaultPreferences();
    pushHistory(getCurrentSnapshot(), '已恢复软件默认设置');
    setPreferences(defaultPreferences);
    setExchangeRates({ ...DEFAULT_EXCHANGE_RATES });
    setIsCustomSorting(false);
    setActiveTab(defaultPreferences.defaultTab);
    setSelectedYear(defaultPreferences.defaultYear);
    setToastMessage({
      id: Date.now(),
      text: '已恢复软件默认设置，账本数据保持不变'
    });
  }, [getCurrentSnapshot, pushHistory]);

  const createBackup = useCallback(() => ({
    format: 'sweetfinance-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    data: {
      items,
      categories,
      customYears,
      exchangeRates,
      preferences
    }
  }), [items, categories, customYears, exchangeRates, preferences]);

  const exportDatabase = useCallback(() => (
    exportSQLiteDatabaseSnapshot(getCurrentSnapshot())
  ), [getCurrentSnapshot]);

  const importBackup = useCallback((payload) => {
    const backup = normalizeBackupPayload(payload);
    if (!backup.success) return backup;

    const nextSnapshot = {
      items: backup.items,
      categories: backup.categories || categories,
      customYears: backup.customYears || customYears,
      exchangeRates: backup.exchangeRates || exchangeRates,
      preferences: backup.preferences || preferences
    };

    pushHistory(getCurrentSnapshot(), `已导入 ${backup.items.length} 条账目备份`);
    applyPersistentSnapshot(nextSnapshot);
    if (backup.preferences) {
      setActiveTab(backup.preferences.defaultTab || 'minimal');
      setSelectedYear(backup.preferences.defaultYear || CURRENT_YEAR);
    }

    return { success: true, count: backup.items.length };
  }, [categories, customYears, exchangeRates, preferences, getCurrentSnapshot, pushHistory, applyPersistentSnapshot]);

  // Category Management Methods
  const addCategory = useCallback((type, name, iconKey = 'sparkles') => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const list = categories[type] || [];
    if (list.includes(trimmed)) return false;

    pushHistory(getCurrentSnapshot(), `已新增分类「${trimmed}」`);
    setCategories((previous) => ({ ...previous, [type]: [...(previous[type] || []), trimmed] }));
    const currentIcons = normalizeCategoryIcons(preferences.categoryIcons);
    setPreferences((previous) => {
      const previousIcons = normalizeCategoryIcons(previous.categoryIcons || currentIcons);
      return {
        ...previous,
        categoryIcons: {
          ...previousIcons,
          [type]: { ...previousIcons[type], [trimmed]: iconKey || 'sparkles' }
        }
      };
    });
    return true;
  }, [categories, preferences, getCurrentSnapshot, pushHistory]);

  const renameCategory = useCallback((type, oldName, newName, iconKey) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;

    const list = categories[type] || [];
    if (!list.includes(oldName)) return false;
    if (trimmed !== oldName && list.includes(trimmed)) return false;

    const currentIcons = normalizeCategoryIcons(preferences.categoryIcons);
    const previousIcon = currentIcons[type]?.[oldName];
    const nextIcon = iconKey || previousIcon;
    if (oldName === trimmed && nextIcon === previousIcon) return false;

    pushHistory(
      getCurrentSnapshot(),
      oldName === trimmed ? `已修改分类「${oldName}」图标` : `已将分类「${oldName}」修改为「${trimmed}」`
    );
    if (oldName !== trimmed) {
      setCategories((previous) => ({
        ...previous,
        [type]: (previous[type] || []).map((category) => (category === oldName ? trimmed : category))
      }));
      setItems((previous) => previous.map((item) => (
        item.type === type && item.category === oldName
          ? { ...item, category: trimmed }
          : item
      )));
    }
    setPreferences((previous) => {
      const previousIcons = normalizeCategoryIcons(previous.categoryIcons || currentIcons);
      const nextTypeIcons = { ...previousIcons[type] };
      delete nextTypeIcons[oldName];
      if (nextIcon) nextTypeIcons[trimmed] = nextIcon;
      return {
        ...previous,
        categoryIcons: { ...previousIcons, [type]: nextTypeIcons }
      };
    });
    return true;
  }, [categories, items, preferences, getCurrentSnapshot, pushHistory]);

  const deleteCategory = useCallback((type, name) => {
    const list = categories[type] || [];
    if (!list.includes(name)) return;
    pushHistory(getCurrentSnapshot(), `已删除分类「${name}」`);
    setCategories((previous) => ({ ...previous, [type]: (previous[type] || []).filter((category) => category !== name) }));
    const currentIcons = normalizeCategoryIcons(preferences.categoryIcons);
    setPreferences((previous) => {
      const previousIcons = normalizeCategoryIcons(previous.categoryIcons || currentIcons);
      const nextTypeIcons = { ...previousIcons[type] };
      delete nextTypeIcons[name];
      return {
        ...previous,
        categoryIcons: { ...previousIcons, [type]: nextTypeIcons }
      };
    });
  }, [categories, preferences, getCurrentSnapshot, pushHistory]);

  // Undo action
  const undo = useCallback(() => {
    if (past.length === 0) return false;

    const previousEntry = normalizeHistoryEntry(past[past.length - 1]);
    const previousState = getHistoryState(previousEntry);
    const newPast = past.slice(0, past.length - 1);
    const nextUndoCount = consecutiveUndoCount + 1;
    const currentState = getCurrentSnapshot();

    setFuture((prevFuture) => {
      const entry = { state: currentState, actionDesc: previousEntry.actionDesc };
      const updated = [entry, ...prevFuture];
      return updated.slice(0, MAX_HISTORY);
    });
    setPast(newPast);
    setConsecutiveUndoCount(nextUndoCount);
    applyPersistentSnapshot(previousState);
    setToastMessage({
      id: Date.now(),
      text: '已撤销',
      detail: getUndoDetail(previousEntry.actionDesc),
      isUndoNotice: true,
      isUndoWarning: nextUndoCount >= CONTINUOUS_UNDO_WARNING_STEP,
      undoCount: nextUndoCount
    });
    return true;
  }, [past, consecutiveUndoCount, getCurrentSnapshot, applyPersistentSnapshot]);

  // Redo action
  const redo = useCallback(() => {
    if (future.length === 0) return false;

    const nextEntry = normalizeHistoryEntry(future[0]);
    const nextState = getHistoryState(nextEntry);
    const newFuture = future.slice(1);
    const currentState = getCurrentSnapshot();

    setPast((prevPast) => {
      const entry = { state: currentState, actionDesc: nextEntry.actionDesc };
      const updated = [...prevPast, entry];
      return updated.length > MAX_HISTORY ? updated.slice(updated.length - MAX_HISTORY) : updated;
    });
    setFuture(newFuture);
    setConsecutiveUndoCount(0);
    applyPersistentSnapshot(nextState);
    setToastMessage({
      id: Date.now(),
      text: '已重做',
      detail: getRedoDetail(nextEntry.actionDesc),
      isUndoNotice: true,
      isRedoNotice: true
    });
    return true;
  }, [future, getCurrentSnapshot, applyPersistentSnapshot]);

  const undoPreview = useMemo(() => {
    if (past.length === 0) return null;

    const previousEntry = normalizeHistoryEntry(past[past.length - 1]);
    const nextUndoCount = consecutiveUndoCount + 1;
    return {
      detail: getUndoDetail(previousEntry.actionDesc),
      result: getUndoDetail(previousEntry.actionDesc).replace(/^已/, ''),
      isWarning: nextUndoCount >= 2,
      undoCount: nextUndoCount
    };
  }, [past, consecutiveUndoCount]);

  const redoPreview = useMemo(() => {
    if (future.length === 0) return null;

    const nextEntry = normalizeHistoryEntry(future[0]);
    return {
      detail: getRedoDetail(nextEntry.actionDesc),
      result: getRedoDetail(nextEntry.actionDesc).replace(/^已/, '')
    };
  }, [future]);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Filter items by selected year
  const activeItems = useMemo(() => {
    if (selectedYear === '总计' || selectedYear === 'all') {
      return items;
    }
    return items.filter((i) => (i.year || CURRENT_YEAR) === selectedYear);
  }, [items, selectedYear]);

  // Computed metrics based on the active year items
  const incomeItems = useMemo(() => activeItems.filter((i) => i.type === 'income'), [activeItems]);
  const expenseItems = useMemo(() => activeItems.filter((i) => i.type === 'expense'), [activeItems]);
  const savingItems = useMemo(() => activeItems.filter((i) => i.type === 'saving'), [activeItems]);

  const totalIncome = useMemo(
    () => incomeItems.reduce((sum, i) => sum + Number(i.amount || 0), 0),
    [incomeItems]
  );

  const totalExpense = useMemo(
    () => expenseItems.reduce((sum, i) => sum + Number(i.amount || 0), 0),
    [expenseItems]
  );

  const totalSavings = useMemo(
    () => savingItems.reduce((sum, i) => sum + Number(i.amount || 0), 0),
    [savingItems]
  );

  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const savingsRate = useMemo(
    () => (totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0.0'),
    [totalIncome, netBalance]
  );

  const savingDepositRate = useMemo(
    () => (totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : '0.0'),
    [totalIncome, totalSavings]
  );

  const expenseRate = useMemo(
    () => (totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0.0'),
    [totalIncome, totalExpense]
  );

  // Grouped Categories in active year
  const categorySummary = useMemo(() => {
    const map = {};
    activeItems.forEach((it) => {
      if (!map[it.category]) {
        map[it.category] = { category: it.category, type: it.type, total: 0, count: 0, tags: [] };
      }
      map[it.category].total += Number(it.amount || 0);
      map[it.category].count += 1;
      const itemTag = String(it.tag || '').trim();
      if (itemTag && !map[it.category].tags.includes(itemTag)) map[it.category].tags.push(itemTag);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [activeItems]);

  // Hustle stats in active year
  const hustleStats = useMemo(() => {
    const hustleItems = incomeItems.filter(
      (i) => i.category.includes('闲鱼') || i.category.includes('副业')
    );
    const total = hustleItems.reduce((s, i) => s + Number(i.amount || 0), 0);
    const ratio = totalIncome > 0 ? ((total / totalIncome) * 100).toFixed(1) : '0.0';
    return { items: hustleItems, total, ratio };
  }, [incomeItems, totalIncome]);

  // Large expenses stats in active year
  const largeExpenseStats = useMemo(() => {
    const large = expenseItems.filter(
      (i) => Number(i.amount) >= 3000 || (i.tag && i.tag.includes('大额'))
    );
    const total = large.reduce((s, i) => s + Number(i.amount || 0), 0);
    const ratio = totalExpense > 0 ? ((total / totalExpense) * 100).toFixed(1) : '0.0';
    return { items: large, total, ratio };
  }, [expenseItems, totalExpense]);

  // Card order handlers
  const setMinimalCardOrder = useCallback((newOrder) => {
    updatePreferences({ minimalCardOrder: newOrder });
  }, [updatePreferences]);

  const setDetailCardOrder = useCallback((newOrder) => {
    updatePreferences({ detailCardOrder: newOrder });
  }, [updatePreferences]);

  const setMinimalCategoryCardOrder = useCallback((newOrder) => {
    updatePreferences({ minimalCategoryCardOrder: newOrder });
  }, [updatePreferences]);

  const setDetailOverviewCardOrder = useCallback((newOrder) => {
    updatePreferences({ detailOverviewCardOrder: newOrder });
  }, [updatePreferences]);

  const setDetailIncomeCategoryOrder = useCallback((newOrder) => {
    updatePreferences({ detailIncomeCategoryOrder: newOrder });
  }, [updatePreferences]);

  const setDetailIncomeItemOrder = useCallback((newOrder) => {
    updatePreferences({ detailIncomeItemOrder: newOrder });
  }, [updatePreferences]);

  const setDetailExpenseCategoryOrder = useCallback((newOrder) => {
    updatePreferences({ detailExpenseCategoryOrder: newOrder });
  }, [updatePreferences]);

  const setDetailExpenseItemOrder = useCallback((newOrder) => {
    updatePreferences({ detailExpenseItemOrder: newOrder });
  }, [updatePreferences]);

  const setDetailMajorExpenseOrder = useCallback((newOrder) => {
    updatePreferences({ detailMajorExpenseOrder: newOrder });
  }, [updatePreferences]);

  const setDetailRegularExpenseOrder = useCallback((newOrder) => {
    updatePreferences({ detailRegularExpenseOrder: newOrder });
  }, [updatePreferences]);

  const setDetailSavingCategoryOrder = useCallback((newOrder) => {
    updatePreferences({ detailSavingCategoryOrder: newOrder });
  }, [updatePreferences]);

  const setDetailSavingItemOrder = useCallback((newOrder) => {
    updatePreferences({ detailSavingItemOrder: newOrder });
  }, [updatePreferences]);

  const resetCardOrders = useCallback(() => {
    updatePreferences({
      minimalCardOrder: DEFAULT_MINIMAL_CARD_ORDER,
      detailCardOrder: DEFAULT_DETAIL_CARD_ORDER,
      minimalCategoryCardOrder: DEFAULT_MINIMAL_CATEGORY_CARD_ORDER,
      detailOverviewCardOrder: DEFAULT_DETAIL_OVERVIEW_CARD_ORDER,
      detailIncomeCategoryOrder: DEFAULT_DETAIL_INCOME_CATEGORY_ORDER,
      detailIncomeItemOrder: [],
      detailExpenseCategoryOrder: [],
      detailExpenseItemOrder: [],
      detailMajorExpenseOrder: DEFAULT_DETAIL_MAJOR_EXPENSE_ORDER,
      detailRegularExpenseOrder: DEFAULT_DETAIL_REGULAR_EXPENSE_ORDER,
      detailSavingCategoryOrder: DEFAULT_DETAIL_SAVING_CATEGORY_ORDER,
      detailSavingItemOrder: [],
      minimalCollapsedCards: [],
      minimalCollapsedCategories: [],
      detailCollapsedCards: [],
      detailCollapsedIncomeCategories: [],
      detailCollapsedExpenseCategories: [],
      detailCollapsedSavingCategories: []
    });
  }, [updatePreferences]);

  const toggleCustomSorting = useCallback(() => {
    setIsCustomSorting((prev) => !prev);
  }, []);

  return {
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
    setIsCustomSorting,
    toggleCustomSorting,
    minimalCardOrder: preferences.minimalCardOrder || DEFAULT_MINIMAL_CARD_ORDER,
    detailCardOrder: preferences.detailCardOrder || DEFAULT_DETAIL_CARD_ORDER,
    minimalCategoryCardOrder: preferences.minimalCategoryCardOrder || DEFAULT_MINIMAL_CATEGORY_CARD_ORDER,
    detailOverviewCardOrder: preferences.detailOverviewCardOrder || DEFAULT_DETAIL_OVERVIEW_CARD_ORDER,
    detailIncomeCategoryOrder: preferences.detailIncomeCategoryOrder || DEFAULT_DETAIL_INCOME_CATEGORY_ORDER,
    detailIncomeItemOrder: preferences.detailIncomeItemOrder || [],
    detailExpenseCategoryOrder: preferences.detailExpenseCategoryOrder || [],
    detailExpenseItemOrder: preferences.detailExpenseItemOrder || [],
    detailMajorExpenseOrder: preferences.detailMajorExpenseOrder || DEFAULT_DETAIL_MAJOR_EXPENSE_ORDER,
    detailRegularExpenseOrder: preferences.detailRegularExpenseOrder || DEFAULT_DETAIL_REGULAR_EXPENSE_ORDER,
    detailSavingCategoryOrder: preferences.detailSavingCategoryOrder || DEFAULT_DETAIL_SAVING_CATEGORY_ORDER,
    detailSavingItemOrder: preferences.detailSavingItemOrder || [],
    setMinimalCardOrder,
    setDetailCardOrder,
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
    categories,
    incomeCategories: categories.income,
    expenseCategories: categories.expense,
    savingCategories: categories.saving || [],
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
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoPreview,
    redoPreview,
    toastMessage,
    clearToast
  };
}
