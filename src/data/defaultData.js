export const CURRENT_YEAR = new Date().getFullYear().toString();

export const DEFAULT_CURRENCIES = [
  { code: 'CNY', symbol: '¥', name: '人民币', flag: '🇨🇳', defaultRate: 1.0 },
  { code: 'USD', symbol: '$', name: '美元', flag: '🇺🇸', defaultRate: 7.23 },
  { code: 'EUR', symbol: '€', name: '欧元', flag: '🇪🇺', defaultRate: 7.85 },
  { code: 'JPY', symbol: '円', name: '日元', flag: '🇯🇵', defaultRate: 0.048 },
  { code: 'HKD', symbol: 'HK$', name: '港币', flag: '🇭🇰', defaultRate: 0.925 },
  { code: 'GBP', symbol: '£', name: '英镑', flag: '🇬🇧', defaultRate: 9.18 },
  { code: 'SGD', symbol: 'S$', name: '新加坡元', flag: '🇸🇬', defaultRate: 5.42 },
  { code: 'AUD', symbol: 'A$', name: '澳元', flag: '🇦🇺', defaultRate: 4.72 },
  { code: 'KRW', symbol: '₩', name: '韩元', flag: '🇰🇷', defaultRate: 0.0052 },
  { code: 'CAD', symbol: 'C$', name: '加元', flag: '🇨🇦', defaultRate: 5.15 },
  { code: 'THB', symbol: '฿', name: '泰铢', flag: '🇹🇭', defaultRate: 0.21 }
];

export const DEFAULT_EXCHANGE_RATES = DEFAULT_CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c.defaultRate;
  return acc;
}, {});

export function getCurrencyInfo(code = 'CNY') {
  return DEFAULT_CURRENCIES.find((c) => c.code === code) || DEFAULT_CURRENCIES[0];
}

export function formatCurrency(amount, currencyCode = 'CNY') {
  const info = getCurrencyInfo(currencyCode);
  const formatted = formatMoney(amount);
  return `${info.symbol}${formatted}`;
}

export const DEFAULT_ITEMS = [
  // 2026年度 收入条目
  { id: '1', year: '2026', type: 'income', category: '学业与竞赛奖金', title: '乙等学业奖', amount: 500, currency: 'CNY', originalAmount: 500, exchangeRate: 1.0, note: 'received', tag: '2025-2026-2学期' },
  { id: '2', year: '2026', type: 'income', category: '学业与竞赛奖金', title: '社会实践单项奖', amount: 500, currency: 'CNY', originalAmount: 500, exchangeRate: 1.0, note: 'received', tag: '2025-2026-2学期' },
  { id: '3', year: '2026', type: 'income', category: '学业与竞赛奖金', title: '大创项目', amount: 1110, currency: 'CNY', originalAmount: 1110, exchangeRate: 1.0, note: 'received', tag: '2025-2026-2学期' },
  { id: '4', year: '2026', type: 'income', category: '学业与竞赛奖金', title: '学术挑战赛', amount: 267, currency: 'CNY', originalAmount: 267, exchangeRate: 1.0, note: 'received', tag: '2025-2026-2学期' },
  { id: '5', year: '2026', type: 'income', category: '学业与竞赛奖金', title: '大英赛', amount: 1000, currency: 'CNY', originalAmount: 1000, exchangeRate: 1.0, note: '待发放', tag: '2025-2026-2学期' },
  { id: '6', year: '2026', type: 'income', category: '闲鱼&代做资料', title: '二手闲置 (闲鱼)', amount: 2157, currency: 'CNY', originalAmount: 2157, exchangeRate: 1.0, note: '专款专用', tag: '独立副业' },
  { id: '7', year: '2026', type: 'income', category: '闲鱼&代做资料', title: '代做资料 (论坛)', amount: 7821, currency: 'CNY', originalAmount: 7821, exchangeRate: 1.0, note: '专款专用', tag: '独立副业' },
  { id: '8', year: '2026', type: 'income', category: '压岁钱与理财', title: '压岁钱合计 (姥姥14k+2爸2.5k+妈1.6k+大雨1k+bean520)', amount: 19620, currency: 'CNY', originalAmount: 19620, exchangeRate: 1.0, note: '大额压岁拆解', tag: '' },
  { id: '9', year: '2026', type: 'income', category: '压岁钱与理财', title: '转账 ❤️', amount: 1000, currency: 'CNY', originalAmount: 1000, exchangeRate: 1.0, note: '日常转账', tag: '' },
  { id: '10', year: '2026', type: 'income', category: '压岁钱与理财', title: '定存一年收益 (10W 定期)', amount: 1100, currency: 'CNY', originalAmount: 1100, exchangeRate: 1.0, note: '10W本金定期', tag: '理财收益' },

  // 2026年度 支出条目
  { id: '11', year: '2026', type: 'expense', category: '商场与服饰', title: '320 万象城 shopping', amount: 9235, currency: 'CNY', originalAmount: 9235, exchangeRate: 1.0, note: '春季高街添置', tag: '大额打标' },
  { id: '12', year: '2026', type: 'expense', category: '商场与服饰', title: '620 万象城 shopping', amount: 4464, currency: 'CNY', originalAmount: 4464, exchangeRate: 1.0, note: '夏季换季服饰', tag: '大额打标' },
  { id: '13', year: '2026', type: 'expense', category: '数码好物', title: '索尼降噪耳机', amount: 2374, currency: 'CNY', originalAmount: 2374, exchangeRate: 1.0, note: '提升专注力', tag: '数码' },
  { id: '14', year: '2026', type: 'expense', category: '人情与礼物', title: '礼物支出', amount: 2240, currency: 'CNY', originalAmount: 2240, exchangeRate: 1.0, note: '节日与生日心意', tag: '人情' },
  { id: '15', year: '2026', type: 'expense', category: '箱包配饰', title: 'Coach 包包', amount: 1750, currency: 'CNY', originalAmount: 1750, exchangeRate: 1.0, note: '日常百搭款', tag: '轻奢' },
  { id: '16', year: '2026', type: 'expense', category: '休闲娱乐', title: '汪苏泷演唱会', amount: 1200, currency: 'CNY', originalAmount: 1200, exchangeRate: 1.0, note: 'Live现场票', tag: '娱乐' },

  // 2026年度 存款与理财沉淀条目
  { id: '17', year: '2026', type: 'saving', category: '定期存款', title: '招商银行三年定期存单', amount: 20000, currency: 'CNY', originalAmount: 20000, exchangeRate: 1.0, note: '稳健资产储备', tag: '定期' },
  { id: '18', year: '2026', type: 'saving', category: '基金与理财', title: '指数基金定投计划', amount: 8000, currency: 'CNY', originalAmount: 8000, exchangeRate: 1.0, note: '标普500/沪深300', tag: '长期定投' },

  // 2025年度 历史条目
  { id: '201', year: '2025', type: 'income', category: '学业与竞赛奖金', title: '甲等综合奖学金', amount: 3000, currency: 'CNY', originalAmount: 3000, exchangeRate: 1.0, note: '年度嘉奖', tag: '2024-2025年度' },
  { id: '202', year: '2025', type: 'income', category: '闲鱼&代做资料', title: '闲鱼技术代咨询', amount: 5600, currency: 'CNY', originalAmount: 5600, exchangeRate: 1.0, note: '副业积累', tag: '独立副业' },
  { id: '203', year: '2025', type: 'income', category: '压岁钱与理财', title: '2025新年压岁礼', amount: 15000, currency: 'CNY', originalAmount: 15000, exchangeRate: 1.0, note: '长辈新年祝福', tag: '' },
  { id: '204', year: '2025', type: 'expense', category: '数码好物', title: 'iPad Pro 11寸 M4', amount: 6999, currency: 'CNY', originalAmount: 6999, exchangeRate: 1.0, note: '学习创作设备', tag: '大额打标' },
  { id: '205', year: '2025', type: 'expense', category: '休闲娱乐', title: '毕业旅行 (云南大理)', amount: 4300, currency: 'CNY', originalAmount: 4300, exchangeRate: 1.0, note: '暑期旅行', tag: '大额打标' },
  { id: '206', year: '2025', type: 'expense', category: '商场与服饰', title: '秋冬大衣换新', amount: 2890, currency: 'CNY', originalAmount: 2890, exchangeRate: 1.0, note: '商场专柜', tag: '服饰' },
  { id: '207', year: '2025', type: 'saving', category: '定期存款', title: '年终结余定存', amount: 15000, currency: 'CNY', originalAmount: 15000, exchangeRate: 1.0, note: '保本理财', tag: '稳健' },

  // 2024年度 历史条目
  { id: '301', year: '2024', type: 'income', category: '兼职工资', title: '寒暑期助教兼职', amount: 4800, currency: 'CNY', originalAmount: 4800, exchangeRate: 1.0, note: '校外辅导', tag: '兼职' },
  { id: '302', year: '2024', type: 'income', category: '压岁钱与理财', title: '2024新年压岁礼', amount: 12000, currency: 'CNY', originalAmount: 12000, exchangeRate: 1.0, note: '长辈新年祝福', tag: '' },
  { id: '303', year: '2024', type: 'expense', category: '数码好物', title: '富士微单相机 (二手)', amount: 4200, currency: 'CNY', originalAmount: 4200, exchangeRate: 1.0, note: '摄影记录生活', tag: '大额打标' },
  { id: '304', year: '2024', type: 'expense', category: '餐饮美食', title: '年度聚餐聚会', amount: 1850, currency: 'CNY', originalAmount: 1850, exchangeRate: 1.0, note: '朋友聚餐', tag: '日常' }
];

export function getAvailableYears(items = []) {
  const currentYearNum = new Date().getFullYear();
  const yearsSet = new Set();

  // 动态加入当前年份及临近推演年份作为基准
  yearsSet.add(String(currentYearNum));
  yearsSet.add(String(currentYearNum - 1));
  yearsSet.add(String(currentYearNum - 2));
  yearsSet.add(String(currentYearNum + 1));

  // 动态从账目数据中提取所有实际存在的年份
  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (item && item.year) {
        yearsSet.add(String(item.year));
      }
    });
  }

  // 倒序排列（如 2027, 2026, 2025, 2024...）
  const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  return ['总计', ...sortedYears];
}

export const AVAILABLE_TABS = [
  { id: 'minimal', label: '极简视图', icon: '✨' },
  { id: 'detail', label: '详细视图', icon: '📊' },
  { id: 'manage', label: '修改管理', icon: '✏️' }
];

export const INCOME_CATEGORIES = [
  '学业与竞赛奖金',
  '闲鱼&代做资料',
  '压岁钱与理财',
  '兼职工资',
  '其他收入'
];

export const EXPENSE_CATEGORIES = [
  '商场与服饰',
  '数码好物',
  '人情与礼物',
  '箱包配饰',
  '休闲娱乐',
  '餐饮美食',
  '其他支出'
];

export const SAVING_CATEGORIES = [
  '定期存款',
  '基金与理财',
  '大额存单',
  '养老金/公积金',
  '应急备用金',
  '黄金与贵金属',
  '其他存款'
];

export const DEFAULT_MINIMAL_CARD_ORDER = [
  'balance',
  'income',
  'expense',
  'savings',
  'distribution',
  'category_ranking'
];

export const DEFAULT_DETAIL_CARD_ORDER = [
  'overview',
  'income_section',
  'expense_section',
  'saving_section'
];

// Internal display orders are intentionally partial. New categories and records
// are appended after saved keys so freshly created data remains visible.
export const DEFAULT_MINIMAL_CATEGORY_CARD_ORDER = [];

export const DEFAULT_DETAIL_OVERVIEW_CARD_ORDER = [
  'balance',
  'savings'
];

export const DEFAULT_DETAIL_INCOME_CATEGORY_ORDER = [];
export const DEFAULT_DETAIL_MAJOR_EXPENSE_ORDER = [];
export const DEFAULT_DETAIL_REGULAR_EXPENSE_ORDER = [];
export const DEFAULT_DETAIL_SAVING_CATEGORY_ORDER = [];

export function formatMoney(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const n = Number(num);
  if (!isFinite(n)) return '∞';
  const isNegative = n < 0;
  const absVal = Math.abs(n);

  // 应对极端天文数字（>= 1e14），做智能格式化防止科学计数法乱码撑破UI
  if (absVal >= 1e14) {
    if (absVal >= 1e16) {
      return (isNegative ? '-' : '') + absVal.toExponential(2).replace('e+', ' × 10^');
    }
    return (isNegative ? '-' : '') + (absVal / 1e12).toFixed(2) + ' 万亿';
  }

  // 常规数值处理：四舍五入并以中式4位分节输出
  const fixedStr = absVal.toFixed(2);
  const parts = fixedStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] === '00' ? '' : '.' + parts[1].replace(/0+$/, '');

  // 中式四位分节 (万进位)
  integerPart = integerPart.replace(/\B(?=(\d{4})+(?!\d))/g, ',');

  return (isNegative ? '-' : '') + integerPart + decimalPart;
}
