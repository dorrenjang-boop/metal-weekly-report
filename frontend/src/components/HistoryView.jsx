import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Calendar, Tag, Check, ChevronRight } from 'lucide-react';
import { extractKeywords, getWeekString } from '../utils/analyze';

export default function HistoryView() {
  const [historyReports, setHistoryReports] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterName, setFilterName] = useState('all');
  const [filterWeek, setFilterWeek] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const fetchReports = async (pageNum) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.length < 20) setHasMore(false);
      
      if (pageNum === 1) {
        setHistoryReports(data);
      } else {
        setHistoryReports(prev => {
          // Prevent duplicates by checking ID
          const existingIds = new Set(prev.map(r => r.id));
          const newItems = data.filter(r => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
      }
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, []);

  const handleScroll = (e) => {
    // Horizontal scroll check
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    if (scrollWidth - scrollLeft <= clientWidth + 100 && hasMore && !loading) {
      fetchReports(page + 1);
    }
  };

  // 동적 필터 목록 생성
  const filterOptions = useMemo(() => {
    const names = new Set();
    const weeks = new Set();
    const tags = new Set();

    historyReports.forEach(r => {
      if (r.name) names.add(r.name);
      const wStr = getWeekString(r.date);
      if (wStr && wStr !== "날짜 미상") weeks.add(wStr);
      
      const kws = extractKeywords(r);
      kws.forEach(k => tags.add(k));
    });

    return {
      names: [...names].filter(Boolean).sort(),
      weeks: [...weeks].sort((a,b) => b.localeCompare(a)), // 대략적인 내림차순
      tags: [...tags].sort()
    };
  }, [historyReports]);

  const filteredReports = historyReports.filter(r => {
    const wStr = getWeekString(r.date);
    if (wStr === "날짜 미상") return false;

    const term = searchTerm.toLowerCase();
    const matchSearch = term === '' || 
      (r.thisWeekTask || '').toLowerCase().includes(term) ||
      (r.nextWeekTask || '').toLowerCase().includes(term) ||
      (r.task || '').toLowerCase().includes(term);
      
    const matchName = filterName === 'all' || r.name === filterName;
    const matchWeek = filterWeek === 'all' || getWeekString(r.date) === filterWeek;
    
    let matchTag = true;
    if (filterTag !== 'all') {
      const kws = extractKeywords(r);
      matchTag = kws.includes(filterTag);
    }

    return matchSearch && matchName && matchWeek && matchTag;
  });

  return (
    <div className="history-wrapper" style={{ padding: '0 2.5rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2>전체 이력 검색 (Horizontal Scroll)</h2>
        <p>전체 주간 업무 보고를 가로(좌우)로 스크롤하며 비교해 보세요. 무한 스크롤이 적용되어 스크롤 시 데이터를 계속 불러옵니다.</p>
      </div>

      <div className="filter-bar" style={{ marginBottom: '2rem', maxWidth: '100%', gap: '0.75rem' }}>
        <input 
          type="text" 
          className="form-control filter-input" 
          placeholder="업무 내용(금주/차주) 또는 키워드 검색" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 300px' }}
        />
        <select className="form-control" style={{ width: '180px' }} value={filterName} onChange={(e) => setFilterName(e.target.value)}>
          <option value="all">모든 담당자</option>
          {filterOptions.names.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="form-control" style={{ width: '220px' }} value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
          <option value="all">모든 주차</option>
          {filterOptions.weeks.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select className="form-control" style={{ width: '200px' }} value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          <option value="all">모든 태그(키워드)</option>
          {filterOptions.tags.map(t => <option key={t} value={t}>#{t}</option>)}
        </select>
      </div>

      <div className="kanban-board" onScroll={handleScroll} style={{ paddingBottom: '3rem', alignItems: 'flex-start' }}>
        {filteredReports.length === 0 && !loading ? (
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>
            검색 조건에 맞는 결과가 없습니다.
          </div>
        ) : (
          filteredReports.map((report, idx) => {
            const keywords = extractKeywords(report);
            return (
              <div key={report.id || idx} className="card" style={{ 
                minWidth: '675px', // 1.5x width
                maxWidth: '675px', // 1.5x width
                minHeight: '1200px', 
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
                
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  fontSize: '1.05rem', 
                  lineHeight: '1.8', 
                  color: '#374151', 
                  whiteSpace: 'pre-wrap', 
                  marginBottom: '1rem',
                  paddingRight: '0.5rem' 
                }}>
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
          })
        )}
        {loading && <div style={{ minWidth: '300px', textAlign: 'center', alignSelf: 'center', color: '#64748b' }}>데이터를 불러오는 중...</div>}
      </div>
    </div>
  );
}
