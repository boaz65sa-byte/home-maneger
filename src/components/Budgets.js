import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { generateId, formatCurrency, getMonthKey } from '../store';
import { useToast } from './Toast';

function BudgetModal({ budget, categories, onSave, onClose, existingCatIds }) {
  const expCats = categories.filter(c => c.type === 'expense' && (budget ? true : !existingCatIds.includes(c.id)));
  const [form, setForm] = useState(budget || { categoryId: '', amount: '' });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.categoryId || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount), id: budget?.id || generateId() });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{budget ? 'עריכת תקציב' : 'תקציב חדש'}</h3>
          <button className="btn-icon" onClick={onClose}><span style={{ fontSize: 20 }}>×</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">קטגוריה *</label>
              <select className="form-control" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required disabled={!!budget}>
                <option value="">בחר קטגוריה...</option>
                {expCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">תקציב חודשי (₪) *</label>
              <input className="form-control" type="number" min="1" step="1" placeholder="0"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
            <button type="submit" className="btn btn-primary">{budget ? 'שמור' : 'הוסף תקציב'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Budgets({ budgets, setBudgets, categories, transactions, settings, selectedMonth }) {
  const [modal, setModal] = useState(null);
  const toast = useToast();
  const currency = settings?.currency || '₪';

  const monthTxs = transactions.filter(t => getMonthKey(t.date) === selectedMonth);

  const budgetItems = useMemo(() => {
    return budgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = monthTxs.filter(t => t.type === 'expense' && t.category === b.categoryId).reduce((s, t) => s + t.amount, 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const remaining = b.amount - spent;
      return { ...b, cat, spent, pct: Math.min(pct, 100), pctRaw: pct, remaining };
    });
  }, [budgets, categories, monthTxs]);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  function handleSave(b) {
    setBudgets(prev => {
      const exists = prev.find(x => x.id === b.id);
      return exists ? prev.map(x => x.id === b.id ? b : x) : [...prev, b];
    });
    setModal(null);
    toast(modal === 'add' ? 'תקציב נוסף' : 'תקציב עודכן');
  }

  function handleDelete(id) {
    if (!window.confirm('למחוק תקציב זה?')) return;
    setBudgets(prev => prev.filter(b => b.id !== id));
    toast('תקציב נמחק', 'warning');
  }

  const existingCatIds = budgets.map(b => b.categoryId);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>ניהול תקציב</h1>
          <p>מעקב אחר תקציבים חודשיים</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> תקציב חדש
        </button>
      </div>

      {/* Overview */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>סיכום תקציב חודשי</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              הוצאה: {formatCurrency(totalSpent, currency)} מתוך {formatCurrency(totalBudget, currency)}
            </div>
          </div>
          <div style={{
            fontSize: 20, fontWeight: 800,
            color: totalPct >= 100 ? 'var(--danger)' : totalPct >= 75 ? 'var(--warning)' : 'var(--success)',
          }}>
            {Math.round(totalPct)}%
          </div>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{
            width: `${Math.min(totalPct, 100)}%`,
            background: totalPct >= 100 ? 'var(--danger)' : totalPct >= 75 ? 'var(--warning)' : 'var(--success)',
          }} />
        </div>
      </div>

      {/* Budget list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {budgetItems.map(b => (
          <div key={b.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: (b.cat?.color || '#94a3b8') + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {b.cat?.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.cat?.name || b.categoryId}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    תקציב: {formatCurrency(b.amount, currency)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon edit" onClick={() => setModal(b)}><Edit2 size={14} /></button>
                <button className="btn-icon danger" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="progress-bar" style={{ marginBottom: 8 }}>
              <div className="progress-fill" style={{
                width: `${b.pct}%`,
                background: b.pctRaw >= 100 ? 'var(--danger)' : b.pctRaw >= 75 ? 'var(--warning)' : b.cat?.color || 'var(--success)',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>הוצאה: <strong>{formatCurrency(b.spent, currency)}</strong></span>
              <span style={{
                fontWeight: 600,
                color: b.pctRaw >= 100 ? 'var(--danger)' : b.pctRaw >= 75 ? 'var(--warning)' : 'var(--success)',
              }}>
                {b.remaining >= 0
                  ? `נותר: ${formatCurrency(b.remaining, currency)}`
                  : `חריגה: ${formatCurrency(-b.remaining, currency)}`
                }
              </span>
            </div>

            {b.pctRaw >= 100 && (
              <div style={{
                marginTop: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.1)',
                borderRadius: 6, fontSize: 12, color: 'var(--danger)', fontWeight: 500,
              }}>
                ⚠️ חרגת מהתקציב!
              </div>
            )}
            {b.pctRaw >= 75 && b.pctRaw < 100 && (
              <div style={{
                marginTop: 8, padding: '6px 10px', background: 'rgba(245,158,11,0.1)',
                borderRadius: 6, fontSize: 12, color: 'var(--warning)', fontWeight: 500,
              }}>
                ⚡ התקרבת לגבול התקציב
              </div>
            )}
          </div>
        ))}

        {budgetItems.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <Target />
              <h3>אין תקציבים מוגדרים</h3>
              <p>הגדר תקציבים לקטגוריות הוצאות ועקוב אחר צריכתך</p>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <BudgetModal
          budget={modal === 'add' ? null : modal}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModal(null)}
          existingCatIds={existingCatIds}
        />
      )}
    </div>
  );
}
