import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../firebase';

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle(isAdmin = false) {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') {
        setError('');
      } else {
        setError('ההתחברות נכשלה. נסה שוב.');
      }
    }
    setLoading(false);
  }

  return (
    <div className="login-page" dir="rtl">
      <div className="login-card">
        <div className="login-logo">🏡</div>
        <h1 className="login-title">ניהול משק הבית</h1>
        <p className="login-subtitle">נהל את הכספים המשפחתיים בצורה חכמה ופשוטה</p>

        <div className="login-features">
          <div className="login-feature">📊 מעקב הוצאות והכנסות</div>
          <div className="login-feature">👨‍👩‍👧‍👦 שיתוף עם כל המשפחה בזמן אמת</div>
          <div className="login-feature">🎯 ניהול תקציב חודשי</div>
          <div className="login-feature">🔒 נתונים מאובטחים ופרטיים</div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="google-btn" onClick={() => handleGoogle(false)} disabled={loading}>
          {loading ? (
            <span className="login-spinner" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              התחבר עם Google
            </>
          )}
        </button>

        <p className="login-note">כל משפחה מקבלת מרחב נתונים פרטי ומאובטח</p>

        <div className="login-divider" />

        <button className="admin-login-btn" onClick={() => handleGoogle(true)} disabled={loading}>
          🛡️ כניסת מנהל מערכת
        </button>
        <p className="login-note" style={{ marginTop: 6 }}>
          רק עבור {ADMIN_EMAIL}
        </p>
      </div>
    </div>
  );
}
