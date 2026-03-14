import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { generateId, MEMBER_ROLES, MEMBER_COLORS, MEMBER_EMOJIS, formatCurrency, getMonthKey } from '../store';
import { useToast } from './Toast';

function MemberModal({ member, onSave, onClose }) {
  const [form, setForm] = useState(member || {
    name: '', role: 'מבוגר', color: MEMBER_COLORS[0], emoji: MEMBER_EMOJIS[0], photo: '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('photo', ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, id: member?.id || generateId() });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{member ? 'עריכת חבר משפחה' : 'הוספת חבר משפחה'}</h3>
          <button className="btn-icon" onClick={onClose}><span style={{ fontSize: 20 }}>×</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Preview + photo upload */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {form.photo ? (
                  <img src={form.photo} alt="avatar"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${form.color}` }} />
                ) : (
                  <div className="avatar" style={{ background: form.color, width: 80, height: 80, fontSize: 34, margin: '0 auto' }}>
                    {form.emoji}
                  </div>
                )}
                <label style={{
                  position: 'absolute', bottom: 0, left: 0,
                  background: 'var(--primary)', color: 'white', borderRadius: '50%',
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 14, border: '2px solid white',
                }} title="העלה תמונה">
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                </label>
              </div>
              {form.photo && (
                <div style={{ marginTop: 6 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => set('photo', '')}>הסר תמונה</button>
                </div>
              )}
              <div style={{ marginTop: 8, fontWeight: 600 }}>{form.name || 'שם חבר'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{form.role}</div>
            </div>

            <div className="form-group">
              <label className="form-label">שם *</label>
              <input className="form-control" type="text" placeholder="שם חבר המשפחה" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">תפקיד</label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                {MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {!form.photo && (
              <div className="form-group">
                <label className="form-label">אמוג'י</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MEMBER_EMOJIS.map(em => (
                    <button key={em} type="button"
                      onClick={() => set('emoji', em)}
                      style={{
                        width: 40, height: 40, fontSize: 20, border: '2px solid',
                        borderColor: form.emoji === em ? 'var(--primary)' : 'transparent',
                        borderRadius: 8, background: form.emoji === em ? 'rgba(79,70,229,0.1)' : 'var(--bg)',
                        cursor: 'pointer',
                      }}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">צבע</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MEMBER_COLORS.map(col => (
                  <button key={col} type="button"
                    onClick={() => set('color', col)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: col,
                      border: form.color === col ? '3px solid #1a1a2e' : '3px solid transparent',
                      cursor: 'pointer', boxShadow: form.color === col ? '0 0 0 2px white, 0 0 0 4px ' + col : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
            <button type="submit" className="btn btn-primary">{member ? 'שמור שינויים' : 'הוסף חבר'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Members({ members, setMembers, transactions, settings, selectedMonth }) {
  const [modal, setModal] = useState(null);
  const toast = useToast();
  const currency = settings?.currency || '₪';

  function handleSave(m) {
    setMembers(prev => {
      const exists = prev.find(x => x.id === m.id);
      return exists ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
    });
    setModal(null);
    toast(modal === 'add' ? 'חבר משפחה נוסף' : 'פרטי חבר עודכנו');
  }

  function handleDelete(id) {
    if (!window.confirm('האם למחוק חבר משפחה זה?')) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    toast('חבר משפחה נמחק', 'warning');
  }

  const monthTxs = transactions.filter(t => getMonthKey(t.date) === selectedMonth);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>חברי משפחה</h1>
          <p>ניהול פרטי בני המשפחה</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> הוסף חבר
        </button>
      </div>

      {members.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users />
            <h3>אין חברי משפחה</h3>
            <p>הוסף את בני המשפחה למעקב הוצאות אישי</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {members.map(m => {
            const memberTxs = monthTxs.filter(t => t.memberId === m.id);
            const income = memberTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expense = memberTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const txCount = memberTxs.length;

            return (
              <div key={m.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {m.photo ? (
                    <img src={m.photo} alt={m.name}
                      style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${m.color}` }} />
                  ) : (
                    <div className="avatar" style={{ background: m.color, width: 56, height: 56, fontSize: 24 }}>{m.emoji}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>{m.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                          <span className="badge badge-info" style={{ fontSize: 11 }}>{m.role}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon edit" onClick={() => setModal(m)}><Edit2 size={15} /></button>
                        <button className="btn-icon danger" onClick={() => handleDelete(m.id)}><Trash2 size={15} /></button>
                      </div>
                    </div>

                    <div className="section-divider" style={{ margin: '12px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(income, currency)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>הכנסות</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(expense, currency)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>הוצאות</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{txCount}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>עסקאות</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <MemberModal
          member={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
