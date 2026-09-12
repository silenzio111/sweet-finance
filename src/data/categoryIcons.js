import {
  GraduationCap,
  Briefcase,
  Gift,
  Landmark,
  PiggyBank,
  ShoppingBag,
  Utensils,
  Heart,
  Shirt,
  Smartphone,
  Gamepad2,
  Banknote,
  Coins,
  House,
  Plane,
  BookOpen,
  Wallet,
  Sparkles,
  CircleDollarSign,
  Car,
  Coffee,
  Dumbbell
} from 'lucide-react';

export const CATEGORY_ICON_OPTIONS = [
  { key: 'graduation-cap', label: '学业', component: GraduationCap },
  { key: 'briefcase', label: '工作', component: Briefcase },
  { key: 'gift', label: '礼物', component: Gift },
  { key: 'landmark', label: '银行', component: Landmark },
  { key: 'piggy-bank', label: '储蓄', component: PiggyBank },
  { key: 'shopping-bag', label: '购物', component: ShoppingBag },
  { key: 'utensils', label: '餐饮', component: Utensils },
  { key: 'heart', label: '人情', component: Heart },
  { key: 'shirt', label: '服饰', component: Shirt },
  { key: 'smartphone', label: '数码', component: Smartphone },
  { key: 'gamepad-2', label: '娱乐', component: Gamepad2 },
  { key: 'banknote', label: '现金', component: Banknote },
  { key: 'coins', label: '零钱', component: Coins },
  { key: 'house', label: '居住', component: House },
  { key: 'plane', label: '旅行', component: Plane },
  { key: 'book-open', label: '学习', component: BookOpen },
  { key: 'wallet', label: '钱包', component: Wallet },
  { key: 'circle-dollar-sign', label: '收入', component: CircleDollarSign },
  { key: 'car', label: '出行', component: Car },
  { key: 'coffee', label: '咖啡', component: Coffee },
  { key: 'dumbbell', label: '健身', component: Dumbbell },
  { key: 'sparkles', label: '其他', component: Sparkles }
];

export const CATEGORY_ICON_COMPONENTS = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map(({ key, component }) => [key, component])
);

export function getCategoryIconKey(category = '', type = 'income') {
  const name = String(category || '');
  if (name.includes('学业') || name.includes('奖金')) return 'graduation-cap';
  if (name.includes('闲鱼') || name.includes('副业') || name.includes('兼职')) return 'briefcase';
  if (name.includes('压岁') || name.includes('礼物') || name.includes('人情')) return 'gift';
  if (name.includes('定期') || name.includes('存款') || name.includes('银行')) return 'landmark';
  if (name.includes('基金') || name.includes('储备') || name.includes('理财')) return 'piggy-bank';
  if (name.includes('餐饮') || name.includes('美食')) return 'utensils';
  if (name.includes('服饰') || name.includes('商场')) return 'shirt';
  if (name.includes('数码')) return 'smartphone';
  if (name.includes('娱乐')) return 'gamepad-2';
  if (name.includes('出行') || name.includes('旅行')) return 'car';
  if (type === 'expense') return 'shopping-bag';
  if (type === 'saving') return 'piggy-bank';
  return 'sparkles';
}

export function getCategoryIconComponent(category, type, categoryIcons = {}) {
  const customKey = categoryIcons?.[type]?.[category];
  return CATEGORY_ICON_COMPONENTS[customKey] || CATEGORY_ICON_COMPONENTS[getCategoryIconKey(category, type)];
}
