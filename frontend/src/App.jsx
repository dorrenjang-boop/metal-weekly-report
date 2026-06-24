import React, { useState, useEffect } from 'react';
import { Cpu, LayoutDashboard, PenSquare, History, CalendarDays, BarChart2, Printer, Calendar, Lock } from 'lucide-react';
import DashboardView from './components/DashboardView';
import FormView from './components/FormView';
import HistoryView from './components/HistoryView';
import WeeklyView from './components/WeeklyView';
import AnalyticsView from './components/AnalyticsView';
import ReportView from './components/ReportView';
import ArchiveView from './components/ArchiveView';

const API_URL = '/api/reports';

function App() {
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('weekly');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const fetchReports = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoginError('비밀번호가 틀렸습니다.');
        return;
      }
      if (res.ok) {
        setIsAuthenticated(true);
        setLoginError('');
        const data = await res.json();
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('team_password', passwordInput);
    fetchReports(); // This will trigger the API call with the new password in interceptor
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--accent-light)', padding: '1rem', borderRadius: '50%' }}>
              <Lock size={32} color="var(--accent-primary)" />
            </div>
          </div>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>금속기술팀 주간업무보드</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>팀 공통 비밀번호를 입력해주세요.</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', marginBottom: '1rem', boxSizing: 'border-box' }}
            />
            {loginError && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'left' }}>{loginError}</p>}
            <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <div className="top-nav print-hide">
        <div className="nav-brand">
          <Cpu size={24} color="var(--accent-primary)" /> 
          DM사업부 금속기술팀 주간업무보드
        </div>
        <div className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            인사이트 대시보드
          </div>
          <div 
            className={`nav-item ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            <CalendarDays size={18} />
            주차별 업무
          </div>
          <div 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={18} />
            주제·키워드 분석
          </div>
          <div 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            전체 이력 검색
          </div>
          <div 
            className={`nav-item ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            <PenSquare size={18} />
            주간 업무 작성
          </div>
          <div 
            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
            style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', marginLeft: '0.5rem', color: '#1d4ed8' }}
          >
            <Printer size={18} />
            보고서 (인쇄용)
          </div>
          <div 
            className={`nav-item ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            <Calendar size={18} />
            연도별 아카이브
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${activeTab === 'report' ? 'print-mode' : ''}`}>
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
}

export default App;
