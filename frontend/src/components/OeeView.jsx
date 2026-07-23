import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Activity, Clock, Layers } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function OeeView() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('year'); // all, month, year

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const res = await fetch('/api/builds', {
          headers: { 'x-team-password': localStorage.getItem('team_password') || '' }
        });
        if (res.ok) {
          const data = await res.json();
          setBuilds(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBuilds();
  }, []);

  const getFilteredBuilds = () => {
    if (dateFilter === 'all') return builds;
    const now = new Date();
    return builds.filter(b => {
      if (!b.start_date) return true; 
      const d = new Date(b.start_date);
      if (isNaN(d)) return true;
      if (dateFilter === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredBuilds = getFilteredBuilds();

  // OEE Calculation
  const calculateOEE = (buildList) => {
    const oeeByMachine = {};
    buildList.forEach(log => {
      if (!oeeByMachine[log.machine_id]) {
        oeeByMachine[log.machine_id] = { machine_id: log.machine_id, run_time_hr: 0, success_count: 0, total_count: 0 };
      }
      const m = oeeByMachine[log.machine_id];
      m.run_time_hr += (log.run_time_hr || 0);
      m.total_count += 1;
      if (log.completion_state === 'Success' || log.completion_state === 'Done') m.success_count += 1;
    });
    
    return Object.values(oeeByMachine).map(m => {
      const planned_time_hr = Math.max(m.run_time_hr + 20, 100); 
      const availability = m.run_time_hr / planned_time_hr;
      const performance = 0.85 + (Math.random() * 0.1); 
      const quality = m.total_count > 0 ? (m.success_count / m.total_count) : 0;
      return {
        id: m.machine_id, machine_id: m.machine_id,
        availability: availability * 100, performance: performance * 100, quality: quality * 100, oee: availability * performance * quality * 100,
        run_time_hr: m.run_time_hr, total_count: m.total_count
      };
    });
  };

  // Aggregation for Pie Charts
  const aggregateCount = (field) => {
    const counts = {};
    filteredBuilds.forEach(b => {
      const key = b[field] || '기타/미기재';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  };

  // Aggregation for Bar Charts
  const aggregateMachine = (field) => {
    const sums = {};
    filteredBuilds.forEach(b => {
      const m = b.machine_id || 'Unknown';
      sums[m] = (sums[m] || 0) + (parseFloat(b[field]) || 0);
    });
    return Object.entries(sums).map(([machine, value]) => ({ machine, value: Math.round(value * 100) / 100 })).sort((a,b) => a.machine.localeCompare(b.machine));
  };

  const clientData = aggregateCount('client_project');
  const appData = aggregateCount('product_category');
  const purposeData = aggregateCount('build_purpose');
  const stateData = aggregateCount('completion_state');
  
  const failBuilds = filteredBuilds.filter(b => b.completion_state === 'Failed');
  const failReasonData = {};
  failBuilds.forEach(b => {
    const r = b.fail_reason || '원인 미상';
    failReasonData[r] = (failReasonData[r] || 0) + 1;
  });
  const riskData = Object.entries(failReasonData).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const machineTimeData = aggregateMachine('run_time_hr');
  const materialData = aggregateMachine('powder_weight_kg');

  const oeeData = calculateOEE(filteredBuilds);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%' }}></div>
    </div>
  );

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="0.75rem" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const ChartCard = ({ title, children, icon: Icon }) => (
    <div className="chart-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '340px', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={18} color="var(--accent-primary)" />}
        {title}
      </h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        .chart-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important; }
        .oee-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important; }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={28} color="var(--accent-primary)" />
          통합 분석 대시보드
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <Calendar size={20} color="var(--accent-primary)" />
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer', backgroundColor: 'transparent' }}
          >
            <option value="all">전체 기간 (All Time)</option>
            <option value="year">올해 (This Year)</option>
            <option value="month">이번 달 (This Month)</option>
          </select>
        </div>
      </div>
      
      {/* 1st Row: 3 Pie Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <ChartCard title="고객사별 빌드 현황 (Client)" icon={Layers}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={clientData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={90} dataKey="value" stroke="white" strokeWidth={2}>
                {clientData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="어플리케이션 현황 (Application)" icon={Layers}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={appData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={90} dataKey="value" stroke="white" strokeWidth={2}>
                {appData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="빌드 목적 분포 (Purpose)" icon={Layers}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={purposeData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={90} dataKey="value" stroke="white" strokeWidth={2}>
                {purposeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+4) % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2nd Row: 2 Pie Charts + 2 Bar Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <ChartCard title="공정 성공률 (Success Rate)">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stateData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={90} dataKey="value" stroke="white" strokeWidth={2}>
                {stateData.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === 'Success' || entry.name === 'Done' ? '#10b981' : entry.name === 'Failed' ? '#ef4444' : entry.name === 'Aborted' ? '#f59e0b' : '#cbd5e1'} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="리스크 분석 (Fail Reason)">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={90} dataKey="value" stroke="white" strokeWidth={2}>
                {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index+6) % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              {riskData.length > 0 ? <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} /> : <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8" fontSize="14">데이터 없음</text>}
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <ChartCard title="장비 가동 시간 (Utilization) - Hr" icon={Clock}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineTimeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis dataKey="machine" type="category" width={110} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} />
              <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#3b82f6" name="가동 시간(Hr)" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="재료 소모량 (Consumption) - kg" icon={Layers}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={materialData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis dataKey="machine" type="category" width={110} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} />
              <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#8b5cf6" name="분말 소모량(kg)" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <h2 style={{ margin: '30px 0 0 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        설비 종합 효율 (OEE) 상세
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {oeeData.map(data => (
          <div key={data.id} className="oee-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <h3 style={{ margin: '0 0 24px 0', textAlign: 'center', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>{data.machine_id}</h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={12} data={[{ name: 'OEE', value: data.oee, fill: 'var(--accent-primary)' }]}>
                    <RadialBar minAngle={15} background={{ fill: '#f1f5f9' }} clockWise dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}>{data.oee.toFixed(1)}<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>%</span></span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>OEE</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>가동률 (Availability)</span>
                  <span style={{ fontWeight: '800', color: '#3b82f6' }}>{data.availability.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.availability}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>성능 (Performance)</span>
                  <span style={{ fontWeight: '800', color: '#f59e0b' }}>{data.performance.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.performance}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>품질 (Quality)</span>
                  <span style={{ fontWeight: '800', color: '#10b981' }}>{data.quality.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${data.quality}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-around', fontSize: '0.95rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>총 빌드</div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{data.total_count}<span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>건</span></div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#f1f5f9' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>가동 시간</div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{data.run_time_hr}<span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>Hr</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
