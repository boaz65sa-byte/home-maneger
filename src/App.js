import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getCurrentMonthKey } from './store';
import Login from './components/Login';
import FamilySetup from './components/FamilySetup';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Members from './components/Members';
import Categories from './components/Categories';
import Budgets from './components/Budgets';
import Settings from './components/Settings';
import MonthSelector from './components/MonthSelector';
import { ToastProvider, useToast } from './components/Toast';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'לוח בקרה', icon: '📊' },
  { id: 'transactions', label: 'עסקאות', icon: '💳' },
  { id: 'budgets', label: 'תקציב', icon: '🎯' },
  { id: 'members', label: 'חברי משפחה', icon: '👥' },
  { id: 'categories', label: 'קטגוריות', icon: '🏷️' },
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
];

const MONTH_PAGES = ['dashboard', 'transactions', 'budgets', 'members'];

function AppInner() {
  const {
    user, userDoc, family, isAdmin, loading,
    logout,
    transactions, categories, members, budgets, settings,
    addTransaction, updateTransaction, deleteTransaction,
    addCategory, updateCategory, deleteCategory,
    addMember, updateMember, deleteMember,
    addBudget, updateBudget, deleteBudget,
    updateSettings,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [showAdmin, setShowAdmin] = useState(false);
  const showToast = useToast();

  // Loading
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }} dir="rtl">
        <div style={{ fontSize: 40 }}>🏡</div>
        <div style={{ color: '#64748b' }}>טוען...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <Login />;

  // Admin panel (full screen)
  if (isAdmin && showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  // No family yet
  if (!userDoc?.familyId) return <FamilySetup />;

  // Adapters: bridge Firestore ops to component-expected setState-style interface
  const setTransactions = (val) => {
    // Components pass full arrays; we diff and apply
    // For simplicity, components should use add/update/delete directly
    // but we keep this for backward compat by doing nothing (Firestore is real-time)
  };

  const makeSetters = (addFn, updateFn, deleteFn, current) => (val) => {
    const next = typeof val === 'function' ? val(current) : val;
    // Find added, updated, removed items by comparing with current
    const currentIds = new Set(current.map(i => i.id));
    const nextIds = new Set(next.map(i => i.id));
    next.forEach(item => {
      if (!currentIds.has(item.id)) addFn(item);
      else {
        const orig = current.find(c => c.id === item.id);
        if (JSON.stringify(orig) !== JSON.stringify(item)) {
          const { id, ...rest } = item;
          updateFn(id, rest);
        }
      }
    });
    current.forEach(item => {
      if (!nextIds.has(item.id)) deleteFn(item.id);
    });
  };

  const showMonthSelector = MONTH_PAGES.includes(activeTab);

  const commonProps = {
    transactions, categories, members, budgets, settings,
    selectedMonth, setSelectedMonth, showToast,
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} />;
      case 'transactions': return (
        <Transactions
          {...commonProps}
          setTransactions={makeSetters(addTransaction, updateTransaction, deleteTransaction, transactions)}
        />
      );
      case 'budgets': return (
        <Budgets
          {...commonProps}
          setBudgets={makeSetters(addBudget, updateBudget, deleteBudget, budgets)}
        />
      );
      case 'members': return (
        <Members
          {...commonProps}
          setMembers={makeSetters(addMember, updateMember, deleteMember, members)}
        />
      );
      case 'categories': return (
        <Categories
          {...commonProps}
          setCategories={makeSetters(addCategory, updateCategory, deleteCategory, categories)}
        />
      );
      case 'settings': return (
        <Settings
          settings={settings}
          setSettings={(val) => {
            const next = typeof val === 'function' ? val(settings) : val;
            updateSettings(next);
          }}
        />
      );
      default: return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="app-container" dir="rtl">
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <span style={{ fontSize: 24 }}>🏡</span>
          <div>
            <div className="sidebar-title">ניהול משק הבית</div>
            {family?.settings?.familyName && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {family.settings.familyName}
              </div>
            )}
          </div>
        </div>

        <ul className="nav-list">
          {NAV_ITEMS.map(item => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {showMonthSelector && (
          <div className="sidebar-month-wrap">
            <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          </div>
        )}

        {/* User info + logout */}
        <div className="sidebar-footer">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {family?.inviteCode && <>קוד: {family.inviteCode}</>}
            </div>
          </div>
          {isAdmin && (
            <button className="sidebar-icon-btn" title="לוח אדמין" onClick={() => setShowAdmin(true)}>🛡️</button>
          )}
          <button className="sidebar-icon-btn" title="התנתק" onClick={logout}>🚪</button>
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <div className="mobile-topbar">
          <span style={{ fontSize: 20 }}>🏡</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', flex: 1 }}>ניהול משק הבית</span>
          {showMonthSelector && (
            <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          )}
          {isAdmin && (
            <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowAdmin(true)}>🛡️</button>
          )}
        </div>
        {renderPage()}
        <div style={{ height: 72 }} className="mobile-bottom-spacer" />
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
