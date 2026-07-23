import React, { useMemo, useState } from 'react';
import { getWeekString, standardizeProjectName } from '../utils/analyze';
import { isMajorTag } from '../utils/taxonomy';
import { Calendar, User, Check, ChevronRight, Trash2, FolderKanban, Users, Pencil, Save, X } from 'lucide-react';

// "해당 없음" 필터링 및 텍스트 정리 함수
const processTaskText = (text) => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => {
    const clean = line.replace(/[\s\-\*\.]/g, '');
    return !(clean === '해당없음' || clean === '없음' || clean === '해당사항없음' || clean === 'N/A' || clean === 'NA' || clean === '');
  });
  
  if (lines.length === 0) return null;
  
  // 태그 표준화 (사용자별 보기 용)
  return lines.map(line => {
    return line.replace(/\[(.*?)\]/g, (match, p1) => {
      return `[${standardizeProjectName(p1)}]`;
    });
  }).join('\n');
};

export default function WeeklyView({ reports, fetchReports }) {
  const [viewMode, setViewMode] = useState('user'); // 'user' or 'project'
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ thisWeekTask: '', nextWeekTask: '' });

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
    
    const sortedWeeks = Object.keys(groups).sort((a, b) => {
      const dateA = Math.max(...groups[a].map(r => new Date(r.date).getTime()));
      const dateB = Math.max(...groups[b].map(r => new Date(r.date).getTime()));
      return dateB - dateA;
    });

    return { groups, sortedWeeks };
  }, [reports]);

  // 프로젝트별로 데이터를 재구성하는 로직
  const getProjectGroupedData = (reportsForWeek) => {
    const projects = {};
    
    reportsForWeek.forEach(report => {
      ['thisWeekTask', 'nextWeekTask'].forEach(taskType => {
        if (!report[taskType]) return;
        
        const lines = report[taskType].split('\n').filter(line => {
          const clean = line.replace(/[\s\-\*\.]/g, '');
          return !(clean === '해당없음' || clean === '없음' || clean === '해당사항없음' || clean === 'N/A' || clean === 'NA' || clean === '');
        });

        let currentProject = '공통/기타';
        let currentMinor = '';
        
        lines.forEach(line => {
          const match = line.match(/^\[(.*?)\]/);
          if (match) {
            const std = standardizeProjectName(match[1]);
            if (std.includes(' - ')) {
              const parts = std.split(' - ');
              currentProject = parts[0].trim();
              currentMinor = parts.slice(1).join(' - ').trim();
            } else if (isMajorTag(std)) {
              currentProject = std;
              currentMinor = '';
            } else {
              if (currentProject === '공통/기타') {
                currentProject = std;
                currentMinor = '';
              } else {
                currentMinor = std;
              }
            }
          }
          
          if (!projects[currentProject]) {
            projects[currentProject] = { thisWeek: [], nextWeek: [] };
          }
          
          // 태그 제거 후 텍스트 추출
          let cleanText = line.replace(/\[.*?\]/, '').replace(/^[\s\-\*]+/, '').trim();
          if (cleanText) {
            const textToPush = currentMinor ? `[${currentMinor}] ${cleanText}` : cleanText;
            projects[currentProject][taskType === 'thisWeekTask' ? 'thisWeek' : 'nextWeek'].push({
              user: report.name,
              text: textToPush
            });
          }
        });
      });
    });
    
    return projects;
  };

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

  const startEdit = (report) => {
    setEditingId(report.id);
    setEditData({
      thisWeekTask: report.thisWeekTask || '',
      nextWeekTask: report.nextWeekTask || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ thisWeekTask: '', nextWeekTask: '' });
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        setEditingId(null);
        if (fetchReports) fetchReports();
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류로 수정에 실패했습니다.');
    }
  };

  return (
    <div className="weekly-wrapper">
      <div className="page-header" style={{ padding: '0 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>주차별 업무 보기 (Weekly Kanban)</h2>
          <p>각 주차가 거대한 기둥 형태의 카드가 됩니다. 금주 진행 업무와 차주 계획을 분리하여 한눈에 파악하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            onClick={() => setViewMode('user')}
            style={{ 
              padding: '0.5rem 1rem', 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: viewMode === 'user' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'user' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'user' ? 600 : 400,
              color: viewMode === 'user' ? '#0f172a' : '#64748b'
            }}
          >
            <Users size={18} /> 담당자별
          </button>
          <button 
            onClick={() => setViewMode('project')}
            style={{ 
              padding: '0.5rem 1rem', 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: viewMode === 'project' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'project' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'project' ? 600 : 400,
              color: viewMode === 'project' ? '#0f172a' : '#64748b'
            }}
          >
            <FolderKanban size={18} /> 프로젝트별
          </button>
        </div>
      </div>

      <div className="kanban-board" style={{ padding: '0 2.5rem' }}>
        {groupedReports.sortedWeeks.map(week => {
          const reportsForWeek = groupedReports.groups[week];
          const projectData = viewMode === 'project' ? getProjectGroupedData(reportsForWeek) : null;

          return (
            <div key={week} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <Calendar size={20} />
                  {week}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, backgroundColor: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  {reportsForWeek.length}건
                </span>
              </div>
              
              <div className="kanban-column-content">
                {viewMode === 'user' && reportsForWeek.map((report, idx) => {
                  const processedThisWeek = processTaskText(report.thisWeekTask);
                  const processedNextWeek = processTaskText(report.nextWeekTask);
                  
                  if (!processedThisWeek && !processedNextWeek && !report.imagePath) return null;

                  return (
                    <div key={idx} className="kanban-item" style={{ position: 'relative' }}>
                      {report.id && editingId !== report.id && (
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.25rem' }}>
                          <button 
                            onClick={() => startEdit(report)}
                            style={{
                              background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.2rem', borderRadius: '4px', transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="수정하기"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(report.id)}
                            style={{
                              background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', borderRadius: '4px', transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="삭제하기"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}

                      <div className="kanban-item-header">
                        <div className="kanban-item-author">
                          <User size={16} />
                          {report.name}
                        </div>
                        <div className="kanban-item-date" style={{ marginRight: report.id ? '4rem' : '0' }}>
                          {new Date(report.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </div>
                      </div>
                      
                      <div className="kanban-item-body">
                        {editingId === report.id ? (
                          <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#1d4ed8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              <Check size={14} /> 금주 진행사항 (수정)
                            </div>
                            <textarea 
                              style={{ width: '100%', minHeight: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', marginBottom: '1rem', fontFamily: 'inherit' }}
                              value={editData.thisWeekTask}
                              onChange={(e) => setEditData({...editData, thisWeekTask: e.target.value})}
                            />
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#047857', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              <ChevronRight size={14} /> 차주 업무계획 (수정)
                            </div>
                            <textarea 
                              style={{ width: '100%', minHeight: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #a7f3d0', backgroundColor: '#ecfdf5', marginBottom: '1rem', fontFamily: 'inherit' }}
                              value={editData.nextWeekTask}
                              onChange={(e) => setEditData({...editData, nextWeekTask: e.target.value})}
                            />
                            
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={cancelEdit} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', borderRadius: '4px', cursor: 'pointer' }}>
                                <X size={14} /> 취소
                              </button>
                              <button onClick={() => saveEdit(report.id)} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                                <Save size={14} /> 저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {processedThisWeek && (
                              <div style={{ marginBottom: '1rem', backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#1d4ed8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                  <Check size={14} /> 금주 진행사항
                                </div>
                                <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                                  {processedThisWeek}
                                </div>
                              </div>
                            )}
                            
                            {processedNextWeek && (
                              <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#047857', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                  <ChevronRight size={14} /> 차주 업무계획
                                </div>
                                <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                                  {processedNextWeek}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {report.imagePath && (
                          <div style={{ marginTop: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>첨부 이미지</div>
                            <img src={report.imagePath} alt="첨부파일" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {viewMode === 'project' && Object.keys(projectData).sort().map((projectName, pIdx) => {
                  const proj = projectData[projectName];
                  if (proj.thisWeek.length === 0 && proj.nextWeek.length === 0) return null;
                  
                  return (
                    <div key={pIdx} className="kanban-item" style={{ borderTop: `4px solid ${projectName === '공통/기타' ? '#94a3b8' : '#8b5cf6'}` }}>
                      <div className="kanban-item-header" style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FolderKanban size={18} color={projectName === '공통/기타' ? '#94a3b8' : '#8b5cf6'} />
                          {projectName}
                        </div>
                      </div>
                      
                      <div className="kanban-item-body">
                        {proj.thisWeek.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              <Check size={14} /> 금주 진행사항
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#334155', fontSize: '0.95rem' }}>
                              {proj.thisWeek.map((task, tIdx) => (
                                <li key={tIdx} style={{ marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600, marginRight: '0.4rem', color: '#64748b' }}>[{task.user}]</span>
                                  {task.text.match(/^\[(.*?)\]/) ? (
                                    <>
                                      <span style={{ fontWeight: 600, color: '#0f766e', marginRight: '0.25rem' }}>
                                        {task.text.match(/^\[(.*?)\]/)[0]}
                                      </span>
                                      {task.text.replace(/^\[(.*?)\]\s*/, '')}
                                    </>
                                  ) : (
                                    task.text
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {proj.nextWeek.length > 0 && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              <ChevronRight size={14} /> 차주 업무계획
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#334155', fontSize: '0.95rem' }}>
                              {proj.nextWeek.map((task, tIdx) => (
                                <li key={tIdx} style={{ marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600, marginRight: '0.4rem', color: '#64748b' }}>[{task.user}]</span>
                                  {task.text.match(/^\[(.*?)\]/) ? (
                                    <>
                                      <span style={{ fontWeight: 600, color: '#0f766e', marginRight: '0.25rem' }}>
                                        {task.text.match(/^\[(.*?)\]/)[0]}
                                      </span>
                                      {task.text.replace(/^\[(.*?)\]\s*/, '')}
                                    </>
                                  ) : (
                                    task.text
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {groupedReports.sortedWeeks.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
            작성된 주간 업무가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
