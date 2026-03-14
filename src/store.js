// Local storage keys
const KEYS = {
  transactions: 'hm_transactions',
  members: 'hm_members',
  categories: 'hm_categories',
  budgets: 'hm_budgets',
  settings: 'hm_settings',
};

// Default data
const defaultCategories = [
  { id: 'c1', name: 'מזון וקניות', type: 'expense', color: '#ef4444', icon: '🛒' },
  { id: 'c2', name: 'דיור ושכירות', type: 'expense', color: '#f59e0b', icon: '🏠' },
  { id: 'c3', name: 'רכב ותחבורה', type: 'expense', color: '#8b5cf6', icon: '🚗' },
  { id: 'c4', name: 'בריאות', type: 'expense', color: '#10b981', icon: '🏥' },
  { id: 'c5', name: 'חינוך', type: 'expense', color: '#3b82f6', icon: '📚' },
  { id: 'c6', name: 'בידור ופנאי', type: 'expense', color: '#ec4899', icon: '🎬' },
  { id: 'c7', name: 'ביגוד והנעלה', type: 'expense', color: '#14b8a6', icon: '👕' },
  { id: 'c8', name: 'חשמל ומים', type: 'expense', color: '#f97316', icon: '⚡' },
  { id: 'c9', name: 'תקשורת', type: 'expense', color: '#6366f1', icon: '📱' },
  { id: 'c10', name: 'שונות', type: 'expense', color: '#94a3b8', icon: '📦' },
  { id: 'c11', name: 'משכורת', type: 'income', color: '#10b981', icon: '💰' },
  { id: 'c12', name: 'פרילנס', type: 'income', color: '#3b82f6', icon: '💻' },
  { id: 'c13', name: 'השקעות', type: 'income', color: '#f59e0b', icon: '📈' },
  { id: 'c14', name: 'מתנות', type: 'income', color: '#ec4899', icon: '🎁' },
  { id: 'c15', name: 'הכנסה אחרת', type: 'income', color: '#94a3b8', icon: '💵' },
];

const defaultMembers = [
  { id: 'm1', name: 'ראש המשפחה', role: 'מבוגר', color: '#4f46e5', emoji: '👨' },
  { id: 'm2', name: 'בן/בת זוג', role: 'מבוגר', color: '#10b981', emoji: '👩' },
];

const defaultSettings = {
  currency: '₪',
  familyName: 'משפחת ישראל',
};

// Generate sample transactions
function generateSampleData() {
  const now = new Date();
  const transactions = [];
  const months = 3;

  for (let m = 0; m < months; m++) {
    const date = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Income
    transactions.push({
      id: `t_inc_${m}_1`,
      type: 'income',
      amount: 12000 + Math.round(Math.random() * 2000),
      category: 'c11',
      memberId: 'm1',
      description: 'משכורת חודשית',
      date: new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0],
      note: '',
    });
    transactions.push({
      id: `t_inc_${m}_2`,
      type: 'income',
      amount: 9000 + Math.round(Math.random() * 1500),
      category: 'c11',
      memberId: 'm2',
      description: 'משכורת חודשית',
      date: new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0],
      note: '',
    });

    // Expenses
    const expenses = [
      { amt: 4500, cat: 'c2', desc: 'שכירות', day: 1 },
      { amt: 1200 + Math.round(Math.random()*300), cat: 'c1', desc: 'סופר', day: 5 },
      { amt: 800 + Math.round(Math.random()*200), cat: 'c1', desc: 'קניות נוספות', day: 15 },
      { amt: 600 + Math.round(Math.random()*100), cat: 'c3', desc: 'דלק', day: 7 },
      { amt: 400 + Math.round(Math.random()*100), cat: 'c8', desc: 'חשמל', day: 10 },
      { amt: 300, cat: 'c9', desc: 'פלאפון ואינטרנט', day: 12 },
      { amt: 200 + Math.round(Math.random()*100), cat: 'c4', desc: 'רופא/תרופות', day: 18 },
      { amt: 500 + Math.round(Math.random()*200), cat: 'c6', desc: 'בילוי', day: 20 },
      { amt: 300 + Math.round(Math.random()*100), cat: 'c5', desc: 'חוגים לילדים', day: 3 },
    ];

    expenses.forEach((e, i) => {
      transactions.push({
        id: `t_exp_${m}_${i}`,
        type: 'expense',
        amount: e.amt,
        category: e.cat,
        memberId: Math.random() > 0.5 ? 'm1' : 'm2',
        description: e.desc,
        date: new Date(date.getFullYear(), date.getMonth(), e.day).toISOString().split('T')[0],
        note: '',
      });
    });
  }

  return transactions;
}

const defaultBudgets = [
  { id: 'b1', categoryId: 'c1', amount: 2500, month: '' },
  { id: 'b2', categoryId: 'c2', amount: 4500, month: '' },
  { id: 'b3', categoryId: 'c3', amount: 800, month: '' },
  { id: 'b4', categoryId: 'c6', amount: 600, month: '' },
  { id: 'b5', categoryId: 'c8', amount: 500, month: '' },
];

// Storage helpers
export function loadData(key, defaultValue) {
  try {
    const data = localStorage.getItem(KEYS[key]);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function initStore() {
  if (!localStorage.getItem(KEYS.categories)) {
    saveData('categories', defaultCategories);
  }
  if (!localStorage.getItem(KEYS.members)) {
    saveData('members', defaultMembers);
  }
  if (!localStorage.getItem(KEYS.transactions)) {
    saveData('transactions', generateSampleData());
  }
  if (!localStorage.getItem(KEYS.budgets)) {
    saveData('budgets', defaultBudgets);
  }
  if (!localStorage.getItem(KEYS.settings)) {
    saveData('settings', defaultSettings);
  }
}

export function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const MEMBER_ROLES = ['מבוגר', 'ילד', 'מתבגר', 'זקן'];
export const MEMBER_COLORS = ['#4f46e5','#10b981','#ef4444','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];
export const MEMBER_EMOJIS = ['👨','👩','👦','👧','👴','👵','🧑','👶'];

export const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

export function formatCurrency(amount, currency = '₪') {
  return `${currency}${Number(amount).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL');
}

export function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function parseMonthKey(key) {
  const [year, month] = key.split('-');
  return { year: parseInt(year), month: parseInt(month) - 1 };
}
