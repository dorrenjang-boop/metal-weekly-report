import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, Image as ImageIcon, X, ChevronLeft, ChevronRight, Search, Trash2, Box } from 'lucide-react';

const ENGINEERS = ["장동훈", "김진석", "배지훈", "유지민", "강철", "박세빈", "양원재"];
const MATERIALS = ["AlSi10Mg", "CuCr2_4", "IN718", "Ti6Al4V", "STS316L", "Maraging Steel", "CoCr"];
const FAIL_REASONS = ["", "리코터 충돌", "가스 압력 이상", "가스 부족/중단", "사용자 중단", "S/W 오류", "분말 공급 오류", "기타"];
const PURPOSES = ["", "본제품", "공정개발", "시제품", "전시/홍보", "품질시편", "자체제작"];
const CLIENTS = ["링크솔루션(생산부)", "LG전자", "우니스텔라", "한화시스템", "엔젤럭스", "현대차", "한화에어로스페이스", "삼성전자", "모델솔루션", "현대로템"];
const APPLICATIONS = ["콜드플레이트", "공정검사시편", "연소기", "VIP 기념품", "열교환기", "방열판", "힌지", "미세유체장치(MicroFlu)", "하우징", "EP-500S 부품", "모바일 컴포넌트", "라이너"];

const DENSITIES = {
  "AlSi10Mg": 2.67,
  "CuCr2_4": 8.9,
  "IN718": 8.19,
  "Ti6Al4V": 4.43,
  "STS316L": 7.99,
  "Maraging Steel": 8.1,
  "CoCr": 8.3
};

export default function BuildLogsView() {
  const [builds, setBuilds] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  
  const [activeMachine, setActiveMachine] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 30;

  const getHeaders = (isFormData = false) => {
    const headers = { 'x-team-password': localStorage.getItem('team_password') || '' };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metaRes = await fetch('/api/metadata', { headers: getHeaders() });
        const buildRes = await fetch('/api/builds', { headers: getHeaders() });
        
        if (metaRes.ok && buildRes.ok) {
          const metaData = await metaRes.json();
          const buildData = await buildRes.json();
          
          setMachines(metaData.machines);
          setBuilds(buildData);
          if (metaData.machines.length > 0) {
            setActiveMachine(metaData.machines[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (id, field, value) => {
    // Optimistic update
    let newBuilds = builds.map(b => b.id === id ? { ...b, [field]: value } : b);
    
    // Auto calculate powder if volume or material changes
    const targetBuild = newBuilds.find(b => b.id === id);
    if ((field === 'volume_mm3' || field === 'material') && targetBuild) {
      const vol = parseFloat(targetBuild.volume_mm3) || 0;
      const mat = targetBuild.material || '';
      const density = DENSITIES[mat] || 0;
      const calcPowder = (vol * density / 1000000).toFixed(3);
      
      newBuilds = newBuilds.map(b => b.id === id ? { ...b, powder_weight_kg: calcPowder } : b);
    }
    
    setBuilds(newBuilds);
    setSavingId(id);

    try {
      // Send the specific field
      await fetch(`/api/builds/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ [field]: value })
      });
      
      // If we auto calculated powder, we need to save that too
      if (field === 'volume_mm3' || field === 'material') {
        const updatedTarget = newBuilds.find(b => b.id === id);
        await fetch(`/api/builds/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ powder_weight_kg: updatedTarget.powder_weight_kg })
        });
      }
    } catch (e) {
      console.error("Failed to update:", e);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 빌드 이력을 정말 삭제하시겠습니까?")) return;
    
    setBuilds(prev => prev.filter(b => b.id !== id));
    try {
      await fetch(`/api/builds/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setSavingId(id);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        handleUpdate(id, 'image_base64', data.imagePath);
      } else {
        alert("Image upload failed.");
      }
    } catch (e) {
      console.error("Upload error", e);
    } finally {
      setSavingId(null);
    }
  };

  const addNewBuild = async () => {
    if (!activeMachine) return;
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          machine_id: activeMachine,
          material: MATERIALS[0],
          build_name: 'New Build',
          engineer: ENGINEERS[0],
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          completion_state: 'Success',
          job_type: '신규',
          run_time_hr: 0,
          volume_mm3: 0,
          powder_weight_kg: 0,
          client_project: '',
          product_category: '',
          build_purpose: '',
          description: '',
          issue_detail: '',
          fail_reason: '',
          fail_layer: ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBuilds([data.data, ...builds]);
        setCurrentPage(1);
        setSearchTerm('');
      } else {
        alert("새 항목을 추가하지 못했습니다.");
      }
    } catch (e) {
      console.error("Failed to add build", e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Success': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'Failed': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'Aborted': return { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%' }}></div>
    </div>
  );

  let filteredBuilds = builds.filter(b => b.machine_id === activeMachine);
  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filteredBuilds = filteredBuilds.filter(b => 
      (b.build_name || '').toLowerCase().includes(lower) ||
      (b.client_project || '').toLowerCase().includes(lower) ||
      (b.product_category || '').toLowerCase().includes(lower) ||
      (b.engineer || '').toLowerCase().includes(lower)
    );
  }

  const totalPages = Math.ceil(filteredBuilds.length / itemsPerPage);
  const currentBuilds = filteredBuilds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const thStyle = { padding: '14px 10px', whiteSpace: 'nowrap', fontWeight: '600', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, borderBottom: '2px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' };
  const inputStyle = { width: '100%', border: '1px solid transparent', padding: '8px', borderRadius: '6px', backgroundColor: 'transparent', boxSizing: 'border-box', transition: 'all 0.2s', outline: 'none' };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>
        {`
          .hover-row:hover { background-color: #f8fafc !important; }
          .cell-input:hover { background-color: #f1f5f9; border-color: #cbd5e1 !important; }
          .cell-input:focus { background-color: #ffffff; border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
          .fancy-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
          .fancy-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
          .fancy-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .fancy-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          .status-badge { appearance: none; text-align: center; font-weight: 700; border-radius: 20px !important; transition: transform 0.1s; }
          .status-badge:hover { transform: scale(1.05); }
        `}
      </style>
      
      {/* Datalists for Custom Comboboxes */}
      <datalist id="client_list">
        {CLIENTS.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="app_list">
        {APPLICATIONS.map(a => <option key={a} value={a} />)}
      </datalist>

      {/* Sleek Machine Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0', overflowX: 'auto' }} className="fancy-scrollbar">
        {machines.map(m => (
          <button
            key={m.id}
            onClick={() => { setActiveMachine(m.id); setCurrentPage(1); }}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              fontWeight: '700',
              fontSize: '1.05rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: activeMachine === m.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeMachine === m.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            {m.name || m.id}
          </button>
        ))}
      </div>

      {/* Board */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={24} color="var(--accent-primary)"/>
              {machines.find(m => m.id === activeMachine)?.name || activeMachine} 
            </h2>
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              총 {filteredBuilds.length}건
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="검색어 입력..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', width: '220px', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            <button 
              onClick={addNewBuild}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)', transition: 'transform 0.1s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={18} /> 새 항목 추가
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '65vh', border: '1px solid #e2e8f0', borderRadius: '8px' }} className="fancy-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)' }}>
                <th style={{ ...thStyle, minWidth: '220px', left: 0, zIndex: 11 }}>Build Name</th>
                <th style={{ ...thStyle, minWidth: '120px' }}>Material</th>
                <th style={{ ...thStyle, minWidth: '150px' }}>고객사/프로젝트</th>
                <th style={{ ...thStyle, minWidth: '150px' }}>어플리케이션</th>
                <th style={{ ...thStyle, minWidth: '110px' }}>빌드 목적</th>
                <th style={{ ...thStyle, minWidth: '140px' }}>Description (내용)</th>
                <th style={{ ...thStyle, minWidth: '100px' }}>Engineer</th>
                <th style={{ ...thStyle, minWidth: '130px' }}>시작일</th>
                <th style={{ ...thStyle, minWidth: '130px' }}>종료일</th>
                <th style={{ ...thStyle, minWidth: '120px' }}>Status</th>
                <th style={{ ...thStyle, minWidth: '140px' }}>Fail Reason</th>
                <th style={{ ...thStyle, minWidth: '150px' }}>Issue Detail (상세)</th>
                <th style={{ ...thStyle, minWidth: '90px' }}>Fail Layer</th>
                <th style={{ ...thStyle, minWidth: '100px' }}>Run Time(h)</th>
                <th style={{ ...thStyle, minWidth: '110px' }}>Volume(mm³)</th>
                <th style={{ ...thStyle, minWidth: '100px' }}>Powder(kg)</th>
                <th style={{ ...thStyle, minWidth: '70px', textAlign: 'center' }}>사진</th>
                <th style={{ ...thStyle, minWidth: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {currentBuilds.length === 0 && (
                <tr><td colSpan="18" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <Box size={48} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                  표시할 이력이 없습니다.
                </td></tr>
              )}
              {currentBuilds.map(build => {
                const statusColors = getStatusColor(build.completion_state);
                return (
                <tr key={build.id} className="hover-row" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: savingId === build.id ? '#f0fdf4' : 'transparent', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '6px', position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 5, borderRight: '1px solid #e2e8f0' }}>
                    <input 
                      className="cell-input"
                      value={build.build_name || ''} 
                      onChange={e => handleUpdate(build.id, 'build_name', e.target.value)}
                      style={{ ...inputStyle, fontWeight: 'bold', color: 'var(--text-primary)' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select 
                      className="cell-input"
                      value={build.material || ''} 
                      onChange={e => handleUpdate(build.id, 'material', e.target.value)}
                      style={selectStyle}
                    >
                      {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      list="client_list"
                      className="cell-input"
                      placeholder="입력 또는 선택..."
                      value={build.client_project || ''} 
                      onChange={e => handleUpdate(build.id, 'client_project', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      list="app_list"
                      className="cell-input"
                      placeholder="입력 또는 선택..."
                      value={build.product_category || ''} 
                      onChange={e => handleUpdate(build.id, 'product_category', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select 
                      className="cell-input"
                      value={build.build_purpose || ''} 
                      onChange={e => handleUpdate(build.id, 'build_purpose', e.target.value)}
                      style={selectStyle}
                    >
                      {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      placeholder="내용 입력..."
                      value={build.description || ''} 
                      onChange={e => handleUpdate(build.id, 'description', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select 
                      className="cell-input"
                      value={build.engineer || ''} 
                      onChange={e => handleUpdate(build.id, 'engineer', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">선택</option>
                      {ENGINEERS.map(eng => <option key={eng} value={eng}>{eng}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      type="date"
                      value={build.start_date || ''} 
                      onChange={e => handleUpdate(build.id, 'start_date', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      type="date"
                      value={build.end_date || ''} 
                      onChange={e => handleUpdate(build.id, 'end_date', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select 
                      className="status-badge"
                      value={build.completion_state || 'Success'} 
                      onChange={e => handleUpdate(build.id, 'completion_state', e.target.value)}
                      style={{ 
                        ...selectStyle,
                        backgroundColor: statusColors.bg, 
                        color: statusColors.text,
                        border: `1px solid ${statusColors.border}`
                      }}
                    >
                      <option value="Success">Success</option>
                      <option value="Failed">Failed</option>
                      <option value="Aborted">Aborted</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select 
                      className="cell-input"
                      value={build.fail_reason || ''} 
                      onChange={e => handleUpdate(build.id, 'fail_reason', e.target.value)}
                      disabled={build.completion_state !== 'Failed'}
                      style={{ ...selectStyle, opacity: build.completion_state === 'Failed' ? 1 : 0.5 }}
                    >
                      {FAIL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      placeholder={build.completion_state === 'Failed' ? "이슈 상세..." : ""}
                      value={build.issue_detail || ''} 
                      onChange={e => handleUpdate(build.id, 'issue_detail', e.target.value)}
                      disabled={build.completion_state !== 'Failed'}
                      style={{ ...inputStyle, opacity: build.completion_state === 'Failed' ? 1 : 0.5 }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      type="number"
                      placeholder={build.completion_state === 'Failed' ? "Layer" : ""}
                      value={build.fail_layer || ''} 
                      onChange={e => handleUpdate(build.id, 'fail_layer', e.target.value)}
                      disabled={build.completion_state !== 'Failed'}
                      style={{ ...inputStyle, opacity: build.completion_state === 'Failed' ? 1 : 0.5 }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      type="number"
                      value={build.run_time_hr || ''} 
                      onChange={e => handleUpdate(build.id, 'run_time_hr', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      type="number"
                      value={build.volume_mm3 || ''} 
                      onChange={e => handleUpdate(build.id, 'volume_mm3', parseFloat(e.target.value))}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input 
                      className="cell-input"
                      type="number"
                      value={build.powder_weight_kg || ''} 
                      readOnly
                      title="Volume(mm³)과 Material 밀도에 의해 자동 계산됩니다."
                      style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                    />
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center' }}>
                    {build.image_base64 ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <img 
                          src={build.image_base64} 
                          alt="build" 
                          onClick={() => setZoomedImage(build.image_base64)}
                          style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px', cursor: 'zoom-in', border: '1px solid #cbd5e1', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', color: '#94a3b8', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor='#f1f5f9'}>
                          <ImageIcon size={18} />
                        </div>
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => { handleUpdate(build.id, 'image_base64', reader.result); };
                          if (file) reader.readAsDataURL(file);
                        }} />
                      </label>
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      {savingId === build.id ? <Clock size={16} color="#94a3b8" /> : <CheckCircle size={16} color="#22c55e" />}
                      <button 
                        onClick={() => handleDelete(build.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', display: 'flex', borderRadius: '4px', transition: 'background-color 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ display: 'flex', alignItems: 'center', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : 'var(--text-primary)', transition: 'all 0.2s' }}
            >
              <ChevronLeft size={18} /> 이전
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ display: 'flex', alignItems: 'center', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : 'var(--text-primary)', transition: 'all 0.2s' }}
            >
              다음 <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {zoomedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onClick={() => setZoomedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', animation: 'scaleIn 0.2s ease-out' }}>
            <button 
              onClick={() => setZoomedImage(null)}
              style={{ position: 'absolute', top: '-50px', right: '-10px', background: 'white', border: 'none', color: '#0f172a', cursor: 'pointer', borderRadius: '50%', padding: '8px', display: 'flex', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              <X size={24} />
            </button>
            <img src={zoomedImage} alt="Zoomed Build" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }} />
          </div>
          <style>{`@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
