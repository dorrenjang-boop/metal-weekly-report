import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Hammer, Activity, FileText, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)] print:h-auto print:overflow-visible">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 glass-panel border-y-0 border-l-0 rounded-none h-full flex flex-col relative z-20 print:hidden"
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Metal Insights
          </h1>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-2 mt-4">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/builds" icon={Hammer} label="Build Logs" />
          <SidebarItem to="/oee" icon={Activity} label="OEE System" />
          <SidebarItem to="/weekly-report" icon={FileText} label="Weekly Report" />
          <SidebarItem to="/project-tracking" icon={ClipboardList} label="Project Tracking" />
        </nav>
        <div className="p-6 text-sm text-[var(--text-muted)]">
          © 2026 금속기술팀
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 print:overflow-visible">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm print:hidden">
          <h2 className="text-lg font-medium text-gray-800">Overview</h2>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
              DH
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 print:p-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="print:translate-y-0 print:opacity-100"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
