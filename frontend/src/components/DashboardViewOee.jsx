import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardViewOee = () => {
  const [oeeData, setOeeData] = useState([]);
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/oee').then(res => res.json()),
      fetch('/api/builds').then(res => res.json())
    ]).then(([oee, bld]) => {
      setOeeData(oee);
      setBuilds(bld);
    }).catch(err => console.error(err));
  }, []);

  // Calculate overall metrics
  const avgOee = oeeData.length ? (oeeData.reduce((acc, curr) => acc + curr.oee, 0) / oeeData.length).toFixed(1) : 0;
  const totalBuilds = builds.length;
  const successBuilds = builds.filter(b => b.completion_state === 'Success' || b.completion_state === 'Done').length;
  const successRate = totalBuilds ? ((successBuilds / totalBuilds) * 100).toFixed(1) : 0;

  // Pie chart for job types
  const jobTypeCount = {};
  builds.forEach(b => {
    const type = b.job_type || '미분류';
    jobTypeCount[type] = (jobTypeCount[type] || 0) + 1;
  });
  const pieData = Object.keys(jobTypeCount).map(key => ({ name: key, value: jobTypeCount[key] }));

  return (
    <div>
      <div className="page-header">
        <h2>종합 대시보드 (Build & OEE)</h2>
        <p>전체 장비의 통합된 통계 및 실적을 요약합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>전체 장비 평균 OEE</div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#6366f1' }}>{avgOee}%</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>총 빌드 건수</div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#10b981' }}>{totalBuilds} <span style={{fontSize:'1rem', color:'var(--text-muted)', fontWeight:'normal'}}>건</span></div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>전체 빌드 성공률</div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: '#3b82f6' }}>{successRate}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>빌드 목적 비율</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} label dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>최근 성공적인 빌드</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {builds.filter(b => b.completion_state === 'Success' || b.completion_state === 'Done').slice(0, 4).map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{b.build_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.machine_id} | {b.engineer}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#10b981' }}>{b.run_time_hr} Hr</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.volume_mm3} mm³</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardViewOee;
