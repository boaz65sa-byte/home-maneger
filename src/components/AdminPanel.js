import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminPanel({ onClose }) {
  const { logout } = useAuth();
  const [families, setFamilies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [famSnap, userSnap] = await Promise.all([
      getDocs(query(collection(db, 'families'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
    ]);
    setFamilies(famSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function banUser(uid, banned) {
    if (!window.confirm(banned ? `לחסום את המשתמש?` : `לבטל חסימה?`)) return;
    setActionLoading(uid);
    await updateDoc(doc(db, 'users', uid), { banned });
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, banned } : u));
    setActionLoading(null);
  }

  async function deleteUser(uid) {
    if (!window.confirm('למחוק את המשתמש לצמיתות? הפעולה אינה הפיכה!')) return;
    setActionLoading(uid);
    await deleteDoc(doc(db, 'users', uid));
    setUsers(prev => prev.filter(u => u.id !== uid));
    setActionLoading(null);
  }

  async function deleteFamily(familyId) {
    if (!window.confirm('למחוק את המשפחה לצמיתות? כל הנתונים שלה יימחקו!')) return;
    setActionLoading(familyId);
    await deleteDoc(doc(db, 'families', familyId));
    setFamilies(prev => prev.filter(f => f.id !== familyId));
    setActionLoading(null);
  }

  const activeUsers = users.filter(u => !u.banned);
  const bannedUsers = users.filter(u => u.banned);
  const newThisWeek = users.filter(u => {
    const d = u.createdAt?.toDate?.();
    return d && (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const usersWithFamily = users.filter(u => u.familyId).length;

  return (
    <div className="admin-page" dir="rtl">
      {/* Header */}
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>לוח אדמין</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>ניהול כלל המשפחות והמשתמשים</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-btn-outline" onClick={load}>🔄 רענן</button>
          {onClose && <button className="admin-btn-outline" onClick={onClose}>כניסה לאפליקציה</button>}
          <button className="admin-btn-outline" onClick={logout}>התנתק</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#4f46e5' }}>{families.length}</div>
          <div className="admin-stat-label">משפחות פעילות</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#10b981' }}>{activeUsers.length}</div>
          <div className="admin-stat-label">משתמשים פעילים</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#f59e0b' }}>{newThisWeek}</div>
          <div className="admin-stat-label">הצטרפו השבוע</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#3b82f6' }}>{usersWithFamily}</div>
          <div className="admin-stat-label">מחוברים למשפחה</div>
        </div>
        {bannedUsers.length > 0 && (
          <div className="admin-stat-card">
            <div className="admin-stat-num" style={{ color: '#ef4444' }}>{bannedUsers.length}</div>
            <div className="admin-stat-label">חסומים</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          👤 משתמשים ({users.length})
        </button>
        <button className={`admin-tab ${activeTab === 'families' ? 'active' : ''}`} onClick={() => setActiveTab('families')}>
          👨‍👩‍👧‍👦 משפחות ({families.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>טוען נתונים...</div>
      ) : (
        <div className="admin-table-wrap">

          {/* Users Tab */}
          {activeTab === 'overview' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>משתמש</th>
                  <th>אימייל</th>
                  <th>סטטוס</th>
                  <th>משפחה</th>
                  <th>הצטרף</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.banned ? 0.5 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {u.photoURL
                          ? <img src={u.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                          : <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                        }
                        <span style={{ fontWeight: 600 }}>{u.displayName || '—'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{u.email}</td>
                    <td>
                      {u.role === 'admin'
                        ? <span className="role-badge role-admin">🛡️ אדמין</span>
                        : u.banned
                          ? <span className="role-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>🚫 חסום</span>
                          : <span className="role-badge role-parent">✅ פעיל</span>
                      }
                    </td>
                    <td>
                      {u.familyId
                        ? <span className="id-badge">{families.find(f => f.id === u.familyId)?.settings?.familyName || u.familyId.slice(0,8)+'...'}</span>
                        : <span style={{ color: '#94a3b8', fontSize: 13 }}>ללא משפחה</span>
                      }
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{u.createdAt?.toDate?.()?.toLocaleDateString('he-IL') || '—'}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className={`admin-action-btn ${u.banned ? 'unban' : 'ban'}`}
                            onClick={() => banUser(u.id, !u.banned)}
                            disabled={actionLoading === u.id}
                          >
                            {actionLoading === u.id ? '...' : u.banned ? '✅ בטל חסימה' : '🚫 חסום'}
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => deleteUser(u.id)}
                            disabled={actionLoading === u.id}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>אין משתמשים עדיין</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* Families Tab */}
          {activeTab === 'families' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>שם משפחה</th>
                  <th>קוד הזמנה</th>
                  <th>חברים</th>
                  <th>תאריך יצירה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {families.map(f => {
                  const memberCount = users.filter(u => u.familyId === f.id).length;
                  return (
                    <tr key={f.id}>
                      <td><strong>{f.settings?.familyName || f.name || '—'}</strong></td>
                      <td><code className="invite-badge">{f.inviteCode}</code></td>
                      <td>
                        <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                          {memberCount} חברים
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{f.createdAt?.toDate?.()?.toLocaleDateString('he-IL') || '—'}</td>
                      <td>
                        <button
                          className="admin-action-btn delete"
                          onClick={() => deleteFamily(f.id)}
                          disabled={actionLoading === f.id}
                        >
                          {actionLoading === f.id ? '...' : '🗑️ מחק'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {families.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>אין משפחות עדיין</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
