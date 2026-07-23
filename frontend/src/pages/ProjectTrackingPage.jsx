import React from 'react';
import { BarChart3 } from 'lucide-react';

const ProjectTrackingPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
      <BarChart3 size={48} style={{ marginBottom: '1rem', color: 'var(--accent-light)' }} />
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>프로젝트 추적 관리</h2>
      <p>진행 중인 프로젝트를 한눈에 볼 수 있는 페이지가 준비 중입니다.</p>
    </div>
  );
};

export default ProjectTrackingPage;
