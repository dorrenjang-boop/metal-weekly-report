import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, CartesianGrid
} from 'recharts';
import { extractKeywords, getWeekString } from '../utils/analyze';
import { FileText, TrendingUp, Users, Tag, AlertTriangle, Activity } from 'lucide-react';

export default function DashboardView({ reports }) {
  
  const stats = useMemo(() => {
    // 1. Total Data & New This Week
    const totalReports = reports.length;
    
    // Find what the "latest" week is in the dataset and current week
    const allWeeks = reports.map(r => getWeekString(r.date)).filter(w => w !== "날짜 미상");
    const uniqueWeeks = [...new Set(allWeeks)].sort((a,b) => b.localeCompare(a));
    const latestWeek = uniqueWeeks.length > 0 ? uniqueWeeks[0] : null;
    
    const currentWeekStr = getWeekString(new Date().toISOString());
    const newReportsThisWeek = reports.filter(r => getWeekString(r.date) === currentWeekStr).length;

    // 2. Team Member Report Count
    const memberCounts = {};
    reports.forEach(r => {
      if (r.name) {
        memberCounts[r.name] = (memberCounts[r.name] || 0) + 1;
      }
    });
    
    const memberData = Object.keys(memberCounts).map(name => ({
      name,
      count: memberCounts[name]
    })).sort((a, b) => b.count - a.count);

    // 3. Top 10 Keywords in the last month
    const now = new Date().getTime();
    const lastMonthReports = reports.filter(r => {
      const diffDays = (now - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30; // approx 1 month
    });

    const kwCounts = {};
    lastMonthReports.forEach(r => {
      const kws = extractKeywords(r);
      kws.forEach(k => {
        kwCounts[k] = (kwCounts[k] || 0) + 1;
      });
    });

    const topKeywords = Object.keys(kwCounts)
      .map(kw => ({ kw, count: kwCounts[kw] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. (A) Unsubmitted Members This Week
    const ALL_MEMBERS = ['장동훈', '김진석', '유지민', '강철', '배지훈', '양원재', '박세빈'];
    const submittedMembers = new Set(reports.filter(r => getWeekString(r.date) === currentWeekStr).map(r => r.name));
    const unsubmittedMembers = ALL_MEMBERS.filter(m => !submittedMembers.has(m));

    // 5. (B) Core Projects Weekly Trend (Last 4 Weeks)
    const last4Weeks = uniqueWeeks.slice(0, 4).reverse(); // Oldest to newest
    const top5Kws = topKeywords.slice(0, 5).map(k => k.kw);
    
    const trendData = last4Weeks.map(w => {
      const wReports = reports.filter(r => getWeekString(r.date) === w);
      const counts = { week: w.split(' ').slice(-1)[0] }; // e.g., '6월 2주차' -> '2주차' or keep full if short
      top5Kws.forEach(k => counts[k] = 0);

      wReports.forEach(r => {
        const kws = extractKeywords(r);
        kws.forEach(k => {
          if (top5Kws.includes(k)) {
            counts[k] += 1;
          }
        });
      });
      return counts;
    });

    return { totalReports, newReportsThisWeek, currentWeekStr, memberData, topKeywords, unsubmittedMembers, trendData, top5Kws };
  }, [reports]);

  // Modern soft color palette for the bar chart
  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  return (
    <div className="dashboard-wrapper" style={{ padding: '0 2.5rem 4rem 2.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div className="page-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>인사이트 대시보드</h2>
        <p style={{ fontSize: '1.1rem', color: '#64748b' }}>팀장 및 관리자를 위한 팀 업무 핵심 지표 현황입니다.</p>
      </div>

      {/* Top Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Card 1: Total Reports */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '50%' }}>
            <FileText size={28} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>누적 작성된 보고서</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalReports}건</div>
          </div>
        </div>

        {/* Card 2: New This Week */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '50%' }}>
            <TrendingUp size={28} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>이번 주 신규 보고서</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{stats.newReportsThisWeek}건</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>({stats.currentWeekStr})</div>
          </div>
        </div>

        {/* Card 3: Unsubmitted Warning */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'flex-start', gap: '1.25rem', border: '1px solid #fecaca' }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '50%' }}>
            <AlertTriangle size={28} color="#dc2626" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 700, marginBottom: '0.5rem' }}>이번 주 미제출자 현황</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {stats.unsubmittedMembers.length > 0 ? stats.unsubmittedMembers.map(m => (
                <span key={m} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {m}
                </span>
              )) : (
                <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 600 }}>전원 제출 완료 🎉</span>
              )}
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Trend Chart */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Activity size={24} color="#0f172a" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>최근 4주 핵심 프로젝트 트렌드</h3>
          </div>
          
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                {stats.top5Kws.map((kw, i) => (
                  <Line key={kw} type="monotone" dataKey={kw} stroke={COLORS[i % COLORS.length]} strokeWidth={3} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Keywords */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Tag size={24} color="#0f172a" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>최근 1달 핵심 키워드 TOP 10</h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>최근 한 달간 팀 내에서 가장 많이 언급된 주요 프로젝트 및 기술 키워드입니다.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {stats.topKeywords.length > 0 ? stats.topKeywords.map((item, idx) => {
              const isTop3 = idx < 3;
              return (
                <div 
                  key={item.kw} 
                  style={{
                    backgroundColor: isTop3 ? '#eff6ff' : '#f8fafc',
                    color: isTop3 ? '#1d4ed8' : '#475569',
                    border: `1px solid ${isTop3 ? '#bfdbfe' : '#e2e8f0'}`,
                    padding: isTop3 ? '0.75rem 1.25rem' : '0.5rem 1rem',
                    borderRadius: '50px',
                    fontSize: isTop3 ? '1.1rem' : '0.95rem',
                    fontWeight: isTop3 ? 700 : 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}
                >
                  #{item.kw}
                  <span style={{ 
                    backgroundColor: isTop3 ? '#dbeafe' : '#f1f5f9', 
                    color: isTop3 ? '#2563eb' : '#64748b', 
                    padding: '0.1rem 0.5rem', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem' 
                  }}>
                    {item.count}
                  </span>
                </div>
              );
            }) : (
              <div style={{ color: '#94a3b8' }}>최근 1달간 언급된 키워드가 없습니다.</div>
            )}
          </div>
        </div>

      </div>

      {/* Team Member Chart */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Users size={24} color="#0f172a" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>전체 팀원별 업무 작성 건수</h3>
        </div>
        
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.memberData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {stats.memberData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
