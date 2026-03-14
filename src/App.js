import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { initStore, loadData, saveData, getCurrentMonthKey } from './store';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const showToast = useToast();

  const [transactions, setTransactionsState] = useState([]);
  const [categories, setCategoriesState] = useState([]);
  const [members, setMembersState] = useState([]);
  const [budgets, setBudgetsState] = useState([]);
  const [settings, setSettingsState] = useState(() => loadData('settings', { currency: '₪', familyName: 'משפחת ישראל' }));

  useEffect(() => {
    initStore();
    setTransactionsState(loadData('transactions', []));
    setCategoriesState(loadData('categories', []));
    setMembersState(loadData('members', []));
    setBudgetsState(loadData('budgets', []));
  }, []);

  const setTransactions = useCallback((val) => {
    const next = typeof val === 'function' ? val(transactions) : val;
    saveData('transactions', next);
    setTransactionsState(next);
  }, [transactions]);

  const setCategories = useCallback((val) => {
    const next = typeof val === 'function' ? val(categories) : val;
    saveData('categories', next);
    setCategoriesState(next);
  }, [categories]);

  const setMembers = useCallback((val) => {
    const next = typeof val === 'function' ? val(members) : val;
    saveData('members', next);
    setMembersState(next);
  }, [members]);

  const setBudgets = useCallback((val) => {
    const next = typeof val === 'function' ? val(budgets) : val;
    saveData('budgets', next);
    setBudgetsState(next);
  }, [budgets]);

  const setSettings = useCallback((val) => {
    const next = typeof val === 'function' ? val(settings) : val;
    saveData('settings', next);
    setSettingsState(next);
  }, [settings]);

  const showMonthSelector = MONTH_PAGES.includes(activeTab);

  const commonProps = { transactions, categories, members, budgets, settings, selectedMonth, setSelectedMonth, showToast };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} />;
      case 'transactions': return <Transactions {...commonProps} setTransactions={setTransactions} />;
      case 'budgets': return <Budgets {...commonProps} setBudgets={setBudgets} />;
      case 'members': return <Members {...commonProps} setMembers={setMembers} />;
      case 'categories': return <Categories {...commonProps} setCategories={setCategories} />;
      case 'settings': return <Settings settings={settings} setSettings={setSettings} />;
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
            {settings.familyName && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{settings.familyName}</div>
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
      </nav>

      {/* Main content */}
      <main className="main-content">
        <div className="mobile-topbar">
          <span style={{ fontSize: 20 }}>🏡</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', flex: 1 }}>ניהול משק הבית</span>
          {showMonthSelector && (
            <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
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
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;
