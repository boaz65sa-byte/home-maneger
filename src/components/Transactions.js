import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, getMonthKey, generateId, MONTHS_HE, parseMonthKey } from '../store';
import { useToast } from './Toast';

function TransactionModal({ tx, categories, members, onSave, onClose }) {
  const [form, setForm] = useState(tx || {
    type: 'expense',
    amount: '',
    category: '',
    memberId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const expCats = categories.filter(c => c.type === 'expense');
  const incCats = categories.filter(c => c.type === 'income');
  const currentCats = form.type === 'expense' ? expCats : incCats;

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setType(v) { setForm(f => ({ ...f, type: v, category: '', description: '' })); }

  const selectedCat = categories.find(c => c.id === form.category);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.category || !form.date) return;
    const desc = form.description || selectedCat?.name || '';
    onSave({ ...form, description: desc, amount: parseFloat(form.amount), id: tx?.id || generateId() });
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>{tx ? 'עריכת עסקה' : 'עסקה חדשה'}</h3>
          <button className="btn-icon" onClick={onClose}><span style={{ fontSize: 20 }}>×</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Type toggle */}
            <div className="type-toggle-large">
              <button type="button"
                className={`type-btn-large expense ${form.type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}>
                <span style={{ fontSize: 22 }}>💸</span> הוצאה
              </button>
              <button type="button"
                className={`type-btn-large income ${form.type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}>
                <span style={{ fontSize: 22 }}>💰</span> הכנסה
              </button>
            </div>

            {/* Amount + Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">סכום (₪) *</label>
                <input className="form-control form-control-lg" type="number" min="0" step="1"
                  placeholder="0" autoFocus
                  value={form.amount} onChange={e => set('amount', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">תאריך</label>
                <input className="form-control" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
            </div>

            {/* Category grid */}
            <div className="form-group">
              <label className="form-label">קטגוריה *</label>
              <div className="cat-grid">
                {currentCats.map(c => (
                  <button key={c.id} type="button"
                    className={`cat-btn ${form.category === c.id ? 'active' : ''}`}
                    style={form.category === c.id ? { borderColor: c.color, background: `${c.color}18` } : {}}
                    onClick={() => { set('category', c.id); if (!form.description) set('description', c.name); }}>
                    <span className="cat-btn-icon">{c.icon}</span>
                    <span className="cat-btn-name">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">תיאור</label>
              <input className="form-control" type="text"
                placeholder={selectedCat ? selectedCat.name : 'תיאור (אופציונלי)'}
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            {/* Member */}
            {members.length > 0 && (
              <div className="form-group">
                <label className="form-label">של מי?</label>
                <div className="member-btns">
                  <button type="button"
                    className={`member-btn ${!form.memberId ? 'active' : ''}`}
                    onClick={() => set('memberId', '')}>כולם</button>
                  {members.map(m => (
                    <button key={m.id} type="button"
                      className={`member-btn ${form.memberId === m.id ? 'active' : ''}`}
                      style={form.memberId === m.id ? { borderColor: m.color, background: `${m.color}18` } : {}}
                      onClick={() => set('memberId', m.id)}>
                      {m.photo
                        ? <img src={m.photo} alt={m.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }} />
                        : m.emoji
                      } {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
            <button type="submit" className={`btn ${form.type === 'income' ? 'btn-success' : 'btn-danger'}`}
              disabled={!form.amount || !form.category}>
              {tx ? 'שמור שינויים' : (form.type === 'income' ? '+ הוסף הכנסה' : '+ הוסף הוצאה')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions({ transactions, setTransactions, categories, members, settings, selectedMonth }) {
  const [modal, setModal] = useState(null); // null | 'add' | tx object
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [tab, setTab] = useState('month'); // 'month' | 'all'
  const toast = useToast();
  const currency = settings?.currency || '₪';

  const filtered = useMemo(() => {
    let txs = [...transactions];
    if (tab === 'month') txs = txs.filter(t => getMonthKey(t.date) === selectedMonth);
    if (filterType !== 'all') txs = txs.filter(t => t.type === filterType);
    if (filterCat) txs = txs.filter(t => t.category === filterCat);
    if (filterMember) txs = txs.filter(t => t.memberId === filterMember);
    if (search) txs = txs.filter(t => t.description.includes(search) || t.note?.includes(search));
    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, tab, selectedMonth, filterType, filterCat, filterMember, search]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  function handleSave(tx) {
    setTransactions(prev => {
      const exists = prev.find(t => t.id === tx.id);
      return exists ? prev.map(t => t.id === tx.id ? tx : t) : [tx, ...prev];
    });
    setModal(null);
    toast(modal === 'add' ? 'עסקה נוספה בהצלחה' : 'עסקה עודכנה בהצלחה');
  }

  function handleDelete(id) {
    if (!window.confirm('האם למחוק עסקה זו?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast('עסקה נמחקה', 'warning');
  }

  const { year, month } = parseMonthKey(selectedMonth);
  const monthLabel = `${MONTHS_HE[month]} ${year}`;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>עסקאות</h1>
          <p>ניהול הכנסות והוצאות</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> עסקה חדשה
        </button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-icon income" style={{ width: 40, height: 40 }}>+</div>
          <div className="stat-info">
            <div className="stat-label">הכנסות מסוננות</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(totalIncome, currency)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expense" style={{ width: 40, height: 40 }}>-</div>
          <div className="stat-info">
            <div className="stat-label">הוצאות מסוננות</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(totalExpense, currency)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon balance" style={{ width: 40, height: 40 }}>=</div>
          <div className="stat-info">
            <div className="stat-label">יתרה</div>
            <div className="stat-value" style={{ fontSize: 18, color: totalIncome - totalExpense >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {formatCurrency(totalIncome - totalExpense, currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'month' ? 'active' : ''}`} onClick={() => setTab('month')}>
            {monthLabel}
          </button>
          <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            כל העסקאות
          </button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="חיפוש עסקאות..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 140 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">הכל</option>
            <option value="income">הכנסות</option>
            <option value="expense">הוצאות</option>
          </select>
          <select className="form-control" style={{ width: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">כל הקטגוריות</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select className="form-control" style={{ width: 140 }} value={filterMember} onChange={e => setFilterMember(e.target.value)}>
            <option value="">כל החברים</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
          </select>
          {(search || filterType !== 'all' || filterCat || filterMember) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setFilterType('all'); setFilterCat(''); setFilterMember(''); }}>
              נקה סינון
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>תיאור</th>
                  <th>קטגוריה</th>
                  <th>חבר משפחה</th>
                  <th>תאריך</th>
                  <th>סכום</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const cat = categories.find(c => c.id === tx.category);
                  const member = members.find(m => m.id === tx.memberId);
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{tx.description}</div>
                        {tx.note && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tx.note}</div>}
                      </td>
                      <td>
                        {cat && (
                          <span className="badge" style={{ background: `${cat.color}20`, color: cat.color }}>
                            {cat.icon} {cat.name}
                          </span>
                        )}
                      </td>
                      <td>
                        {member ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ background: member.color, width: 28, height: 28, fontSize: 13 }}>{member.emoji}</div>
                            <span style={{ fontSize: 13 }}>{member.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(tx.date)}</td>
                      <td>
                        <span className={tx.type === 'income' ? 'amount-positive' : 'amount-negative'} style={{ fontSize: 15 }}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon edit" onClick={() => setModal(tx)}><Edit2 size={15} /></button>
                          <button className="btn-icon danger" onClick={() => handleDelete(tx.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Search />
            <h3>לא נמצאו עסקאות</h3>
            <p>נסה לשנות את הסינון או הוסף עסקה חדשה</p>
          </div>
        )}
      </div>

      {modal && (
        <TransactionModal
          tx={modal === 'add' ? null : modal}
          categories={categories}
          members={members}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
