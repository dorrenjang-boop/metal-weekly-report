import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [builds, setBuilds] = useState([]);
  const [oee, setOee] = useState([]);

  useEffect(() => {
    fetch('/api/builds').then(res => res.json()).then(setBuilds);
    fetch('/api/oee').then(res => res.json()).then(setOee);
  }, []);

  const purposeData = builds.reduce((acc, curr) => {
    const type = curr.job_type || 'Unknown';
    const existing = acc.find(item => item.name === type);
    if (existing) existing.value++;
    else acc.push({ name: type, value: 1 });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Yearly Overview and Statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPI Cards */}
        <motion.div className="glass-card flex flex-col justify-center" whileHover={{ y: -5 }}>
          <h3 className="text-[var(--text-muted)] text-sm font-medium">Total Builds</h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">{builds.length}</p>
        </motion.div>
        <motion.div className="glass-card flex flex-col justify-center" whileHover={{ y: -5 }}>
          <h3 className="text-[var(--text-muted)] text-sm font-medium">Success Rate</h3>
          <p className="text-4xl font-bold text-[#10b981] mt-2">
            {builds.length ? Math.round((builds.filter(b => b.completion_state === 'Success').length / builds.length) * 100) : 0}%
          </p>
        </motion.div>
        <motion.div className="glass-card flex flex-col justify-center" whileHover={{ y: -5 }}>
          <h3 className="text-[var(--text-muted)] text-sm font-medium">Average OEE</h3>
          <p className="text-4xl font-bold text-[#3b82f6] mt-2">
            {oee.length ? Math.round(oee.reduce((acc, curr) => acc + curr.oee, 0) / oee.length) : 0}%
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div className="glass-card h-[400px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-lg font-semibold mb-6">Build Purpose Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={purposeData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {purposeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                itemStyle={{ color: '#111827' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass-card h-[400px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-lg font-semibold mb-6">Machine Run Time (Hrs)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={builds}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="machine_id" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="run_time_hr" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
