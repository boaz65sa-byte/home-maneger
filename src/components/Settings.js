import React, { useState } from 'react';
import { Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { useToast } from './Toast';

const CURRENCIES = [
  { value: '₪', label: '₪ שקל (ILS)' },
  { value: '$', label: '$ דולר (USD)' },
  { value: '€', label: '€ אירו (EUR)' },
  { value: '£', label: '£ פאונד (GBP)' },
];

export default function Settings({ settings, setSettings }) {
  const [form, setForm] = useState({ ...settings });
  const toast = useToast();

  function handleSave(e) {
    e.preventDefault();
    setSettings(form);
    toast('הגדרות נשמרו בהצלחה');
  }

  function handleReset() {
    if (!window.confirm('האם לאפס את כל הנתונים?\nפעולה זו תמחק את כל העסקאות, התקציבים, חברי המשפחה והקטגוריות ואינה הפיכה!')) return;
    ['hm_transactions', 'hm_categories', 'hm_members', 'hm_budgets', 'hm_settings'].forEach(k =>
      localStorage.removeItem(k)
    );
    window.location.reload();
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>הגדרות</h1>
          <p>הגדרות כלליות של האפליקציה</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,480px)', gap: 16 }}>
        <div className="card">
          <div className="card-title">
            <span>⚙️</span> הגדרות כלליות
          </div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">שם המשפחה</label>
              <input
                className="form-control"
                type="text"
                placeholder="לדוגמה: משפחת כהן"
                value={form.familyName}
                onChange={e => setForm(f => ({ ...f, familyName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">מטבע</label>
              <select
                className="form-control"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> שמור הגדרות
            </button>
          </form>
        </div>

        <div className="card" style={{ border: '1.5px solid #fecaca' }}>
          <div className="card-title" style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={18} /> אזור מסוכן
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            איפוס כל הנתונים ימחק לצמיתות את כל העסקאות, התקציבים, חברי המשפחה והקטגוריות שהוגדרו.
            הנתונים יחזרו לברירת המחדל.
          </p>
          <button type="button" className="btn btn-danger" onClick={handleReset}>
            <RotateCcw size={16} /> איפוס כל הנתונים
          </button>
        </div>
      </div>
    </div>
  );
}
