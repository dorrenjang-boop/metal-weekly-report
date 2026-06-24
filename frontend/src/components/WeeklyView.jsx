import React, { useMemo } from 'react';
import { getWeekString } from '../utils/analyze';
import { Calendar, User, Check, ChevronRight, Trash2 } from 'lucide-react';

export default function WeeklyView({ reports, fetchReports }) {
  const groupedReports = useMemo(() => {
    const groups = {};
    reports.forEach(r => {
      const weekStr = getWeekString(r.date);
      if (weekStr === "날짜 미상") return;

      if (!groups[weekStr]) {
        groups[weekStr] = [];
      }
      groups[weekStr].push(r);
    });
    
    // Sort weeks descending
    const sortedWeeks = Object.keys(groups).sort((a, b) => {
      const dateA = Math.max(...groups[a].map(r => new Date(r.date).getTime()));
      const dateB = Math.max(...groups[b].map(r => new Date(r.date).getTime()));
      return dateB - dateA;
    });

    return { groups, sortedWeeks };
  }, [reports]);

  const handleDelete = async (id) => {
    if (!id) {
      alert('삭제할 수 없는 데이터입니다 (ID 누락).');
      return;
    }
    
    if (window.confirm('정말 이 보고서를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) {
      try {
        const res = await fetch(`/api/reports/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          if (fetchReports) fetchReports();
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('서버 오류로 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="weekly-wrapper">
      <div className="page-header" style={{ padding: '0 2.5rem' }}>
        <h2>주차별 업무 보기 (Weekly Kanban)</h2>
        <p>각 주차가 거대한 기둥 형태의 카드가 됩니다. 금주 진행 업무와 차주 계획을 분리하여 한눈에 파악하세요.</p>
      </div>

      <div className="kanban-board" style={{ padding: '0 2.5rem' }}>
        {groupedReports.sortedWeeks.map(week => (
          <div key={week} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <Calendar size={20} />
                {week}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, backgroundColor: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                {groupedReports.groups[week].length}건
              </span>
            </div>
            
            <div className="kanban-column-content">
              {groupedReports.groups[week].map((report, idx) => (
                <div key={idx} className="kanban-item" style={{ position: 'relative' }}>
                  
                  {report.id && (
                    <button 
                      onClick={() => handleDelete(report.id)}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="이 보고서 삭제하기"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className="kanban-item-header">
                    <div className="kanban-item-author">
                      <User size={16} />
                      {report.name}
                    </div>
                    <div className="kanban-item-date" style={{ marginRight: report.id ? '2rem' : '0' }}>
                      {new Date(report.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </div>
                  </div>
                  
                  <div className="kanban-item-body">
                    {/* 금주 업무 */}
                    {report.thisWeekTask && (
                      <div style={{ marginBottom: '1rem', backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#1d4ed8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <Check size={14} /> 금주 진행사항
                        </div>
                        <div style={{ fontSize: '0.95rem' }}>
                          {report.thisWeekTask}
                        </div>
                      </div>
                    )}
                    
                    {/* 차주 업무 */}
                    {report.nextWeekTask && (
                      <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#047857', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <ChevronRight size={14} /> 차주 업무계획
                        </div>
                        <div style={{ fontSize: '0.95rem' }}>
                          {report.nextWeekTask}
                        </div>
                      </div>
                    )}

                    {report.imagePath && (
                      <div style={{ marginTop: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>첨부 이미지</div>
                        <img 
                          src={report.imagePath} 
                          alt="첨부파일" 
                          style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedReports.sortedWeeks.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
            작성된 주간 업무가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
