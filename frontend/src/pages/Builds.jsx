import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Builds = () => {
  const [builds, setBuilds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: 'm1',
    build_name: '',
    engineer: '',
    start_date: '',
    end_date: '',
    completion_state: 'Success',
    job_type: '본제품',
    run_time_hr: 0
  });

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    const res = await fetch('/api/builds');
    const data = await res.json();
    setBuilds(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowModal(false);
    fetchBuilds();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Build Logs</h1>
          <p className="text-[var(--text-muted)] mt-1">Manage and view machine build histories</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add New Build</button>
      </div>

      <motion.div className="glass-card p-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Build Name</th>
                <th>Machine ID</th>
                <th>Engineer</th>
                <th>Job Type</th>
                <th>Status</th>
                <th>Run Time</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium text-gray-900">{b.build_name}</td>
                  <td>{b.machine_id}</td>
                  <td>{b.engineer}</td>
                  <td>{b.job_type}</td>
                  <td>
                    <span className={`badge ${b.completion_state === 'Success' ? 'success' : 'danger'}`}>
                      {b.completion_state}
                    </span>
                  </td>
                  <td>{b.run_time_hr} Hr</td>
                </tr>
              ))}
              {builds.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">No build logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-md p-6"
          >
            <h2 className="text-xl font-bold mb-4">Add Build Log</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input required className="glass-input" placeholder="Build Name" value={formData.build_name} onChange={e => setFormData({...formData, build_name: e.target.value})} />
              <input required className="glass-input" placeholder="Engineer" value={formData.engineer} onChange={e => setFormData({...formData, engineer: e.target.value})} />
              <div className="flex gap-4">
                <input required type="date" className="glass-input" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                <input required type="date" className="glass-input" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
              </div>
              <input required type="number" step="0.1" className="glass-input" placeholder="Run Time (Hr)" value={formData.run_time_hr} onChange={e => setFormData({...formData, run_time_hr: parseFloat(e.target.value)})} />
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-4 py-2 text-slate-400 hover:text-gray-900" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Build</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Builds;
