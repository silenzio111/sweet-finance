import { Capacitor, registerPlugin } from '@capacitor/core';

const FinanceFile = registerPlugin('FinanceFile');

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createBackupFilename() {
  // Backup names follow the date the person sees on their device, rather than UTC.
  return `SweetFinance_Backup_${formatLocalDate()}.json`;
}

function createDatabaseFilename() {
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join('');
  return `SweetFinance_Database_${formatLocalDate(now)}_${time}.db`;
}

function downloadInBrowser(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return { cancelled: false, filename };
}

function importInBrowser() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/json';
    input.className = 'hidden';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve({ cancelled: true });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve({
        cancelled: false,
        filename: file.name,
        content: String(reader.result || '')
      });
      reader.onerror = () => reject(new Error('无法读取所选备份文件。'));
      reader.readAsText(file);
    });

    input.addEventListener('cancel', () => {
      input.remove();
      resolve({ cancelled: true });
    });

    document.body.appendChild(input);
    input.click();
  });
}

export async function exportBackupFile(content) {
  const filename = createBackupFilename();

  if (Capacitor.getPlatform() === 'android') {
    return FinanceFile.exportJson({ content, filename });
  }

  return downloadInBrowser(content, filename);
}

export async function exportDatabaseFile() {
  if (Capacitor.getPlatform() !== 'android') {
    throw new Error('SQLite 数据库副本仅可在 Android App 内导出。');
  }

  return FinanceFile.exportDatabase({ filename: createDatabaseFilename() });
}

export async function importBackupFile() {
  if (Capacitor.getPlatform() === 'android') {
    return FinanceFile.importJson();
  }

  return importInBrowser();
}
