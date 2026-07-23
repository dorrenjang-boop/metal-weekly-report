import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const OEE = () => {
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: 'm1',
    record_date: '',
    planned_time_hr: 0,
    down_time_hr: 0,
    ideal_cycle_time: 0,
    total_parts_qty: 0,
    good_parts_qty: 0
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const res = await fetch('/api/oee');
    const data = await res.json();
    setRecords(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/oee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    fetchRecords();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Overall Equipment Effectiveness</h1>
          <p className="text-[var(--text-muted)] mt-1">Track and manage machine efficiency (OEE)</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add OEE Record</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.map(record => (
          <motion.div key={record.id} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Machine: {record.machine_id}</h3>
              <span className="text-sm text-slate-400">{record.record_date}</span>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-1">Availability</div>
                <div className="text-xl font-semibold text-blue-400">{record.availability?.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-1">Performance</div>
                <div className="text-xl font-semibold text-amber-400">{record.performance?.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-1">Quality</div>
                <div className="text-xl font-semibold text-emerald-400">{record.quality?.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="font-medium text-slate-300">Total OEE Score</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {record.oee?.toFixed(1)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-md p-6"
          >
            <h2 className="text-xl font-bold mb-4">Add OEE Data</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input required type="date" className="glass-input" value={formData.record_date} onChange={e => setFormData({...formData, record_date: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.1" className="glass-input" placeholder="Planned Time (hr)" value={formData.planned_time_hr} onChange={e => setFormData({...formData, planned_time_hr: parseFloat(e.target.value)})} />
                <input required type="number" step="0.1" className="glass-input" placeholder="Down Time (hr)" value={formData.down_time_hr} onChange={e => setFormData({...formData, down_time_hr: parseFloat(e.target.value)})} />
              </div>
              <input required type="number" step="0.1" className="glass-input" placeholder="Ideal Cycle Time (hr/part)" value={formData.ideal_cycle_time} onChange={e => setFormData({...formData, ideal_cycle_time: parseFloat(e.target.value)})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" className="glass-input" placeholder="Total Parts" value={formData.total_parts_qty} onChange={e => setFormData({...formData, total_parts_qty: parseInt(e.target.value, 10)})} />
                <input required type="number" className="glass-input" placeholder="Good Parts" value={formData.good_parts_qty} onChange={e => setFormData({...formData, good_parts_qty: parseInt(e.target.value, 10)})} />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-4 py-2 text-slate-400 hover:text-gray-900" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Calculate & Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OEE;
