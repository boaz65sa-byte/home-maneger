import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { generateId } from '../store';
import { useToast } from './Toast';

const COLORS = ['#ef4444','#f97316','#f59e0b','#84cc16','#10b981','#14b8a6','#3b82f6','#6366f1','#8b5cf6','#ec4899','#94a3b8','#1a1a2e'];
const ICONS = ['🛒','🏠','🚗','🏥','📚','🎬','👕','⚡','📱','📦','💰','💻','📈','🎁','💵','✈️','🍕','🎮','💄','🏋️','🐾','🎓','🔧','🏦'];

function CategoryModal({ cat, onSave, onClose }) {
  const [form, setForm] = useState(cat || { name: '', type: 'expense', color: COLORS[0], icon: ICONS[0] });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, id: cat?.id || generateId() });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{cat ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h3>
          <button className="btn-icon" onClick={onClose}><span style={{ fontSize: 20 }}>×</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Preview */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: form.color + '25',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                margin: '0 auto', border: `2px solid ${form.color}40`,
              }}>{form.icon}</div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>{form.name || 'שם קטגוריה'}</div>
            </div>

            <div className="form-group">
              <label className="form-label">שם קטגוריה *</label>
              <input className="form-control" type="text" placeholder="שם הקטגוריה" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">סוג</label>
              <div className="type-toggle">
                <button type="button" className={`expense-btn ${form.type === 'expense' ? 'active' : ''}`} onClick={() => set('type', 'expense')}>הוצאה</button>
                <button type="button" className={`income-btn ${form.type === 'income' ? 'active' : ''}`} onClick={() => set('type', 'income')}>הכנסה</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">אייקון</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button"
                    onClick={() => set('icon', ic)}
                    style={{
                      width: 38, height: 38, fontSize: 18, border: '2px solid',
                      borderColor: form.icon === ic ? form.color : 'transparent',
                      borderRadius: 8, background: form.icon === ic ? form.color + '20' : 'var(--bg)',
                      cursor: 'pointer',
                    }}>{ic}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">צבע</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COLORS.map(col => (
                  <button key={col} type="button"
                    onClick={() => set('color', col)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: col, cursor: 'pointer',
                      border: form.color === col ? '3px solid #1a1a2e' : '3px solid transparent',
                      boxShadow: form.color === col ? `0 0 0 2px white, 0 0 0 4px ${col}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
            <button type="submit" className="btn btn-primary">{cat ? 'שמור שינויים' : 'הוסף קטגוריה'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories({ categories, setCategories, transactions }) {
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState('expense');
  const toast = useToast();

  function handleSave(cat) {
    setCategories(prev => {
      const exists = prev.find(c => c.id === cat.id);
      return exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat];
    });
    setModal(null);
    toast(modal === 'add' ? 'קטגוריה נוספה' : 'קטגוריה עודכנה');
  }

  function handleDelete(id) {
    const used = transactions.some(t => t.category === id);
    if (used && !window.confirm('קטגוריה זו בשימוש. האם למחוק בכל זאת?')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    toast('קטגוריה נמחקה', 'warning');
  }

  const displayCats = categories.filter(c => c.type === tab);
  const usageCounts = {};
  transactions.forEach(t => { usageCounts[t.category] = (usageCounts[t.category] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>קטגוריות</h1>
          <p>ניהול קטגוריות הוצאות והכנסות</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> קטגוריה חדשה
        </button>
      </div>

      <div className="card">
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'expense' ? 'active' : ''}`} onClick={() => setTab('expense')}>
            הוצאות ({categories.filter(c => c.type === 'expense').length})
          </button>
          <button className={`tab-btn ${tab === 'income' ? 'active' : ''}`} onClick={() => setTab('income')}>
            הכנסות ({categories.filter(c => c.type === 'income').length})
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {displayCats.map(cat => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: cat.color + '20', color: cat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, border: `1.5px solid ${cat.color}30`,
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {usageCounts[cat.id] || 0} עסקאות
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button className="btn-icon edit" onClick={() => setModal(cat)}><Edit2 size={14} /></button>
                <button className="btn-icon danger" onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}

          {displayCats.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Tag />
              <h3>אין קטגוריות</h3>
              <p>הוסף קטגוריות {tab === 'expense' ? 'הוצאות' : 'הכנסות'}</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <CategoryModal
          cat={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
