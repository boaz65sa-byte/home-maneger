import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS_HE, parseMonthKey, getCurrentMonthKey } from '../store';

export default function MonthSelector({ selectedMonth, setSelectedMonth }) {
  const { year, month } = parseMonthKey(selectedMonth);
  const label = `${MONTHS_HE[month]} ${year}`;
  const isCurrentMonth = selectedMonth === getCurrentMonthKey();

  function goToPrev() {
    const d = new Date(year, month - 1, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  function goToNext() {
    const d = new Date(year, month + 1, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="month-selector-nav">
      <button className="month-nav-btn" onClick={goToPrev} title="חודש קודם">
        <ChevronRight size={16} />
      </button>
      <span className="month-nav-label">{label}</span>
      <button
        className="month-nav-btn"
        onClick={goToNext}
        disabled={isCurrentMonth}
        title="חודש הבא"
        style={{ opacity: isCurrentMonth ? 0.35 : 1 }}
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );
}
