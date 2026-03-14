import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminPanel({ onClose }) {
  const { logout } = useAuth();
  const [families, setFamilies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('families');

  useEffect(() => {
    async function load() {
      const [famSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, 'families'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
      ]);
      setFamilies(famSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="admin-page" dir="rtl">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>לוח אדמין</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>ניהול כלל המשפחות והמשתמשים</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onClose && (
            <button className="admin-btn-outline" onClick={onClose}>כניסה לאפליקציה</button>
          )}
          <button className="admin-btn-outline" onClick={logout}>התנתק</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{families.length}</div>
          <div className="admin-stat-label">משפחות</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{users.length}</div>
          <div className="admin-stat-label">משתמשים</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">
            {users.filter(u => {
              const d = u.createdAt?.toDate?.();
              return d && (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </div>
          <div className="admin-stat-label">משתמשים חדשים (7 ימים)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'families' ? 'active' : ''}`} onClick={() => setActiveTab('families')}>
          👨‍👩‍👧‍👦 משפחות ({families.length})
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👤 משתמשים ({users.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>טוען נתונים...</div>
      ) : (
        <div className="admin-table-wrap">
          {activeTab === 'families' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>שם משפחה</th>
                  <th>קוד הזמנה</th>
                  <th>תאריך יצירה</th>
                  <th>מזהה</th>
                </tr>
              </thead>
              <tbody>
                {families.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.name || f.settings?.familyName || '—'}</strong></td>
                    <td><code className="invite-badge">{f.inviteCode}</code></td>
                    <td>{f.createdAt?.toDate?.()?.toLocaleDateString('he-IL') || '—'}</td>
                    <td><span className="id-badge">{f.id.slice(0, 8)}...</span></td>
                  </tr>
                ))}
                {families.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>אין משפחות עדיין</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'users' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>אימייל</th>
                  <th>תפקיד</th>
                  <th>משפחה</th>
                  <th>תאריך הצטרפות</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {u.photoURL && <img src={u.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                        {u.displayName || '—'}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === 'admin' ? '🛡️ אדמין' : u.role === 'parent' ? '👨 הורה' : '👤 חבר'}
                      </span>
                    </td>
                    <td>{u.familyId ? <span className="id-badge">{u.familyId.slice(0, 8)}...</span> : <span style={{ color: '#94a3b8' }}>ללא משפחה</span>}</td>
                    <td>{u.createdAt?.toDate?.()?.toLocaleDateString('he-IL') || '—'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>אין משתמשים עדיין</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
