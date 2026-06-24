import React, { useMemo, useState } from 'react';
import { extractKeywords, getTopicsFromKeywords, TOPICS } from '../utils/analyze';
import { Tag } from 'lucide-react';

export default function AnalyticsView({ reports }) {
  const [activeTopic, setActiveTopic] = useState('공정 최적화'); // 기본값 변경

  const analyticsData = useMemo(() => {
    // data[topic][keyword] = [ { text, author, date, type }, ... ]
    const data = {};
    
    Object.keys(TOPICS).forEach(topic => {
      data[topic] = {};
      TOPICS[topic].forEach(kw => {
        data[topic][kw] = [];
      });
    });

    const processText = (text, report, typeLabel) => {
      if (!text) return;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        
        Object.keys(TOPICS).forEach(topic => {
          TOPICS[topic].forEach(kw => {
            if (lowerLine.includes(kw.toLowerCase())) {
              data[topic][kw].push({
                text: line.replace(/^\d+\.\s*/, '').trim(),
                author: report.name.split(' ')[0],
                date: report.date,
                type: typeLabel // [금주] or [차주]
              });
            }
          });
        });
      });
    };

    reports.forEach(r => {
      // Process legacy tasks if exists
      if (r.task && !r.thisWeekTask) {
        processText(r.task, r, '[금주]');
      } else {
        processText(r.thisWeekTask, r, '[금주]');
        processText(r.nextWeekTask, r, '[차주]');
      }
    });

    Object.keys(data).forEach(t => {
      Object.keys(data[t]).forEach(kw => {
        const uniqueLines = [];
        const seen = new Set();
        data[t][kw].forEach(item => {
          const key = item.author + item.text + item.type;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueLines.push(item);
          }
        });
        
        data[t][kw] = uniqueLines.sort((a, b) => new Date(b.date) - new Date(a.date));
      });
    });

    return data;
  }, [reports]);

  const topicsList = Object.keys(TOPICS);
  const activeColumns = analyticsData[activeTopic];
  const sortedKeywords = Object.keys(activeColumns).sort((a, b) => activeColumns[b].length - activeColumns[a].length).filter(kw => activeColumns[kw].length > 0);

  return (
    <div className="analytics-wrapper">
      <div className="page-header" style={{ padding: '0 2.5rem', marginBottom: '2rem' }}>
        <h2>주제 및 키워드 분석 (AI Line Extraction)</h2>
        <p>각 키워드에 해당하는 구체적인 업무 '내용 한 줄'만 정밀하게 추출하여 모아보여줍니다.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '0 2.5rem', flexWrap: 'wrap' }}>
        {topicsList.map(topic => {
          const totalInTopic = Object.keys(analyticsData[topic]).reduce((acc, kw) => acc + analyticsData[topic][kw].length, 0);
          return (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '30px',
                border: activeTopic === topic ? 'none' : '1px solid var(--border-color)',
                backgroundColor: activeTopic === topic ? 'var(--accent-primary)' : '#fff',
                color: activeTopic === topic ? '#fff' : 'var(--text-main)',
                fontWeight: activeTopic === topic ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: activeTopic === topic ? '0 4px 10px rgba(15, 23, 42, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {topic}
              <span style={{ 
                marginLeft: '0.5rem', 
                backgroundColor: activeTopic === topic ? 'rgba(255,255,255,0.2)' : '#f1f5f9', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '12px',
                fontSize: '0.8rem' 
              }}>
                {totalInTopic}건 추출됨
              </span>
            </button>
          )
        })}
      </div>

      <div className="kanban-board" style={{ padding: '0 2.5rem' }}>
        {sortedKeywords.map(kw => (
          <div key={kw} className="kanban-column" style={{ minWidth: '400px', maxWidth: '400px' }}>
            <div className="kanban-column-header" style={{ borderBottomColor: '#93c5fd' }}>
              <div className="kanban-column-title" style={{ color: '#1d4ed8' }}>
                <Tag size={20} />
                #{kw}
              </div>
              <span style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 600, backgroundColor: '#dbeafe', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                {activeColumns[kw].length}건 추출
              </span>
            </div>
            
            <div className="kanban-column-content" style={{ gap: '0.75rem' }}>
              {activeColumns[kw].map((item, idx) => (
                <div key={idx} style={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  borderLeft: item.type === '[차주]' ? '4px solid #10b981' : '4px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.type === '[차주]' ? '#047857' : '#1d4ed8', marginRight: '0.5rem' }}>
                      {item.type}
                    </span>
                    {item.text}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    <span style={{ fontWeight: 600, color: '#3b82f6' }}>{item.author}</span>
                    <span>|</span>
                    <span>{new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sortedKeywords.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
            선택한 주제와 관련된 키워드 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
