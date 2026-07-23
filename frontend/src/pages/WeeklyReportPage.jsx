import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PenSquare, History, CalendarDays, BarChart2, Printer, Calendar } from 'lucide-react';

import DashboardView from '../components/DashboardView';
import FormView from '../components/FormView';
import HistoryView from '../components/HistoryView';
import WeeklyView from '../components/WeeklyView';
import AnalyticsView from '../components/AnalyticsView';
import ReportView from '../components/ReportView';
import ArchiveView from '../components/ArchiveView';

const API_URL = '/api/reports';

const WeeklyReportPage = () => {
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('weekly');

  const fetchReports = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Page Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: '인사이트 대시보드' },
          { id: 'weekly', icon: <CalendarDays size={18} />, label: '주차별 업무' },
          { id: 'analytics', icon: <BarChart2 size={18} />, label: '주제·키워드 분석' },
          { id: 'history', icon: <History size={18} />, label: '전체 이력 검색' },
          { id: 'form', icon: <PenSquare size={18} />, label: '주간 업무 작성' },
          { id: 'report', icon: <Printer size={18} />, label: '보고서 (인쇄용)' },
          { id: 'archive', icon: <Calendar size={18} />, label: '연도별 아카이브' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        {activeTab === 'dashboard' && <DashboardView reports={reports} />}
        {activeTab === 'weekly' && <WeeklyView reports={reports} fetchReports={fetchReports} />}
        {activeTab === 'analytics' && <AnalyticsView reports={reports} />}
        {activeTab === 'history' && <HistoryView reports={reports} />}
        {activeTab === 'form' && <FormView onReportAdded={() => { fetchReports(); setActiveTab('weekly'); }} />}
        {activeTab === 'report' && <ReportView reports={reports} />}
        {activeTab === 'archive' && <ArchiveView />}
      </div>
    </div>
  );
};

export default WeeklyReportPage;
