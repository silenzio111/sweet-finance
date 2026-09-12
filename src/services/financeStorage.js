import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { exportDatabaseFile } from './backupFiles';

export const STORAGE_KEYS = {
  items: 'sweetfinance_items_v2',
  categories: 'sweetfinance_categories_v2',
  preferences: 'sweetfinance_preferences_v2',
  years: 'sweetfinance_custom_years_v2',
  rates: 'sweetfinance_exchange_rates_v2'
};

const DATABASE_NAME = 'sweetfinance';
const LEGACY_STATE_TABLE = 'finance_state';
const LEDGER_ITEMS_TABLE = 'ledger_items';
const ADJUSTMENTS_TABLE = 'adjustment_records';
const CATEGORIES_TABLE = 'categories';
const PREFERENCES_TABLE = 'preferences';
const STORAGE_VERSION = 2;
const RECOVERY_KEY = 'sweetfinance_sqlite_recovery_v1';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let databasePromise = null;
let nativeDatabaseAvailable = true;
let nativeWriteQueue = Promise.resolve();

function canUseNativeDatabase() {
  return Capacitor.isNativePlatform() && nativeDatabaseAvailable;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serialize(value) {
  return JSON.stringify(value ?? null);
}

function readLegacyState() {
  const state = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) state[name] = JSON.parse(raw);
    } catch (error) {
      console.error(`Failed to read legacy ${name} storage:`, error);
    }
  });

  return state;
}

function writeLegacyState(state) {
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = name === 'years'
      ? state.customYears
      : name === 'rates'
      ? state.exchangeRates
      : state[name];
    try {
      localStorage.setItem(key, serialize(value));
    } catch (error) {
      console.error(`Failed to save ${name} storage fallback:`, error);
    }
  });
}

function readRecoveryState() {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY);
    return raw ? parseJson(raw, null) : null;
  } catch {
    return null;
  }
}

function writeRecoveryState(state) {
  try {
    localStorage.setItem(RECOVERY_KEY, serialize(state));
  } catch (error) {
    console.error('Failed to write SQLite recovery state:', error);
  }
}

function clearRecoveryState() {
  try {
    localStorage.removeItem(RECOVERY_KEY);
  } catch {
    // The next successful startup can safely retry removal.
  }
}

function normalizeStateShape(state = {}) {
  return {
    items: Array.isArray(state.items) ? state.items : [],
    categories: state.categories && typeof state.categories === 'object' && !Array.isArray(state.categories)
      ? state.categories
      : {},
    preferences: state.preferences && typeof state.preferences === 'object' && !Array.isArray(state.preferences)
      ? state.preferences
      : {},
    customYears: Array.isArray(state.customYears)
      ? state.customYears
      : (Array.isArray(state.years) ? state.years : []),
    exchangeRates: state.exchangeRates && typeof state.exchangeRates === 'object' && !Array.isArray(state.exchangeRates)
      ? state.exchangeRates
      : (state.rates && typeof state.rates === 'object' && !Array.isArray(state.rates) ? state.rates : {})
  };
}

async function openNativeDatabase() {
  const existingConnection = await sqlite.isConnection(DATABASE_NAME, false);
  const database = existingConnection.result
    ? await sqlite.retrieveConnection(DATABASE_NAME, false)
    // Keep the plugin-level version stable for existing installs. The schema marker below
    // owns application migrations, so an old database never needs a Capacitor upgrade script.
    : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);

  const openState = await database.isDBOpen();
  if (!openState.result) await database.open();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS ${LEDGER_ITEMS_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      item_type TEXT NOT NULL DEFAULT '',
      category TEXT,
      item_year TEXT,
      currency TEXT NOT NULL DEFAULT 'CNY',
      amount REAL NOT NULL DEFAULT 0,
      original_amount REAL NOT NULL DEFAULT 0,
      exchange_rate REAL NOT NULL DEFAULT 1,
      tag TEXT,
      note TEXT,
      position INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ${ADJUSTMENTS_TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      item_id TEXT NOT NULL,
      operation TEXT,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT,
      note TEXT,
      created_at TEXT,
      position INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES ${LEDGER_ITEMS_TABLE}(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ${CATEGORIES_TABLE} (
      category_type TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (category_type, name)
    );
    CREATE TABLE IF NOT EXISTS ${PREFERENCES_TABLE} (
      preference_key TEXT PRIMARY KEY NOT NULL,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ledger_items_year_type ON ${LEDGER_ITEMS_TABLE}(item_year, item_type);
    CREATE INDEX IF NOT EXISTS idx_ledger_items_category_year_amount ON ${LEDGER_ITEMS_TABLE}(category, item_year, amount);
    CREATE INDEX IF NOT EXISTS idx_adjustments_item_created ON ${ADJUSTMENTS_TABLE}(item_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_adjustments_created_at ON ${ADJUSTMENTS_TABLE}(created_at);
  `);

  return database;
}

async function getNativeDatabase() {
  if (!databasePromise) {
    databasePromise = openNativeDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

async function readLegacyStateTable(database) {
  try {
    const result = await database.query(`SELECT state_key, value_json FROM ${LEGACY_STATE_TABLE}`);
    const state = {};

    (result.values || []).forEach((row) => {
      const value = parseJson(row.value_json, undefined);
      if (value !== undefined) state[row.state_key] = value;
    });

    return state;
  } catch {
    return {};
  }
}

async function getStoredPreferenceMap(database) {
  const result = await database.query(`SELECT preference_key, value_json FROM ${PREFERENCES_TABLE}`);
  const values = {};

  (result.values || []).forEach((row) => {
    const value = parseJson(row.value_json, undefined);
    if (value !== undefined) values[row.preference_key] = value;
  });

  return values;
}

async function hasNormalizedSnapshot(database) {
  const preferences = await getStoredPreferenceMap(database);
  return Number(preferences.__storage_version) >= STORAGE_VERSION;
}

async function readNormalizedState(database) {
  const [itemsResult, adjustmentsResult, categoriesResult, preferenceValues] = await Promise.all([
    database.query(`SELECT * FROM ${LEDGER_ITEMS_TABLE} ORDER BY position ASC`),
    database.query(`SELECT * FROM ${ADJUSTMENTS_TABLE} ORDER BY item_id ASC, position ASC`),
    database.query(`SELECT category_type, name, position FROM ${CATEGORIES_TABLE} ORDER BY category_type ASC, position ASC`),
    getStoredPreferenceMap(database)
  ]);

  const adjustmentsByItemId = new Map();
  (adjustmentsResult.values || []).forEach((row) => {
    const data = parseJson(row.data_json, {}) || {};
    const adjustment = {
      ...data,
      id: row.id,
      operation: row.operation || data.operation,
      amount: Number(row.amount ?? data.amount ?? 0),
      currency: row.currency || data.currency,
      note: row.note || data.note || '',
      createdAt: row.created_at || data.createdAt
    };
    const records = adjustmentsByItemId.get(row.item_id) || [];
    records.push(adjustment);
    adjustmentsByItemId.set(row.item_id, records);
  });

  const items = (itemsResult.values || []).map((row) => {
    const data = parseJson(row.data_json, {}) || {};
    return {
      ...data,
      id: row.id,
      title: row.title,
      type: row.item_type,
      category: row.category || '',
      year: row.item_year || '',
      currency: row.currency || 'CNY',
      amount: Number(row.amount || 0),
      originalAmount: Number(row.original_amount || 0),
      exchangeRate: Number(row.exchange_rate || 1),
      tag: row.tag || '',
      note: row.note || '',
      adjustments: adjustmentsByItemId.get(row.id) || []
    };
  });

  const categories = {};
  (categoriesResult.values || []).forEach((row) => {
    if (!categories[row.category_type]) categories[row.category_type] = [];
    categories[row.category_type].push(row.name);
  });

  return normalizeStateShape({
    items,
    categories,
    preferences: preferenceValues.preferences,
    customYears: preferenceValues.customYears,
    exchangeRates: preferenceValues.exchangeRates
  });
}

function deserializeLedgerItem(row) {
  const data = parseJson(row.data_json, {}) || {};
  return {
    ...data,
    id: row.id,
    title: row.title,
    type: row.item_type,
    category: row.category || '',
    year: row.item_year || '',
    currency: row.currency || 'CNY',
    amount: Number(row.amount || 0),
    originalAmount: Number(row.original_amount || 0),
    exchangeRate: Number(row.exchange_rate || 1),
    tag: row.tag || '',
    note: row.note || ''
  };
}

function deserializeAdjustmentRecord(row) {
  const data = parseJson(row.data_json, {}) || {};
  return {
    ...data,
    id: row.id,
    itemId: row.item_id,
    operation: row.operation || data.operation,
    amount: Number(row.amount ?? data.amount ?? 0),
    currency: row.currency || data.currency || 'CNY',
    note: row.note || data.note || '',
    createdAt: row.created_at || data.createdAt
  };
}

function hasNumberFilter(value) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
}

// These query APIs operate on normalized columns rather than parsing the JSON backup payload.
// They are the foundation for future filter, report, and history views.
export async function queryLedgerItems({ year, type, category, minAmount, maxAmount } = {}) {
  if (!canUseNativeDatabase()) return [];

  try {
    const clauses = [];
    const values = [];

    if (year) {
      clauses.push('item_year = ?');
      values.push(String(year));
    }
    if (type) {
      clauses.push('item_type = ?');
      values.push(type);
    }
    if (category) {
      clauses.push('category = ?');
      values.push(category);
    }
    if (hasNumberFilter(minAmount)) {
      clauses.push('amount >= ?');
      values.push(Number(minAmount));
    }
    if (hasNumberFilter(maxAmount)) {
      clauses.push('amount <= ?');
      values.push(Number(maxAmount));
    }

    const database = await getNativeDatabase();
    const whereClause = clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
    const result = await database.query(
      `SELECT * FROM ${LEDGER_ITEMS_TABLE}${whereClause} ORDER BY item_year DESC, position ASC`,
      values
    );
    return (result.values || []).map(deserializeLedgerItem);
  } catch (error) {
    console.error('Failed to query normalized ledger items:', error);
    return [];
  }
}

export async function queryAdjustmentRecords({ itemId, fromDate, toDate, minAmount, maxAmount } = {}) {
  if (!canUseNativeDatabase()) return [];

  try {
    const clauses = [];
    const values = [];

    if (itemId) {
      clauses.push('item_id = ?');
      values.push(String(itemId));
    }
    if (fromDate) {
      clauses.push('created_at >= ?');
      values.push(fromDate);
    }
    if (toDate) {
      clauses.push('created_at <= ?');
      values.push(toDate);
    }
    if (hasNumberFilter(minAmount)) {
      clauses.push('amount >= ?');
      values.push(Number(minAmount));
    }
    if (hasNumberFilter(maxAmount)) {
      clauses.push('amount <= ?');
      values.push(Number(maxAmount));
    }

    const database = await getNativeDatabase();
    const whereClause = clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
    const result = await database.query(
      `SELECT * FROM ${ADJUSTMENTS_TABLE}${whereClause} ORDER BY created_at DESC, position ASC`,
      values
    );
    return (result.values || []).map(deserializeAdjustmentRecord);
  } catch (error) {
    console.error('Failed to query normalized adjustment records:', error);
    return [];
  }
}

function createSnapshotStatements(state) {
  const normalized = normalizeStateShape(state);
  const now = Date.now();
  const statements = [
    { statement: `DELETE FROM ${ADJUSTMENTS_TABLE}`, values: [] },
    { statement: `DELETE FROM ${LEDGER_ITEMS_TABLE}`, values: [] },
    { statement: `DELETE FROM ${CATEGORIES_TABLE}`, values: [] },
    { statement: `DELETE FROM ${PREFERENCES_TABLE}`, values: [] }
  ];

  normalized.items.forEach((item, itemPosition) => {
    const itemId = String(item.id || `item-${now}-${itemPosition}`);
    const { adjustments = [], ...itemData } = item;
    statements.push({
      statement: `INSERT INTO ${LEDGER_ITEMS_TABLE} (
        id, title, item_type, category, item_year, currency, amount, original_amount,
        exchange_rate, tag, note, position, data_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        itemId,
        item.title || '',
        item.type || '',
        item.category || '',
        String(item.year || ''),
        item.currency || 'CNY',
        Number(item.amount || 0),
        Number(item.originalAmount ?? item.amount ?? 0),
        Number(item.exchangeRate || 1),
        item.tag || '',
        item.note || '',
        itemPosition,
        serialize(itemData),
        item.createdAt || null,
        now
      ]
    });

    (Array.isArray(adjustments) ? adjustments : []).forEach((adjustment, adjustmentPosition) => {
      const adjustmentId = String(adjustment.id || `${itemId}-adjustment-${adjustmentPosition}`);
      statements.push({
        statement: `INSERT INTO ${ADJUSTMENTS_TABLE} (
          id, item_id, operation, amount, currency, note, created_at, position, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          adjustmentId,
          itemId,
          adjustment.operation || '',
          Number(adjustment.amount || 0),
          adjustment.currency || item.currency || 'CNY',
          adjustment.note || '',
          adjustment.createdAt || null,
          adjustmentPosition,
          serialize(adjustment)
        ]
      });
    });
  });

  Object.entries(normalized.categories).forEach(([type, names]) => {
    (Array.isArray(names) ? names : []).forEach((name, position) => {
      statements.push({
        statement: `INSERT INTO ${CATEGORIES_TABLE} (category_type, name, position) VALUES (?, ?, ?)`,
        values: [type, String(name), position]
      });
    });
  });

  [
    ['__storage_version', STORAGE_VERSION],
    ['preferences', normalized.preferences],
    ['customYears', normalized.customYears],
    ['exchangeRates', normalized.exchangeRates]
  ].forEach(([key, value]) => {
    statements.push({
      statement: `INSERT INTO ${PREFERENCES_TABLE} (preference_key, value_json, updated_at) VALUES (?, ?, ?)`,
      values: [key, serialize(value), now]
    });
  });

  return statements;
}

async function writeNormalizedSnapshot(database, state) {
  await database.executeSet(createSnapshotStatements(state), true);
}

function enqueueNativeSnapshotWrite(state) {
  const snapshot = normalizeStateShape(state);
  const write = nativeWriteQueue.then(async () => {
    const database = await getNativeDatabase();
    await writeNormalizedSnapshot(database, snapshot);
  });

  nativeWriteQueue = write.catch(() => undefined);
  return write;
}

export async function loadFinanceState() {
  const legacyState = readLegacyState();

  if (!canUseNativeDatabase()) {
    return Object.keys(legacyState).length > 0 ? normalizeStateShape(legacyState) : {};
  }

  try {
    const database = await getNativeDatabase();
    const recoveryState = readRecoveryState();
    if (recoveryState) {
      await writeNormalizedSnapshot(database, recoveryState);
      clearRecoveryState();
      return normalizeStateShape(recoveryState);
    }

    if (await hasNormalizedSnapshot(database)) {
      return readNormalizedState(database);
    }

    const sqliteSnapshot = await readLegacyStateTable(database);
    const migrationSource = Object.keys(sqliteSnapshot).length > 0 ? sqliteSnapshot : legacyState;
    if (Object.keys(migrationSource).length > 0) {
      await writeNormalizedSnapshot(database, migrationSource);
    }

    // No previous data means the hook should retain its application defaults, then save
    // that first complete snapshot in a single transaction.
    return Object.keys(migrationSource).length > 0 ? normalizeStateShape(migrationSource) : {};
  } catch (error) {
    nativeDatabaseAvailable = false;
    console.error('SQLite is unavailable. Falling back to localStorage:', error);
    return normalizeStateShape(legacyState);
  }
}

export async function saveFinanceSnapshot(state) {
  const snapshot = normalizeStateShape(state);

  if (canUseNativeDatabase()) {
    try {
      await enqueueNativeSnapshotWrite(snapshot);
      clearRecoveryState();
      return;
    } catch (error) {
      nativeDatabaseAvailable = false;
      writeRecoveryState(snapshot);
      console.error('Failed to save SQLite snapshot. Using localStorage fallback:', error);
    }
  }

  // Keep the most recent complete snapshot available for the next native startup.
  // This prevents an earlier failed write from restoring stale data after later edits.
  if (Capacitor.isNativePlatform()) writeRecoveryState(snapshot);
  writeLegacyState(snapshot);
}

export async function exportSQLiteDatabaseSnapshot(state) {
  if (!canUseNativeDatabase()) {
    throw new Error('当前设备上的 SQLite 数据库不可用，无法导出数据库副本。');
  }

  const snapshot = normalizeStateShape(state);

  try {
    // Queue this exact state behind any pending writes before the native layer snapshots the file.
    await enqueueNativeSnapshotWrite(snapshot);
    clearRecoveryState();
  } catch (error) {
    nativeDatabaseAvailable = false;
    writeRecoveryState(snapshot);
    console.error('Failed to flush SQLite before database export:', error);
    throw new Error('账本尚未成功写入 SQLite，已取消导出以避免生成不完整副本。');
  }

  if (!canUseNativeDatabase()) {
    throw new Error('当前设备上的 SQLite 数据库不可用，无法导出数据库副本。');
  }

  return exportDatabaseFile();
}
