import React from 'react';
import { Settings } from 'lucide-react';

const OEEPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
      <Settings size={48} style={{ marginBottom: '1rem', color: 'var(--accent-light)' }} />
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>설비종합효율 (OEE) 대시보드</h2>
      <p>현재 개발 중인 페이지입니다. 조만간 멋진 기능이 추가될 예정입니다!</p>
    </div>
  );
};

export default OEEPage;
