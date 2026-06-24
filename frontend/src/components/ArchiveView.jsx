import React, { useState, useEffect, useMemo } from 'react';
import { User, Calendar, Tag, Check, ChevronRight } from 'lucide-react';
import { extractKeywords, getWeekString } from '../utils/analyze';

export default function ArchiveView() {
  const [archiveReports, setArchiveReports] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const availableYears = ['2025', '2026', '2027', '2028'];

  useEffect(() => {
    fetchArchive(year);
  }, [year]);

  const fetchArchive = async (targetYear) => {
    setLoading(true);
    try {
      // For archive, we might want to fetch all for that year.
      // We can fetch limit=0 (all) and filter by year here, or fetch and let backend handle.
      // Since our API currently doesn't support year filter natively without changing backend, 
      // we fetch all and filter frontend (SQLite will handle up to tens of thousands fine).
      const res = await fetch(`/api/reports?limit=0`);
      const data = await res.json();
      
      const filtered = data.filter(r => r.date.startsWith(targetYear));
      setArchiveReports(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="archive-wrapper" style={{ padding: '0 2.5rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2>연도별 아카이브</h2>
        <p>과거 연도의 전체 데이터를 손쉽게 열람할 수 있는 아카이브 뷰입니다.</p>
      </div>

      <div className="filter-bar" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', color: '#475569' }}>조회할 연도 선택:</h3>
        {availableYears.map(y => (
          <button 
            key={y}
            onClick={() => setYear(y)}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: year === y ? '#0f172a' : '#f1f5f9',
              color: year === y ? '#fff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            {y}년
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>아카이브 데이터를 불러오는 중입니다...</div>
      ) : archiveReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>해당 연도의 데이터가 없습니다.</div>
      ) : (
        <div className="kanban-board" style={{ paddingBottom: '3rem', alignItems: 'flex-start' }}>
          {archiveReports.map((report, idx) => {
            const keywords = extractKeywords(report);
            return (
              <div key={report.id || idx} className="card" style={{ 
                minWidth: '675px', 
                maxWidth: '675px', 
                minHeight: '800px', 
                display: 'flex', 
                flexDirection: 'column', 
                margin: 0,
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--accent-primary)" />
                    {report.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    {new Date(report.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', fontSize: '1.05rem', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap', marginBottom: '1rem', paddingRight: '0.5rem' }}>
                  {report.thisWeekTask && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#1d4ed8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.25rem', borderBottom: '1px solid #bfdbfe' }}>
                        <Check size={16} /> 금주 진행사항
                      </div>
                      <div style={{ fontSize: '0.95rem', paddingLeft: '0.25rem' }}>
                        {report.thisWeekTask}
                      </div>
                    </div>
                  )}
                  
                  {report.nextWeekTask && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#047857', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.25rem', borderBottom: '1px solid #a7f3d0' }}>
                        <ChevronRight size={16} /> 차주 업무계획
                      </div>
                      <div style={{ fontSize: '0.95rem', paddingLeft: '0.25rem' }}>
                        {report.nextWeekTask}
                      </div>
                    </div>
                  )}

                  {report.imagePath && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>첨부 이미지</div>
                      <img 
                        src={report.imagePath} 
                        alt="첨부파일" 
                        style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.2rem' }}>
                    <Tag size={12} /> 추출됨:
                  </span>
                  {keywords.length > 0 ? keywords.map(kw => (
                    <span key={kw} style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      #{kw}
                    </span>
                  )) : <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>없음</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
