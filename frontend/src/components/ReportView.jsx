import React, { useMemo } from 'react';
import { generatePrintableReport, getWeekString } from '../utils/analyze';
import { Printer, Info } from 'lucide-react';

export default function ReportView({ reports }) {
  const currentWeekStr = useMemo(() => getWeekString(new Date().toISOString()), []);

  const reportData = useMemo(() => {
    // Only use reports for THIS week
    const thisWeekReports = reports.filter(r => getWeekString(r.date) === currentWeekStr);
    return generatePrintableReport(thisWeekReports);
  }, [reports, currentWeekStr]);

  const hasNoData = Object.keys(reportData.thisWeek).length === 0 && Object.keys(reportData.nextWeek).length === 0;

  const handlePrint = () => {
    window.print();
  };

  const renderSectionContent = (dataObj, projectsArray) => {
    const activeProjects = projectsArray.filter(proj => dataObj[proj] && dataObj[proj].length > 0);

    if (activeProjects.length === 0) {
      return <div style={{ color: '#64748b', paddingLeft: '1rem' }}>해당 내역이 없습니다.</div>;
    }

    return activeProjects.map((proj, idx) => {
      const items = dataObj[proj];
      return (
        <div key={proj} style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.2rem' }}>
            {idx + 1}. {proj}
          </h3>
          <ul style={{ listStyleType: 'none', paddingLeft: '1rem', margin: 0 }}>
            {items.map((line, i) => (
              <li key={i} style={{ fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '0.2rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '-1rem' }}>-</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const allProjects = useMemo(() => {
    const set = new Set([...Object.keys(reportData.thisWeek), ...Object.keys(reportData.nextWeek)]);
    return Array.from(set).sort((a, b) => {
      if (a === '기타 업무') return 1;
      if (b === '기타 업무') return -1;
      return a.localeCompare(b);
    });
  }, [reportData]);

  return (
    <div className="report-wrapper" style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="print-controls" style={{ maxWidth: '297mm', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af', fontWeight: 600 }}>
          <Info size={20} />
          <span>인쇄 설정 안내: 용지 방향을 반드시 '가로(Landscape)'로 설정해주세요.</span>
        </div>
        <button 
          onClick={handlePrint}
          style={{
            backgroundColor: '#0f172a',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Printer size={18} /> PDF 인쇄하기
        </button>
      </div>

      {/* A4 Paper Container (Landscape) */}
      {hasNoData ? (
        <div style={{ textAlign: 'center', marginTop: '5rem', fontSize: '1.2rem', color: '#475569', fontWeight: 600 }}>
          이번 주(현재 주차)에 작성된 주간 업무 보고가 아직 없습니다.
        </div>
      ) : (
        <div className="a4-paper-landscape" style={{
          backgroundColor: 'white',
          width: '297mm',      // A4 Landscape Width
          minHeight: '210mm',  // A4 Landscape Height
          margin: '0 auto',
          padding: '15mm',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          color: 'black'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>금속기술팀 주간 업무 보고</h1>
            <p style={{ fontSize: '1.1rem', color: '#1e40af', fontWeight: 700 }}>
              해당 주차: {currentWeekStr}
            </p>
          </div>

          {/* 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column: This Week */}
            <div style={{ borderRight: '2px solid #e2e8f0', paddingRight: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#1d4ed8' }}>
                Ⅰ. 금주 진행 업무
              </h2>
              {renderSectionContent(reportData.thisWeek, allProjects)}
            </div>

            {/* Right Column: Next Week */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#047857' }}>
                Ⅱ. 차주 업무 계획
              </h2>
              {renderSectionContent(reportData.nextWeek, allProjects)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
