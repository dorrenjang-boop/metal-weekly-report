import React, { useState } from 'react';
import { extractKeywords } from '../utils/analyze';
import { Send, History, CheckCircle, ChevronRight, Check } from 'lucide-react';

const TAXONOMY = [
  {
    major: "AM 제조/서비스",
    minors: ["우나스텔라", "LG전자", "기타(단발성)"],
    customPrompt: "신규 고객사명을 입력하세요 (예: 삼성전자):"
  },
  {
    major: "설비 운용 및 관리",
    minors: ["A40PM3SN01(BLT-S400-3)", "A40PM3SN02(BLT-S400-3)", "A40PM4SN01(EOS M400-4)", "A29PM1SN01(EOS M290-1)", "A65PM8SN01(BLT S600-8)", "A65PM8SN02(BLT S600-8)", "A40PM6SN01(LiM X400-6)", "A15PM1SN01(LiM X150-1)"],
    customPrompt: "신규 설비명을 입력하세요:"
  },
  {
    major: "후공정 및 검사",
    minors: ["절삭가공", "열처리", "와이어 방전가공", "품질검사"],
    customPrompt: "신규 공정명을 입력하세요:"
  },
  {
    major: "기술개발 및 실증",
    minors: ["공정최적화", "불량원인분석", "소재물성평가", "공정환경평가"],
    customPrompt: null
  },
  {
    major: "센터 운영 및 기타",
    minors: ["원자재/부자재관리", "근태(휴가)", "기타업무"],
    customPrompt: "신규 항목을 입력하세요:"
  }
];

export default function FormView({ onReportAdded }) {
  const [name, setName] = useState('');
  const [thisWeekTask, setThisWeekTask] = useState('');
  const [nextWeekTask, setNextWeekTask] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeMajor, setActiveMajor] = useState(TAXONOMY[0].major);

  // Past History Load
  const [showHistory, setShowHistory] = useState(false);
  const [myPastReports, setMyPastReports] = useState([]);

  const loadMyHistory = async () => {
    if (!name.trim()) {
      alert("담당자 이름을 먼저 입력해주세요.");
      return;
    }
    
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/reports`);
      const data = await res.json();
      const mine = data.filter(r => r.name.includes(name.trim())).sort((a,b) => new Date(b.date) - new Date(a.date));
      setMyPastReports(mine);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
      alert("과거 이력을 불러오는데 실패했습니다.");
    }
  };

  const applyPastReport = (report) => {
    // Bring past 'nextWeekTask' to current 'thisWeekTask' if available, otherwise just use their past thisWeekTask
    if (report.nextWeekTask && report.nextWeekTask.trim().length > 0) {
      setThisWeekTask(report.nextWeekTask + '\n\n[지난주 예정사항에서 가져옴 - 진행 내역으로 수정해주세요.]\n- ');
    } else {
      setThisWeekTask(report.thisWeekTask);
    }
    setShowHistory(false);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === '[') {
      e.preventDefault();
      alert('⚠️ 프로젝트 태그(대괄호 [ ])는 직접 입력할 수 없습니다. 상단의 대분류/중분류 버튼을 클릭해서 추가해주세요!');
    }
  };

  const handleTextareaPaste = (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    if (paste.includes('[')) {
      e.preventDefault();
      alert('⚠️ 복사한 내용에 대괄호([ ])가 포함되어 있어 붙여넣을 수 없습니다. 대괄호를 지우고 다시 시도해주세요.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (!thisWeekTask && !nextWeekTask)) {
      alert('이름과 업무 내용을 최소 하나 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    // Combine for keyword extraction to keep metadata rich
    const combinedTask = `${thisWeekTask}\n${nextWeekTask}`;
    const keywordsArray = extractKeywords(combinedTask);
    const keywordsString = keywordsArray.join(',');

    let uploadedImagePath = '';
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      try {
        const upRes = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          uploadedImagePath = upData.imagePath;
        }
      } catch (err) {
        console.error('Image upload failed', err);
      }
    }

    const payload = {
      date: new Date().toISOString(),
      name: name.trim(),
      thisWeekTask,
      nextWeekTask,
      imagePath: uploadedImagePath,
      keywords: keywordsString
    };

    try {
      const res = await fetch(`/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSuccess(true);
        setName('');
        setThisWeekTask('');
        setNextWeekTask('');
        setImageFile(null);
        setTimeout(() => {
          setSuccess(false);
          onReportAdded();
        }, 1500);
      } else {
        const errData = await res.json();
        alert(`저장 실패: ${errData.error || '알 수 없는 오류'}\n(혹시 엑셀에서 CSV 파일을 열어두고 계신다면 종료해주세요.)`);
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2>주간 업무 작성</h2>
        <p>복잡한 양식 없이 금주 진행 사항과 차주 계획을 나열식으로 편하게 작성하세요.</p>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontWeight: 'bold', display: 'inline-block', textAlign: 'left', width: '100%' }}>
          💡 [스마트 작성 규칙]<br/>
          이제부터 <b>임의의 프로젝트 태그 직접 입력은 금지</b>됩니다! (대괄호 [ ] 타이핑 불가)<br/>
          아래의 대분류 탭을 누르시고, 원하시는 중분류 버튼을 클릭하여 태그를 삽입해 주세요.
          
          <div style={{ marginTop: '1rem', border: '1px solid #22c55e', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', backgroundColor: '#dcfce7', borderBottom: '1px solid #22c55e', flexWrap: 'wrap' }}>
              {TAXONOMY.map(cat => (
                <button
                  key={cat.major}
                  type="button"
                  onClick={() => setActiveMajor(cat.major)}
                  style={{
                    flex: '1 1 20%', padding: '0.6rem 0.2rem', border: 'none', borderRight: '1px solid #22c55e', borderBottom: 'none',
                    backgroundColor: activeMajor === cat.major ? '#22c55e' : 'transparent',
                    color: activeMajor === cat.major ? '#fff' : '#166534',
                    fontWeight: activeMajor === cat.major ? 'bold' : 'normal',
                    cursor: 'pointer', fontSize: '0.85rem',
                    transition: 'background-color 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.major}
                </button>
              ))}
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {TAXONOMY.find(c => c.major === activeMajor)?.minors.map(minor => (
                <button 
                  key={minor}
                  type="button"
                  onClick={() => {
                    const tag = `[${activeMajor} - ${minor}]`;
                    setThisWeekTask(prev => prev + (prev ? '\n\n' : '') + tag + '\n- ');
                  }}
                  style={{ 
                    backgroundColor: '#f8fafc', border: '1px solid #22c55e', color: '#15803d',
                    padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#dcfce7'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#f8fafc'; }}
                >
                  + {minor}
                </button>
              ))}
              {TAXONOMY.find(c => c.major === activeMajor)?.customPrompt && (
                <button 
                  type="button"
                  onClick={() => {
                    const customText = window.prompt(TAXONOMY.find(c => c.major === activeMajor).customPrompt);
                    if (customText && customText.trim()) {
                      const tag = `[${activeMajor} - ${customText.trim()}]`;
                      setThisWeekTask(prev => prev + (prev ? '\n\n' : '') + tag + '\n- ');
                    }
                  }}
                  style={{ 
                    backgroundColor: '#fff', border: '1px dashed #22c55e', color: '#15803d',
                    padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem'
                  }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#dcfce7'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#fff'; }}
                >
                  + 직접 입력 (신규 추가)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '3rem', position: 'relative' }}>
        {success && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '16px' }}>
            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', color: '#064e3b' }}>성공적으로 제출되었습니다!</h3>
            <p style={{ color: '#059669', marginTop: '0.5rem' }}>대시보드로 이동합니다...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label>담당자 이름</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="예: 장동훈 (직급 생략 가능)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button type="button" className="btn-secondary" onClick={loadMyHistory} style={{ padding: '0.875rem 1.5rem' }}>
              <History size={18} /> 내 과거 이력 불러오기
            </button>
          </div>

          {showHistory && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <History size={16} /> 최근 작성 이력
              </h4>
              {myPastReports.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>조회된 과거 이력이 없습니다.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myPastReports.slice(0,3).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.thisWeekTask}
                        </div>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => applyPastReport(r)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                        복사하여 가져오기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af' }}>
              <Check size={18} /> 금주 진행 업무
            </label>
            <textarea 
              className="form-control" 
              placeholder="예)&#10;[AM 제조/서비스 - 우나스텔라]&#10;- 출력물 서포트 제거&#10;&#10;[설비 운용 및 관리 - A40PM3SN01(BLT-S400-3)]&#10;- 필터 교체"
              value={thisWeekTask}
              onChange={(e) => setThisWeekTask(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handleTextareaPaste}
              style={{ minHeight: '180px', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857' }}>
              <ChevronRight size={18} /> 차주 업무 계획
            </label>
            <textarea 
              className="form-control" 
              placeholder="예)&#10;[AM 제조/서비스 - 우나스텔라]&#10;- 4/30일 우나스텔라 기술미팅 예정&#10;&#10;[후공정 및 검사 - 품질검사]&#10;- 공인시험 접수 예정"
              value={nextWeekTask}
              onChange={(e) => setNextWeekTask(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handleTextareaPaste}
              style={{ minHeight: '180px', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <label>첨부 파일 (현장/시편 사진 등 - 옵션)</label>
            <input 
              type="file" 
              accept="image/*"
              className="form-control" 
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ padding: '0.5rem 1rem' }}
            />
            {imageFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#047857' }}>
                선택된 파일: {imageFile.name}
              </div>
            )}
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'right' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              <Send size={20} /> {isSubmitting ? '저장 중...' : '보고서 제출하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
