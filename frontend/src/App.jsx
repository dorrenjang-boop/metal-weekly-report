import React, { useState, useEffect } from 'react';
import { Cpu, LayoutDashboard, PenSquare, History, CalendarDays, BarChart2, Printer, Calendar, Lock, Database, Activity, Hammer, Menu } from 'lucide-react';
import DashboardView from './components/DashboardView';
import FormView from './components/FormView';
import HistoryView from './components/HistoryView';
import WeeklyView from './components/WeeklyView';
import AnalyticsView from './components/AnalyticsView';
import ReportView from './components/ReportView';
import ArchiveView from './components/ArchiveView';
import BuildLogsView from './components/BuildLogsView';
import OeeView from './components/OeeView';

const API_URL = '/api/reports';

function App() {
  const [reports, setReports] = useState([]);
  const [mainMenu, setMainMenu] = useState('weekly'); // 'weekly' or 'build_management'
  const [activeTab, setActiveTab] = useState('dashboard'); // sub-tabs
  const [buildTab, setBuildTab] = useState('board'); // 'board', 'oee', 'dashboard'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
    fetchReports();
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
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>금속기술팀 통합 시스템</h2>
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
    <div className="app-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Left Main Sidebar */}
      <div className="print-hide" style={{ width: isSidebarOpen ? '260px' : '0px', backgroundColor: '#ffffff', borderRight: isSidebarOpen ? '1px solid var(--border-color)' : 'none', display: 'flex', flexDirection: 'column', zIndex: 10, transition: 'width 0.3s ease', overflow: 'hidden' }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', minWidth: '260px' }}>
          <Cpu size={28} color="var(--accent-primary)" />
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>금속기술팀 시스템</span>
        </div>
        <div style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            onClick={() => setMainMenu('weekly')}
            style={{ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', backgroundColor: mainMenu === 'weekly' ? 'var(--accent-light)' : 'transparent', color: mainMenu === 'weekly' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          >
            <CalendarDays size={20} />
            주간업무보고
          </div>
          <div 
            onClick={() => setMainMenu('build_management')}
            style={{ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', backgroundColor: mainMenu === 'build_management' ? 'var(--accent-light)' : 'transparent', color: mainMenu === 'build_management' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          >
            <Database size={20} />
            빌드 이력 및 OEE
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {mainMenu === 'weekly' && (
          <div className="app-container" style={{ margin: 0, height: '100%', borderRadius: 0, boxShadow: 'none' }}>
            <div className="top-nav print-hide" style={{ borderRadius: 0 }}>
              <div className="nav-menu" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', marginRight: '0.5rem', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <Menu size={20} />
                </button>
                <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={18} />인사이트 대시보드</div>
                <div className={`nav-item ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => setActiveTab('weekly')}><CalendarDays size={18} />주차별 업무</div>
                <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><BarChart2 size={18} />주제·키워드 분석</div>
                <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><History size={18} />전체 이력 검색</div>
                <div className={`nav-item ${activeTab === 'form' ? 'active' : ''}`} onClick={() => setActiveTab('form')}><PenSquare size={18} />주간 업무 작성</div>
                <div className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')} style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', marginLeft: '0.5rem', color: '#1d4ed8' }}><Printer size={18} />보고서 (인쇄용)</div>
                <div className={`nav-item ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}><Calendar size={18} />연도별 아카이브</div>
              </div>
            </div>
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
        )}

        {mainMenu === 'build_management' && (
          <div className="app-container" style={{ margin: 0, height: '100%', borderRadius: 0, boxShadow: 'none' }}>
            <div className="top-nav print-hide" style={{ borderRadius: 0 }}>
              <div className="nav-menu" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', marginRight: '0.5rem', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <Menu size={20} />
                </button>
                <div className={`nav-item ${buildTab === 'board' ? 'active' : ''}`} onClick={() => setBuildTab('board')}><Hammer size={18} />빌드 이력 보드</div>
                <div className={`nav-item ${buildTab === 'oee' ? 'active' : ''}`} onClick={() => setBuildTab('oee')}><Activity size={18} />OEE 분석</div>
              </div>
            </div>
            <div className="main-content" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', overflowY: 'auto' }}>
              {buildTab === 'board' && <BuildLogsView />}
              {buildTab === 'oee' && <OeeView />}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
