import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { formatCurrency, getMonthKey, MONTHS_HE, parseMonthKey } from '../store';

function StatCard({ icon, iconClass, label, value, change, changeDir, currency }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{formatCurrency(value, currency)}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeDir === 'up' ? 'up' : 'down'}`}>
            {changeDir === 'up' ? <ArrowUpRight size={12} style={{display:'inline'}} /> : <ArrowDownRight size={12} style={{display:'inline'}} />}
            {' '}{Math.abs(change)}% מהחודש הקודם
          </div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:8, padding:'12px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13 }}>
            {p.name}: {formatCurrency(p.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ transactions, categories, members, budgets, settings, selectedMonth }) {
  const currency = settings?.currency || '₪';

  const monthTransactions = useMemo(() =>
    transactions.filter(t => getMonthKey(t.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const monthIncome = useMemo(() =>
    monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  const monthExpense = useMemo(() =>
    monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  const monthBalance = monthIncome - monthExpense;
  const savingRate = monthIncome > 0 ? Math.round((monthBalance / monthIncome) * 100) : 0;

  // Previous month
  const { year, month } = parseMonthKey(selectedMonth);
  const prevDate = new Date(year, month - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevTransactions = transactions.filter(t => getMonthKey(t.date) === prevMonthKey);
  const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const incomeChange = prevIncome > 0 ? Math.round(((monthIncome - prevIncome) / prevIncome) * 100) : 0;
  const expenseChange = prevExpense > 0 ? Math.round(((monthExpense - prevExpense) / prevExpense) * 100) : 0;

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const txs = transactions.filter(t => getMonthKey(t.date) === key);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      data.push({
        month: MONTHS_HE[d.getMonth()],
        הכנסות: inc,
        הוצאות: exp,
        חיסכון: inc - exp,
      });
    }
    return data;
  }, [transactions, year, month]);

  // Expense by category (pie)
  const expensePieData = useMemo(() => {
    const map = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([catId, value]) => {
        const cat = categories.find(c => c.id === catId);
        return { name: cat?.name || catId, value, color: cat?.color || '#94a3b8' };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [monthTransactions, categories]);

  // Budget progress
  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = monthTransactions
        .filter(t => t.type === 'expense' && t.category === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const pct = Math.min(Math.round((spent / b.amount) * 100), 100);
      return { ...b, cat, spent, pct };
    });
  }, [budgets, categories, monthTransactions]);

  // Recent transactions
  const recentTx = useMemo(() =>
    [...monthTransactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
    [monthTransactions]
  );

  // Member spending
  const memberSpending = useMemo(() => {
    return members.map(m => {
      const spent = monthTransactions.filter(t => t.type === 'expense' && t.memberId === m.id).reduce((s, t) => s + t.amount, 0);
      const earned = monthTransactions.filter(t => t.type === 'income' && t.memberId === m.id).reduce((s, t) => s + t.amount, 0);
      return { ...m, spent, earned };
    });
  }, [members, monthTransactions]);

  const { year: y, month: m2 } = parseMonthKey(selectedMonth);
  const monthLabel = `${MONTHS_HE[m2]} ${y}`;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>דשבורד</h1>
          <p>סקירה כללית - {monthLabel}</p>
        </div>
        <div className="chip"><Calendar size={14} /> {monthLabel}</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<TrendingUp size={22} />} iconClass="income" label="סה״כ הכנסות" value={monthIncome} change={incomeChange} changeDir={incomeChange >= 0 ? 'up' : 'down'} currency={currency} />
        <StatCard icon={<TrendingDown size={22} />} iconClass="expense" label="סה״כ הוצאות" value={monthExpense} change={expenseChange} changeDir={expenseChange <= 0 ? 'up' : 'down'} currency={currency} />
        <StatCard icon={<Wallet size={22} />} iconClass="balance" label="יתרה חודשית" value={monthBalance} currency={currency} />
        <StatCard icon={<PiggyBank size={22} />} iconClass="saving" label="אחוז חיסכון" value={savingRate} currency="" change={undefined} />
      </div>

      {/* Charts row 1 */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title"><TrendingUp size={18} color="var(--primary)" /> מגמת הכנסות והוצאות</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v/1000)}K`} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend />
              <Area type="monotone" dataKey="הכנסות" stroke="#10b981" strokeWidth={2} fill="url(#incGrad)" />
              <Area type="monotone" dataKey="הוצאות" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">הוצאות לפי קטגוריה</div>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {expensePieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>אין הוצאות החודש</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="dashboard-grid-3">
        {/* Budget */}
        <div className="card">
          <div className="card-title">תקציב חודשי</div>
          {budgetProgress.length > 0 ? budgetProgress.map(b => (
            <div className="budget-item" key={b.id}>
              <div className="budget-header">
                <span className="budget-label">{b.cat?.icon} {b.cat?.name}</span>
                <span className="budget-values">
                  {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${b.pct}%`,
                    background: b.pct >= 100 ? 'var(--danger)' : b.pct >= 75 ? 'var(--warning)' : 'var(--success)',
                  }}
                />
              </div>
              <div style={{ textAlign: 'left', fontSize: 11, color: b.pct >= 100 ? 'var(--danger)' : 'var(--text-secondary)', marginTop: 3 }}>
                {b.pct}%
              </div>
            </div>
          )) : (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>לא הוגדרו תקציבים</p>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="card">
          <div className="card-title">חיסכון חודשי</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v/1000)}K`} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Bar dataKey="חיסכון" radius={[4,4,0,0]}>
                {trendData.map((entry, i) => (
                  <Cell key={i} fill={entry.חיסכון >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Members */}
        <div className="card">
          <div className="card-title">הוצאות לפי חבר משפחה</div>
          {memberSpending.map(m => (
            <div key={m.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div className="avatar" style={{ background: m.color, width: 32, height: 32, fontSize: 14 }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    הוציא: {formatCurrency(m.spent, currency)} | הכניס: {formatCurrency(m.earned, currency)}
                  </div>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: monthExpense > 0 ? `${Math.min((m.spent / monthExpense) * 100, 100)}%` : '0%',
                    background: m.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-title">עסקאות אחרונות</div>
        {recentTx.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>תיאור</th>
                  <th>קטגוריה</th>
                  <th>חבר משפחה</th>
                  <th>תאריך</th>
                  <th>סכום</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map(tx => {
                  const cat = categories.find(c => c.id === tx.category);
                  const member = members.find(m => m.id === tx.memberId);
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{tx.description}</div>
                        {tx.note && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tx.note}</div>}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {cat?.icon} {cat?.name}
                        </span>
                      </td>
                      <td>
                        {member && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ background: member.color, width: 28, height: 28, fontSize: 13 }}>{member.emoji}</div>
                            <span>{member.name}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {new Date(tx.date).toLocaleDateString('he-IL')}
                      </td>
                      <td>
                        <span className={tx.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>אין עסקאות החודש</p>
          </div>
        )}
      </div>
    </div>
  );
}
