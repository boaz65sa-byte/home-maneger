import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function FamilySetup() {
  const { user, createFamily, joinFamily, logout } = useAuth();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');

  async function handleCreate() {
    if (!familyName.trim()) return setError('נא להזין שם משפחה');
    setLoading(true);
    setError('');
    try {
      const code = await createFamily(familyName.trim());
      setSuccessCode(code);
    } catch (e) {
      setError('שגיאה ביצירת המשפחה. נסה שוב.');
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return setError('נא להזין קוד הזמנה');
    setLoading(true);
    setError('');
    try {
      await joinFamily(inviteCode.trim());
    } catch (e) {
      setError(e.message || 'קוד הזמנה לא תקין');
    }
    setLoading(false);
  }

  if (successCode) {
    return (
      <div className="login-page" dir="rtl">
        <div className="login-card">
          <div className="login-logo">🎉</div>
          <h2 className="login-title">המשפחה נוצרה בהצלחה!</h2>
          <p className="login-subtitle">שתף את קוד ההזמנה עם בני המשפחה</p>
          <div className="invite-code-box">
            <div className="invite-code-label">קוד הזמנה</div>
            <div className="invite-code">{successCode}</div>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(successCode)}>
              📋 העתק קוד
            </button>
          </div>
          <button className="google-btn" onClick={() => setSuccessCode('')}>
            כניסה לאפליקציה →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page" dir="rtl">
      <div className="login-card">
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
          מחובר כ: {user?.displayName} ({user?.email})
        </div>
        <div className="login-logo">🏡</div>
        <h2 className="login-title">ברוך הבא!</h2>
        <p className="login-subtitle">האם אתה יוצר משפחה חדשה או מצטרף לקיימת?</p>

        {!mode && (
          <div className="setup-options">
            <button className="setup-option-btn" onClick={() => setMode('create')}>
              <span style={{ fontSize: 32 }}>➕</span>
              <span style={{ fontWeight: 700 }}>צור משפחה חדשה</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>התחל מאפס עם נתוני ברירת מחדל</span>
            </button>
            <button className="setup-option-btn" onClick={() => setMode('join')}>
              <span style={{ fontSize: 32 }}>🔗</span>
              <span style={{ fontWeight: 700 }}>הצטרף למשפחה קיימת</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>הכנס קוד הזמנה מבן/בת משפחה</span>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="setup-form">
            <label className="form-label">שם המשפחה</label>
            <input
              className="form-input"
              placeholder="למשל: משפחת כהן"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            {error && <div className="login-error">{error}</div>}
            <button className="google-btn" onClick={handleCreate} disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'צור משפחה'}
            </button>
            <button className="back-btn" onClick={() => { setMode(null); setError(''); }}>← חזור</button>
          </div>
        )}

        {mode === 'join' && (
          <div className="setup-form">
            <label className="form-label">קוד הזמנה</label>
            <input
              className="form-input"
              placeholder="הזן קוד בן 6 תווים"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 22, letterSpacing: 6, fontWeight: 700 }}
              autoFocus
            />
            {error && <div className="login-error">{error}</div>}
            <button className="google-btn" onClick={handleJoin} disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'הצטרף'}
            </button>
            <button className="back-btn" onClick={() => { setMode(null); setError(''); }}>← חזור</button>
          </div>
        )}

        <button className="logout-link" onClick={logout}>התנתק</button>
      </div>
    </div>
  );
}
